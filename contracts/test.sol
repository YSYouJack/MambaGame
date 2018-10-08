pragma solidity ^0.4.24;

import "../third-contracts/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract test {
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
	
	Coin[5] public coins;

	uint8 public Y;
	uint8 public A;
	uint8 public B;
	uint16 public txFee;
	uint256 public minDiffBets;
	uint256 public timeStampOfStartRate;
	uint256 public timeStampOfEndRate;
	bool public isClosed = false;
	
	uint256[] public winnerCoinIds;
	
	address public teamWallet;
	
	CoinBets[5] _coinbets;
	int32[5] _endExRate;
	
	event SendAwards(address indexed player, uint256 awards);
	
	constructor() public payable
	{
	    // Check inputs.
	    A = 10;
	    B = 20;
	    Y = 10;
	    
	    coins[0].name = "AAA";
	    coins[0].startExRate = 10000;
	    _endExRate[0] = 8000; // -20%
	    
	    coins[1].name = "BBB";
	    coins[1].startExRate = 20000;
	    _endExRate[1] = 24000; // 20%
	    
	    coins[2].name = "CCC";
	    coins[2].startExRate = 30000;
	    _endExRate[2] = 33000; // 10%
	    
	    coins[3].name = "DDD";
	    coins[3].startExRate = 40000;
	    _endExRate[3] = 48000; // 20%
	    
	    coins[4].name = "EEE";
	    coins[4].startExRate = 50000;
	    _endExRate[4] = 51000; // 2%
	    
	    txFee = 5;
	    minDiffBets = 10 finney;
	    
	    
	}
	
	function numberOfWinnerCoinIds() public view returns (uint256) {
	    return winnerCoinIds.length;
	}
	
	function jj() public payable {
	    // set bets.
	    address addr0 = 0xca35b7d915458ef540ade6068dfe2f44e8fa733c;
	    address addr1 = 0x14723a09acff6d2a60dcdf7aa4aff308fddc160c;
	    address addr2 = 0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db;
	    address addr3 = 0x583031d1113ad414f02576bd6afabfb302140225;
	    address addr4 = 0xdd870fa1b7c4700f2bd7f44238821c26f7392148;
	    this.bet.value(1 ether)(0, addr0);
	    this.bet.value(5 ether)(0, addr1);
	    this.bet.value(2 ether)(1, addr2);
	    this.bet.value(3 ether)(1, addr3);
	    this.bet.value(2 ether)(2, addr3);
	    this.bet.value(2 ether)(2, addr4);
	    this.bet.value(1 ether)(2, addr0);
	    this.bet.value(4 ether)(3, addr4);
	    this.bet.value(2 ether)(3, addr0);
	    this.bet.value(4 ether)(4, addr3);
	}
	
	function bet(uint256 _id, address _player) public payable {
	    //require(msg.value >= MIN_BET);
	    require(_id < 5);
	    //require(now >= openTime && now <= closeTime); 
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
        	//emit CoinLargestBet(_id, betAmount);
        } else if (betAmount == largestBets) {
            c.largestBetIds.push(betId);
        }
        
        //emit CoinBet(_id, _player, betAmount);
	}
	
	function close() public returns (bool)
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
		    //timeStampOfEndRate = _timeStampOfEndRate;
		    coins[0].endExRate = _endExRate[0];
		    coins[1].endExRate = _endExRate[1];
		    coins[2].endExRate = _endExRate[2];
		    coins[3].endExRate = _endExRate[3];
		    coins[4].endExRate = _endExRate[4];
		    
		    //_distributeAwards();
		    
		    //emit Closed();
		} else {
		    //closeTime = closeTime.add(gameDuration);
		    //emit Extended();
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
	
	/*
	function _distributeAwards() private {
	    Y = _randY();
	    
	    uint256 totalAward = address(this).balance;
	    uint256 totalAwardPerCoin = totalAward.div(winnerCoinIds.length);
	    uint256 restWei = 0;
	    for (uint256 i = 0; i < winnerCoinIds.length; ++i) {
	        restWei += _distributeOneCoin(_coinbets[winnerCoinIds[i]], totalAwardPerCoin);
	    }
	    
	    teamWallet.transfer(restWei);
	}
	*/
	function testDistributeOneCoin(uint256 id, uint256 _Y, uint256 totalAwards)
	    public
	    returns (uint256)
	{
	    CoinBets storage _cbets = _coinbets[id];
	    
	    uint256 awards;
	    uint256 weightedY = _Y.mul(_cbets.bets.length);
	    uint256 totalAwardsA = totalAwards.mul(A).div(100);
	    uint256 totalAwardsB = totalAwards.mul(B).div(100);
	    //uint256 totalAwardsC = totalAwards.sub(totalAwardsA).sub(totalAwardsB).div(_cbets.largestBetIds.length);
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
	        
	        emit SendAwards(_cbets.bets[i].player, awards);
	        //_cbets.bets[i].player.transfer(awards);
	        totalAwards = totalAwards.sub(awards);
	    }
	    
	    totalAwardsA = totalAwards.div(_cbets.largestBetIds.length);
	    
	    
	    for (i = 0; i < _cbets.largestBetIds.length; ++i) {
	        emit SendAwards(_cbets.bets[_cbets.largestBetIds[i]].player, totalAwardsA);
	        //_cbets.bets[_cbets.largestBetIds[i]].player.transfer(totalAwardsC);
	        totalAwards = totalAwards.sub(totalAwardsA);
	    }
	    
	    return totalAwards;
	}
	
	/*
	function _distributeOneCoin(CoinBets storage _cbets, uint256 totalAwards) 
	    private 
	    returns (uint256)
	{
	    uint256 awards;
	    uint256 weightedY = uint256(Y).mul(_cbets.bets.length);
	    uint256 totalAwardsA = totalAwards.mul(A).div(100);
	    uint256 totalAwardsB = totalAwards.mul(B).div(100);
	    uint256 totalAwardsC = totalAwards.sub(totalAwardsA).sub(totalAwardsB).div(_cbets.largestBetIds.length);
	    uint256 betsA = 0;
	    uint256 betsB;
	    uint256 i;
	        
	    for (i = 0; i < _cbets.bets.length; ++i) {
	        if (i.mul(100) > weightedY) {
	            break;
	        }
	        betsA = betsA.add(_cbets.bets[i].amount); 
	    }
	    
	    betsB = _cbets.totalBets.sub(betsA);
	    
	    for (i = 0; i < _cbets.bets.length; ++i) {
	        if (i.mul(100) <= weightedY) {
	            awards = totalAwardsA.mul(_cbets.bets[i].amount).div(betsA);
	        } else {
	            awards = totalAwardsB.mul(_cbets.bets[i].amount).div(betsB);
	        }
	        
	        _cbets.bets[i].player.transfer(awards);
	        totalAwards = totalAwards.sub(awards);
	    }
	    
	    for (i = 0; i < _cbets.largestBetIds.length; ++i) {
	        _cbets.bets[_cbets.largestBetIds[i]].player.transfer(totalAwardsC);
	        totalAwards = totalAwards.sub(totalAwardsC);
	    }
	    
	    return totalAwards;
	}
	*/
	
    /*	
	function _randY() private view returns (uint8) {
	    return uint8(YDistribution[now % YDistribution.length]);
	}
	*/
	
	function getLargestBets(uint256 id) public view returns (uint256) {
	    return _getLargestBets(_coinbets[id]);
	}
	
	function _getLargestBets(CoinBets storage _cbets) private view returns (uint256) {
	    return (_cbets.largestBetIds.length > 0) ? _cbets.bets[_cbets.largestBetIds[0]].amount : 0;
	}
}