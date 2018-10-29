pragma solidity ^0.4.24;

import "../third-contracts/openzeppelin-solidity/contracts/math/SafeMath.sol";

library GameLogicLib {
    enum State { Created, Ready, Open, Stop, WaitToClose, Closed }
    
    struct Bet {
		address player;
		uint256 amount;
	}
	
	struct Coin {
		string name;
		int32  startExRate;
		int32  endExRate;
	}
	
	struct CoinBets {
	    uint256[] largestBetIds;
		uint256 totalBets;
	    Bet[] bets;
	}
	
	struct Instance {
	    uint256 id;
	    
	    uint256 openTime;
	    uint256 closeTime;
	    uint256 duration;
	    
	    uint8[50] YDistribution;
	    uint8 Y;
	    uint8 A;
	    uint8 B;
	    uint16 txFee;
	    uint256 minDiffBets;
	    uint256 timeStampOfStartRate;
	    uint256 timeStampOfEndRate;
	    
	    bool isFinished;
	    bool isYChoosed;
	    uint256[] winnerCoinIds;
	    
	    Coin[5] coins;
	}
	
	struct Bets {
	    Game.CoinBets[5] coinbets;
	}
	
	function state(Instance storage game) public view returns (State) {
	    if (game.isFinished) {
	        return State.Closed;
	    } else if (now > game.closeTime) {
	        if (0 != game.coins[0].endExRate && 
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
	
	function tryClose(Instance storage game, Bets storage bets)
	    public 
	    returns (bool) 
	{
		require(now > game.closeTime);
		
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
		        if (getLargestBets(bets.coinbets[ranks[0]]) < getLargestBets(bets.coinbets[i])) {
		            ranks[i] = ranks[0];
		            ranks[0] = i;
		        }
		    } else if (isEqualTo(start, end, smallStart, smallEnd)) {
		        if (getLargestBets(bets.coinbets[ranks[1]]) < getLargestBets(bets.coinbets[i])) {
		            ranks[i] = ranks[1];
		            ranks[1] = i;
		        }
		    }
		}
		
		// Sort the largest/smallest coins by larest bets.
		if (getLargestBets(bets.coinbets[ranks[0]]) < getLargestBets(bets.coinbets[ranks[1]])) {
		    uint256 tmp = ranks[0];
		    ranks[0] = ranks[1];
		    ranks[1] = tmp;
		}
		
		// Sort the rest of coins by totalbets.
		if (bets.coinbets[ranks[2]].totalBets > bets.coinbets[ranks[3]].totalBets) {
		    if (bets.coinbets[ranks[4]].totalBets > bets.coinbets[ranks[2]].totalBets) {
		        tmp = ranks[2];
		        ranks[2] = ranks[4];
		        ranks[4] = ranks[3];
		        ranks[3] = tmp;
		    } else if (bets.coinbets[ranks[4]].totalBets > bets.coinbets[ranks[3]].totalBets) {
		        tmp = ranks[3];
		        ranks[3] = ranks[4];
		        ranks[4] = tmp;
		    }
		} else if (bets.coinbets[ranks[2]].totalBets < bets.coinbets[ranks[3]].totalBets) {
		    if (bets.coinbets[ranks[4]].totalBets <= bets.coinbets[ranks[2]].totalBets) {
		        tmp = ranks[2];
		        ranks[2] = ranks[3];
		        ranks[3] = tmp;
		    } else if (bets.coinbets[ranks[4]].totalBets <= bets.coinbets[ranks[3]].totalBets) {
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
		    if (bets.coinbets[ranks[4]].totalBets > bets.coinbets[ranks[2]].totalBets) {
		        tmp = ranks[2];
		        ranks[2] = ranks[4];
		        ranks[4] = tmp;
		    }
		}
		
		
		// Decide the winner.
		if (SafeMath.add(getLargestBets(bets.coinbets[ranks[1]]), game.minDiffBets) < getLargestBets(bets.coinbets[ranks[0]])) {
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
		                if (SafeMath.add(bets.coinbets[ranks[4]].totalBets, game.minDiffBets) < bets.coinbets[ranks[3]].totalBets) {
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
		                if (SafeMath.add(bets.coinbets[ranks[4]].totalBets, game.minDiffBets) < bets.coinbets[ranks[2]].totalBets) {
		                    game.isFinished = true;
		                    game.winnerCoinIds.push(ranks[2]);
	                    }
		            }
		        } else {
		            if (SafeMath.add(bets.coinbets[ranks[3]].totalBets, game.minDiffBets) < bets.coinbets[ranks[2]].totalBets) {
		                game.isFinished = true;
		                game.winnerCoinIds.push(ranks[2]);
	                }
		        }
		    }
		}
		
		return game.isFinished;
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
	
	function getLargestBets(CoinBets storage _cbets)
	    public 
	    view 
	    returns (uint256)
	{
	    return (_cbets.largestBetIds.length > 0) ? _cbets.bets[_cbets.largestBetIds[0]].amount : 0;
	}
}

contract AA {
    Game.Instance[] public games;
    
    constructor() public {
        games.length++;
        Game.Instance storage game0 = games[games.length - 1];
        game0.openTime = now + 5 minutes;
	    game0.closeTime = now + 10 minutes;
	    game0.isFinished = false;
	    game0.isYChoosed = false;
	    
	    games.length++;
        Game.Instance storage game1 = games[games.length - 1];
        game1.openTime = now + 5 minutes;
	    game1.closeTime = now + 10 minutes;
	    game1.isFinished = false;
	    game1.isYChoosed = false;
	    game1.coins[0].startExRate = 1;
	    game1.coins[1].startExRate = 1;
	    game1.coins[2].startExRate = 1;
	    game1.coins[3].startExRate = 1;
	    game1.coins[4].startExRate = 1;
	    
	    games.length++;
        Game.Instance storage game2 = games[games.length - 1];
        game2.openTime = now - 5 minutes;
	    game2.closeTime = now + 10 minutes;
	    game2.isFinished = false;
	    game2.isYChoosed = false;
	    
	    games.length++;
        Game.Instance storage game3 = games[games.length - 1];
        game3.openTime = now - 5 minutes;
	    game3.closeTime = now + 10 minutes;
	    game3.isFinished = false;
	    game3.isYChoosed = false;
	    game3.coins[0].startExRate = 1;
	    game3.coins[1].startExRate = 1;
	    game3.coins[2].startExRate = 1;
	    game3.coins[3].startExRate = 1;
	    game3.coins[4].startExRate = 1;
	    
	    games.length++;
        Game.Instance storage game4 = games[games.length - 1];
        game4.openTime = now - 15 minutes;
	    game4.closeTime = now - 5 minutes;
	    game4.isFinished = false;
	    game4.isYChoosed = false;
	    game4.coins[0].startExRate = 1;
	    game4.coins[1].startExRate = 1;
	    game4.coins[2].startExRate = 1;
	    game4.coins[3].startExRate = 1;
	    game4.coins[4].startExRate = 1;
	    
	    games.length++;
        Game.Instance storage game5 = games[games.length - 1];
        game5.openTime = now - 15 minutes;
	    game5.closeTime = now - 5 minutes;
	    game5.isFinished = false;
	    game5.isYChoosed = true;
	    game5.coins[0].startExRate = game5.coins[0].endExRate = 1;
	    game5.coins[1].startExRate = game5.coins[1].endExRate = 1;
	    game5.coins[2].startExRate = game5.coins[2].endExRate = 1;
	    game5.coins[3].startExRate = game5.coins[3].endExRate = 1;
	    game5.coins[4].startExRate = game5.coins[4].endExRate = 1;
	    
	    games.length++;
        Game.Instance storage game6 = games[games.length - 1];
        game6.openTime = now - 15 minutes;
	    game6.closeTime = now - 5 minutes;
	    game6.isFinished = true;
	    game6.isYChoosed = true;
	    game6.coins[0].startExRate = game6.coins[0].endExRate = 1;
	    game6.coins[1].startExRate = game6.coins[1].endExRate = 1;
	    game6.coins[2].startExRate = game6.coins[2].endExRate = 1;
	    game6.coins[3].startExRate = game6.coins[3].endExRate = 1;
	    game6.coins[4].startExRate = game6.coins[4].endExRate = 1;
    }
    
    function aa() public view returns (Game.State[7] states) {
        states[0] = Game.state(games[0]);
        states[1] = Game.state(games[1]);
        states[2] = Game.state(games[2]);
        states[3] = Game.state(games[3]);
        states[4] = Game.state(games[4]);
        states[5] = Game.state(games[5]);
        states[6] = Game.state(games[6]);
    }
}