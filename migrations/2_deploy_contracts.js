//var MambaGameTest = artifacts.require("./MambaGameTest.sol");
var GameLogic = artifacts.require("./GameLogic.sol");
var GamePool = artifacts.require("./GamePool.sol");
var GamePoolTestProxy = artifacts.require("./GamePoolTestProxy.sol");

module.exports = function(deployer, network, accounts) {
	if (network == "development") {
		deployer.deploy(GameLogic);
		deployer.link(GameLogic, GamePoolTestProxy);
		deployer.deploy(GamePoolTestProxy, accounts[0]);
	} else if (network == "rinkeby"){
		deployer.deploy(GameLogic);
		deployer.link(GameLogic, GamePool);
		deployer.deploy(GamePool, accounts[0]);
	}
};
