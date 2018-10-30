pragma solidity ^0.4.24;

import "./GamePool.sol";

contract GamePoolTestProxy is GamePool {
    
    constructor(address txFeeReceiver) public
        GamePool(txFeeReceiver)
    {
    }
    
    function setStartExRate(uint256 _gameId, int32[5] _rates, uint256 _timeStamp)
        public 
    {
        require(_gameId < games.length);
	   
	    GameLogic.Instance storage game = games[_gameId];
	    for (uint256 i = 0; i < 5; ++i) {
	        game.coins[i].startExRate = _rates[i];
	    }
	    
	    game.timeStampOfStartRate = _timeStamp;
    }
    
    function setEndExRate(uint256 _gameId, int32[5] _rates, uint256 _timeStamp) 
        public
    {
        require(_gameId < games.length);
	   
	    GameLogic.Instance storage game = games[_gameId];
	    for (uint256 i = 0; i < 5; ++i) {
	        game.coins[i].endExRate = _rates[i];
	    }
	    
	     game.timeStampOfEndRate = _timeStamp;
    }
    
    function setOpenCloseTime(uint256 _gameId, uint256 _openTime, uint256 _closeTime) 
        public
    {
        require(_gameId < games.length);
	   
	    GameLogic.Instance storage game = games[_gameId];
	    require(_openTime < _closeTime);
	    game.openTime = _openTime;
	    game.closeTime = _closeTime;
    }
    
    function setIsFinished(uint256 _gameId, bool _isFinished) 
        public
    {
        require(_gameId < games.length);
	   
	    GameLogic.Instance storage game = games[_gameId];
	    game.isFinished = _isFinished;
    }
    
    function setY(uint256 _gameId, uint8 _Y) 
        public
    {
        require(_gameId < games.length);
	   
	    GameLogic.Instance storage game = games[_gameId];
	    game.Y = _Y;
	    game.isYChoosed = true;
    }
    
    function close(uint256 _gameId, uint256 _timeStampOfEndRate) 
	    onlyOwner 
	    public 
	    returns (bool)
    {
        require(_gameId < games.length);
	   
	    GameLogic.Instance storage game = games[_gameId];
	    game.closeTime = now - 5 seconds;
	    return super.close(_gameId, _timeStampOfEndRate);
    }
    
    // Callback for oraclize query.
	function __callback(bytes32 _id, string _result) public {
	    super.__callback(_id, _result);
     }
    
}