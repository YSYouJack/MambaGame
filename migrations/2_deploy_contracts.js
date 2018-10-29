//var MambaGameTest = artifacts.require("./MambaGameTest.sol");
var Game = artifacts.require("./Game.sol");
var MambaGame = artifacts.require("./MambaGame.sol");

module.exports = function(deployer, network, accounts) {
	console.log(MambaGame._json.deployedBytecode.length);
	if (network == "development") {
		deployer.deploy(Game);
		deployer.link(Game, MambaGame);
		deployer.deploy(MambaGame, accounts[0], {overwrite: true, gas: 0x7a1200});
		//deployer.deploy(MambaGameTest, accounts[0]);
	} else {
		//deployer.deploy(MambaGame, accounts[0], {overwrite: false});
	}
};
