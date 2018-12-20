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
    uint256 public ORICALIZE_GAS_LIMIT = 120000;
    uint256 public CLAIM_AWARD_TIME_AFTER_CLOSE = 30 days;
    uint256 public MAX_FETCHING_TIME_FOR_END_EXRATE = 1 hours;
    
    event StartExRateUpdated(uint256 indexed gameId, uint256 coinId, int32 rate, uint256 timeStamp);
    event EndExRateUpdated(uint256 indexed gameId, uint256 coinId, int32 rate, uint256 timeStamp);
    event GameYChoosed(uint256 indexed gameId, uint8 Y);
    
    event Log(string message);
    event LogAddr(address addr);
    event CoinBet(uint256 indexed gameId, uint256 coinId, address player, uint256 amount);
    event CoinLargestBetChanged(uint256 indexed gameId, uint256 coinId, uint256 amount);
    event SendAwards(uint256 indexed gameId, address player, uint256 awards);
    event RefundClaimed(uint256 indexed gameId, address player, uint256 amount);
    event OraclizeFeeReceived(uint256 received);
    event OraclizeFeeUsed(uint256 used);
    event SentOraclizeQuery(bytes32 queryId);
    event SendTxFee(address receiver, uint256 feeAmount);
    event GetUnclaimedAwards(uint256 indexed gameId, address receiver, uint256 feeAmount);
    event GetUnclaimedRefunds(uint256 indexed gameId, address receiver, uint256 feeAmount);
    
    event GameCreated(uint256 gameId);
    
    event GameClosed(uint256 indexed gameId);
    event GameExtended(uint256 indexed gameId, uint256 closeTime);
    event GameWaitToClose(uint256 indexed gameId);
    event GameReady(uint256 indexed gameId);
    event GameOpened(uint256 indexed gameId);
    
    modifier hasGameId(uint256 _gameId) {
         require(_gameId < games.length && games.length == gameBets.length);
         _;
    }
    
    modifier hasCoinId(uint256 _coinId) {
         require(_coinId < 5);
         _;
    }
    
    constructor(address _txFeeReceiver) public {
        require(address(0) != _txFeeReceiver);
        txFeeReceiver = _txFeeReceiver;
        
        //OAR = OraclizeAddrResolverI(0x0BffB729b30063E53A341ba6a05dfE8f817E7a53);
        //emit LogAddr(oraclize_cbAddress());
    }
    
    function packedCommonData() 
        public 
        view 
        returns (address _txFeeReceiver
            , uint256 _minimumBets
            , uint256 _hiddenTimeLengthBeforeClose
            , uint256 _claimAwardTimeAfterClose
            , uint256 _maximumFetchingTimeForEndExRate
            , uint256 _numberOfGames)
    {
        _txFeeReceiver = txFeeReceiver;
        _minimumBets = MIN_BET;
        _hiddenTimeLengthBeforeClose = HIDDEN_TIME_BEFORE_CLOSE;
        _claimAwardTimeAfterClose = CLAIM_AWARD_TIME_AFTER_CLOSE;
        _maximumFetchingTimeForEndExRate = MAX_FETCHING_TIME_FOR_END_EXRATE;
        _numberOfGames = games.length;
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
            GameLogic.State state = GameLogic.state(games[games.length - 1]
                , gameBets[games.length - 1]);
            require(GameLogic.State.Closed == state || GameLogic.State.Error == state);
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
        game.claimTimeAfterClose = CLAIM_AWARD_TIME_AFTER_CLOSE;
        game.maximumFetchingTimeForEndExRate = MAX_FETCHING_TIME_FOR_END_EXRATE;
        
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
    
    function gamePackedCommonData(uint256 _gameId)
        hasGameId(_gameId)
        public
        view
        returns (uint256 openTime
            , uint256 closeTime
            , uint256 duration
            , uint8[50] YDistribution
            , uint8 Y
            , uint8 A
            , uint8 B
            , uint8 state
            , uint8 winnerMasks
            , uint16 txFee
            , uint256 minDiffBets)
    {
        GameLogic.Instance storage game = games[_gameId];
        GameLogic.GameBets storage bets = gameBets[_gameId];
        
        openTime = game.openTime;
        closeTime = game.closeTime;
        duration = game.duration;
        YDistribution = game.YDistribution;
        Y = game.Y;
        A = game.A;
        B = game.B;
        state = uint8(GameLogic.state(game, bets));
        txFee = game.txFee;
        minDiffBets = game.minDiffBets;
        
        winnerMasks = gameWinnerMask(_gameId);
    }
    
    function gameWinnerMask(uint256 _gameId)
        hasGameId(_gameId)
        public
        view
        returns (uint8 winnerMasks)
    {
        GameLogic.Instance storage game = games[_gameId];
        
        winnerMasks = 0;
        for (_gameId = 0; _gameId < game.winnerCoinIds.length; ++_gameId) {
            winnerMasks |= uint8(1 << game.winnerCoinIds[_gameId]);
        }
    }
    
    
    function gameCoinData(uint256 _gameId, uint256 _coinId)
        hasGameId(_gameId)
        hasCoinId(_coinId)
        public 
        view 
        returns (string name, int32 startExRate, uint256 timeStampOfStartExRate
                 , int32 endExRate, uint256 timeStampOfEndExRate)
    {
        GameLogic.Instance storage game = games[_gameId];
        
        name = game.coins[_coinId].name;
        startExRate = game.coins[_coinId].startExRate;
        timeStampOfStartExRate = game.coins[_coinId].timeStampOfStartExRate;
        endExRate = game.coins[_coinId].endExRate;
        timeStampOfEndExRate = game.coins[_coinId].timeStampOfEndExRate;
    }
    
    function gamePackedCoinData(uint256 _gameId)
        hasGameId(_gameId)
        public 
        view 
        returns (bytes32[5] encodedName
            , uint256[5] timeStampOfStartExRate
            , uint256[5] timeStampOfEndExRate
            , int32[5] startExRate
            , int32[5] endExRate)
    {
        GameLogic.Instance storage game = games[_gameId];
        
        for (uint256 i = 0 ; i < 5; ++i) {
            encodedName[i] = GameLogic.encodeCoinName(game.coins[i].name);
            startExRate[i] = game.coins[i].startExRate;
            timeStampOfStartExRate[i] = game.coins[i].timeStampOfStartExRate;
            endExRate[i] = game.coins[i].endExRate;
            timeStampOfEndExRate[i] = game.coins[i].timeStampOfEndExRate;
        }
    }
    
    function gameBetData(uint256 _gameId, uint256 _coinId)
        hasGameId(_gameId)
        hasCoinId(_coinId)
        public 
        view 
        returns (uint256 totalBets, uint256 largestBets, uint256 numberOfBets)
    {
        GameLogic.Instance storage game = games[_gameId];
        GameLogic.GameBets storage bets = gameBets[_gameId];
        
        if (!GameLogic.isBetInformationHidden(game)) {
            GameLogic.CoinBets storage c = bets.coinbets[_coinId];
            totalBets = c.totalBetAmount;
            numberOfBets = c.bets.length;
            largestBets = c.largestBetAmount;
        }
    }
    
    function gamePackedBetData(uint256 _gameId)
        hasGameId(_gameId)
        public 
        view 
        returns (uint256[5] totalBets
            , uint256[5] largestBets
            , uint256[5] numberOfBets)
    {
        GameLogic.Instance storage game = games[_gameId];
        GameLogic.GameBets storage bets = gameBets[_gameId];
        
        for (uint256 i = 0; i < 5; ++i) {
            if (GameLogic.isBetInformationHidden(game)) {
                totalBets[i] = largestBets[i] = numberOfBets[i] = 0;
            } else {
                GameLogic.CoinBets storage c = bets.coinbets[i];
                
                totalBets[i] = c.totalBetAmount;
                largestBets[i] = c.largestBetAmount;
                numberOfBets[i] = c.bets.length;
            }
        }
    }
    
    function numberOfGames() public view returns (uint256) {
        return games.length;
    }
    
    function gameNumberOfWinnerCoinIds(uint256 _gameId) 
        hasGameId(_gameId)
        public 
        view 
        returns (uint256)
    {
        return games[_gameId].winnerCoinIds.length;
    }
    
    function gameWinnerCoinIds(uint256 _gameId, uint256 _winnerId) 
        hasGameId(_gameId)
        public
        view
        returns (uint256)
    {
        GameLogic.Instance storage game = games[_gameId];
        require(_winnerId < game.winnerCoinIds.length);
        
        return game.winnerCoinIds[_winnerId];
    }
    
    function gameState(uint256 _gameId) public view returns (GameLogic.State) {
        if (_gameId < games.length) {
            return GameLogic.state(games[_gameId], gameBets[_gameId]);
        } else {
            return GameLogic.State.NotExists;
        }
    }
    
    function isBetInformationHidden(uint256 _gameId) 
        hasGameId(_gameId)
        public
        view
        returns (bool)
    {
        return GameLogic.isBetInformationHidden(games[_gameId]);
    }
    
    function bet(uint256 _gameId, uint256 _coinId) 
        hasGameId(_gameId)
        hasCoinId(_coinId)
        public 
        payable
    {
        require(msg.value >= MIN_BET);
        
        GameLogic.Instance storage game = games[_gameId];
        GameLogic.GameBets storage bets = gameBets[_gameId];
        
        GameLogic.bet(game, bets, _coinId, txFeeReceiver);
    }
    
    function fetchStartExRate(uint256 _gameId) 
        hasGameId(_gameId)
        onlyOwner
        public
    {
        // Check the game state.
        GameLogic.Instance storage game = games[_gameId];
        require(GameLogic.state(game, gameBets[_gameId]) == GameLogic.State.Created);
        
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
    
    function fetchEndExRate(uint256 _gameId) 
        hasGameId(_gameId)
        onlyOwner
        public 
    {
        // Check the game state.
        GameLogic.Instance storage game = games[_gameId];
        require(GameLogic.state(game, gameBets[_gameId]) == GameLogic.State.Stop);
        
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
        hasGameId(_gameId)
        onlyOwner 
        public
        returns (bool)
    {
        GameLogic.Instance storage game = games[_gameId];
        GameLogic.GameBets storage bets = gameBets[_gameId];
            
        require(GameLogic.state(game, bets) == GameLogic.State.WaitToClose);
        
        if (0 != bets.totalAwards) {
            GameLogic.tryClose(game, bets);
        }

        if (game.isFinished) {
            GameLogic.calculateAwardForCoin(game, bets, bets.totalAwards);
            emit GameClosed(_gameId);
        } else {
            game.Y = 0;
            game.isYChoosed = false;
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
            
            // ((now - open) / duration + 1) * duration + open - 1;
            game.closeTime = now.sub(game.openTime).div(game.duration).add(1).mul(game.duration).add(game.openTime).sub(1);
            emit GameExtended(_gameId, game.closeTime);
        }
        
        return game.isFinished;
    }
    
    function calculateAwardAmount(uint256 _gameId) 
        hasGameId(_gameId)
        public
        view
        returns (uint256)
    {
        GameLogic.State queryGameState = gameState(_gameId);
        if (GameLogic.State.Closed == queryGameState) {
            GameLogic.Instance storage game = games[_gameId];
            GameLogic.GameBets storage bets = gameBets[_gameId];
        
            return GameLogic.calculateAwardAmount(game, bets);
        } else {
            return 0;
        }
    }
    
    function calculateRefund(uint256 _gameId) 
        hasGameId(_gameId)
        public
        view
        returns (uint256)
    {
        GameLogic.State queryGameState = gameState(_gameId);
        if (GameLogic.State.Error == queryGameState) {
            GameLogic.Instance storage game = games[_gameId];
            GameLogic.GameBets storage bets = gameBets[_gameId];
        
            return GameLogic.calculateRefundAmount(game, bets);
        } else {
            return 0;
        }
    }
    
    function getAwards(uint256 _gameId) hasGameId(_gameId) public {
        uint256 amount = calculateAwardAmount(_gameId);
        if (0 < amount) {
            GameLogic.GameBets storage bets = gameBets[_gameId];
            require(bets.totalAwards.sub(bets.claimedAwards) >= amount);
            
            bets.isAwardTransfered[msg.sender] = true;
            bets.claimedAwards = bets.claimedAwards.add(amount);
            
            msg.sender.transfer(amount);
            emit SendAwards(_gameId, msg.sender, amount);
        }
    }
    
    function claimRefunds(uint256 _gameId) hasGameId(_gameId) public {
        uint256 amount = calculateRefund(_gameId);
        if (0 < amount) {
            GameLogic.GameBets storage bets = gameBets[_gameId];
            
            bets.isRefunded[msg.sender] = true;
            bets.claimedRefunds = bets.claimedRefunds.add(amount);
            
            msg.sender.transfer(amount);
            emit RefundClaimed(_gameId, msg.sender, amount);
        }
    }
    
    function withdrawOraclizeFee() public onlyOwner {
        require(address(this).balance >= oraclizeFee);
        uint256 amount = oraclizeFee;
        oraclizeFee = 0;
        owner().transfer(amount);
    }
    
    function getUnclaimedAward(uint256 _gameId) 
        hasGameId(_gameId) 
        onlyOwner 
        public
    {
        GameLogic.Instance storage game = games[_gameId];
        require(game.closeTime + game.claimTimeAfterClose < now);
        
        GameLogic.GameBets storage bets = gameBets[_gameId];
        
        uint256 amount = bets.totalAwards.sub(bets.claimedAwards);
        bets.claimedAwards = bets.totalAwards;
        
        owner().transfer(amount);
        emit GetUnclaimedAwards(_gameId, owner(), amount);
    }
    
    function getUnclaimedRefunds(uint256 _gameId) 
        hasGameId(_gameId) 
        onlyOwner 
        public
    {
        GameLogic.Instance storage game = games[_gameId];
        require(game.closeTime + game.claimTimeAfterClose < now);
        
        GameLogic.GameBets storage bets = gameBets[_gameId];
        
        uint256 amount = bets.totalAwards.sub(bets.claimedRefunds);
        bets.claimedRefunds = bets.totalAwards;
        
        owner().transfer(amount);
        emit GetUnclaimedRefunds(_gameId, owner(), amount);
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
        GameLogic.GameBets storage gameBet = gameBets[gameId];
        
        if (RecordType.RandY == queryRecords[_id].recordType) {
            game.Y = game.YDistribution[parseInt(_result)];
            game.isYChoosed = true;
            delete queryRecords[_id];
            emit GameYChoosed(gameId, game.Y);
            
            if (GameLogic.state(game, gameBet) == GameLogic.State.WaitToClose) {
                emit GameWaitToClose(gameId);
            }
            
        } else {
            uint256 coinId = queryRecords[_id].arg;
            if (RecordType.StartExRate == queryRecords[_id].recordType) {
                game.coins[coinId].startExRate = int32(parseInt(_result, 5));
                game.coins[coinId].timeStampOfStartExRate = now;
                delete queryRecords[_id];
                emit StartExRateUpdated(gameId, coinId, game.coins[coinId].startExRate, now);
                
                if (GameLogic.state(game, gameBet) == GameLogic.State.Ready) {
                    emit GameReady(gameId);
                } else if (GameLogic.state(game, gameBet) == GameLogic.State.Open) {
                    emit GameOpened(gameId);
                }
                
            } else if (RecordType.EndExRate == queryRecords[_id].recordType) {
                game.coins[coinId].endExRate = int32(parseInt(_result, 5));
                game.coins[coinId].timeStampOfEndExRate = now;
                delete queryRecords[_id];
                emit EndExRateUpdated(gameId, coinId, game.coins[coinId].endExRate, now);
                
                if (GameLogic.state(game, gameBet) == GameLogic.State.WaitToClose) {
                    emit GameWaitToClose(gameId);
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