var MambaGame = artifacts.require("./MambaGame.sol");

let game = await MambaGame.deployed();
let numberOfGameData = await game.numberOfGameData.call();

game.createNewGame(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[7]}));
		

module.exports = function(callback) {
  // perform actions
}