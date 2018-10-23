var MambaGameTest = artifacts.require("./MambaGameTest.sol");
var MambaGame = artifacts.require("./MambaGame.sol");

module.exports = function(deployer, network, accounts) {
	if (network == "development") {
		deployer.deploy(MambaGame, accounts[0]);
		deployer.deploy(MambaGameTest, accounts[0]);
	} else {
		deployer.deploy(MambaGame, accounts[0], {overwrite: false});
	}
};
