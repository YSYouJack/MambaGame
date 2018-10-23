pragma solidity ^0.4.24;

import "./MambaGame.sol";

contract MambaGameTest is MambaGame {
	
	constructor (address _teamWallet) public
	    MambaGame(_teamWallet)
	{
	    
	}
	
	function close(uint256 _gameId, int32[5] _endExRate, uint256 _timeStampOfEndRate) 
	    onlyOwner 
	    public 
	    returns (bool)
	{
		gameData[_gameId].closeTime = gameData[_gameId].openTime;
	    return super.close(_gameId, _endExRate, _timeStampOfEndRate);
	}
	
	function setYToZero(uint256 _gameId) onlyOwner public {
	    for (uint256 i = 0; i < gameData[_gameId].YDistribution.length; ++i) {
	        gameData[_gameId].YDistribution[i] = 0;
	    }
	}
	
	function forceToCloseAllGames() onlyOwner public {
	    for (uint256 i = 0; i < gameData.length; ++i) {
	        gameData[i].isClosed = true;
	    }
	    
	    this.owner().transfer(address(this).balance);
	}
	
}