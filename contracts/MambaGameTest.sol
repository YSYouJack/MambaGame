pragma solidity ^0.4.24;

import "./MambaGame.sol";

contract MambaGameTest is MambaGame {
	constructor(uint256 _openTime
		, uint256 _gameDuration
		, string _coinName0
		, string _coinName1
		, string _coinName2
		, string _coinName3
		, string _coinName4
		, int32[5] _startExRate
		, uint256 _exRateTimeStamp
		, uint8[50] _YDistribution
		, uint8 _A
		, uint8 _B
		, uint16 _txFee
		, uint256 _minDiffBets
		, address _teamWallet) 
		MambaGame(_openTime, _gameDuration
			, _coinName0, _coinName1, _coinName2, _coinName3, _coinName4
			, _startExRate, _exRateTimeStamp, _YDistribution
			, _A, _B, _txFee, _minDiffBets, _teamWallet)
		public
	{
	}
	
	function close(int32[5] _endExRate, uint256 _timeStampOfEndRate) 
	    onlyOwner 
	    public 
	    returns (bool)
	{
		closeTime = openTime;
	    return super.close(_endExRate, _timeStampOfEndRate);
	}
	
	function setYToZero() onlyOwner public {
	    for (uint256 i = 0; i < YDistribution.length; ++i) {
	        YDistribution[i] = 0;
	    }
	    
	}
}