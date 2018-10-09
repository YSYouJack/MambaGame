var Web3 = require("Web3");
var MambaGameTest = artifacts.require("./MambaGameTest.sol");

module.exports = function(deployer, network, accounts) {
	var openingTime = Math.floor(Date.now() / 1000);
	var duration = 600;
	
	deployer.deploy(MambaGameTest
		, openingTime
		, duration
		, "Coin0"
		, "Coin1"
		, "Coin2"
		, "Coin3"
		, "Coin4"
		, [100, 200, 300, 400, 500]
		, openingTime
		, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
		, 10
		, 20
		, 5
		, Web3.utils.toWei("10", "finney")
		, accounts[0]);
};
