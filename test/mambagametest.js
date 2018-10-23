var MambaGameTest = artifacts.require("./MambaGameTest.sol");

contract('MambaGameTest', function(accounts) {
	
	it("Initial Data", async function () {
		let game = await MambaGameTest.deployed();
		
		let numberOfGameData = await game.numberOfGameData.call();
		assert.equal(numberOfGameData, 0);
		
		let teamWallet = await game.teamWallet.call();
		assert.equal(teamWallet, accounts[0]);
		
		// Test MIN_BET and HIDDEN_TIME_BEFORE_CLOSE.
		let MIN_BET = await game.MIN_BET.call();
		assert.ok(MIN_BET.eq(web3.toWei("10", "finney")));
		
		let HIDDEN_TIME_BEFORE_CLOSE = await game.HIDDEN_TIME_BEFORE_CLOSE.call();
		assert.equal(HIDDEN_TIME_BEFORE_CLOSE, 300);
	});
	
	
});

contract('MambaGameTest', function(accounts) {
	beforeEach(async function() {
		let game = await MambaGameTest.deployed();
		await game.forceToCloseAllGames();
		
		var openingTime = Math.floor(Date.now() / 1000);
		var duration = 600;
		
		await game.createNewGame(openingTime
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
			, web3.toWei("10", "finney")
			, {from: accounts[0]});
	});
	
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
	
	it("Create Game", async function () {
		let game = await MambaGameTest.deployed();
		
		let numberOfGameData = await game.numberOfGameData.call();
		assert.ok(numberOfGameData > 0);
		
		let gameId = numberOfGameData - 1;
		let gameData = await game.gameData.call(gameId);
		
		assert.equal(gameData.length, 12);
		
		// Test id.
		let id = gameData[0].toNumber();
		assert.equal(gameId, id);
		
		// Test opening time,  duration and closing time.
		let openingTime = gameData[1];
		let closingTime = gameData[2];
		let gameDuration = gameData[3];
		
		assert.equal(gameDuration, 600);
		assert.ok(closingTime.eq(openingTime.add(gameDuration)));
		
		// Test txFee, Y, A, B, minDiffBets.
		let Y = gameData[4];
		assert.equal(Y, 0);
		
		let A = gameData[5];
		assert.equal(A, 10);
		
		let B = gameData[6];
		assert.equal(B, 20);
		
		let txFee = gameData[7];
		assert.equal(txFee, 5);
		
		let minDiffBets = gameData[8];
		assert.ok(minDiffBets.eq(web3.toWei("10", "finney")));
		
		// Test timestamp for ex-change rate.
		let timeStampOfStartRate = gameData[9];
		assert.ok(timeStampOfStartRate.eq(openingTime));
		
		let timeStampOfEndRate = gameData[10];
		assert.equal(timeStampOfEndRate, 0);
		
		// Test is closed.
		let isClosed = gameData[11];
		assert.ok(!isClosed);
		
		
		// Test Y Distributions.
		let yDist = await game.getGameYDistribution.call(gameId);
		assert.equal(yDist.length, 50);
		for (let i = 0; i < 50; ++i) {
			assert.equal(yDist[i], (i % 10) + 1);
		}
		
		// Test coins.
		let coins = await game.getGameCoinData.call(gameId);
		assert.equal(coins.length, 7);
		assert.equal(coins[0], "Coin0"); // name
		assert.equal(coins[1], "Coin1"); // name
		assert.equal(coins[2], "Coin2"); // name
		assert.equal(coins[3], "Coin3"); // name
		assert.equal(coins[4], "Coin4"); // name	
		
		assert.equal(coins[5][0], 100); // startExRate
		assert.equal(coins[5][1], 200); // startExRate
		assert.equal(coins[5][2], 300); // startExRate
		assert.equal(coins[5][3], 400); // startExRate
		assert.equal(coins[5][4], 500); // startExRate
		assert.equal(coins[6][0], 0); // endExRate
		assert.equal(coins[6][1], 0); // endExRate
		assert.equal(coins[6][2], 0); // endExRate
		assert.equal(coins[6][3], 0); // endExRate
		assert.equal(coins[6][4], 0); // endExRate
		
		// getCoinBetData;
		for (let i = 0; i < 5; ++i) {
			let coinbets = await game.getGameBetData.call(gameId, i);
			assert.ok(coinbets[0].isZero()); // totalBets
			assert.ok(coinbets[1].isZero()); // largestBets
			assert.ok(coinbets[2].isZero()); // numberOfBets
		}
		
		// Test winner mask.
		let numberOfWinnerIds = await game.getNumberOfWinnerCoinIds(gameId);
		assert.equal(numberOfWinnerIds, 0);
	});
	
	it("Take bets", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let numberOfGameData = await game.numberOfGameData.call();
		assert.ok(numberOfGameData > 0);
		
		let gameId = numberOfGameData - 1;
		
		// First bet.
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[1]});
			
		let netBets0 = web3.toBigNumber(web3.toWei("9950", "microether"));
		let coinbets = await game.getGameBetData.call(gameId, 0);
		assert.ok(coinbets[0].eq(netBets0)); // totalBets
		assert.ok(coinbets[1].eq(netBets0)); // largestBets
		assert.ok(coinbets[2].eq(1));       // numberOfBets
		
		// Same largest bet on same coin.
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[2]});
			
		coinbets = await game.getGameBetData.call(gameId, 0);
		assert.ok(coinbets[0].eq(netBets0.add(netBets0))); // totalBets
		assert.ok(coinbets[1].eq(netBets0)); // largestBets
		assert.ok(coinbets[2].eq(2));       // numberOfBets
		
		// Another bigger bet on same coin.
		await game.bet(gameId, 0, {value: web3.toWei(100, "finney"), from: accounts[3]});
			
		let netBets1 = web3.toBigNumber(web3.toWei("99500", "microether"));
		coinbets = await game.getGameBetData.call(gameId, 0);
		assert.ok(coinbets[0].eq(netBets1.add(netBets0).add(netBets0))); // totalBets
		assert.ok(coinbets[1].eq(netBets1)); // largestBets
		assert.ok(coinbets[2].eq(3));        // numberOfBets
		
		// Change bet to another coins
		await game.bet(gameId, 1, {value: web3.toWei(100, "finney"), from: accounts[4]});
			
		coinbets = await game.getGameBetData.call(gameId, 1);
		assert.ok(coinbets[0].eq(netBets1)); // totalBets
		assert.ok(coinbets[1].eq(netBets1)); // largestBets
		assert.ok(coinbets[2].eq(1));        // numberOfBets
	});
	
	it("Game - Largest rasing coin, sole winner, two highest bets", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let numberOfGameData = await game.numberOfGameData.call();
		assert.ok(numberOfGameData > 0);
		
		let gameId = numberOfGameData - 1;
		
		// Bets.
		let bets = [];
		bets.push(game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[7]}));
		bets.push(game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[8]}));
		bets.push(game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[9]}));
		bets.push(game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]}));
		bets.push(game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]}));
		bets.push(game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]}));
		
		await Promise.all(bets);
		
		// Get balance at beginning.
		
		let balanceBegin0 = await getBalance(accounts[7]);
		let balanceBegin1 = await getBalance(accounts[8]);
		let balanceBegin2 = await getBalance(accounts[9]);
		
		// Close the game.
		let endExRate = [200 // 100%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(gameId, endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coins = await game.getGameCoinData.call(gameId);
		assert.equal(coins.length, 7);
		assert.equal(coins[0], "Coin0"); // name
		assert.equal(coins[1], "Coin1"); // name
		assert.equal(coins[2], "Coin2"); // name
		assert.equal(coins[3], "Coin3"); // name
		assert.equal(coins[4], "Coin4"); // name
		assert.equal(coins[5][0], 100); // startExRate
		assert.equal(coins[5][1], 200); // startExRate
		assert.equal(coins[5][2], 300); // startExRate
		assert.equal(coins[5][3], 400); // startExRate
		assert.equal(coins[5][4], 500); // startExRate
		assert.equal(coins[6][0], 200); // endExRate
		assert.equal(coins[6][1], 220); // endExRate
		assert.equal(coins[6][2], 300); // endExRate
		assert.equal(coins[6][3], 360); // endExRate
		assert.equal(coins[6][4], 600); // endExRate
		
		let gameData = await game.gameData.call(gameId);
		
		let isClosed = gameData[11];
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.getNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.getWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));
		
		let timeStampOfEndRateSol = gameData[10];
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let A = gameData[5];
		let B = gameData[6];
		
		let oneHundred = web3.toBigNumber("100");
		
		let totalAwards = web3.toBigNumber(web3.toWei(99500, "microether"));
		
		let bet0 = web3.toBigNumber(web3.toWei(29850, "microether")); 
		let bet1 = web3.toBigNumber(web3.toWei(29850, "microether"));
		let bet2 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		
		let awards0 = totalAwards.mul(A).div(oneHundred);
		let awards1 = totalAwards.mul(B).div(oneHundred).mul(bet1).dividedToIntegerBy(bet1.add(bet2));
		let awards2 = totalAwards.mul(B).div(oneHundred).mul(bet2).dividedToIntegerBy(bet1.add(bet2));
		
		let highestAwards = totalAwards.sub(awards0).sub(awards1).sub(awards2).dividedToIntegerBy(web3.toBigNumber("2"));
		awards0 = awards0.add(highestAwards);
		awards1 = awards1.add(highestAwards);
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		let balanceFinal1 = await getBalance(accounts[8]);
		let balanceFinal2 = await getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).eq(balanceFinal0));
		assert.ok(balanceBegin1.add(awards1).eq(balanceFinal1));
		assert.ok(balanceBegin2.add(awards2).eq(balanceFinal2));
	});
	
	it("Game - Largest rasing coin, sole winner, two highest bets, force Y = 0", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let numberOfGameData = await game.numberOfGameData.call();
		assert.ok(numberOfGameData > 0);
		
		let gameId = numberOfGameData - 1;
		
		// Bets.
		let bets = [];
		bets.push(game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[7]}));
		bets.push(game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[8]}));
		bets.push(game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[9]}));
		bets.push(game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]}));
		bets.push(game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]}));
		bets.push(game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]}));
		
		await Promise.all(bets);
		
		// Get balance at beginning.
		
		let balanceBegin0 = await getBalance(accounts[7]);
		let balanceBegin1 = await getBalance(accounts[8]);
		let balanceBegin2 = await getBalance(accounts[9]);
		
		// Set Y to zero.
		await game.setYToZero(gameId, {from: accounts[0]});
		
		// Close the game.
		let endExRate = [200 // 100%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(gameId, endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coins = await game.getGameCoinData.call(gameId);
		assert.equal(coins.length, 7);
		assert.equal(coins[0], "Coin0"); // name
		assert.equal(coins[1], "Coin1"); // name
		assert.equal(coins[2], "Coin2"); // name
		assert.equal(coins[3], "Coin3"); // name
		assert.equal(coins[4], "Coin4"); // name
		assert.equal(coins[5][0], 100); // startExRate
		assert.equal(coins[5][1], 200); // startExRate
		assert.equal(coins[5][2], 300); // startExRate
		assert.equal(coins[5][3], 400); // startExRate
		assert.equal(coins[5][4], 500); // startExRate
		assert.equal(coins[6][0], 200); // endExRate
		assert.equal(coins[6][1], 220); // endExRate
		assert.equal(coins[6][2], 300); // endExRate
		assert.equal(coins[6][3], 360); // endExRate
		assert.equal(coins[6][4], 600); // endExRate
		
		let gameData = await game.gameData.call(gameId);
		
		let isClosed = gameData[11];
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.getNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.getWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));
		
		let timeStampOfEndRateSol = gameData[10];
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let A = gameData[5];
		let B = gameData[6];
		
		let oneHundred = web3.toBigNumber("100");
		
		let totalAwards = web3.toBigNumber(web3.toWei(99500, "microether"));
		
		let bet0 = web3.toBigNumber(web3.toWei(29850, "microether")); 
		let bet1 = web3.toBigNumber(web3.toWei(29850, "microether"));
		let bet2 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		
		let awards0 = totalAwards.mul(B).div(oneHundred).mul(bet0).dividedToIntegerBy(bet0.add(bet1).add(bet2));
		let awards1 = totalAwards.mul(B).div(oneHundred).mul(bet1).dividedToIntegerBy(bet0.add(bet1).add(bet2));
		let awards2 = totalAwards.mul(B).div(oneHundred).mul(bet2).dividedToIntegerBy(bet0.add(bet1).add(bet2));
		
		let highestAwards = totalAwards.sub(awards0).sub(awards1).sub(awards2).dividedToIntegerBy(web3.toBigNumber("2"));
		awards0 = awards0.add(highestAwards);
		awards1 = awards1.add(highestAwards);
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		let balanceFinal1 = await getBalance(accounts[8]);
		let balanceFinal2 = await getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).eq(balanceFinal0));
		assert.ok(balanceBegin1.add(awards1).eq(balanceFinal1));
		assert.ok(balanceBegin2.add(awards2).eq(balanceFinal2));
	});
	
	it("Game - Smallest rasing coin, sole winner, one highest bets", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let numberOfGameData = await game.numberOfGameData.call();
		assert.ok(numberOfGameData > 0);
		
		let gameId = numberOfGameData - 1;
		
		// Bets.
		let bets = [];
		bets.push(game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[7]}));
		bets.push(game.bet(gameId, 0, {value: web3.toWei(20, "finney"), from: accounts[8]}));
		bets.push(game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[9]}));
		bets.push(game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]}));
		bets.push(game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]}));
		bets.push(game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]}));
		bets.push(game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]}));
		
		await Promise.all(bets);
		
		// Get balance at beginning.
		
		let balanceBegin0 = await getBalance(accounts[7]);
		let balanceBegin1 = await getBalance(accounts[8]);
		let balanceBegin2 = await getBalance(accounts[9]);
		
		// Close the game.
		let endExRate = [50 // -50%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(gameId, endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coins = await game.getGameCoinData.call(gameId);
		assert.equal(coins.length, 7);
		assert.equal(coins[0], "Coin0"); // name
		assert.equal(coins[1], "Coin1"); // name
		assert.equal(coins[2], "Coin2"); // name
		assert.equal(coins[3], "Coin3"); // name
		assert.equal(coins[4], "Coin4"); // name
		assert.equal(coins[5][0], 100); // startExRate
		assert.equal(coins[5][1], 200); // startExRate
		assert.equal(coins[5][2], 300); // startExRate
		assert.equal(coins[5][3], 400); // startExRate
		assert.equal(coins[5][4], 500); // startExRate
		assert.equal(coins[6][0], 50); // endExRate
		assert.equal(coins[6][1], 220); // endExRate
		assert.equal(coins[6][2], 300); // endExRate
		assert.equal(coins[6][3], 360); // endExRate
		assert.equal(coins[6][4], 600); // endExRate
		
		let gameData = await game.gameData.call(gameId);
		
		let isClosed = gameData[11];
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.getNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.getWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));
		
		let timeStampOfEndRateSol = gameData[10];
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let A = gameData[5];
		let B = gameData[6];
		
		let oneHundred = web3.toBigNumber("100");
		
		let totalAwards = web3.toBigNumber(web3.toWei(99500, "microether"));
		
		let bet0 = web3.toBigNumber(web3.toWei(29850, "microether")); 
		let bet1 = web3.toBigNumber(web3.toWei(19900, "microether"));
		let bet2 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		
		let awards0 = totalAwards.mul(A).div(oneHundred);
		let awards1 = totalAwards.mul(B).div(oneHundred).mul(bet1).dividedToIntegerBy(bet1.add(bet2));
		let awards2 = totalAwards.mul(B).div(oneHundred).mul(bet2).dividedToIntegerBy(bet1.add(bet2));
		
		let highestAwards = totalAwards.sub(awards0).sub(awards1).sub(awards2);
		awards0 = awards0.add(highestAwards);
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		let balanceFinal1 = await getBalance(accounts[8]);
		let balanceFinal2 = await getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).eq(balanceFinal0));
		assert.ok(balanceBegin1.add(awards1).eq(balanceFinal1));
		assert.ok(balanceBegin2.add(awards2).eq(balanceFinal2));
	});
	
	it("Game - Tied on highest and smallest change rate, sole winner, one highest bets", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let numberOfGameData = await game.numberOfGameData.call();
		assert.ok(numberOfGameData > 0);
		
		let gameId = numberOfGameData - 1;
		
		// Bets.
		let bets = [];
		bets.push(game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[7]}));
		bets.push(game.bet(gameId, 0, {value: web3.toWei(20, "finney"), from: accounts[8]}));
		bets.push(game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[9]}));
		bets.push(game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]}));
		bets.push(game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]}));
		bets.push(game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]}));
		bets.push(game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]}));
		
		await Promise.all(bets);
		
		// Get balance at beginning.
		
		let balanceBegin0 = await getBalance(accounts[7]);
		let balanceBegin1 = await getBalance(accounts[8]);
		let balanceBegin2 = await getBalance(accounts[9]);
		
		// Close the game.
		let endExRate = [100 // 0%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(gameId, endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coins = await game.getGameCoinData.call(gameId);
		assert.equal(coins.length, 7);
		assert.equal(coins[0], "Coin0"); // name
		assert.equal(coins[1], "Coin1"); // name
		assert.equal(coins[2], "Coin2"); // name
		assert.equal(coins[3], "Coin3"); // name
		assert.equal(coins[4], "Coin4"); // name
		assert.equal(coins[5][0], 100); // startExRate
		assert.equal(coins[5][1], 200); // startExRate
		assert.equal(coins[5][2], 300); // startExRate
		assert.equal(coins[5][3], 400); // startExRate
		assert.equal(coins[5][4], 500); // startExRate
		assert.equal(coins[6][0], 100); // endExRate
		assert.equal(coins[6][1], 220); // endExRate
		assert.equal(coins[6][2], 300); // endExRate
		assert.equal(coins[6][3], 360); // endExRate
		assert.equal(coins[6][4], 600); // endExRate
		
		let gameData = await game.gameData.call(gameId);
		
		let isClosed = gameData[11];
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.getNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.getWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));
		
		let timeStampOfEndRateSol = gameData[10];
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let A = gameData[5];
		let B = gameData[6];
		
		let oneHundred = web3.toBigNumber("100");
		
		let totalAwards = web3.toBigNumber(web3.toWei(99500, "microether"));
		
		let bet0 = web3.toBigNumber(web3.toWei(29850, "microether")); 
		let bet1 = web3.toBigNumber(web3.toWei(19900, "microether"));
		let bet2 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		
		let awards0 = totalAwards.mul(A).div(oneHundred);
		let awards1 = totalAwards.mul(B).div(oneHundred).mul(bet1).dividedToIntegerBy(bet1.add(bet2));
		let awards2 = totalAwards.mul(B).div(oneHundred).mul(bet2).dividedToIntegerBy(bet1.add(bet2));
		
		let highestAwards = totalAwards.sub(awards0).sub(awards1).sub(awards2);
		awards0 = awards0.add(highestAwards);
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		let balanceFinal1 = await getBalance(accounts[8]);
		let balanceFinal2 = await getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).eq(balanceFinal0));
		assert.ok(balanceBegin1.add(awards1).eq(balanceFinal1));
		assert.ok(balanceBegin2.add(awards2).eq(balanceFinal2));
	});
	
	it("Game - Two highest change rate winner, one highest bets", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let numberOfGameData = await game.numberOfGameData.call();
		assert.ok(numberOfGameData > 0);
		
		let gameId = numberOfGameData - 1;
		
		// Bets.
		let bets = [];
		bets.push(game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[7]}));
		bets.push(game.bet(gameId, 0, {value: web3.toWei(20, "finney"), from: accounts[8]}));
		bets.push(game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[9]}));
		bets.push(game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]}));
		bets.push(game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]}));
		bets.push(game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]}));
		bets.push(game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]}));
		
		await Promise.all(bets);
		
		// Get balance at beginning.
		
		let balanceBegin0 = await getBalance(accounts[7]);
		let balanceBegin1 = await getBalance(accounts[8]);
		let balanceBegin2 = await getBalance(accounts[9]);
		let balanceBegin3 = await getBalance(accounts[4]);
		
		// Close the game.
		let endExRate = [120 // 20%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(gameId, endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coins = await game.getGameCoinData.call(gameId);
		assert.equal(coins.length, 7);
		assert.equal(coins[0], "Coin0"); // name
		assert.equal(coins[1], "Coin1"); // name
		assert.equal(coins[2], "Coin2"); // name
		assert.equal(coins[3], "Coin3"); // name
		assert.equal(coins[4], "Coin4"); // name
		assert.equal(coins[5][0], 100); // startExRate
		assert.equal(coins[5][1], 200); // startExRate
		assert.equal(coins[5][2], 300); // startExRate
		assert.equal(coins[5][3], 400); // startExRate
		assert.equal(coins[5][4], 500); // startExRate
		assert.equal(coins[6][0], 120); // endExRate
		assert.equal(coins[6][1], 220); // endExRate
		assert.equal(coins[6][2], 300); // endExRate
		assert.equal(coins[6][3], 360); // endExRate
		assert.equal(coins[6][4], 600); // endExRate
		
		let gameData = await game.gameData.call(gameId);
		
		let isClosed = gameData[11];
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.getNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(2));
		
		let winnerId = await game.getWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));
		
		winnerId = await game.getWinnerCoinIds.call(gameId, 1);
		assert.ok(winnerId.eq(4));
		
		let timeStampOfEndRateSol = gameData[10];
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let A = gameData[5];
		let B = gameData[6];
		
		let oneHundred = web3.toBigNumber("100");
		
		let totalAwards = web3.toBigNumber(web3.toWei(99500, "microether"));
		totalAwards = totalAwards.dividedToIntegerBy(web3.toBigNumber("2"));
		
		let bet0 = web3.toBigNumber(web3.toWei(29850, "microether")); 
		let bet1 = web3.toBigNumber(web3.toWei(19900, "microether"));
		let bet2 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		let bet4 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		
		let awards0 = totalAwards.mul(A).div(oneHundred);
		let awards1 = totalAwards.mul(B).div(oneHundred).mul(bet1).dividedToIntegerBy(bet1.add(bet2));
		let awards2 = totalAwards.mul(B).div(oneHundred).mul(bet2).dividedToIntegerBy(bet1.add(bet2));
		let awards3 = totalAwards;
		
		let highestAwards = totalAwards.sub(awards0).sub(awards1).sub(awards2);
		awards0 = awards0.add(highestAwards);
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		let balanceFinal1 = await getBalance(accounts[8]);
		let balanceFinal2 = await getBalance(accounts[9]);
		let balanceFinal3 = await getBalance(accounts[4]);
		
		assert.ok(balanceBegin0.add(awards0).eq(balanceFinal0));
		assert.ok(balanceBegin1.add(awards1).eq(balanceFinal1));
		assert.ok(balanceBegin2.add(awards2).eq(balanceFinal2));
		assert.ok(balanceBegin3.add(awards3).eq(balanceFinal3));
	});
	
	it("Game - No winners. Total bets are equal.", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let numberOfGameData = await game.numberOfGameData.call();
		assert.ok(numberOfGameData > 0);
		
		let gameId = numberOfGameData - 1;
		
		// Bets.
		let bets = [];
		bets.push(game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[7]}));
		bets.push(game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]}));
		bets.push(game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]}));
		bets.push(game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]}));
		bets.push(game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]}));
		
		await Promise.all(bets);
	
		// Close the game.
		let endExRate = [100 // 0%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(gameId, endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coins = await game.getGameCoinData.call(gameId);
		assert.equal(coins.length, 7);
		assert.equal(coins[0], "Coin0"); // name
		assert.equal(coins[1], "Coin1"); // name
		assert.equal(coins[2], "Coin2"); // name
		assert.equal(coins[3], "Coin3"); // name
		assert.equal(coins[4], "Coin4"); // name
		assert.equal(coins[5][0], 100); // startExRate
		assert.equal(coins[5][1], 200); // startExRate
		assert.equal(coins[5][2], 300); // startExRate
		assert.equal(coins[5][3], 400); // startExRate
		assert.equal(coins[5][4], 500); // startExRate
		assert.equal(coins[6][0], 0); // endExRate
		assert.equal(coins[6][1], 0); // endExRate
		assert.equal(coins[6][2], 0); // endExRate
		assert.equal(coins[6][3], 0); // endExRate
		assert.equal(coins[6][4], 0); // endExRate
		
		let gameData = await game.gameData.call(gameId);
		
		let isClosed = gameData[11];
		assert.ok(!isClosed);
		
		let numberOfWinnerCoinIds = await game.getNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(0));
		
		let timeStampOfEndRateSol = gameData[10];
		assert.ok(timeStampOfEndRateSol.isZero());
		
		let closeTime = gameData[2];
		assert.ok(closeTime > timeStampOfEndRate);
	});
	
	it("Game - No winners. Every coins are highest or smallest change rate.", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let numberOfGameData = await game.numberOfGameData.call();
		assert.ok(numberOfGameData > 0);
		
		let gameId = numberOfGameData - 1;
		
		// Bets.
		let bets = [];
		bets.push(game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[7]}));
		bets.push(game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]}));
		bets.push(game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]}));
		bets.push(game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]}));
		bets.push(game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]}));
		
		await Promise.all(bets);
	
		// Close the game.
		let endExRate = [120 // 20%
			, 240 // 20%
			, 270 // -10%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(gameId, endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coins = await game.getGameCoinData.call(gameId);
		assert.equal(coins.length, 7);
		assert.equal(coins[0], "Coin0"); // name
		assert.equal(coins[1], "Coin1"); // name
		assert.equal(coins[2], "Coin2"); // name
		assert.equal(coins[3], "Coin3"); // name
		assert.equal(coins[4], "Coin4"); // name
		assert.equal(coins[5][0], 100); // startExRate
		assert.equal(coins[5][1], 200); // startExRate
		assert.equal(coins[5][2], 300); // startExRate
		assert.equal(coins[5][3], 400); // startExRate
		assert.equal(coins[5][4], 500); // startExRate
		assert.equal(coins[6][0], 0); // endExRate
		assert.equal(coins[6][1], 0); // endExRate
		assert.equal(coins[6][2], 0); // endExRate
		assert.equal(coins[6][3], 0); // endExRate
		assert.equal(coins[6][4], 0); // endExRate
		
		let gameData = await game.gameData.call(gameId);
		
		let isClosed = gameData[11];
		assert.ok(!isClosed);
		
		let numberOfWinnerCoinIds = await game.getNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(0));
		
		let timeStampOfEndRateSol = gameData[10];
		assert.ok(timeStampOfEndRateSol.isZero());
		
		let closeTime = gameData[2];
		assert.ok(closeTime > timeStampOfEndRate);
	});
	
	it("Game - Tied on highest and samllest change rate. Only one in the rest group, sole winner, one highest bets.", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let numberOfGameData = await game.numberOfGameData.call();
		assert.ok(numberOfGameData > 0);
		
		let gameId = numberOfGameData - 1;
		
		// Bets.
		let bets = [];
		bets.push(game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[7]}));
		bets.push(game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]}));
		bets.push(game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]}));
		bets.push(game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]}));
		bets.push(game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]}));
		
		await Promise.all(bets);
		
		// Get balance at beginning.
		let balanceBegin0 = await getBalance(accounts[7]);
		
		// Close the game.
		let endExRate = [100 // 0%
			, 240 // 20%
			, 270 // -10%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(gameId, endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coins = await game.getGameCoinData.call(gameId);
		assert.equal(coins.length, 7);
		assert.equal(coins[0], "Coin0"); // name
		assert.equal(coins[1], "Coin1"); // name
		assert.equal(coins[2], "Coin2"); // name
		assert.equal(coins[3], "Coin3"); // name
		assert.equal(coins[4], "Coin4"); // name
		assert.equal(coins[5][0], 100); // startExRate
		assert.equal(coins[5][1], 200); // startExRate
		assert.equal(coins[5][2], 300); // startExRate
		assert.equal(coins[5][3], 400); // startExRate
		assert.equal(coins[5][4], 500); // startExRate
		assert.equal(coins[6][0], 100); // endExRate
		assert.equal(coins[6][1], 240); // endExRate
		assert.equal(coins[6][2], 270); // endExRate
		assert.equal(coins[6][3], 360); // endExRate
		assert.equal(coins[6][4], 600); // endExRate
		
		let gameData = await game.gameData.call(gameId);
		
		let isClosed = gameData[11];
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.getNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.getWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));
		
		let timeStampOfEndRateSol = gameData[10];
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let A = gameData[5];
		let B = gameData[6];
		
		let oneHundred = web3.toBigNumber("100");
		
		let totalAwards = web3.toBigNumber(web3.toWei(49750, "microether"));
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		
		assert.ok(balanceBegin0.add(totalAwards).eq(balanceFinal0));
	});
});