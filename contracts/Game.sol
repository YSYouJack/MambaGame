pragma solidity ^0.4.24;

import "../third-contracts/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../third-contracts/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../third-contracts/oraclize/ethereum-api/oraclizeAPI_0.5.sol";
import "./Game.sol";

contract MambaGame is Ownable, usingOraclize {
    using SafeMath for uint256;
    
    enum RecordType { StartExRate, EndExRate, RandY }
    
    struct QueryRecord {
        RecordType recordType;
        uint256 gameId;
        uint256 arg;
    }
    
    mapping (bytes32 => QueryRecord) public queryRecords;
    Game.Instance[] public games;
    Game.Bets[] gameBets;
    
    address public teamWallet;
    
    uint256 public MIN_BET = 10 finney; // 0.01 ether.
	uint256 public HIDDEN_TIME_BEFORE_CLOSE = 5 minutes;
    
    event StartExRateUpdated(uint256 indexed gameId, uint256 coinId, int32 rate);
    event EndExRateUpdated(uint256 indexed gameId, uint256 coinId, int32 rate);
    event Log(string message);
    event Closed(uint256 indexed gameId);
	event Extended(uint256 indexed gameId);
	event CoinBet(uint256 indexed gameId, uint256 indexed coinId, address player, uint256 bets);
	event CoinLargestBet(uint256 indexed gameId, uint256 indexed coinId, uint256 bets);
	event SendAwards(uint256 indexed gameId, address player, uint256 awards);
	event SendRemainAwards(uint256 indexed gameId, address teamWallet, uint256 awards);
	event GameYChoosed(uint256 indexed gameId, uint8 Y);
    
    constructor(address _teamWallet) public {
        require(address(0) != _teamWallet);
        teamWallet = _teamWallet;
        
        OAR = OraclizeAddrResolverI(0xA8473897374abf3f316a38AFb90498b2F58aE49E);
    }
    
    function createNewGame(uint256 _openTime
		, uint256 _duration
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
		require(_duration > 0);
		
		require(_txFee <= 1000); // < 100%
		
		if (0 != games.length) {
	        require(games[games.length - 1].isFinished);
	    }
		
		// Create new game data.
		games.length++;
		gameBets.length++;
		
		Game.Instance storage game = games[games.length - 1];
		
		game.id = games.length - 1;
		game.openTime = _openTime;
		game.closeTime = _openTime + _duration;
		game.duration = _duration;
		
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
		game.isFinished = false;
		game.isYChoosed = false;
	}
    
    function gameCoinData(uint256 _gameId)
	    public 
	    view 
	    returns (string coinName0, string coinName1, string coinName2, string coinName3, string coinName4
	        , int32[5] startExRate, int32[5] endExRate)
	{
	    require(_gameId < games.length);
	    
	    Game.Instance storage game = games[_gameId];
	    
	    coinName0 = game.coins[0].name;
	    coinName1 = game.coins[1].name;
	    coinName2 = game.coins[2].name;
	    coinName3 = game.coins[3].name;
	    coinName4 = game.coins[4].name;
	    
	    for (uint256 i = 0; i < 5; ++i) {
	        startExRate[i] = game.coins[i].startExRate;
	        endExRate[i] = game.coins[i].endExRate;
	    }
	}
	
	function gameBetData(uint256 _gameId, uint256 _coinId)
	    public 
	    view 
	    returns (uint256 totalBets, uint256 largestBets, uint256 numberOfBets)
	{
	    require(_gameId < games.length);
	    require(_gameId < gameBets.length);
	    require(_coinId < 5);
	    
	    Game.Instance storage game = games[_gameId];
	    Game.Bets storage bets = gameBets[_gameId];
	    
	    if (!(now <= game.closeTime && now.add(HIDDEN_TIME_BEFORE_CLOSE) > game.closeTime)) {
	        Game.CoinBets storage b = bets.coinbets[_coinId];
	        totalBets = b.totalBets;
	        numberOfBets = b.bets.length;
	        largestBets = Game._getLargestBets(b);
	    }
	}
	
	function numberOfGames() public view returns (uint256) {
        return games.length;
    }
    
    function gameYDistribution(uint256 _gameId) public view returns (uint8[50]) {
        require(_gameId < games.length);
        return games[_gameId].YDistribution;
    }
    
    function gameNumberOfWinnerCoinIds(uint256 _gameId) public view returns (uint256) {
        require(_gameId < games.length);
        return games[_gameId].winnerCoinIds.length;
    }
    
    function gameWinnerCoinIds(uint256 _gameId, uint256 _winnerId) public view returns (uint256) {
        require(_gameId < games.length);
        
        Game.Instance storage game = games[_gameId];
        require(_winnerId < game.winnerCoinIds.length);
        
        return game.winnerCoinIds[_winnerId];
    }
    
    function gameState(uint256 _gameId) public view returns (Game.State) {
        require(_gameId < games.length);
        return Game.state(games[_gameId]);
    }
    
    function isBetInformationHidden(uint256 _gameId) public view returns (bool) {
        require(_gameId < games.length);
        
	    Game.Instance storage game = games[_gameId];
	    return now <= game.closeTime && now.add(HIDDEN_TIME_BEFORE_CLOSE) > game.closeTime;
    }
    
    function bet(uint256 _gameId, uint256 _coinId) public payable {
	    require(msg.value >= MIN_BET);
	    require(_gameId < games.length);
	    require(_gameId < gameBets.length);
	    require(_coinId < 5);
	    
	    Game.Instance storage game = games[_gameId];
	    require(Game.state(game) == Game.State.Open);
	    
	    uint256 txFeeAmount = msg.value.mul(game.txFee).div(1000);
	    uint256 betAmount = msg.value.sub(txFeeAmount);
	    
	    teamWallet.transfer(txFeeAmount);
	    
	    Game.CoinBets storage c = gameBets[_gameId].coinbets[_coinId];
	    c.totalBets += betAmount;
	    
	    uint256 largestBets = Game._getLargestBets(c);
	    
	    uint256 betId = c.bets.length++;
	    Game.Bet storage b = c.bets[betId];
	    
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
    
    function fetchStartRate(uint256 _gameId) public onlyOwner payable {
        require(_gameId < games.length);
        
        Game.Instance storage game = games[_gameId];
        require(Game.state(game) == Game.State.Created);
        
        // Query all start exchange rate.
		string memory url;
		bytes32 queryId;
		
		for (uint256 i = 0; i < 5; ++i) {
		    url = strConcat("json(https://api.binance.com/api/v3/ticker/price?symbol=", game.coins[i].name, "USDT).price");
		    queryId = oraclize_query(60, "URL", url);
		    queryRecords[queryId] = QueryRecord(RecordType.StartExRate, game.id, i);
		}
    }	
    
    function fetchExRate(uint256 _gameId) public onlyOwner payable {
        require(_gameId < games.length);
        
        Game.Instance storage game = games[_gameId];
        require(Game.state(game) == Game.State.Stop);
        
        // Query all start exchange rate.
		string memory url;
		bytes32 queryId;
		
		for (uint256 i = 0; i < 5; ++i) {
		    url = strConcat("json(https://api.binance.com/api/v3/ticker/price?symbol=", game.coins[i].name, "USDT).price");
		    queryId = oraclize_query(60, "URL", url);
		    queryRecords[queryId] = QueryRecord(RecordType.EndExRate, game.id, i);
		}
		
		queryId = oraclize_query(60, "URL", "https://www.random.org/integers/?num=1&min=0&max=49&col=1&base=10&format=plain&rnd=new");
		queryRecords[queryId] = QueryRecord(RecordType.RandY, game.id, 0);
    }
    
    function close(uint256 _gameId, uint256 _timeStampOfEndRate) 
	    onlyOwner 
	    public 
	    returns (bool)
	{
	    require(_gameId < games.length);
	    require(_gameId < gameBets.length);
	    require(Game.state(game) == Game.State.WaitToClose);
		
		Game.Instance storage game = games[_gameId];
		Game.Bets storage bets = gameBets[_gameId];
		
		Game.tryClose(game, bets);
		
		if (game.isFinished) {
		    game.timeStampOfEndRate = _timeStampOfEndRate;
		    //_distributeAwards(game, bets);
		    
		    emit Closed(_gameId);
		} else {
		    game.closeTime = game.closeTime.add(game.duration);
		    if (game.closeTime <= now) {
		        game.closeTime = now.add(game.duration);
		    }
		    
		    emit Extended(_gameId);
		}
	}
    
    function _distributeAwards(Game.Instance storage _game, Game.Bets storage _bets) private {
	    uint256 totalAward = address(this).balance;
	    uint256 totalAwardPerCoin = totalAward.div(_game.winnerCoinIds.length);
	    uint256 restWei = 0;
	    
	    for (uint256 i = 0; i < _game.winnerCoinIds.length; ++i) {
	        restWei += _distributeOneCoin(_game, _bets.coinbets[_game.winnerCoinIds[i]], totalAwardPerCoin);
	    }
	    
	    if (0 < restWei) {
	        teamWallet.transfer(restWei);
		    emit SendRemainAwards(_game.id, teamWallet, restWei);
	    }
	}
	
	function _distributeOneCoin(Game.Instance storage _game, Game.CoinBets storage _cbets, uint256 totalAwards) 
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
    
    // Callback for oraclize query.
	function __callback(bytes32 _id, string _result) public {
	    assert(msg.sender == oraclize_cbAddress());
	    
	    uint256 gameId = queryRecords[_id].gameId;
	    Game.Instance storage game = games[gameId];
	    
	    if (RecordType.RandY == queryRecords[_id].recordType) {
	        game.Y = game.YDistribution[parseInt(_result)];
	        game.isYChoosed = true;
	        delete queryRecords[_id];
	        emit GameYChoosed(gameId, game.Y);
	    } else {
	        uint256 coinId = queryRecords[_id].arg;
	        delete queryRecords[_id];
	        
	        if (RecordType.StartExRate == queryRecords[_id].recordType) {
	            game.coins[coinId].startExRate = int32(parseInt(_result, 2));
	            emit StartExRateUpdated(gameId, coinId, game.coins[coinId].startExRate);
	        } else if (RecordType.EndExRate == queryRecords[_id].recordType) {
	            game.coins[coinId].endExRate = int32(parseInt(_result, 2));
	            emit EndExRateUpdated(gameId, coinId, game.coins[coinId].endExRate);
	        } else {
	            revert();
	        }
	    }
   }
}