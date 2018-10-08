pragma solidity ^0.4.24;

import "../third-contracts/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../third-contracts/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract MambaGame is Ownable {
	using SafeMath for uint256;

	struct Bet {
		address player;
		uint256 amount;
	}
	
	struct Coin {
		string name;
		int32  startExRate;
		int32  endExRate;
		int32 finalChangeRate;
	}
	
	struct CoinBets {
	    uint256[] largestBetIds;
		uint256 totalBets;
	    Bet[] bets;
	}
	
	uint256 public openTime;
	uint256 public closeTime;
	uint256 public gameDuration;
	Coin[5] public coins;
	uint8[50] public YDistribution;
	uint8 public Y;
	uint8 public A;
	uint8 public B;
	uint16 public txFee;
	uint256 public minDiffBets;
	uint256 public timeStampOfStartRate;
	uint256 public timeStampOfEndRate;
	bool public isClosed = false;
	
	uint256[] public winnerCoinIds;
	
	uint256 public MIN_BET = 10 finney; // 0.01 ether.
	uint256 public HIDDEN_TIME_BEFORE_CLOSE = 5 minutes;
	
	address public teamWallet;
	
	CoinBets[5] _coinbets;
	
	event Closed();
	event Extended();
	event CoinBet(uint256 coinId, address indexed player, uint256 bets);
	event CoinLargestBet(uint256 coinId, uint256 bets);
	event SendAwards(address indexed player, uint256 awards);
	event SendRemainAwards(address indexed teamWallet, uint256 awards);
	
	constructor(uint256 _openTime
		, uint256 _gameDuration
		, string _coinName0
		, string _coinName1
		, string _coinName2
		, string _coinName3
		, string _coinName4
		, int16[5] _startExRate
		, uint256 _exRateTimeStamp
		, uint8[50] _YDistribution
		, uint8 _A
		, uint8 _B
		, uint16 _txFee
		, uint256 _minDiffBets
		, address _teamWallet) public
	{
	    // Check inputs.
		require(_A <= 100 && _B <= 100 && _A + _B <= 100);
		
		require(_YDistribution[0] <= 100);
		require(_YDistribution[1] <= 100);
		require(_YDistribution[2] <= 100);
		require(_YDistribution[3] <= 100);
		require(_YDistribution[4] <= 100);
		require(_YDistribution[5] <= 100);
		require(_YDistribution[6] <= 100);
		require(_YDistribution[7] <= 100);
		require(_YDistribution[8] <= 100);
		require(_YDistribution[9] <= 100);
		require(_YDistribution[10] <= 100);
		require(_YDistribution[11] <= 100);
		require(_YDistribution[12] <= 100);
		require(_YDistribution[13] <= 100);
		require(_YDistribution[14] <= 100);
		require(_YDistribution[15] <= 100);
		require(_YDistribution[16] <= 100);
		require(_YDistribution[17] <= 100);
		require(_YDistribution[18] <= 100);
		require(_YDistribution[19] <= 100);
		require(_YDistribution[20] <= 100);
		require(_YDistribution[21] <= 100);
		require(_YDistribution[22] <= 100);
		require(_YDistribution[23] <= 100);
		require(_YDistribution[24] <= 100);
		require(_YDistribution[25] <= 100);
		require(_YDistribution[26] <= 100);
		require(_YDistribution[27] <= 100);
		require(_YDistribution[28] <= 100);
		require(_YDistribution[29] <= 100);
		require(_YDistribution[30] <= 100);
		require(_YDistribution[31] <= 100);
		require(_YDistribution[32] <= 100);
		require(_YDistribution[33] <= 100);
		require(_YDistribution[34] <= 100);
		require(_YDistribution[35] <= 100);
		require(_YDistribution[36] <= 100);
		require(_YDistribution[37] <= 100);
		require(_YDistribution[38] <= 100);
		require(_YDistribution[39] <= 100);
		require(_YDistribution[40] <= 100);
		require(_YDistribution[41] <= 100);
		require(_YDistribution[42] <= 100);
		require(_YDistribution[43] <= 100);
		require(_YDistribution[44] <= 100);
		require(_YDistribution[45] <= 100);
		require(_YDistribution[46] <= 100);
		require(_YDistribution[47] <= 100);
		require(_YDistribution[48] <= 100);
		require(_YDistribution[49] <= 100);
		
		require(_startExRate[0] > 0);
		require(_startExRate[1] > 0);
		require(_startExRate[2] > 0);
		require(_startExRate[3] > 0);
		require(_startExRate[4] > 0);
		
		require(_openTime >= now);
		require(_gameDuration > 0);
		
		require(_txFee <= 1000); // < 100%
		
		// Create new games.
		
		openTime = _openTime;
		closeTime = _openTime + _gameDuration;
		gameDuration = _gameDuration;
		timeStampOfStartRate = _exRateTimeStamp;
		
		coins[0].name = _coinName0;
		coins[0].startExRate = _startExRate[0];
		
		coins[1].name = _coinName1;
		coins[1].startExRate = _startExRate[1];
		
		coins[2].name = _coinName2;
		coins[2].startExRate = _startExRate[2];
		
		coins[3].name = _coinName3;
		coins[3].startExRate = _startExRate[3];
		
		coins[4].name = _coinName4;
		coins[4].startExRate = _startExRate[4];
		
		YDistribution = _YDistribution;
		A = _A;
		B = _B;
		txFee = _txFee;
		teamWallet = _teamWallet;
		minDiffBets = _minDiffBets;
	}
	
	function getCoinBetData(uint256 _id) 
	    public 
	    view 
	    returns (uint256 totalBets, uint256 largestBets, uint256 numberOfBets)
	{
	    require(_id < 5);
	    require(now.add(HIDDEN_TIME_BEFORE_CLOSE) <= closeTime);
	    
	    CoinBets storage c = _coinbets[_id];
	    totalBets = c.totalBets;
	    numberOfBets = c.bets.length;
	    largestBets = _getLargestBets(c);
	}
	
	function numberOfWinnerCoinIds() public view returns (uint256) {
	    return winnerCoinIds.length;
	}
	
	function isAlive() public view returns (bool) {
		return now >= openTime && now <= closeTime;
	}
	
	function bet(uint256 _id, address _player) public payable {
	    require(msg.value >= MIN_BET);
	    require(_id < 5);
	    require(now >= openTime && now <= closeTime); 
	    require(_player != address(0) && _player != address(this));
	    
	    uint256 txFeeAmount = msg.value.mul(txFee).div(1000);
	    uint256 betAmount = msg.value.sub(txFeeAmount);
	    
	    teamWallet.transfer(txFeeAmount);
	    
	    CoinBets storage c = _coinbets[_id];
	    c.totalBets += betAmount;
	    
	    uint256 largestBets = _getLargestBets(c);
	    
	    uint256 betId = c.bets.length++;
	    Bet storage b = c.bets[betId];
	    
	    b.player = _player;
	    b.amount = betAmount;
	    
        if (betAmount > largestBets) {
            c.largestBetIds.length = 1;
            c.largestBetIds[0] = betId;
        	emit CoinLargestBet(_id, betAmount);
        } else if (betAmount == largestBets) {
            c.largestBetIds.push(betId);
        }
        
        emit CoinBet(_id, _player, betAmount);
	}
	
	function close(int16[5] _endExRate, uint256 _timeStampOfEndRate) 
	    onlyOwner 
	    public 
	    returns (bool)
	{
	    // Calculate the winners.
	    require(_endExRate[0] > 0);
		require(_endExRate[1] > 0);
		require(_endExRate[2] > 0);
		require(_endExRate[3] > 0);
		require(_endExRate[4] > 0);
		
		uint256[5] memory ranks;
		
		// Get largest and smallest rasing rate coins.
	    int32 largestStart = coins[0].startExRate;
	    int32 largestEnd = _endExRate[0];
	    int32 start = coins[1].startExRate;
		int32 end = _endExRate[1];
	    int32 smallStart;
		int32 smallEnd;

	    if (_isGreaterThan(start, end, largestStart, largestEnd)) {
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
		    start = coins[i].startExRate;
		    end = _endExRate[i];
		    
		    if (_isGreaterThan(start, end, largestStart, largestEnd)) {
		        ranks[i] = ranks[0];
		        ranks[0] = i;
		        largestStart = start;
		        largestEnd = end;
		    } else if (_isLessThan(start, end, smallStart, smallEnd)) {
		        ranks[i] = ranks[1];
		        ranks[1] = i;
		        smallStart = start;
		        smallEnd = end;
		    } else if (_isEqualTo(start, end, largestStart, largestEnd)) {
		        if (_getLargestBets(_coinbets[ranks[0]]) < _getLargestBets(_coinbets[i])) {
		            ranks[i] = ranks[0];
		            ranks[0] = i;
		        }
		    } else if (_isEqualTo(start, end, smallStart, smallEnd)) {
		        if (_getLargestBets(_coinbets[ranks[1]]) < _getLargestBets(_coinbets[i])) {
		            ranks[i] = ranks[1];
		            ranks[1] = i;
		        }
		    }
		}
		
		// Sort the largest/smallest coins by larest bets.
		if (_getLargestBets(_coinbets[ranks[0]]) < _getLargestBets(_coinbets[ranks[1]])) {
		    uint256 tmp = ranks[0];
		    ranks[0] = ranks[1];
		    ranks[1] = tmp;
		}
		
		// Sort the rest of coins by totalbets.
		if (_coinbets[ranks[2]].totalBets > _coinbets[ranks[3]].totalBets) {
		    if (_coinbets[ranks[4]].totalBets > _coinbets[ranks[2]].totalBets) {
		        tmp = ranks[2];
		        ranks[2] = ranks[4];
		        ranks[4] = ranks[3];
		        ranks[3] = tmp;
		    } else if (_coinbets[ranks[4]].totalBets > _coinbets[ranks[3]].totalBets) {
		        tmp = ranks[3];
		        ranks[3] = ranks[4];
		        ranks[4] = tmp;
		    }
		} else if (_coinbets[ranks[2]].totalBets < _coinbets[ranks[3]].totalBets) {
		    if (_coinbets[ranks[4]].totalBets <= _coinbets[ranks[2]].totalBets) {
		        tmp = ranks[2];
		        ranks[2] = ranks[3];
		        ranks[3] = tmp;
		    } else if (_coinbets[ranks[4]].totalBets <= _coinbets[ranks[3]].totalBets) {
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
		    if (_coinbets[ranks[4]].totalBets > _coinbets[ranks[2]].totalBets) {
		        tmp = ranks[2];
		        ranks[2] = ranks[4];
		        ranks[4] = tmp;
		    }
		}
		
		// Decide the winner.
		if (_getLargestBets(_coinbets[ranks[1]]).add(minDiffBets) < _getLargestBets(_coinbets[ranks[0]])) {
		    isClosed = true;
		    winnerCoinIds.push(ranks[0]);
		    
            largestStart = coins[ranks[0]].startExRate;
	        largestEnd = _endExRate[ranks[0]];
	        
	        for (i = 2; i < 5; ++i) {
	            start = coins[ranks[i]].startExRate;
		        end = _endExRate[ranks[i]];
		        
		        if (_isEqualTo(largestStart, largestEnd, start, end)) {
		            winnerCoinIds.push(ranks[i]);
		        }
	        }
		} else {
            start = coins[ranks[2]].startExRate;
		    end = _endExRate[ranks[2]];
		        
		    if (_isEqualTo(largestStart, largestEnd, start, end) || 
		        _isEqualTo(smallStart, smallEnd, start, end)) {
		        
		        start = coins[ranks[3]].startExRate;
		        end = _endExRate[ranks[3]];
		        
                if (_isEqualTo(largestStart, largestEnd, start, end) || 
		            _isEqualTo(smallStart, smallEnd, start, end)) {

		            start = coins[ranks[4]].startExRate;
		            end = _endExRate[ranks[4]];
		            
		            if (!_isEqualTo(largestStart, largestEnd, start, end) && 
		                !_isEqualTo(smallStart, smallEnd, start, end)) {
		                
		                isClosed = true;
		                winnerCoinIds.push(ranks[4]);
		            }
		        } else {
		            start = coins[ranks[4]].startExRate;
		            end = _endExRate[ranks[4]];
		            
		            if (_isEqualTo(largestStart, largestEnd, start, end) ||
		                _isEqualTo(smallStart, smallEnd, start, end)) {
		                
		                isClosed = true;
		                winnerCoinIds.push(ranks[3]);
		            } else {
		                if (_coinbets[ranks[4]].totalBets.add(minDiffBets) < _coinbets[ranks[3]].totalBets) {
		                    isClosed = true;
		                    winnerCoinIds.push(ranks[3]);
	                    }
		            }
		        }
		    } else {
		        
		        start = coins[ranks[3]].startExRate;
		        end = _endExRate[ranks[3]];
		        
                if (_isEqualTo(largestStart, largestEnd, start, end) || 
		            _isEqualTo(smallStart, smallEnd, start, end)) {

		            start = coins[ranks[4]].startExRate;
		            end = _endExRate[ranks[4]];
		            
		            if (_isEqualTo(largestStart, largestEnd, start, end) ||
		                _isEqualTo(smallStart, smallEnd, start, end)) {
		                
		                isClosed = true;
		                winnerCoinIds.push(ranks[2]);
		            } else {
		                if (_coinbets[ranks[4]].totalBets.add(minDiffBets) < _coinbets[ranks[2]].totalBets) {
		                    isClosed = true;
		                    winnerCoinIds.push(ranks[2]);
	                    }
		            }
		        } else {
		            if (_coinbets[ranks[3]].totalBets.add(minDiffBets) < _coinbets[ranks[2]].totalBets) {
		                isClosed = true;
		                winnerCoinIds.push(ranks[2]);
	                }
		        }
		    }
		}
		
		if (isClosed) {
		    timeStampOfEndRate = _timeStampOfEndRate;
		    coins[0].endExRate = _endExRate[0];
		    coins[1].endExRate = _endExRate[1];
		    coins[2].endExRate = _endExRate[2];
		    coins[3].endExRate = _endExRate[3];
		    coins[4].endExRate = _endExRate[4];
		    
		    _distributeAwards();
		    
		    emit Closed();
		} else {
		    closeTime = closeTime.add(gameDuration);
		    emit Extended();
		}
		
		return isClosed;
	}
	
	function _isEqualTo(int32 start0, int32 end0, int32 start1, int32 end1) 
	    private
	    pure
	    returns (bool)
	{
	    return ((end0 - start0) * start1) == ((end1 - start1) * start0);
	}
	
	function _isGreaterThan(int32 start0, int32 end0, int32 start1, int32 end1) 
	    private
	    pure
	    returns (bool)
	{
	    return ((end0 - start0) * start1) > ((end1 - start1) * start0);
	}
	
	function _isLessThan(int32 start0, int32 end0, int32 start1, int32 end1) 
	    private
	    pure
	    returns (bool)
    {
	    return ((end0 - start0) * start1) < ((end1 - start1) * start0);
	}
	
	function _distributeAwards() private {
	    Y = _randY();
	    
	    uint256 totalAward = address(this).balance;
	    uint256 totalAwardPerCoin = totalAward.div(winnerCoinIds.length);
	    uint256 restWei = 0;
	    for (uint256 i = 0; i < winnerCoinIds.length; ++i) {
	        restWei += _distributeOneCoin(_coinbets[winnerCoinIds[i]], totalAwardPerCoin);
	    }
	    
	    teamWallet.transfer(restWei);
		emit SendRemainAwards(teamWallet, restWei);
	}
	
	function _distributeOneCoin(CoinBets storage _cbets, uint256 totalAwards) 
	    private 
	    returns (uint256)
	{
	    uint256 awards;
	    uint256 weightedY = uint256(Y).mul(_cbets.bets.length);
	    uint256 totalAwardsA = totalAwards.mul(A).div(100);
	    uint256 totalAwardsB = totalAwards.mul(B).div(100);
	    uint256 betsA = 0;
	    uint256 betsB;
	    uint256 i;
	        
	    for (i = 0; i < _cbets.bets.length; ++i) {
	        if (i.mul(100) >= weightedY) {
	            break;
	        }
	        betsA = betsA.add(_cbets.bets[i].amount); 
	    }
	    
	    betsB = _cbets.totalBets.sub(betsA);
	    
	    for (i = 0; i < _cbets.bets.length; ++i) {
	        if (i.mul(100) < weightedY) {
	            awards = totalAwardsA.mul(_cbets.bets[i].amount).div(betsA);
	        } else {
	            awards = totalAwardsB.mul(_cbets.bets[i].amount).div(betsB);
	        }
	        
	        _cbets.bets[i].player.transfer(awards);
	        totalAwards = totalAwards.sub(awards);
			emit SendAwards(_cbets.bets[_cbets.largestBetIds[i]].player, totalAwardsA);
	    }
		
		totalAwardsA = totalAwards.div(_cbets.largestBetIds.length);
	    
	    for (i = 0; i < _cbets.largestBetIds.length; ++i) {
	        _cbets.bets[_cbets.largestBetIds[i]].player.transfer(totalAwardsA);
	        totalAwards = totalAwards.sub(totalAwardsA);
			emit SendAwards(_cbets.bets[_cbets.largestBetIds[i]].player, totalAwardsA);
	    }
	    
	    return totalAwards;
	}
	
	function _randY() private view returns (uint8) {
	    return uint8(YDistribution[now % YDistribution.length]);
	}
	
	function _getLargestBets(CoinBets storage _cbets) private view returns (uint256) {
	    return (_cbets.largestBetIds.length > 0) ? _cbets.bets[_cbets.largestBetIds[0]].amount : 0;
	}
}