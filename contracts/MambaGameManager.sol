pragma solidity ^0.4.24;

import "../third-contracts/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./MambaGame.sol";

contract MambaGameManager is Ownable {
    
    address[] public games;
    address public teamWallet;
    
    event GameAdded(address indexed gameAddr, uint256 openTime);
    
    constructor(address _teamWallet) public {
        require(_teamWallet != address(0));
        teamWallet = _teamWallet;
    }
    
    function numberOfGames() public view returns (uint256) {
        return games.length;
    }
    
    function addGame(address game) onlyOwner public {
	    MambaGame g1 = MambaGame(game);
	    require(g1.owner() == address(this));
	    
	    if (0 != games.length) {
	        MambaGame g0 = MambaGame(games[games.length - 1]);
	        require(g0.isClosed());
	        require(g1.openTime() > g0.closeTime());
	    }
	    
	    games.push(game);
	    emit GameAdded(game, g1.openTime());
	}
}