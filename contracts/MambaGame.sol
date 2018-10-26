pragma solidity ^0.4.24;

import "../third-contracts/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../third-contracts/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../third-contracts/oraclize/ethereum-api/oraclizeAPI_0.5.sol";

contract MambaGame is Ownable, usingOraclize {
	using SafeMath for uint256;

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
	
	struct GameData {
	    uint256 id;
	    
	    uint256 openTime;
	    uint256 closeTime;
	    uint256 gameDuration;
	    
	    uint8[50] YDistribution;
	    uint8 Y;
	    uint8 A;
	    uint8 B;
	    uint16 txFee;
	    uint256 minDiffBets;
	    uint256 timeStampOfStartRate;
	    uint256 timeStampOfEndRate;
	    
	    bool isClosed;
	    uint256[] winnerCoinIds;
	    
	    mapping (bytes32 => uint256) startExRateQueryIds;
	    mapping (bytes32 => uint256) endExRateQueryIds;
	    
	    Coin[5] coins;
	}
	
	struct GameHideableData {
	    CoinBets[5] coinbets;
	}
	
	address public teamWallet;
	
	GameData[] public gameData;
	GameHideableData[] gameHideableData;
	
	uint256 public MIN_BET = 10 finney; // 0.01 ether.
	uint256 public HIDDEN_TIME_BEFORE_CLOSE = 5 minutes;
	
	mapping (bytes32 => uint256) startExRateQueryIds;
	mapping (bytes32 => uint256) endExRateQueryIds;
	mapping (bytes32 => uint256) randYQueryIds;
	
	event Closed(uint256 indexed gameId);
	event Extended(uint256 indexed gameId);
	event CoinBet(uint256 indexed gameId, uint256 indexed coinId, address player, uint256 bets);
	event CoinLargestBet(uint256 indexed gameId, uint256 indexed coinId, uint256 bets);
	event SendAwards(uint256 indexed gameId, address player, uint256 awards);
	event SendRemainAwards(uint256 indexed gameId, address teamWallet, uint256 awards);
	event GameCreated(uint256 gameId, uint256 openTime);
	event StartExRateUpdated(uint256 indexed gameId, uint256 coinId, int32 rate);
	event EndExRateUpdated(uint256 indexed gameId, uint256 coinId, int32 rate);
	event YChoosed(uint256 indexed gameId, uint8 Y);
	
	constructor(address _teamWallet) public
	{
	    require(_teamWallet != address(0));
		teamWallet = _teamWallet;
		
		OAR = OraclizeAddrResolverI(0xA8473897374abf3f316a38AFb90498b2F58aE49E);
	}
	
	function createNewGame(uint256 _openTime
		, uint256 _gameDuration
		, string _coinName0
		, string _coinName1
		, string _coinName2
		, string _coinName3
		, string _coinName4
		, uint8[50] _YDistribution
		, uint8 _A
		, uint8 _B
		, uint16 _txFee
		, uint256 _minDiffBets) onlyOwner public
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
		
		require(_openTime >= now);
		require(_gameDuration > 0);
		
		require(_txFee <= 1000); // < 100%
		
		if (0 != gameData.length) {
	        require(gameData[gameData.length - 1].isClosed);
	    }
		
		// Create new game data.
		gameData.length++;
		gameHideableData.length++;
		GameData storage game = gameData[gameData.length - 1];
		
		game.id = gameData.length - 1;
		game.openTime = _openTime;
		game.closeTime = _openTime + _gameDuration;
		game.gameDuration = _gameDuration;
		
		game.coins[0].name = _coinName0;
		game.coins[1].name = _coinName1;
		game.coins[2].name = _coinName2;
		game.coins[3].name = _coinName3;
		game.coins[4].name = _coinName4;
		
		game.YDistribution = _YDistribution;
		game.A = _A;
		game.B = _B;
		game.txFee = _txFee;
		game.minDiffBets = _minDiffBets;
		game.isClosed = false;
		
		string memory url;
		bytes32 queryId;
		url = strConcat("json(https://api.binance.com/api/v3/ticker/price?symbol=", game.coins[0].name, "USDT).price");
		queryId = oraclize_query(60, "URL", url);
		startExRateQueryIds[queryId] = gameData.length;
		game.startExRateQueryIds[queryId] = 1;
		
		url = strConcat("json(https://api.binance.com/api/v3/ticker/price?symbol=", game.coins[1].name, "USDT).price");
		queryId = oraclize_query(60, "URL", url);
		startExRateQueryIds[queryId] = gameData.length;
		game.startExRateQueryIds[queryId] = 2;
		
		url = strConcat("json(https://api.binance.com/api/v3/ticker/price?symbol=", game.coins[2].name, "USDT).price");
		queryId = oraclize_query(60, "URL", url);
		startExRateQueryIds[queryId] = gameData.length;
		game.startExRateQueryIds[queryId] = 3;
		
		url = strConcat("json(https://api.binance.com/api/v3/ticker/price?symbol=", game.coins[3].name, "USDT).price");
		queryId = oraclize_query(60, "URL", url);
		startExRateQueryIds[queryId] = gameData.length;
		game.startExRateQueryIds[queryId] = 4;
		
		url = strConcat("json(https://api.binance.com/api/v3/ticker/price?symbol=", game.coins[4].name, "USDT).price");
		queryId = oraclize_query(60, "URL", url);
		startExRateQueryIds[queryId] = gameData.length;
		game.startExRateQueryIds[queryId] = 5;
		
		emit GameCreated(gameData.length - 1, game.openTime);
	}
	
	function numberOfGameData() public view returns (uint256) {
        return gameData.length;
    }
    
    function getGameYDistribution(uint256 _gameId) public view returns (uint8[50]) {
        require(_gameId < gameData.length);
        GameData storage game = gameData[_gameId];
        return game.YDistribution;
    }
    
    function getNumberOfWinnerCoinIds(uint256 _gameId) public view returns (uint256) {
        require(_gameId < gameData.length);
        GameData storage game = gameData[_gameId];
        return game.winnerCoinIds.length;
    }
    
    function getWinnerCoinIds(uint256 _gameId, uint256 _winnerId) public view returns (uint256) {
        require(_gameId < gameData.length);
        
        GameData storage game = gameData[_gameId];
        require(_winnerId < game.winnerCoinIds.length);
        
        return game.winnerCoinIds[_winnerId];
    }
    
    function getGameCoinData(uint256 _gameId)
	    public 
	    view 
	    returns (string coinName0, string coinName1, string coinName2, string coinName3, string coinName4
	        , int32[5] startExRate, int32[5] endExRate)
	{
	    require(_gameId < gameData.length);
	    
	    GameData storage game = gameData[_gameId];
	    
	    coinName0 = game.coins[0].name;
	    startExRate[0] = game.coins[0].startExRate;
	    endExRate[0] = game.coins[0].endExRate;
	    
	    coinName1 = game.coins[1].name;
	    startExRate[1] = game.coins[1].startExRate;
	    endExRate[1] = game.coins[1].endExRate;
	    
	    coinName2 = game.coins[2].name;
	    startExRate[2] = game.coins[2].startExRate;
	    endExRate[2] = game.coins[2].endExRate;
	    
	    coinName3 = game.coins[3].name;
	    startExRate[3] = game.coins[3].startExRate;
	    endExRate[3] = game.coins[3].endExRate;
	    
	    coinName4 = game.coins[4].name;
	    startExRate[4] = game.coins[4].startExRate;
	    endExRate[4] = game.coins[4].endExRate;
	}
    
    function getGameBetData(uint256 _gameId, uint256 _coinId)
	    public 
	    view 
	    returns (uint256 totalBets, uint256 largestBets, uint256 numberOfBets)
	{
	    require(_gameId < gameData.length);
	    require(_gameId < gameHideableData.length);
	    require(_coinId < 5);
	    
	    GameData storage game = gameData[_gameId];
	    GameHideableData storage hidableData = gameHideableData[_gameId];
	    
	    if (!(now <= game.closeTime && now.add(HIDDEN_TIME_BEFORE_CLOSE) > game.closeTime)) {
	        CoinBets storage b = hidableData.coinbets[_coinId];
	        totalBets = b.totalBets;
	        numberOfBets = b.bets.length;
	        largestBets = _getLargestBets(b);
	    }
	}
    
    function bet(uint256 _gameId, uint256 _coinId) public payable {
	    require(msg.value >= MIN_BET);
	    require(_gameId < gameData.length);
	    require(_gameId < gameHideableData.length);
	    require(_coinId < 5);
	    
	    GameData storage game = gameData[_gameId];
	    require(now >= game.openTime && now <= game.closeTime);
	    
	    uint256 txFeeAmount = msg.value.mul(game.txFee).div(1000);
	    uint256 betAmount = msg.value.sub(txFeeAmount);
	    
	    teamWallet.transfer(txFeeAmount);
	    
	    CoinBets storage c = gameHideableData[_gameId].coinbets[_coinId];
	    c.totalBets += betAmount;
	    
	    uint256 largestBets = _getLargestBets(c);
	    
	    uint256 betId = c.bets.length++;
	    Bet storage b = c.bets[betId];
	    
	    b.player = msg.sender;
	    b.amount = betAmount;
	    
	   if (betAmount > largestBets) {
            c.largestBetIds.length = 1;
            c.largestBetIds[0] = betId;
            
            if (!isBetInformationHidden(_gameId)) {     
        	    emit CoinLargestBet(_gameId, _coinId, betAmount);
            }
        } else if (betAmount == largestBets) {
            c.largestBetIds.push(betId);
        }
        
        if (!isBetInformationHidden(_gameId)) {
            emit CoinBet(_gameId, _coinId, msg.sender, betAmount);
        }
	}
    
    function isBetInformationHidden(uint256 _gameId) public view returns (bool) {
        require(_gameId < gameData.length);
        
	    GameData storage game = gameData[_gameId];
	    return now <= game.closeTime && now.add(HIDDEN_TIME_BEFORE_CLOSE) > game.closeTime;
    }
	
	/*
	function close(uint256 _gameId, int32[5] _endExRate, uint256 _timeStampOfEndRate) 
	    onlyOwner 
	    public 
	    returns (bool)
	{
	    require(_gameId < gameData.length);
	    require(_gameId < gameHideableData.length);
	    
	    require(_endExRate[0] > 0);
		require(_endExRate[1] > 0);
		require(_endExRate[2] > 0);
		require(_endExRate[3] > 0);
		require(_endExRate[4] > 0);
		
		GameData storage game = gameData[_gameId];
		GameHideableData storage hidableData = gameHideableData[_gameId];
		
		require(now > game.closeTime);
		
		uint256[5] memory ranks;
		
		// Get largest and smallest rasing rate coins.
	    int32 largestStart = game.coins[0].startExRate;
	    int32 largestEnd = _endExRate[0];
	    int32 start = game.coins[1].startExRate;
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
		    start = game.coins[i].startExRate;
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
		        if (_getLargestBets(hidableData.coinbets[ranks[0]]) < _getLargestBets(hidableData.coinbets[i])) {
		            ranks[i] = ranks[0];
		            ranks[0] = i;
		        }
		    } else if (_isEqualTo(start, end, smallStart, smallEnd)) {
		        if (_getLargestBets(hidableData.coinbets[ranks[1]]) < _getLargestBets(hidableData.coinbets[i])) {
		            ranks[i] = ranks[1];
		            ranks[1] = i;
		        }
		    }
		}
		
		// Sort the largest/smallest coins by larest bets.
		if (_getLargestBets(hidableData.coinbets[ranks[0]]) < _getLargestBets(hidableData.coinbets[ranks[1]])) {
		    uint256 tmp = ranks[0];
		    ranks[0] = ranks[1];
		    ranks[1] = tmp;
		}
		
		// Sort the rest of coins by totalbets.
		if (hidableData.coinbets[ranks[2]].totalBets > hidableData.coinbets[ranks[3]].totalBets) {
		    if (hidableData.coinbets[ranks[4]].totalBets > hidableData.coinbets[ranks[2]].totalBets) {
		        tmp = ranks[2];
		        ranks[2] = ranks[4];
		        ranks[4] = ranks[3];
		        ranks[3] = tmp;
		    } else if (hidableData.coinbets[ranks[4]].totalBets > hidableData.coinbets[ranks[3]].totalBets) {
		        tmp = ranks[3];
		        ranks[3] = ranks[4];
		        ranks[4] = tmp;
		    }
		} else if (hidableData.coinbets[ranks[2]].totalBets < hidableData.coinbets[ranks[3]].totalBets) {
		    if (hidableData.coinbets[ranks[4]].totalBets <= hidableData.coinbets[ranks[2]].totalBets) {
		        tmp = ranks[2];
		        ranks[2] = ranks[3];
		        ranks[3] = tmp;
		    } else if (hidableData.coinbets[ranks[4]].totalBets <= hidableData.coinbets[ranks[3]].totalBets) {
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
		    if (hidableData.coinbets[ranks[4]].totalBets > hidableData.coinbets[ranks[2]].totalBets) {
		        tmp = ranks[2];
		        ranks[2] = ranks[4];
		        ranks[4] = tmp;
		    }
		}
		
		
		// Decide the winner.
		if (_getLargestBets(hidableData.coinbets[ranks[1]]).add(game.minDiffBets) < _getLargestBets(hidableData.coinbets[ranks[0]])) {
		    game.isClosed = true;
		    game.winnerCoinIds.push(ranks[0]);
		    
            largestStart = game.coins[ranks[0]].startExRate;
	        largestEnd = _endExRate[ranks[0]];
	        
	        for (i = 2; i < 5; ++i) {
	            start = game.coins[ranks[i]].startExRate;
		        end = _endExRate[ranks[i]];
		        
		        if (_isEqualTo(largestStart, largestEnd, start, end)) {
		            game.winnerCoinIds.push(ranks[i]);
		        }
	        }
		} else {
            start = game.coins[ranks[2]].startExRate;
		    end = _endExRate[ranks[2]];
		        
		    if (_isEqualTo(largestStart, largestEnd, start, end) || 
		        _isEqualTo(smallStart, smallEnd, start, end)) {
		        
		        start = game.coins[ranks[3]].startExRate;
		        end = _endExRate[ranks[3]];
		        
                if (_isEqualTo(largestStart, largestEnd, start, end) || 
		            _isEqualTo(smallStart, smallEnd, start, end)) {

		            start = game.coins[ranks[4]].startExRate;
		            end = _endExRate[ranks[4]];
		            
		            if (!_isEqualTo(largestStart, largestEnd, start, end) && 
		                !_isEqualTo(smallStart, smallEnd, start, end)) {
		                
		                game.isClosed = true;
		                game.winnerCoinIds.push(ranks[4]);
		            }
		        } else {
		            start = game.coins[ranks[4]].startExRate;
		            end = _endExRate[ranks[4]];
		            
		            if (_isEqualTo(largestStart, largestEnd, start, end) ||
		                _isEqualTo(smallStart, smallEnd, start, end)) {
		                
		                game.isClosed = true;
		                game.winnerCoinIds.push(ranks[3]);
		            } else {
		                if (hidableData.coinbets[ranks[4]].totalBets.add(game.minDiffBets) < hidableData.coinbets[ranks[3]].totalBets) {
		                    game.isClosed = true;
		                    game.winnerCoinIds.push(ranks[3]);
	                    }
		            }
		        }
		    } else {
		        
		        start = game.coins[ranks[3]].startExRate;
		        end = _endExRate[ranks[3]];
		        
                if (_isEqualTo(largestStart, largestEnd, start, end) || 
		            _isEqualTo(smallStart, smallEnd, start, end)) {

		            start = game.coins[ranks[4]].startExRate;
		            end = _endExRate[ranks[4]];
		            
		            if (_isEqualTo(largestStart, largestEnd, start, end) ||
		                _isEqualTo(smallStart, smallEnd, start, end)) {
		                
		                game.isClosed = true;
		                game.winnerCoinIds.push(ranks[2]);
		            } else {
		                if (hidableData.coinbets[ranks[4]].totalBets.add(game.minDiffBets) < hidableData.coinbets[ranks[2]].totalBets) {
		                    game.isClosed = true;
		                    game.winnerCoinIds.push(ranks[2]);
	                    }
		            }
		        } else {
		            if (hidableData.coinbets[ranks[3]].totalBets.add(game.minDiffBets) < hidableData.coinbets[ranks[2]].totalBets) {
		                game.isClosed = true;
		                game.winnerCoinIds.push(ranks[2]);
	                }
		        }
		    }
		}
		
		if (game.isClosed) {
		    game.timeStampOfEndRate = _timeStampOfEndRate;
		    game.coins[0].endExRate = _endExRate[0];
		    game.coins[1].endExRate = _endExRate[1];
		    game.coins[2].endExRate = _endExRate[2];
		    game.coins[3].endExRate = _endExRate[3];
		    game.coins[4].endExRate = _endExRate[4];
		    
		    _distributeAwards(game, hidableData);
		    
		    emit Closed(_gameId);
		} else {
		    game.closeTime = game.closeTime.add(game.gameDuration);
		    emit Extended(_gameId);
		}
		
		return game.isClosed;
		
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
	
	function _distributeAwards(GameData storage _game, GameHideableData storage _gameHidableData) private {
	    _game.Y = _randY(_game);
	    
	    uint256 totalAward = address(this).balance;
	    uint256 totalAwardPerCoin = totalAward.div(_game.winnerCoinIds.length);
	    uint256 restWei = 0;
	    
	    for (uint256 i = 0; i < _game.winnerCoinIds.length; ++i) {
	        restWei += _distributeOneCoin(_game, _gameHidableData.coinbets[_game.winnerCoinIds[i]], totalAwardPerCoin);
	    }
	    
	    if (0 < restWei) {
	        teamWallet.transfer(restWei);
		    emit SendRemainAwards(_game.id, teamWallet, restWei);
	    }
	}
	
	function _distributeOneCoin(GameData storage _game, CoinBets storage _cbets, uint256 totalAwards) 
	    private 
	    returns (uint256)
	{
	    uint256 awards;
	    uint256 weightedY = uint256(_game.Y).mul(_cbets.bets.length);
	    uint256 totalAwardsA = totalAwards.mul(_game.A).div(100);
	    uint256 totalAwardsB = totalAwards.mul(_game.B).div(100);
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
	        
	        if (0 < awards) {
	            _cbets.bets[i].player.transfer(awards);
	            totalAwards = totalAwards.sub(awards);
			    emit SendAwards(_game.id, _cbets.bets[i].player, awards);
	        }
	    }
		
		totalAwardsA = totalAwards.div(_cbets.largestBetIds.length);
	    
	    if (0 < totalAwardsA) {
	        for (i = 0; i < _cbets.largestBetIds.length; ++i) {
	            _cbets.bets[_cbets.largestBetIds[i]].player.transfer(totalAwardsA);
	            totalAwards = totalAwards.sub(totalAwardsA);
			    emit SendAwards(_game.id, _cbets.bets[_cbets.largestBetIds[i]].player, totalAwardsA);
	        }
	    }
	    
	    return totalAwards;
	}
	
	function _randY(GameData storage _game) private view returns (uint8) {
	    return uint8(_game.YDistribution[now % _game.YDistribution.length]);
	}
	*/
	function _getLargestBets(CoinBets storage _cbets) private view returns (uint256) {
	    return (_cbets.largestBetIds.length > 0) ? _cbets.bets[_cbets.largestBetIds[0]].amount : 0;
	}
	
	// Callback for oraclize query.
	function __callback(bytes32 _id, string _result) public {
	    assert(msg.sender == oraclize_cbAddress());
	    uint256 gameId;
	    uint256 coinId; 
	    if (0 != startExRateQueryIds[_id]) {
	        gameId = startExRateQueryIds[_id] - 1;
	        GameData storage data = gameData[gameId];
            
	        coinId = data.startExRateQueryIds[_id] - 1;
	        data.coins[coinId].startExRate = int32(parseInt(_result));
	        
	        delete startExRateQueryIds[_id];
	        delete data.startExRateQueryIds[_id];
	        
	        emit StartExRateUpdated(gameId, coinId, data.coins[coinId].startExRate);
	    } else if (0 != endExRateQueryIds[_id]) {
	        gameId = endExRateQueryIds[_id] - 1;
	        data = gameData[gameId];
            
	        coinId = data.endExRateQueryIds[_id] - 1;
	        data.coins[coinId].endExRate = int32(parseInt(_result));
	        
	        delete endExRateQueryIds[_id];
	        delete data.endExRateQueryIds[_id];
	        
	        emit EndExRateUpdated(gameId, coinId, data.coins[coinId].endExRate);
	    } else if (0 != randYQueryIds[_id]) {
	        
	        gameId = randYQueryIds[_id] - 1;
	        data = gameData[gameId];
	        
	        data.Y = data.YDistribution[parseInt(_result)];
	        
	        delete randYQueryIds[_id];
	        emit YChoosed(gameId, data.Y);
	    } else {
	        revert();
	    }
   }
}