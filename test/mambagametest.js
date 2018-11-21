var assert = require('assert');
var GamePoolTestProxy = artifacts.require("./GamePoolTestProxy.sol");

function getBalance(account) {
	return new Promise(function (resolve, reject) {
		web3.eth.getBalance(account, "latest", function (error, result) {
			if (error) {
				reject(error);
			} else {
				resolve(web3.toBigNumber(result));
			}
		});
	});
}

async function createNewTestGame(accounts) {
	let game = await GamePoolTestProxy.deployed();
	await game.forceToCloseAllGames();
	
	var openingTime = Math.floor(Date.now() / 1000);
	var duration = 600;
	
	await game.createNewGame(openingTime
		, duration
		, "BTC"
		, "LTC"
		, "BCC"
		, "ETH"
		, "ETC"
		, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
		, 10
		, 20
		, 5
		, web3.toWei("10", "finney")
		, {from: accounts[0]});
}

async function setOpenCloseTime(gameId, openTime, closeTime, mambaGame) {
	let contract = await GamePoolTestProxy.deployed();
	await contract.setOpenCloseTime(gameId, openTime, closeTime);
	
	let result = await contract.games(gameId);
	mambaGame.openTime = new Date(result[1].toNumber() * 1000);
	mambaGame.closeTime = new Date(result[2].toNumber() * 1000);
}

