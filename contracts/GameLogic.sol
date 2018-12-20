pragma solidity ^0.4.24;

import "../third-contracts/openzeppelin-solidity/contracts/math/SafeMath.sol";

library GameLogic {
    using SafeMath for uint256;

    enum State { NotExists, Created, Ready, Open, Stop, WaitToClose, Closed, Error}
    enum CompareResult { Equal, Less, Greater }

    struct Bets {
        uint256 betAmount;
        uint256 totalBetAmountByFar;
    }

    struct Coin {
        string name;
        int32 startExRate;
        uint256 timeStampOfStartExRate;
        int32 endExRate;
        uint256 timeStampOfEndExRate;
    }

    struct CoinBets {
        uint256 largestBetAmount;
        uint256 numberOfLargestBetTx;
        uint256 totalBetAmount;
        Bets[] bets;
        mapping (address => uint256[]) playerBetMap;
        uint256 yThreshold;
        uint256 awardAmountBeforeY;
        uint256 awardAmountAfterY;
        uint256 awardAmountForLargestBetPlayers;
        uint256 totalBetAmountBeforeY;
        uint256 totalBetAmountAfterY;
    }

    struct Instance {
        uint256 id;
        
        uint256 openTime;
        uint256 closeTime;
        uint256 duration;
        uint256 hiddenTimeBeforeClose;
        uint256 claimTimeAfterClose;
        uint256 maximumFetchingTimeForEndExRate;
        
        uint8[50] YDistribution;
        uint8 Y;
        uint8 A;
        uint8 B;
        uint16 txFee;
        bool isFinished;
        bool isYChoosed;
        uint256 minDiffBets;
        
        uint256[] winnerCoinIds;
        
        Coin[5] coins;
    }

    struct GameBets {
        CoinBets[5] coinbets;
        mapping (address => bool) isAwardTransfered;
        mapping (address => bool) isRefunded;
        uint256 totalAwards;
        uint256 claimedAwards;
        uint256 claimedRefunds;
    }

    event CoinBet(uint256 indexed gameId, uint256 coinId, address player, uint256 amount);
    event CoinLargestBetChanged(uint256 indexed gameId, uint256 coinId, uint256 amount);
    event SendTxFee(address receiver, uint256 feeAmount);

    function isEndExRateAndYFetched(Instance storage game) 
        public
        view
        returns (bool)
    {
        return (0 != game.coins[0].endExRate && 
                0 != game.coins[1].endExRate &&
                0 != game.coins[2].endExRate &&
                0 != game.coins[3].endExRate &&
                0 != game.coins[4].endExRate &&
                game.isYChoosed);
    }

    function isStartExRateFetched(Instance storage game) 
        public
        view
        returns (bool)
    {
        return (0 != game.coins[0].startExRate && 
                0 != game.coins[1].startExRate &&
                0 != game.coins[2].startExRate &&
                0 != game.coins[3].startExRate &&
                0 != game.coins[4].startExRate);
    }

    function state(Instance storage game, GameBets storage bets) 
        public 
        view 
        returns (State)
    {
        if (game.isFinished) {
            return State.Closed;
        } else if (now > game.closeTime.add(game.maximumFetchingTimeForEndExRate)) {
            if (!isEndExRateAndYFetched(game)) {
                return State.Error;
            } else {
                return State.WaitToClose;
            }
        } else if (now > game.closeTime) {
            if (!isStartExRateFetched(game)) {
                return State.Error;
            } else if (isEndExRateAndYFetched(game) || 0 == bets.totalAwards) {
                return State.WaitToClose;
            } else {
                return State.Stop;
            }
        } else {
            if (isStartExRateFetched(game)) {
                if (now >= game.openTime) {
                    return State.Open;
                } else {
                    return State.Ready;
                }
            } else {
                return State.Created;
            }
        }
    }

    function tryClose(Instance storage game, GameBets storage bets)
        public 
        returns (bool) 
    {
        require(state(game, bets) == State.WaitToClose);
        
        uint256 largestIds = 0;
        uint256 smallestIds = 0;
        uint256 otherIds = 0;
        
        uint256 i = 0;
        CompareResult result;
        for (; i < 5; ++i) {
            // Remove the orphan coins which no one has bet.
            if (bets.coinbets[i].totalBetAmount == 0) {
                continue;
            }
            
            // Compare with the largest coin id.
            if (0 == (largestIds & 0x7)) {
                largestIds = i + 1;
                continue;
            } else {
                result = compare(game.coins[(largestIds & 0x7) - 1], game.coins[i]);
                if (CompareResult.Equal == result) {
                    largestIds = pushToLargestOrSmallestIds(bets, largestIds, i);
                    continue;
                } else if (CompareResult.Less == result) {
                    if (0 == (smallestIds & 0x7)) {
                        smallestIds = largestIds;
                    } else {
                        otherIds = pushToOtherIds(bets, otherIds, largestIds);
                    }
                    
                    largestIds = i + 1;
                    continue;
                }
            }
            
            // Compare with the smallest coin id.
            if (0 == (smallestIds & 0x7)) {
                smallestIds = i + 1;
                continue;
            } else {
                result = compare(game.coins[(smallestIds & 0x7) - 1], game.coins[i]);
                if (CompareResult.Equal == result) {
                    smallestIds = pushToLargestOrSmallestIds(bets, smallestIds, i);
                    continue;
                } else if (CompareResult.Greater == result) {
                    if (0 == (largestIds & 0x7)) {
                        largestIds = smallestIds;
                    } else {
                        otherIds = pushToOtherIds(bets, otherIds, smallestIds);
                    }
                        
                    smallestIds = i + 1;
                    continue;
                }
            }
            
            // Assign to 'other' group.
            otherIds = pushToOtherIds(bets, otherIds, i + 1);
        }
        
        // Choose winners.
        require(otherIds < 512);
        
        if (smallestIds == 0) {
            if (largestIds != 0) {
                game.isFinished = true;
                convertTempIdsToWinnerIds(game, largestIds);
                return true;
            } else {
                return false;
            }
        }
        
        i = bets.coinbets[(largestIds & 0x7) - 1].largestBetAmount;
        uint256 j = bets.coinbets[(smallestIds & 0x7) - 1].largestBetAmount;
        
        // Compare largest and smallest group.
        if (i > j.add(game.minDiffBets)) {
            game.isFinished = true;
            convertTempIdsToWinnerIds(game, largestIds);
        } else if (j > i.add(game.minDiffBets)) {
            game.isFinished = true;
            convertTempIdsToWinnerIds(game, smallestIds);
        } else {
            // Compare other group.
            if (otherIds < 8 && otherIds != 0) {
                // sole winner.
                game.isFinished = true;
                convertTempIdsToWinnerIds(game, otherIds);
            } else if (otherIds >= 8 && otherIds != 0) {
                // compare.
                i = bets.coinbets[(otherIds & 0x7) - 1].totalBetAmount;
                j = bets.coinbets[((otherIds >> 3) & 0x7) - 1].totalBetAmount;
                
                if (i > j.add(game.minDiffBets)) {
                    game.isFinished = true;
                    game.winnerCoinIds.push((otherIds & 0x7) - 1);
                } else if (otherIds >= 128) {
                    i = bets.coinbets[((otherIds >> 6) & 0x7) - 1].totalBetAmount;
                    if (j > i.add(game.minDiffBets)) {
                        convertTempIdsToWinnerIds(game, otherIds & 0x3f);
                    } else {
                        convertTempIdsToWinnerIds(game, otherIds);
                    }
                    game.isFinished = true;
                }
            }
        }
        
        return game.isFinished;
    }

    function bet(Instance storage game, GameBets storage gameBets, uint256 coinId, address txFeeReceiver)
        public 
    {
        require(coinId < 5);
        require(state(game, gameBets) == State.Open);
        require(address(0) != txFeeReceiver && address(this) != txFeeReceiver);
        
        uint256 txFeeAmount = msg.value.mul(game.txFee).div(1000);
        if (0 < txFeeAmount) {
            txFeeReceiver.transfer(txFeeAmount);
            emit SendTxFee(txFeeReceiver, txFeeAmount);
        }
        
        CoinBets storage c = gameBets.coinbets[coinId];
        
        c.bets.length++;
        Bets storage b = c.bets[c.bets.length - 1];
        b.betAmount = msg.value.sub(txFeeAmount);
        
        c.totalBetAmount = b.betAmount.add(c.totalBetAmount);
        b.totalBetAmountByFar = c.totalBetAmount;
        gameBets.totalAwards =  gameBets.totalAwards.add(b.betAmount);
        
        c.playerBetMap[msg.sender].push(c.bets.length - 1);
        
        if (b.betAmount > c.largestBetAmount) {
            c.largestBetAmount = b.betAmount;
            c.numberOfLargestBetTx = 1;
            
            emit CoinLargestBetChanged(game.id, coinId, b.betAmount);
            
        } else if (b.betAmount == c.largestBetAmount) {
            ++c.numberOfLargestBetTx;
        }
        
        emit CoinBet(game.id, coinId, msg.sender, b.betAmount);
    }

    function isBetInformationHidden(Instance storage game) 
        public 
        view 
        returns (bool)
    {
        return now <= game.closeTime 
            && now.add(game.hiddenTimeBeforeClose) > game.closeTime;
    }

    function calculateAwardForCoin(Instance storage game
        , GameBets storage bets
        , uint256 awardAmount
    ) 
        public
    {
        require(state(game, bets) == State.Closed);
        awardAmount = awardAmount.div(game.winnerCoinIds.length);
        
        for (uint256 i = 0; i < game.winnerCoinIds.length; ++i) {
            CoinBets storage c = bets.coinbets[game.winnerCoinIds[i]];
            require(c.bets.length > 0);
            
            c.yThreshold = c.bets.length.mul(uint256(game.Y)).div(100);
            if (c.yThreshold.mul(100) < c.bets.length.mul(uint256(game.Y))) {
                ++c.yThreshold;
            }
            
            c.awardAmountAfterY = awardAmount.mul(game.B).div(100);
           
            if (c.yThreshold == 0) {
                c.awardAmountBeforeY = 0;
                c.totalBetAmountBeforeY = 0;
            } else if (c.bets.length == 1) {
                c.awardAmountBeforeY = awardAmount;
                c.awardAmountAfterY = 0;
                c.totalBetAmountBeforeY = c.totalBetAmount;
            } else {
                c.awardAmountBeforeY = awardAmount.mul(game.A).div(100);
                c.totalBetAmountBeforeY = c.bets[c.yThreshold - 1].totalBetAmountByFar;
            }
            
            c.awardAmountForLargestBetPlayers = awardAmount
                .sub(c.awardAmountBeforeY)
                .sub(c.awardAmountAfterY)
                .div(c.numberOfLargestBetTx);
            
            c.totalBetAmountAfterY = c.totalBetAmount.sub(c.totalBetAmountBeforeY);
        }
    }

    function calculateAwardAmount(Instance storage game, GameBets storage bets)
        public 
        view 
        returns (uint256 amount)
    {
        require(state(game, bets) == State.Closed);
        require(0 < game.winnerCoinIds.length);
        
        if (bets.isAwardTransfered[msg.sender]) {
            return 0;
        } else if (game.closeTime + game.claimTimeAfterClose < now) {
            return 0;
        }
    
        amount = 0;
        
        for (uint256 i = 0; i < game.winnerCoinIds.length; ++i) {
            CoinBets storage c = bets.coinbets[game.winnerCoinIds[i]];
            uint256[] storage betIdList = c.playerBetMap[msg.sender];
            
            for (uint256 j = 0; j < betIdList.length; ++j) {
                Bets storage b = c.bets[betIdList[j]];
                if (betIdList[j] < c.yThreshold) {
                    amount = amount.add(
                        c.awardAmountBeforeY.mul(b.betAmount).div(c.totalBetAmountBeforeY));
                } else {
                    amount = amount.add(
                        c.awardAmountAfterY.mul(b.betAmount).div(c.totalBetAmountAfterY));
                }
                
                if (b.betAmount == c.largestBetAmount) {
                    amount = amount.add(c.awardAmountForLargestBetPlayers);
                }
            }
        }
    }

    function calculateRefundAmount(Instance storage game, GameBets storage bets)
        public 
        view 
        returns (uint256 amount)
    {
        require(state(game, bets) == State.Error);
        amount = 0;
        
        if (bets.isRefunded[msg.sender]) {
            return 0;
        } else if (game.closeTime + game.claimTimeAfterClose < now) {
            return 0;
        }
        
        for (uint256 i = 0; i < 5; ++i) {
            CoinBets storage c = bets.coinbets[i];
            uint256[] storage betIdList = c.playerBetMap[msg.sender];
            
            for (uint256 j = 0; j < betIdList.length; ++j) {
                Bets storage b = c.bets[betIdList[j]];
                amount = amount.add(b.betAmount);
            }
        }
    }

    function compare(Coin storage coin0, Coin storage coin1) 
        public
        view
        returns (CompareResult)
    {
        int32 value0 = (coin0.endExRate - coin0.startExRate) * coin1.startExRate;
        int32 value1 = (coin1.endExRate - coin1.startExRate) * coin0.startExRate;
        
        if (value0 == value1) {
            return CompareResult.Equal;
        } else if (value0 < value1) {
            return CompareResult.Less;
        } else {
            return CompareResult.Greater;
        }
    }

    function pushToLargestOrSmallestIds(GameBets storage bets
        , uint256 currentIds
        , uint256 newId
    )
        public
        view
        returns (uint256)
    {
        require(currentIds < 2048); // maximum capacity is 5.
    
        if (currentIds == 0) {
            return newId + 1;
        } else {
            uint256 id = (currentIds & 0x7) - 1;
            if (bets.coinbets[newId].largestBetAmount >= bets.coinbets[id].largestBetAmount) {
                return (currentIds << 3) | (newId + 1);
            } else {
                return (id + 1) | (pushToLargestOrSmallestIds(bets, currentIds >> 3, newId) << 3);
            }
        }
    }

    function pushToOtherIds(GameBets storage bets, uint256 currentIds, uint256 newIds)
        public
        view
        returns (uint256)
    {
        require(currentIds < 2048);
        require(newIds < 2048 && newIds > 0);
    
        if (newIds >= 8) {
            return pushToOtherIds(bets
                , pushToOtherIds(bets, currentIds, newIds >> 3)
                , newIds & 0x7);
        } else {
            if (currentIds == 0) {
                return newIds;
            } else {
                uint256 id = (currentIds & 0x7) - 1;
                if (bets.coinbets[newIds - 1].totalBetAmount >= bets.coinbets[id].totalBetAmount) {
                    return (currentIds << 3) | newIds;
                } else {
                    return (id + 1) | (pushToOtherIds(bets, currentIds >> 3, newIds) << 3);
                }
            }
        }
    }

    function convertTempIdsToWinnerIds(Instance storage game, uint256 ids) public
    {
        if (ids > 0) {
            game.winnerCoinIds.push((ids & 0x7) - 1);
            convertTempIdsToWinnerIds(game, ids >> 3);
        }
    }

    function utf8ToUint(byte char) public pure returns (uint256) {
        uint256 utf8Num = uint256(char);
        if (utf8Num > 47 && utf8Num < 58) {
            return utf8Num;
        } else if (utf8Num > 64 && utf8Num < 91) {
            return utf8Num;
        } else {
            revert();
        }
    }

    function encodeCoinName(string str) pure public returns (bytes32) {
        bytes memory bString = bytes(str);
        require(bString.length <= 32);
        
        uint256 retVal = 0;
        uint256 offset = 248;
        for (uint256 i = 0; i < bString.length; ++i) {
            retVal |= utf8ToUint(bString[i]) << offset;
            offset -= 8;
        }
        return bytes32(retVal);
    }
}