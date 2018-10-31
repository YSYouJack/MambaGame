pragma solidity ^0.4.24;

import "../third-contracts/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../third-contracts/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../third-contracts/oraclize/ethereum-api/oraclizeAPI_0.5.sol";
import "./GameLogic.sol";

contract GamePool is Ownable, usingOraclize {
    using SafeMath for uint256;
    
    enum RecordType { StartExRate, EndExRate, RandY }
    
    struct QueryRecord {
        RecordType recordType;
        uint256 gameId;
        uint256 arg;
    }
    
    mapping (bytes32 => QueryRecord) public queryRecords;
    
    GameLogic.Instance[] public games;
    GameLogic.GameBets[] gameBets;
    
    address public txFeeReceiver;
    uint256 public oraclizeFee;
    
    uint256 public MIN_BET = 10 finney; // 0.01 ether.
	uint256 public HIDDEN_TIME_BEFORE_CLOSE = 5 minutes;
	uint256 public ORICALIZE_GAS_LIMIT = 200000;
    
    event StartExRateUpdated(uint256 indexed gameId, uint256 coinId, int32 rate, uint256 timeStamp);
    event EndExRateUpdated(uint256 indexed gameId, uint256 coinId, int32 rate, uint256 timeStamp);
    event GameYChoosed(uint256 indexed gameId, uint8 Y);
    
    event Log(string message);
    event LogAddr(address addr);
	event CoinBet(uint256 indexed gameId, uint256 coinId, address player, uint256 amount);
	event CoinLargestBetChanged(uint256 indexed gameId, uint256 coinId, uint256 amount);
	event SendAwards(uint256 indexed gameId, address player, uint256 awards);
	event OraclizeFeeReceived(uint256 received);
	event OraclizeFeeUsed(uint256 used);
	event SentOraclizeQuery(bytes32 queryId);
	
	event GameCreated(uint256 gameId);
	
	event GameClosed(uint256 indexed gameId);
	event GameExtended(uint256 indexed gameId, uint256 closeTime);
	event GameWaitToClose(uint256 indexed gameId);
	event GameReady(uint256 indexed gameId);
    event GameOpened(uint256 indexed gameId);
    
    constructor(address _txFeeReceiver) public {
        require(address(0) != _txFeeReceiver);
        txFeeReceiver = _txFeeReceiver;
        
        //OAR = OraclizeAddrResolverI(0x0BffB729b30063E53A341ba6a05dfE8f817E7a53);
        //emit LogAddr(oraclize_cbAddress());
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
		
		GameLogic.Instance storage game = games[games.length - 1];
		
		game.id = games.length - 1;
		game.openTime = _openTime;
		game.closeTime = _openTime + _duration - 1;
		game.duration = _duration;
		game.hiddenTimeBeforeClose = HIDDEN_TIME_BEFORE_CLOSE;
		
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
		
		emit GameCreated(game.id);
	}
	
	function gameCoinData(uint256 _gameId, uint256 _coinId)
	    public 
	    view 
	    returns (string name, int32 startExRate, uint256 timeStampOfStartExRate
	             , int32 endExRate, uint256 timeStampOfEndExRate)
	{
	    require(_gameId < games.length);
	    require(_coinId < 5);
	    
	    GameLogic.Instance storage game = games[_gameId];
	    
	    name = game.coins[_coinId].name;
	    startExRate = game.coins[_coinId].startExRate;
	    timeStampOfStartExRate = game.coins[_coinId].timeStampOfStartExRate;
	    endExRate = game.coins[_coinId].endExRate;
	    timeStampOfEndExRate = game.coins[_coinId].timeStampOfEndExRate;
	}
	
	function gameBetData(uint256 _gameId, uint256 _coinId)
	    public 
	    view 
	    returns (uint256 totalBets, uint256 largestBets, uint256 numberOfBets)
	{
	    require(_gameId < games.length);
	    require(_gameId < gameBets.length);
	    require(_coinId < 5);
	    
	    GameLogic.Instance storage game = games[_gameId];
	    GameLogic.GameBets storage bets = gameBets[_gameId];
	    
	    if (!GameLogic.isBetInformationHidden(game)) {
	        GameLogic.CoinBets storage c = bets.coinbets[_coinId];
	        totalBets = c.totalBetAmount;
	        numberOfBets = c.bets.length;
	        largestBets = c.largestBetAmount;
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
        
        GameLogic.Instance storage game = games[_gameId];
        require(_winnerId < game.winnerCoinIds.length);
        
        return game.winnerCoinIds[_winnerId];
    }
    
    function gameState(uint256 _gameId) public view returns (GameLogic.State) {
        if (_gameId < games.length) {
            return GameLogic.state(games[_gameId]);
        } else {
            return GameLogic.State.NotExists;
        }
    }
    
    function isBetInformationHidden(uint256 _gameId) public view returns (bool) {
        require(_gameId < games.length);
        return GameLogic.isBetInformationHidden(games[_gameId]);
    }
    
    function gameAwardAmount() public view returns (uint256) {
        return address(this).balance.sub(oraclizeFee);
    } 
    
    function bet(uint256 _gameId, uint256 _coinId) public payable {
	    require(msg.value >= MIN_BET);
	    require(_gameId < games.length);
	    require(_gameId < gameBets.length);
	   
	    
	    GameLogic.Instance storage game = games[_gameId];
	    GameLogic.GameBets storage bets = gameBets[_gameId];
	    
	    GameLogic.bet(game, bets, _coinId, txFeeReceiver);
	}
	
	function fetchStartRate(uint256 _gameId) public onlyOwner {
	    // Check the game id.
        require(_gameId < games.length);
        
        // Check the game state.
        GameLogic.Instance storage game = games[_gameId];
        require(GameLogic.state(game) == GameLogic.State.Created);
        
        // Check the tx fee amount.
       require(address(this).balance >= oraclizeFee);
        
        // Query all start exchange rate.
		string memory url;
		bytes32 queryId;
		
		for (uint256 i = 0; i < 5; ++i) {
		    url = strConcat("json(https://api.binance.com/api/v3/ticker/price?symbol=", game.coins[i].name, "USDT).price");
		    queryId = _doOraclizeQuery(url);
		    queryRecords[queryId] = QueryRecord(RecordType.StartExRate, game.id, i);
		}
    }	
    
    function fetchExRate(uint256 _gameId) public onlyOwner payable {
        // Check the game id.
        require(_gameId < games.length);
        
        // Check the game state.
        GameLogic.Instance storage game = games[_gameId];
        require(GameLogic.state(game) == GameLogic.State.Stop);
        
        // Check the tx fee amount.
        require(address(this).balance >= oraclizeFee);
        
        // Query all end exchange rate.
		string memory url;
		bytes32 queryId;
		
		for (uint256 i = 0; i < 5; ++i) {
		    url = strConcat("json(https://api.binance.com/api/v3/ticker/price?symbol=", game.coins[i].name, "USDT).price");
		    queryId = _doOraclizeQuery(url);
		    queryRecords[queryId] = QueryRecord(RecordType.EndExRate, game.id, i);
		}
		
		// Query rand y.
		queryId = _doOraclizeQuery("https://www.random.org/integers/?num=1&min=0&max=49&col=1&base=10&format=plain&rnd=new");
		queryRecords[queryId] = QueryRecord(RecordType.RandY, game.id, 0);
    }
    
    function close(uint256 _gameId) 
	    onlyOwner 
	    public
	    returns (bool)
	{
	    require(_gameId < games.length);
	    require(_gameId < gameBets.length);
	    
		GameLogic.Instance storage game = games[_gameId];
		require(GameLogic.state(game) == GameLogic.State.WaitToClose);
		
		GameLogic.GameBets storage bets = gameBets[_gameId];
		
		GameLogic.tryClose(game, bets, gameAwardAmount());
		
		if (game.isFinished) {
		    emit GameClosed(_gameId);
		} else {
		    game.Y = 0;
		    game.coins[0].endExRate = 0;
		    game.coins[1].endExRate = 0;
		    game.coins[2].endExRate = 0;
		    game.coins[3].endExRate = 0;
		    game.coins[4].endExRate = 0;
		    game.coins[0].timeStampOfEndExRate = 0;
		    game.coins[1].timeStampOfEndExRate = 0;
		    game.coins[2].timeStampOfEndExRate = 0;
		    game.coins[3].timeStampOfEndExRate = 0;
		    game.coins[4].timeStampOfEndExRate = 0;
		    
		    game.closeTime = game.closeTime.add(game.duration);
		    emit GameExtended(_gameId, game.closeTime);
		}
		
		return game.isFinished;
	}
	
	function calculateAwardAmount(uint256 _gameId) public view returns (uint256) {
	    require(_gameId < games.length);
	    require(_gameId < gameBets.length);
	    
	    GameLogic.State queryGameState = gameState(_gameId);
	    GameLogic.State nextGameState = gameState(_gameId.add(1));
	    
	    if (GameLogic.State.Closed == queryGameState && GameLogic.State.Open > nextGameState) {
	        GameLogic.Instance storage game = games[_gameId];
		    GameLogic.GameBets storage bets = gameBets[_gameId];
		
		    return GameLogic.calculateAwardAmount(game, bets);
	    } else {
	        return 0;
	    }
	}
	
	function getAwards(uint256 _gameId) public {
	    uint256 amount = calculateAwardAmount(_gameId);
		if (0 < amount) {
		    require(gameAwardAmount() >= amount);
		    
		    msg.sender.transfer(amount);
		    
		    GameLogic.GameBets storage bets = gameBets[_gameId];
		    bets.isAwardTransfered[msg.sender] = true;
		    
		    emit SendAwards(_gameId, msg.sender, amount);
		}
	}
	
	function closeErrorGame(uint256 _gameId) public {
        require(_gameId < games.length);
	    
	    GameLogic.Instance storage game = games[_gameId];
	    GameLogic.closeErrorGame(game);
		
		emit GameClosed(_gameId);
	}
    
    function withdrawOraclizeFee() public onlyOwner {
        require(address(this).balance >= oraclizeFee);
        uint256 amount = oraclizeFee;
        oraclizeFee = 0;
        owner().transfer(amount);
    }
    
    function sendOraclizeFee() public payable {
        oraclizeFee = oraclizeFee.add(msg.value);
        emit OraclizeFeeReceived(msg.value);
    }
    
    function () public payable {
        sendOraclizeFee();
    }
    
    // Callback for oraclize query.
	function __callback(bytes32 _id, string _result) public {
	    assert(msg.sender == oraclize_cbAddress());
	    
	    uint256 gameId = queryRecords[_id].gameId;
	    GameLogic.Instance storage game = games[gameId];
	    
	    if (RecordType.RandY == queryRecords[_id].recordType) {
	        game.Y = game.YDistribution[parseInt(_result)];
	        game.isYChoosed = true;
	        delete queryRecords[_id];
	        emit GameYChoosed(gameId, game.Y);
	        
	        if (GameLogic.state(game) == GameLogic.State.WaitToClose) {
	            emit GameWaitToClose(gameId);
	        }
	        
	    } else {
	        uint256 coinId = queryRecords[_id].arg;
	        if (RecordType.StartExRate == queryRecords[_id].recordType) {
	            game.coins[coinId].startExRate = int32(parseInt(_result, 2));
	            game.coins[coinId].timeStampOfStartExRate = now;
	            delete queryRecords[_id];
	            emit StartExRateUpdated(gameId, coinId, game.coins[coinId].startExRate, now);
	            
	            if (GameLogic.state(game) == GameLogic.State.WaitToClose) {
	                emit GameWaitToClose(gameId);
	            }
	            
	        } else if (RecordType.EndExRate == queryRecords[_id].recordType) {
	            game.coins[coinId].endExRate = int32(parseInt(_result, 2));
	            game.coins[coinId].timeStampOfEndExRate = now;
	            delete queryRecords[_id];
	            emit EndExRateUpdated(gameId, coinId, game.coins[coinId].endExRate, now);
	            
	            if (GameLogic.state(game) == GameLogic.State.Ready) {
	                emit GameReady(gameId);
	            } else if (GameLogic.state(game) == GameLogic.State.Open) {
	                emit GameOpened(gameId);
	            }
	            
	        } else {
	            revert();
	        }
	    }
    }
    
    function _doOraclizeQuery(string url) private returns (bytes32) {
		uint256 fee = oraclize_getPrice("URL", ORICALIZE_GAS_LIMIT);
		require(fee <= oraclizeFee);
		oraclizeFee = oraclizeFee.sub(fee);
		
		bytes32 queryId = oraclize_query("URL", url, ORICALIZE_GAS_LIMIT);
		
		emit OraclizeFeeUsed(fee);
		emit SentOraclizeQuery(queryId);
		
		return queryId;
    }
}