contract('Mamba game front-end javascript', async function(accounts) {
	/*
	describe("Mamba game pool", async function () {
		it('Init parameters', async function() {
			//let contract = await GamePool.GamePoolTestProxy();
			let mambaGamePool = require('../jslib/dist/mambagame.js');
			
			assert.ok(typeof mambaGamePool != 'undefined');
			assert.ok(typeof mambaGamePool.isInited === 'boolean');
			assert.ok(!mambaGamePool.isInited);
			assert.ok(typeof mambaGamePool.abi != 'undefined');
			//assert.equal(mambaGamePool.abi, GamePool._json.abi);
			assert.ok(typeof mambaGamePool.address === 'string');
		});
		
		it('Initialization', async function() {
			let contract = await GamePoolTestProxy.deployed();
			let mambaGamePool = require('../jslib/dist/mambagame.js');
			mambaGamePool.address = contract.address;
			
			await mambaGamePool.init();
			assert.ok(mambaGamePool.isInited);
			assert.ok(typeof mambaGamePool.contract != 'undefined');
			assert.ok(typeof mambaGamePool.initBlockNumber != 'undefined');
			assert.ok(typeof mambaGamePool.numberOfGames != 'undefined');
			
			assert.equal(mambaGamePool.txFeeReceiver, accounts[0]);
			assert.equal(mambaGamePool.minimumBets, '0.01');
			assert.equal(mambaGamePool.playerAddress, accounts[0]);
			
			mambaGamePool.close();
			assert.ok(!mambaGamePool.isInited);
		});
		
		it('Create new game callback', async function() {
			let contract = await GamePoolTestProxy.deployed();
			let mambaGamePool = require('../jslib/dist/mambagame.js');
			mambaGamePool.address = contract.address;
			
			await mambaGamePool.init();
			assert.ok(mambaGamePool.isInited);
			
			let numberOfGamesBefore = mambaGamePool.numberOfGames;
			let numberOfGamesCallback = -1;
			
			mambaGamePool.subscribeForNewGame(function (numberOfGames) {
				numberOfGamesCallback = numberOfGames;
			});
			
			await createNewTestGame(accounts);
			let numberOfGamesAfter = mambaGamePool.numberOfGames;
			
			assert.equal(numberOfGamesCallback, numberOfGamesBefore + 1);
			assert.equal(numberOfGamesAfter, numberOfGamesBefore + 1);
			
			mambaGamePool.close();
		});
	});
	*/

	describe("Mamba game", async function () {
		this.startExRate = [100, 200, 300, 400, 500];
		this.mambaGamePool = null;
		
		before(async function() {
			// Initialize api instance.
			let contract = await GamePoolTestProxy.deployed();
			mambaGamePool = require('../jslib/dist/mambagame.js');
			mambaGamePool.address = contract.address;
			
			await mambaGamePool.init();
			assert.ok(mambaGamePool.isInited);
		});
		
		after(function() {
			mambaGamePool.close();
		});
		
		beforeEach(async function() {
			await createNewTestGame(accounts);
		});
		
		/*
		it('Get game', async function () {
			assert.ok(mambaGamePool.numberOfGames > 0);
			let gameId = mambaGamePool.numberOfGames - 1;
			
			let contract = await GamePoolTestProxy.deployed();
			let numberOfGames = await contract.numberOfGames.call();
			assert.equal(numberOfGames.toNumber(), mambaGamePool.numberOfGames);
			
			let startExRate = [100, 200, 300, 400, 500];
			let endExRate = [200, 300, 400, 500, 600];
			
			await contract.setStartExRate(gameId, startExRate);
			await contract.setEndExRate(gameId, endExRate);
			await contract.setY(gameId, 39);
			
			let mambaGame = await mambaGamePool.game(gameId);
			assert.equal(mambaGame.id, gameId);
			assert.equal(mambaGame.initBlockNumber, mambaGamePool.initBlockNumber);
			assert.ok(typeof mambaGame.contract != 'undefined');
			assert.equal(mambaGame.minimumBets, mambaGamePool.minimumBets);
			assert.equal(mambaGame.txFeeReceiver, mambaGamePool.txFeeReceiver);
			assert.equal(mambaGame.closeTime.getTime() / 1000 + 1
				, 600 + mambaGame.openTime.getTime() / 1000);
			assert.equal(mambaGame.duration, 600000);
			assert.equal(mambaGame.hiddenTimeLengthBeforeClose, 300000);
			assert.equal(mambaGame.claimAwardTimeAfterClose, 2592000000);
			assert.equal(mambaGame.Y, 39);
			assert.equal(mambaGame.A, 10);
			assert.equal(mambaGame.B, 20);
			assert.equal(mambaGame.txFee.toString(), "0.5");
			assert.equal(mambaGame.minimumDifferenceBetsForWinner, '0.01');
			assert.equal(mambaGame.YDistribution.length, 50);
			for (let i = 0; i < 50; ++i) {
				assert.equal(mambaGame.YDistribution[i], i % 10 + 1);
			}
			
			assert.equal(mambaGame.coins.length, 5);
			for (let i = 0; i < 5; ++i) {
				// name
				if (0 == i) {
					assert.equal(mambaGame.coins[i].name, "BTC");
				} else if (1 == i) {
					assert.equal(mambaGame.coins[i].name, "LTC");
				} else if (2 == i) {
					assert.equal(mambaGame.coins[i].name, "BCC");
				} else if (3 == i) {
					assert.equal(mambaGame.coins[i].name, "ETH");
				} else {
					assert.equal(mambaGame.coins[i].name, "ETC");
				}
				
				assert.equal(mambaGame.coins[i].startExRate * 100, startExRate[i]); // startExRate
				assert.ok(mambaGame.coins[i].timeStampOfStartExRate.getTime() > 0); // timeStampOfStartExRate
				assert.equal(mambaGame.coins[i].endExRate * 100, endExRate[i]);     // endExRate
				assert.ok(mambaGame.coins[i].timeStampOfEndExRate.getTime() > 0);   // timeStampOfEndExRate
				assert.equal(mambaGame.coins[i].totalBets, "0");
				assert.equal(mambaGame.coins[i].largestBets, "0");
				assert.equal(mambaGame.coins[i].numberOfBets, 0);
			}
			
			assert.ok(typeof mambaGame.winnerCoinIds === 'undefined');
			assert.equal(mambaGame.state, 'Open');
			
			mambaGame.close();
		});
		
		it('Callback of stated changed', async function () {
			assert.ok(mambaGamePool.numberOfGames > 0);
			let gameId = mambaGamePool.numberOfGames - 1;
			
			let mambaGame = await mambaGamePool.game(gameId);
			assert.equal(mambaGame.state, 'Created');
			
			let stateStr = '';
			mambaGame.subscribe('StateChanged', function (state) {
				stateStr = state;
			});
			
			let now = Math.floor(Date.now() / 1000);
			
			let contract = await GamePoolTestProxy.deployed();
			
			await setOpenCloseTime(gameId, now + 300, now + 600, mambaGame);
			let aaa = await contract.games(gameId);
			assert.equal(stateStr, '');
			
			let startExRate = [100, 200, 300, 400, 500];
			await contract.setStartExRate(gameId, startExRate);
			assert.equal(stateStr, 'Ready');
			assert.equal(mambaGame.state, 'Ready');
			
			await setOpenCloseTime(gameId, now - 300, now + 600, mambaGame);
			await contract.setStartExRate(gameId, [0, 0, 0, 0, 0]);
			await contract.setStartExRate(gameId, startExRate);
			assert.equal(stateStr, 'Open');
			assert.equal(mambaGame.state, 'Open');
			
			let endExRate = [200, 300, 400, 500, 600];
			await setOpenCloseTime(gameId, now - 600, now - 300, mambaGame);
			await contract.setEndExRate(gameId, endExRate);
			await contract.setY(gameId, 23);
			assert.equal(stateStr, 'WaitToClose');
			assert.equal(mambaGame.state, 'WaitToClose');
			
			mambaGame.close();
		});
		*/
		it('Take Bets & close game.', async function () {
			
			mambaGamePool.playerAddress = accounts[3];
			
			//let historyPrev = await mambaGamePool.getPlayerBetsHistory();
			
			assert.ok(mambaGamePool.numberOfGames > 0);
			let gameId = mambaGamePool.numberOfGames - 1;
			
			let mambaGame = await mambaGamePool.game(gameId);
			
			let startExRate = [100, 200, 300, 400, 500];
			let contract = await GamePoolTestProxy.deployed();
			await contract.setStartExRate(gameId, startExRate);
			
			assert.equal(mambaGame.state, 'Open');
			
			await mambaGame.bet(0, '0.02');
			await mambaGame.bet(0, '0.01');
			await mambaGame.bet(1, '0.01');
			
			// Close the game.
			let endExRate = [200 // 100%
				, 220 // 10%
				, 300 // 0%
				, 360 // -10%
				, 600]; // 20%
			await contract.setEndExRate(gameId, endExRate);
			await contract.setY(gameId, 10);
						
			function waitForCloseStateChange() {
				return new Promise(function (resolve, reject) {
					if (mambaGame.state === 'Closed') {
						resolve();
					} else if (mambaGame.state != 'Open') {
						reject("Game state is not corrected.")
					} else {
						mambaGame.subscribe('StateChanged', function (state) {
							mambaGame.unsubscribe('StateChanged');
							if (state === 'Closed') {
								resolve();
							} else {
								reject();
							}
						});
					}
				});
			}
			
			await contract.close(gameId, {from: accounts[0], gasLimit: 371211});
			await waitForCloseStateChange();

			// Check bets.
			assert.equal(mambaGame.coins[0].numberOfBets, 2);
			assert.equal(mambaGame.coins[0].largestBets, '0.0199');
			assert.equal(mambaGame.coins[0].totalBets, '0.02985');
			
			assert.equal(mambaGame.coins[1].numberOfBets, 1);
			assert.equal(mambaGame.coins[1].largestBets, '0.00995');
			assert.equal(mambaGame.coins[1].totalBets, '0.00995');
			
			// Test calculate awards.
			let awards = await mambaGame.calculateAwards();
			assert.equal(awards, '0.0398');
			
			let balanceBefore = await getBalance(mambaGamePool.playerAddress);				
			await mambaGame.getAwards();
			
			/*
			// Do a longer operation to wait blockchain finished.
			let history = await mambaGamePool.getPlayerBetsHistory();
			assert.equal(history.length - historyPrev.length, 3);
			assert.equal(history[history.length - 3].gameId, gameId);
			assert.equal(history[history.length - 3].coinId, 0);
			assert.equal(history[history.length - 3].betAmount, '0.0199');
			assert.ok(typeof history[history.length - 3].timeStamp != 'undefined');
			assert.equal(history[history.length - 2].gameId, gameId);
			assert.equal(history[history.length - 2].coinId, 0);
			assert.equal(history[history.length - 2].betAmount, '0.00995');
			assert.ok(typeof history[history.length - 2].timeStamp != 'undefined');
			assert.equal(history[history.length - 1].gameId, gameId);
			assert.equal(history[history.length - 1].coinId, 1);
			assert.equal(history[history.length - 1].betAmount, '0.00995');
			assert.ok(typeof history[history.length - 1].timeStamp != 'undefined');
			
			// Check balace.
			let balanceAfter = await getBalance(mambaGamePool.playerAddress);
			
			awards = web3.toBigNumber(web3.toWei(awards, 'ether'));
			let threshold = web3.toBigNumber(web3.toWei("10", "finney"));
			
			assert.ok(balanceBefore.add(awards).sub(balanceAfter).lte(threshold));
			
			// check state.
			assert.equal(mambaGame.state, 'Closed');
			assert.equal(mambaGame.winnerCoinIds.length, 1);
			assert.equal(mambaGame.winnerCoinIds[0], 0);
			*/
			mambaGame.close();
		});
	});
});