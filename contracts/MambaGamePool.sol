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
		uint256 largestBetId;
		uint256 totalBets;
		int16  startExRate;
		int16  endExRate;
		int16 finalChangeRate;
		Bet[] bets;
	}
	
	struct Game {
		uint256 openTime;
		uint256 closeTime;
		uint256 gameDuration;
		Coin[5] coins;
		uint8[50] YDistribution;
		uint8 Y;
		uint8 A;
		uint8 B;
		uint16 txFee;
		uint256 timeStampOfStartRate;
		uint256 timeStampOfEndRate;
		bool isClosed;
		uint256[] winnerCoinIds;
	}
	
	Game[] _games;
	
	event NextGameSetup(uint256 gameId);
	event NextGameRemoved(uint256 gameId);
	event GameClosed(uint256 gameId);
	event CoinBet(uint256 gameId, uint8 coinId, address indexed player, uint256 bets);
	event CoinLargestBet(uint256 gameId, uint8 coinId, address indexed player, uint256 bets);
	
	function setupNextGame(uint256 _openTime
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
		, uint16 _txFee)
		onlyOwner
		public 
	{
		// Check inputs.
		require(_A.add(_B) <= 100);
		
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
		
		if (_games.length > 0) {
			require(_games[_games.length - 1].isClosed);
		}
		
		
		// Create new games.
		uint256 id = _games.length++;
		Game storage g = _games[id];
		g.openTime = _openTime;
		g.closeTime = _openTime + _gameDuration;
		g.gameDuration = _gameDuration;
		g.timeStampOfStartRate = _exRateTimeStamp;
		
		g.coins[0].name = _coinName0;
		g.coins[0].startExRate = _startExRate[0];
		
		g.coins[1].name = _coinName1;
		g.coins[1].startExRate = _startExRate[1];
		
		g.coins[2].name = _coinName2;
		g.coins[2].startExRate = _startExRate[2];
		
		g.coins[3].name = _coinName3;
		g.coins[3].startExRate = _startExRate[3];
		
		g.coins[4].name = _coinName4;
		g.coins[4].startExRate = _startExRate[4];
		
		g.YDistribution = _YDistribution;
		g.A = _A;
		g.B = _B;
		g.txFee = _txFee;
		
		emit NextGameSetup(id);
	}
	
	function removeNextGame() onlyOwner public {
		require(_games.length > 0);
		
		uint256 id = _games.length - 1;
		Game storage g = _games[id];
		
		require(g.openTime > now);
		g.isClosed = false;
		
		emit NextGameRemoved(id);
	}
	
	function numberOfGames() public view returns (uint256) {
	    return _games.length;
	}
	
	function getGameStatus() public view returns (
	        uint256 openTime,
		    uint256 closeTime,
		    uint256 gameDuration,
		    uint8 Y,
		    uint8 A,
		    uint8 B,
		    uint16 txFee,
		    string coinName0,
		    string coinName1,
		    string coinName2,
		    string coinName3,
		    string coinName4,
		    int16[5] startExRate,
		    uint256 startExRateTimestamp,
		    int16[5] endExRate,
		    uint256 endExRateTimestamp,
		    uint256[5] totalBets,
		    address[5] largestBetAddrs,
		    uint256[5] largestBets,
		    bool isClosed,
		    uint256[] winnerCoinIds
        )
	{
	    
	    //if (_games.length == 0) {
	        return (
	            0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", startExRate, 0
	            , endExRate, 0, totalBets, largestBetAddrs, largestBets, false
	            , winnerCoinIds
	        );
	    //}
	}
	
	/*
	function tryCloseGame(int16[5] memory _endExRate, uint256 _exRateTimeStamp) 
		onlyOwner 
		public 
		returns (bool) 
	{
		require(_games.length > 0);
		
		uint16 id = _games.length - 1;
		Game storage g = _games[id];
		
		
	}
	
	function _decideWinners() private returns (byte1) {
		
	}
	*/
}