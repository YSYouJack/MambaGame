pragma solidity ^0.4.24;

import "../third-contracts/openzeppelin-solidity/contracts/math/SafeMath.sol";

library GameLogic {
    using SafeMath for uint256;
    
    enum State { Created, Ready, Open, Stop, WaitToClose, Closed, Error }
    
    struct Bets {
        uint256 betAmount;
        uint256 totalBetAmountByFar;
    }
    
	struct Coin {
		string name;
		int32  startExRate;
		uint256 timeStampOfStartExRate;
		int32  endExRate;
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
	    uint256 awardAmount;
	    uint256 transferedAwardAmount;
	    mapping (address => bool) isAwardTransfered;
	}
	
	event CoinBet(uint256 indexed gameId, uint256 coinId, address player, uint256 amount);
	event CoinLargestBetChanged(uint256 indexed gameId, uint256 coinId, uint256 amount);
	
	function state(Instance storage game) public view returns (State) {
	    if (game.isFinished) {
	        return State.Closed;
	    } else if (now > game.closeTime) {
	        if (0 == game.coins[0].startExRate || 
	            0 == game.coins[1].startExRate ||
	            0 == game.coins[2].startExRate ||
	            0 == game.coins[3].startExRate ||
	            0 == game.coins[4].startExRate)
	        {
	            return State.Error;
	        } else if (0 != game.coins[0].endExRate && 
	            0 != game.coins[1].endExRate &&
	            0 != game.coins[2].endExRate &&
	            0 != game.coins[3].endExRate &&
	            0 != game.coins[4].endExRate &&
	            game.isYChoosed)
	        {
	            return State.WaitToClose;
	        } else {
	            return State.Stop;
	        }
	    } else {
	        if (0 != game.coins[0].startExRate && 
	            0 != game.coins[1].startExRate &&
	            0 != game.coins[2].startExRate &&
	            0 != game.coins[3].startExRate &&
	            0 != game.coins[4].startExRate)
	        {
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
		require(state(game) == State.WaitToClose);
		
		uint256[5] memory ranks;
		
		// Get largest and smallest rasing rate coins.
	    int32 largestStart = game.coins[0].startExRate;
	    int32 largestEnd = game.coins[0].endExRate;
	    int32 start = game.coins[1].startExRate;
		int32 end = game.coins[1].endExRate;
	    int32 smallStart;
		int32 smallEnd;

	    if (isGreaterThan(start, end, largestStart, largestEnd)) {
	        ranks[0] = 1;
	        ranks[1] = 0;
	        
	        smallStart = largestStart;
	        smallEnd = largestEnd;
	        largestStart = start;
	        largestEnd = end;
	    } else {
	        ranks[0] = 0;
	        ranks[1] = 1;
	        
	        smallStart = start;
	        smallEnd = end;
	    }
	    
	    ranks[2] = 2;
	    ranks[3] = 3;
	    ranks[4] = 4;
		
		// Sorting.
		for (uint256 i = 2; i < 5; ++i) {
		    start = game.coins[i].startExRate;
		    end = game.coins[i].endExRate;
		    
		    if (isGreaterThan(start, end, largestStart, largestEnd)) {
		        ranks[i] = ranks[0];
		        ranks[0] = i;
		        largestStart = start;
		        largestEnd = end;
		    } else if (isLessThan(start, end, smallStart, smallEnd)) {
		        ranks[i] = ranks[1];
		        ranks[1] = i;
		        smallStart = start;
		        smallEnd = end;
		    } else if (isEqualTo(start, end, largestStart, largestEnd)) {
		        if (bets.coinbets[ranks[0]].largestBetAmount < bets.coinbets[i].largestBetAmount) {
		            ranks[i] = ranks[0];
		            ranks[0] = i;
		        }
		    } else if (isEqualTo(start, end, smallStart, smallEnd)) {
		        if (bets.coinbets[ranks[1]].largestBetAmount < bets.coinbets[i].largestBetAmount) {
		            ranks[i] = ranks[1];
		            ranks[1] = i;
		        }
		    }
		}
		
		// Sort the largest/smallest coins by larest bets.
		if (bets.coinbets[ranks[0]].largestBetAmount < bets.coinbets[ranks[1]].largestBetAmount) {
		    uint256 tmp = ranks[0];
		    ranks[0] = ranks[1];
		    ranks[1] = tmp;
		}
		
		// Sort the rest of coins by totalbets.
		if (bets.coinbets[ranks[2]].totalBetAmount > bets.coinbets[ranks[3]].totalBetAmount) {
		    if (bets.coinbets[ranks[4]].totalBetAmount > bets.coinbets[ranks[2]].totalBetAmount) {
		        tmp = ranks[2];
		        ranks[2] = ranks[4];
		        ranks[4] = ranks[3];
		        ranks[3] = tmp;
		    } else if (bets.coinbets[ranks[4]].totalBetAmount > bets.coinbets[ranks[3]].totalBetAmount) {
		        tmp = ranks[3];
		        ranks[3] = ranks[4];
		        ranks[4] = tmp;
		    }
		} else if (bets.coinbets[ranks[2]].totalBetAmount < bets.coinbets[ranks[3]].totalBetAmount) {
		    if (bets.coinbets[ranks[4]].totalBetAmount <= bets.coinbets[ranks[2]].totalBetAmount) {
		        tmp = ranks[2];
		        ranks[2] = ranks[3];
		        ranks[3] = tmp;
		    } else if (bets.coinbets[ranks[4]].totalBetAmount <= bets.coinbets[ranks[3]].totalBetAmount) {
		        tmp = ranks[2];
		        ranks[2] = ranks[3];
		        ranks[3] = ranks[4];
		        ranks[4] = tmp;
		    } else {
		        tmp = ranks[2];
		        ranks[2] = ranks[4];
		        ranks[4] = tmp;
		    }
		} else {
		    if (bets.coinbets[ranks[4]].totalBetAmount > bets.coinbets[ranks[2]].totalBetAmount) {
		        tmp = ranks[2];
		        ranks[2] = ranks[4];
		        ranks[4] = tmp;
		    }
		}
		
		// Decide the winner.
		if (bets.coinbets[ranks[1]].largestBetAmount.add(game.minDiffBets) < bets.coinbets[ranks[0]].largestBetAmount) {
		    game.isFinished = true;
		    game.winnerCoinIds.push(ranks[0]);
		    
            largestStart = game.coins[ranks[0]].startExRate;
	        largestEnd = game.coins[ranks[0]].endExRate;
	        
	        for (i = 2; i < 5; ++i) {
	            start = game.coins[ranks[i]].startExRate;
		        end = game.coins[ranks[i]].endExRate;
		        
		        if (isEqualTo(largestStart, largestEnd, start, end)) {
		            game.winnerCoinIds.push(ranks[i]);
		        }
	        }
		} else {
            start = game.coins[ranks[2]].startExRate;
		    end = game.coins[ranks[2]].endExRate;
		        
		    if (isEqualTo(largestStart, largestEnd, start, end) || 
		        isEqualTo(smallStart, smallEnd, start, end)) {
		        
		        start = game.coins[ranks[3]].startExRate;
		        end = game.coins[ranks[3]].endExRate;
		        
                if (isEqualTo(largestStart, largestEnd, start, end) || 
		            isEqualTo(smallStart, smallEnd, start, end)) {

		            start = game.coins[ranks[4]].startExRate;
		            end = game.coins[ranks[4]].endExRate;
		            
		            if (!isEqualTo(largestStart, largestEnd, start, end) && 
		                !isEqualTo(smallStart, smallEnd, start, end)) {
		                
		                game.isFinished = true;
		                game.winnerCoinIds.push(ranks[4]);
		            }
		        } else {
		            start = game.coins[ranks[4]].startExRate;
		            end = game.coins[ranks[4]].endExRate;
		            
		            if (isEqualTo(largestStart, largestEnd, start, end) ||
		                isEqualTo(smallStart, smallEnd, start, end)) {
		                
		                game.isFinished = true;
		                game.winnerCoinIds.push(ranks[3]);
		            } else {
		                if (bets.coinbets[ranks[4]].totalBetAmount.add(game.minDiffBets) < bets.coinbets[ranks[3]].totalBetAmount) {
		                    game.isFinished = true;
		                    game.winnerCoinIds.push(ranks[3]);
	                    }
		            }
		        }
		    } else {
		        
		        start = game.coins[ranks[3]].startExRate;
		        end = game.coins[ranks[3]].endExRate;
		        
                if (isEqualTo(largestStart, largestEnd, start, end) || 
		            isEqualTo(smallStart, smallEnd, start, end)) {

		            start = game.coins[ranks[4]].startExRate;
		            end = game.coins[ranks[4]].endExRate;
		            
		            if (isEqualTo(largestStart, largestEnd, start, end) ||
		                isEqualTo(smallStart, smallEnd, start, end)) {
		                
		                game.isFinished = true;
		                game.winnerCoinIds.push(ranks[2]);
		            } else {
		                if (bets.coinbets[ranks[4]].totalBetAmount.add(game.minDiffBets) < bets.coinbets[ranks[2]].totalBetAmount) {
		                    game.isFinished = true;
		                    game.winnerCoinIds.push(ranks[2]);
	                    }
		            }
		        } else {
		            if (bets.coinbets[ranks[3]].totalBetAmount.add(game.minDiffBets) < bets.coinbets[ranks[2]].totalBetAmount) {
		                game.isFinished = true;
		                game.winnerCoinIds.push(ranks[2]);
	                }
		        }
		    }
		}
		
		if (game.isFinished) {
		    calculateAwardForCoin(game, bets);
		}
		
		return game.isFinished;
	}
	
	function forceClose(Instance storage game, GameBets storage gameBets)
	    public 
	{
        require(state(game) == State.Error && 0 == gameBets.awardAmount);
        game.isFinished = true;
	}
	
	function bet(Instance storage game, GameBets storage gameBets, uint256 coinId, address txFeeReceiver)
	    public 
	{
	    require(coinId < 5);
	    require(state(game) == State.Open);
	    require(address(0) != txFeeReceiver && address(this) != txFeeReceiver);
	    
	    uint256 txFeeAmount = msg.value.mul(game.txFee).div(1000);
	    txFeeReceiver.transfer(txFeeAmount);
	    
	    CoinBets storage c = gameBets.coinbets[coinId];
	    
	    c.bets.length++;
	    Bets storage b = c.bets[c.bets.length - 1];
	    b.betAmount = msg.value.sub(txFeeAmount);
	    
	    c.totalBetAmount = b.betAmount.add(c.totalBetAmount);
	    gameBets.awardAmount = b.betAmount.add(gameBets.awardAmount);
	    b.totalBetAmountByFar = c.totalBetAmount;
	    
	    c.playerBetMap[msg.sender].push(c.bets.length - 1);
	    
	    if (b.betAmount > c.largestBetAmount) {
            c.largestBetAmount = b.betAmount;
            c.numberOfLargestBetTx = 1;
            
            if (!isBetInformationHidden(game)) {     
        	    emit CoinLargestBetChanged(game.id, coinId, b.betAmount);
            }
        } else if (b.betAmount == c.largestBetAmount) {
            ++c.numberOfLargestBetTx;
        }
        
        if (!isBetInformationHidden(game)) {
            emit CoinBet(game.id, coinId, msg.sender, b.betAmount);
        }
	}
	
	function isBetInformationHidden(Instance storage game) 
	    public 
	    view 
	    returns (bool)
	{
	    return now <= game.closeTime 
	        && now.add(game.hiddenTimeBeforeClose) > game.closeTime;
    }
    
    function calculateAwardForCoin(Instance storage game, GameBets storage bets) 
        public
    {
        require(state(game) == State.Closed);
        uint256 awardAmount = bets.awardAmount.div(game.winnerCoinIds.length);
        
        for (uint256 i = 0; i < game.winnerCoinIds.length; ++i) {
	        CoinBets storage c = bets.coinbets[game.winnerCoinIds[i]];
	        c.yThreshold = c.bets.length.mul(uint256(game.Y)).div(100);
            if (c.yThreshold.mul(100) < c.bets.length.mul(uint256(game.Y))) {
	            ++c.yThreshold;
	        }
	        
	        if (c.yThreshold >= c.bets.length) {
	            --c.yThreshold;
	        }
	        
	        c.awardAmountBeforeY = awardAmount.mul(game.A).div(100);
	        c.awardAmountAfterY = awardAmount.mul(game.B).div(100);
	        c.awardAmountForLargestBetPlayers = awardAmount
	            .sub(c.awardAmountBeforeY)
	            .sub(c.awardAmountAfterY)
	            .div(c.numberOfLargestBetTx);
	            
	        c.totalBetAmountBeforeY = c.bets[c.yThreshold].totalBetAmountByFar;
	        c.totalBetAmountAfterY = c.totalBetAmount.sub(c.totalBetAmountBeforeY);
	    }
    }
	
	function calculateAwardAmount(Instance storage game, GameBets storage bets)
	    public 
	    view 
	    returns (uint256 amount)
	{
	    require(state(game) == State.Closed);
	    require(0 < game.winnerCoinIds.length);
	    
	    if (bets.isAwardTransfered[msg.sender]) {
            return 0;
        }
	
	    amount = 0;
	    
	    for (uint256 i = 0; i < game.winnerCoinIds.length; ++i) {
	        CoinBets storage c = bets.coinbets[game.winnerCoinIds[i]];
	        uint256[] storage betIdList = c.playerBetMap[msg.sender];
	        
	        for (uint256 j = 0; j < betIdList.length; ++j) {
	            Bets storage b = c.bets[betIdList[j]];
	            if (betIdList[j] <= c.yThreshold) {
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
	
	function isEqualTo(int32 start0, int32 end0, int32 start1, int32 end1) 
	    public
	    pure
	    returns (bool)
	{
	    return ((end0 - start0) * start1) == ((end1 - start1) * start0);
	}
	
	function isGreaterThan(int32 start0, int32 end0, int32 start1, int32 end1) 
	    public
	    pure
	    returns (bool)
	{
	    return ((end0 - start0) * start1) > ((end1 - start1) * start0);
	}
	
	function isLessThan(int32 start0, int32 end0, int32 start1, int32 end1) 
	    public
	    pure
	    returns (bool)
    {
	    return ((end0 - start0) * start1) < ((end1 - start1) * start0);
	}
}