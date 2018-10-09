var Web3 = require("Web3");
var MambaGameTest = artifacts.require("./MambaGameTest.sol");

contract('MambaGameTest', function(accounts) {
	it("Initial Data", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test opening time,  duration and closing time.
		let openingTime = await game.openTime.call();
		let gameDuration = await game.gameDuration.call();
		assert.equal(gameDuration, 600);
		
		let closingTime = await game.closeTime.call();
		assert.ok(closingTime.eq(openingTime.add(gameDuration)));
		
		// Test coins.
		let coin0 = await game.coins.call(0);
		assert.equal(coin0[0], "Coin0"); // name
		assert.equal(coin0[1], 100);     // startExRate
		assert.equal(coin0[2], 0);       // endExRate
		
		let coin1 = await game.coins.call(1);
		assert.equal(coin1[0], "Coin1"); // name
		assert.equal(coin1[1], 200);     // startExRate
		assert.equal(coin1[2], 0);       // endExRate
		
		let coin2 = await game.coins.call(2);
		assert.equal(coin2[0], "Coin2"); // name
		assert.equal(coin2[1], 300);     // startExRate
		assert.equal(coin2[2], 0);       // endExRate
		
		let coin3 = await game.coins.call(3);
		assert.equal(coin3[0], "Coin3"); // name
		assert.equal(coin3[1], 400);     // startExRate
		assert.equal(coin3[2], 0);       // endExRate
		
		let coin4 = await game.coins.call(4);
		assert.equal(coin4[0], "Coin4"); // name
		assert.equal(coin4[1], 500);     // startExRate
		assert.equal(coin4[2], 0);       // endExRate
		
		// Test timestamp for ex-change rate.
		let timeStampOfStartRate = await game.timeStampOfStartRate.call();
		assert.ok(timeStampOfStartRate.eq(openingTime));
		
		let timeStampOfEndRate = await game.timeStampOfEndRate.call();
		assert.equal(timeStampOfEndRate, 0);
		
		// Test is closed.
		let isClosed = await game.isClosed.call();
		assert.ok(!isClosed);
		
		// Test team wallet.
		let teamWallet = await game.teamWallet.call();
		assert.equal(teamWallet, accounts[0]);
		
		// Test txFee, Y, A, B, minDiffBets.
		let txFee = await game.txFee.call();
		assert.equal(txFee, 5);
		
		let Y = await game.Y.call();
		assert.equal(Y, 0);
		
		let A = await game.A.call();
		assert.equal(A, 10);
		
		let B = await game.B.call();
		assert.equal(B, 20);
		
		let minDiffBets = await game.minDiffBets.call();
		assert.ok(minDiffBets.eq(Web3.utils.toWei("10", "finney")));
		
		// Test Y Distributions.
		let yDistPromises = [];
		for (let i = 0; i < 50; ++i) {
			yDistPromises.push(game.YDistribution.call(i)); 
		}
		
		let yDist = await Promise.all(yDistPromises);
		for (let i = 0; i < 50; ++i) {
			assert.equal(yDist[i], (i % 10) + 1);
		}
		
		// Test MIN_BET and HIDDEN_TIME_BEFORE_CLOSE.
		let MIN_BET = await game.MIN_BET.call();
		assert.ok(MIN_BET.eq(Web3.utils.toWei("10", "finney")));
		
		let HIDDEN_TIME_BEFORE_CLOSE = await game.HIDDEN_TIME_BEFORE_CLOSE.call();
		assert.equal(HIDDEN_TIME_BEFORE_CLOSE, 300);
		
		// getCoinBetData;
		for (let i = 0; i < 5; ++i) {
			let coinbets = await game.getCoinBetData.call(i);
			assert.ok(coinbets[0].isZero()); // totalBets
			assert.ok(coinbets[1].isZero()); // largestBets
			assert.ok(coinbets[2].isZero()); // numberOfBets
		}
		
		// numberOfWinnerCoinIds
		let numberOfWinnerCoinIds = await game.numberOfWinnerCoinIds.call();
		assert.ok(numberOfWinnerCoinIds.isZero());
	}); 
	
	it("Take bets", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let isAlive = await game.isAlive.call();
		assert.ok(isAlive);
		
		// First bet.
		await game.bet("0", accounts[1]
			, {value: web3.toWei(10, "finney"), from: accounts[1]});
			
		let netBets0 = Web3.utils.toBN(Web3.utils.toWei("9950", "microether"));
		let coinbets = await game.getCoinBetData.call(0);
		assert.ok(coinbets[0].eq(netBets0)); // totalBets
		assert.ok(coinbets[1].eq(netBets0)); // largestBets
		assert.ok(coinbets[2].eq(1));       // numberOfBets
		
		// Same largest bet on same coin.
		await game.bet("0", accounts[2]
			, {value: web3.toWei(10, "finney"), from: accounts[2]});
			
		coinbets = await game.getCoinBetData.call(0);
		assert.ok(coinbets[0].eq(netBets0.add(netBets0))); // totalBets
		assert.ok(coinbets[1].eq(netBets0)); // largestBets
		assert.ok(coinbets[2].eq(2));       // numberOfBets
		
		// Another bigger bet on same coin.
		await game.bet("0", accounts[3]
			, {value: web3.toWei(100, "finney"), from: accounts[3]});
			
		let netBets1 = Web3.utils.toBN(Web3.utils.toWei("99500", "microether"));
		coinbets = await game.getCoinBetData.call(0);
		assert.ok(coinbets[0].eq(netBets1.add(netBets0).add(netBets0))); // totalBets
		assert.ok(coinbets[1].eq(netBets1)); // largestBets
		assert.ok(coinbets[2].eq(3));        // numberOfBets
		
		// Change bet to another coins
		await game.bet("1", accounts[4]
			, {value: web3.toWei(100, "finney"), from: accounts[4]});
			
		coinbets = await game.getCoinBetData.call(1);
		assert.ok(coinbets[0].eq(netBets1)); // totalBets
		assert.ok(coinbets[1].eq(netBets1)); // largestBets
		assert.ok(coinbets[2].eq(1));        // numberOfBets
	}); 
});

contract('MambaGameTest', function(accounts) {
	it("Game - Largest rasing coin, sole winner, two highest bets", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let isAlive = await game.isAlive.call();
		assert.ok(isAlive);
		
		// Get balance at beginning.
		let balanceBegin0 = web3.eth.getBalance(accounts[7]);
		let balanceBegin1 = web3.eth.getBalance(accounts[8]);
		let balanceBegin2 = web3.eth.getBalance(accounts[9]);
		
		// Bets.
		let bets = [];
		bets.push(game.bet("0", accounts[7], {value: web3.toWei(30, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("0", accounts[8], {value: web3.toWei(30, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("0", accounts[9], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("1", accounts[1], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("2", accounts[2], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("3", accounts[3], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		
		await Promise.all(bets);
		
		// Close the game.
		let endExRate = [200 // 100%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coin0 = await game.coins.call(0);
		assert.equal(coin0[0], "Coin0"); // name
		assert.equal(coin0[1], 100);     // startExRate
		assert.equal(coin0[2], 200);     // endExRate
		
		let coin1 = await game.coins.call(1);
		assert.equal(coin1[0], "Coin1"); // name
		assert.equal(coin1[1], 200);     // startExRate
		assert.equal(coin1[2], 220);       // endExRate
		
		let coin2 = await game.coins.call(2);
		assert.equal(coin2[0], "Coin2"); // name
		assert.equal(coin2[1], 300);     // startExRate
		assert.equal(coin2[2], 300);     // endExRate
		
		let coin3 = await game.coins.call(3);
		assert.equal(coin3[0], "Coin3"); // name
		assert.equal(coin3[1], 400);     // startExRate
		assert.equal(coin3[2], 360);     // endExRate
		
		let coin4 = await game.coins.call(4);
		assert.equal(coin4[0], "Coin4"); // name
		assert.equal(coin4[1], 500);     // startExRate
		assert.equal(coin4[2], 600);     // endExRate
		
		let isClosed = await game.isClosed.call();
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.numberOfWinnerCoinIds.call();
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.winnerCoinIds.call(0);
		assert.ok(winnerId.eq(0));
		
		let timeStampOfEndRateSol = await game.timeStampOfEndRate.call();
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let A = await game.A.call();
		let B = await game.B.call();
		
		A = Web3.utils.toBN(A);
		B = Web3.utils.toBN(B);
		let oneHundred = Web3.utils.toBN("100");
		
		let totalAwards = Web3.utils.toBN(web3.toWei(99500, "microether"));
		
		let bet0 = Web3.utils.toBN(web3.toWei(29850, "microether")); 
		let bet1 = Web3.utils.toBN(web3.toWei(29850, "microether"));
		let bet2 = Web3.utils.toBN(web3.toWei(9950, "microether")); 
		
		let awards0 = totalAwards.mul(A).div(oneHundred);
		let awards1 = totalAwards.mul(B).div(oneHundred).mul(bet1).div(bet1.add(bet2));
		let awards2 = totalAwards.mul(B).div(oneHundred).mul(bet2).div(bet1.add(bet2));
		
		let highestAwards = totalAwards.sub(awards0).sub(awards1).sub(awards2).div(Web3.utils.toBN("2"));
		awards0 = awards0.add(highestAwards);
		awards1 = awards1.add(highestAwards);
		
		// Get balance at ending. 
		let balanceFinal0 = web3.eth.getBalance(accounts[7]);
		let balanceFinal1 = web3.eth.getBalance(accounts[8]);
		let balanceFinal2 = web3.eth.getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).eq(balanceFinal0));
		assert.ok(balanceBegin1.add(awards1).eq(balanceFinal1));
		assert.ok(balanceBegin2.add(awards2).eq(balanceFinal2));
		
	});
});

contract('MambaGameTest', function(accounts) {
	it("Game - Largest rasing coin, sole winner, two highest bets, force Y = 0", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let isAlive = await game.isAlive.call();
		assert.ok(isAlive);
		
		// Get balance at beginning.
		let balanceBegin0 = web3.eth.getBalance(accounts[7]);
		let balanceBegin1 = web3.eth.getBalance(accounts[8]);
		let balanceBegin2 = web3.eth.getBalance(accounts[9]);
		
		// Bets.
		let bets = [];
		bets.push(game.bet("0", accounts[7], {value: web3.toWei(30, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("0", accounts[8], {value: web3.toWei(30, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("0", accounts[9], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("1", accounts[1], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("2", accounts[2], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("3", accounts[3], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		
		await Promise.all(bets);
		
		// Set Y to zero.
		await game.setYToZero({from: accounts[0]});
		
		// Close the game.
		let endExRate = [200 // 100%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coin0 = await game.coins.call(0);
		assert.equal(coin0[0], "Coin0"); // name
		assert.equal(coin0[1], 100);     // startExRate
		assert.equal(coin0[2], 200);     // endExRate
		
		let coin1 = await game.coins.call(1);
		assert.equal(coin1[0], "Coin1"); // name
		assert.equal(coin1[1], 200);     // startExRate
		assert.equal(coin1[2], 220);       // endExRate
		
		let coin2 = await game.coins.call(2);
		assert.equal(coin2[0], "Coin2"); // name
		assert.equal(coin2[1], 300);     // startExRate
		assert.equal(coin2[2], 300);     // endExRate
		
		let coin3 = await game.coins.call(3);
		assert.equal(coin3[0], "Coin3"); // name
		assert.equal(coin3[1], 400);     // startExRate
		assert.equal(coin3[2], 360);     // endExRate
		
		let coin4 = await game.coins.call(4);
		assert.equal(coin4[0], "Coin4"); // name
		assert.equal(coin4[1], 500);     // startExRate
		assert.equal(coin4[2], 600);     // endExRate
		
		let isClosed = await game.isClosed.call();
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.numberOfWinnerCoinIds.call();
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.winnerCoinIds.call(0);
		assert.ok(winnerId.eq(0));
		
		let timeStampOfEndRateSol = await game.timeStampOfEndRate.call();
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let A = await game.A.call();
		let B = await game.B.call();
		
		A = Web3.utils.toBN(A);
		B = Web3.utils.toBN(B);
		let oneHundred = Web3.utils.toBN("100");
		
		let totalAwards = Web3.utils.toBN(web3.toWei(99500, "microether"));
		
		let bet0 = Web3.utils.toBN(web3.toWei(29850, "microether")); 
		let bet1 = Web3.utils.toBN(web3.toWei(29850, "microether"));
		let bet2 = Web3.utils.toBN(web3.toWei(9950, "microether")); 
		
		let awards0 = totalAwards.mul(B).div(oneHundred).mul(bet0).div(bet0.add(bet1).add(bet2));
		let awards1 = totalAwards.mul(B).div(oneHundred).mul(bet1).div(bet0.add(bet1).add(bet2));
		let awards2 = totalAwards.mul(B).div(oneHundred).mul(bet2).div(bet0.add(bet1).add(bet2));
		
		let highestAwards = totalAwards.sub(awards0).sub(awards1).sub(awards2).div(Web3.utils.toBN("2"));
		awards0 = awards0.add(highestAwards);
		awards1 = awards1.add(highestAwards);
		
		// Get balance at ending. 
		let balanceFinal0 = web3.eth.getBalance(accounts[7]);
		let balanceFinal1 = web3.eth.getBalance(accounts[8]);
		let balanceFinal2 = web3.eth.getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).eq(balanceFinal0));
		assert.ok(balanceBegin1.add(awards1).eq(balanceFinal1));
		assert.ok(balanceBegin2.add(awards2).eq(balanceFinal2));
		
	});
});

contract('MambaGameTest', function(accounts) {
	it("Game - Smallest rasing coin, sole winner, one highest bets", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let isAlive = await game.isAlive.call();
		assert.ok(isAlive);
		
		// Get balance at beginning.
		let balanceBegin0 = web3.eth.getBalance(accounts[7]);
		let balanceBegin1 = web3.eth.getBalance(accounts[8]);
		let balanceBegin2 = web3.eth.getBalance(accounts[9]);
		
		// Bets.
		let bets = [];
		bets.push(game.bet("0", accounts[7], {value: web3.toWei(30, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("0", accounts[8], {value: web3.toWei(20, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("0", accounts[9], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("1", accounts[1], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("2", accounts[2], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("3", accounts[3], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("4", accounts[4], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		
		await Promise.all(bets);
		
		// Close the game.
		let endExRate = [50 // -50%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coin0 = await game.coins.call(0);
		assert.equal(coin0[0], "Coin0"); // name
		assert.equal(coin0[1], 100);     // startExRate
		assert.equal(coin0[2], 50);     // endExRate
		
		let coin1 = await game.coins.call(1);
		assert.equal(coin1[0], "Coin1"); // name
		assert.equal(coin1[1], 200);     // startExRate
		assert.equal(coin1[2], 220);       // endExRate
		
		let coin2 = await game.coins.call(2);
		assert.equal(coin2[0], "Coin2"); // name
		assert.equal(coin2[1], 300);     // startExRate
		assert.equal(coin2[2], 300);     // endExRate
		
		let coin3 = await game.coins.call(3);
		assert.equal(coin3[0], "Coin3"); // name
		assert.equal(coin3[1], 400);     // startExRate
		assert.equal(coin3[2], 360);     // endExRate
		
		let coin4 = await game.coins.call(4);
		assert.equal(coin4[0], "Coin4"); // name
		assert.equal(coin4[1], 500);     // startExRate
		assert.equal(coin4[2], 600);     // endExRate
		
		let isClosed = await game.isClosed.call();
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.numberOfWinnerCoinIds.call();
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.winnerCoinIds.call(0);
		assert.ok(winnerId.eq(0));
		
		let timeStampOfEndRateSol = await game.timeStampOfEndRate.call();
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let A = await game.A.call();
		let B = await game.B.call();
		
		A = Web3.utils.toBN(A);
		B = Web3.utils.toBN(B);
		let oneHundred = Web3.utils.toBN("100");
		
		let totalAwards = Web3.utils.toBN(web3.toWei(99500, "microether"));
		
		let bet0 = Web3.utils.toBN(web3.toWei(29850, "microether")); 
		let bet1 = Web3.utils.toBN(web3.toWei(19900, "microether"));
		let bet2 = Web3.utils.toBN(web3.toWei(9950, "microether")); 
		
		let awards0 = totalAwards.mul(A).div(oneHundred);
		let awards1 = totalAwards.mul(B).div(oneHundred).mul(bet1).div(bet1.add(bet2));
		let awards2 = totalAwards.mul(B).div(oneHundred).mul(bet2).div(bet1.add(bet2));
		
		let highestAwards = totalAwards.sub(awards0).sub(awards1).sub(awards2);
		awards0 = awards0.add(highestAwards);
		
		// Get balance at ending. 
		let balanceFinal0 = web3.eth.getBalance(accounts[7]);
		let balanceFinal1 = web3.eth.getBalance(accounts[8]);
		let balanceFinal2 = web3.eth.getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).eq(balanceFinal0));
		assert.ok(balanceBegin1.add(awards1).eq(balanceFinal1));
		assert.ok(balanceBegin2.add(awards2).eq(balanceFinal2));
		
	});
});

contract('MambaGameTest', function(accounts) {
	it("Game - Tied on highest and smallest change rate, sole winner, one highest bets", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let isAlive = await game.isAlive.call();
		assert.ok(isAlive);
		
		// Get balance at beginning.
		let balanceBegin0 = web3.eth.getBalance(accounts[7]);
		let balanceBegin1 = web3.eth.getBalance(accounts[8]);
		let balanceBegin2 = web3.eth.getBalance(accounts[9]);
		
		// Bets.
		let bets = [];
		bets.push(game.bet("0", accounts[7], {value: web3.toWei(30, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("0", accounts[8], {value: web3.toWei(20, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("0", accounts[9], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("1", accounts[1], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("2", accounts[2], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("3", accounts[3], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("4", accounts[4], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		
		await Promise.all(bets);
		
		// Close the game.
		let endExRate = [100 // 0%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coin0 = await game.coins.call(0);
		assert.equal(coin0[0], "Coin0"); // name
		assert.equal(coin0[1], 100);     // startExRate
		assert.equal(coin0[2], 100);     // endExRate
		
		let coin1 = await game.coins.call(1);
		assert.equal(coin1[0], "Coin1"); // name
		assert.equal(coin1[1], 200);     // startExRate
		assert.equal(coin1[2], 220);       // endExRate
		
		let coin2 = await game.coins.call(2);
		assert.equal(coin2[0], "Coin2"); // name
		assert.equal(coin2[1], 300);     // startExRate
		assert.equal(coin2[2], 300);     // endExRate
		
		let coin3 = await game.coins.call(3);
		assert.equal(coin3[0], "Coin3"); // name
		assert.equal(coin3[1], 400);     // startExRate
		assert.equal(coin3[2], 360);     // endExRate
		
		let coin4 = await game.coins.call(4);
		assert.equal(coin4[0], "Coin4"); // name
		assert.equal(coin4[1], 500);     // startExRate
		assert.equal(coin4[2], 600);     // endExRate
		
		let isClosed = await game.isClosed.call();
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.numberOfWinnerCoinIds.call();
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.winnerCoinIds.call(0);
		assert.ok(winnerId.eq(0));
		
		let timeStampOfEndRateSol = await game.timeStampOfEndRate.call();
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let A = await game.A.call();
		let B = await game.B.call();
		
		A = Web3.utils.toBN(A);
		B = Web3.utils.toBN(B);
		let oneHundred = Web3.utils.toBN("100");
		
		let totalAwards = Web3.utils.toBN(web3.toWei(99500, "microether"));
		
		let bet0 = Web3.utils.toBN(web3.toWei(29850, "microether")); 
		let bet1 = Web3.utils.toBN(web3.toWei(19900, "microether"));
		let bet2 = Web3.utils.toBN(web3.toWei(9950, "microether")); 
		
		let awards0 = totalAwards.mul(A).div(oneHundred);
		let awards1 = totalAwards.mul(B).div(oneHundred).mul(bet1).div(bet1.add(bet2));
		let awards2 = totalAwards.mul(B).div(oneHundred).mul(bet2).div(bet1.add(bet2));
		
		let highestAwards = totalAwards.sub(awards0).sub(awards1).sub(awards2);
		awards0 = awards0.add(highestAwards);
		
		// Get balance at ending. 
		let balanceFinal0 = web3.eth.getBalance(accounts[7]);
		let balanceFinal1 = web3.eth.getBalance(accounts[8]);
		let balanceFinal2 = web3.eth.getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).eq(balanceFinal0));
		assert.ok(balanceBegin1.add(awards1).eq(balanceFinal1));
		assert.ok(balanceBegin2.add(awards2).eq(balanceFinal2));
		
	});
});

contract('MambaGameTest', function(accounts) {
	it("Game - Two highest change rate winner, one highest bets", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let isAlive = await game.isAlive.call();
		assert.ok(isAlive);
		
		// Get balance at beginning.
		let balanceBegin0 = web3.eth.getBalance(accounts[7]);
		let balanceBegin1 = web3.eth.getBalance(accounts[8]);
		let balanceBegin2 = web3.eth.getBalance(accounts[9]);
		let balanceBegin3 = web3.eth.getBalance(accounts[4]);
		
		// Bets.
		let bets = [];
		bets.push(game.bet("0", accounts[7], {value: web3.toWei(30, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("0", accounts[8], {value: web3.toWei(20, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("0", accounts[9], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("1", accounts[1], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("2", accounts[2], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("3", accounts[3], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("4", accounts[4], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		
		await Promise.all(bets);
		
		// Close the game.
		let endExRate = [120 // 20%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
		
		// Test the result.
		let coin0 = await game.coins.call(0);
		assert.equal(coin0[0], "Coin0"); // name
		assert.equal(coin0[1], 100);     // startExRate
		assert.equal(coin0[2], 120);     // endExRate
		
		let coin1 = await game.coins.call(1);
		assert.equal(coin1[0], "Coin1"); // name
		assert.equal(coin1[1], 200);     // startExRate
		assert.equal(coin1[2], 220);       // endExRate
		
		let coin2 = await game.coins.call(2);
		assert.equal(coin2[0], "Coin2"); // name
		assert.equal(coin2[1], 300);     // startExRate
		assert.equal(coin2[2], 300);     // endExRate
		
		let coin3 = await game.coins.call(3);
		assert.equal(coin3[0], "Coin3"); // name
		assert.equal(coin3[1], 400);     // startExRate
		assert.equal(coin3[2], 360);     // endExRate
		
		let coin4 = await game.coins.call(4);
		assert.equal(coin4[0], "Coin4"); // name
		assert.equal(coin4[1], 500);     // startExRate
		assert.equal(coin4[2], 600);     // endExRate
		
		let isClosed = await game.isClosed.call();
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.numberOfWinnerCoinIds.call();
		assert.ok(numberOfWinnerCoinIds.eq(2));
		
		let winnerId = await game.winnerCoinIds.call(0);
		assert.ok(winnerId.eq(0));
		
		winnerId = await game.winnerCoinIds.call(1);
		assert.ok(winnerId.eq(4));
		
		let timeStampOfEndRateSol = await game.timeStampOfEndRate.call();
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let A = await game.A.call();
		let B = await game.B.call();
		
		A = Web3.utils.toBN(A);
		B = Web3.utils.toBN(B);
		let oneHundred = Web3.utils.toBN("100");
		
		let totalAwards = Web3.utils.toBN(web3.toWei(99500, "microether"));
		totalAwards = totalAwards.div(Web3.utils.toBN("2"));
		
		let bet0 = Web3.utils.toBN(web3.toWei(29850, "microether")); 
		let bet1 = Web3.utils.toBN(web3.toWei(19900, "microether"));
		let bet2 = Web3.utils.toBN(web3.toWei(9950, "microether")); 
		let bet4 = Web3.utils.toBN(web3.toWei(9950, "microether")); 
		
		let awards0 = totalAwards.mul(A).div(oneHundred);
		let awards1 = totalAwards.mul(B).div(oneHundred).mul(bet1).div(bet1.add(bet2));
		let awards2 = totalAwards.mul(B).div(oneHundred).mul(bet2).div(bet1.add(bet2));
		let awards3 = totalAwards;
		
		let highestAwards = totalAwards.sub(awards0).sub(awards1).sub(awards2);
		awards0 = awards0.add(highestAwards);
		
		// Get balance at ending. 
		let balanceFinal0 = web3.eth.getBalance(accounts[7]);
		let balanceFinal1 = web3.eth.getBalance(accounts[8]);
		let balanceFinal2 = web3.eth.getBalance(accounts[9]);
		let balanceFinal3 = web3.eth.getBalance(accounts[4]);
		
		assert.ok(balanceBegin0.add(awards0).eq(balanceFinal0));
		assert.ok(balanceBegin1.add(awards1).eq(balanceFinal1));
		assert.ok(balanceBegin2.add(awards2).eq(balanceFinal2));
		assert.ok(balanceBegin3.add(awards3).eq(balanceFinal3));
	});
});

contract('MambaGameTest', function(accounts) {
	it("Game - No winners. Total bets are equal.", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let isAlive = await game.isAlive.call();
		assert.ok(isAlive);
		
		// Bets.
		let bets = [];
		bets.push(game.bet("0", accounts[7], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("1", accounts[1], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("2", accounts[2], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("3", accounts[3], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("4", accounts[4], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		
		await Promise.all(bets);
		
		// Close the game.
		let endExRate = [100 // 0%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
	
		// Test the result.
		let coin0 = await game.coins.call(0);
		assert.equal(coin0[0], "Coin0"); // name
		assert.equal(coin0[1], 100);     // startExRate
		assert.equal(coin0[2], 0);     // endExRate
		
		let coin1 = await game.coins.call(1);
		assert.equal(coin1[0], "Coin1"); // name
		assert.equal(coin1[1], 200);     // startExRate
		assert.equal(coin1[2], 0);       // endExRate
		
		let coin2 = await game.coins.call(2);
		assert.equal(coin2[0], "Coin2"); // name
		assert.equal(coin2[1], 300);     // startExRate
		assert.equal(coin2[2], 0);     // endExRate
		
		let coin3 = await game.coins.call(3);
		assert.equal(coin3[0], "Coin3"); // name
		assert.equal(coin3[1], 400);     // startExRate
		assert.equal(coin3[2], 0);     // endExRate
		
		let coin4 = await game.coins.call(4);
		assert.equal(coin4[0], "Coin4"); // name
		assert.equal(coin4[1], 500);     // startExRate
		assert.equal(coin4[2], 0);     // endExRate
		
		let isClosed = await game.isClosed.call();
		assert.ok(!isClosed);
		
		let numberOfWinnerCoinIds = await game.numberOfWinnerCoinIds.call();
		assert.ok(numberOfWinnerCoinIds.eq(0));
		
		let timeStampOfEndRateSol = await game.timeStampOfEndRate.call();
		assert.ok(timeStampOfEndRateSol.isZero());
		
		let closeTime = await game.closeTime.call();
		assert.ok(closeTime > timeStampOfEndRate);
	});
});

contract('MambaGameTest', function(accounts) {
	it("Game - No winners. Every coins are highest or smallest change rate.", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let isAlive = await game.isAlive.call();
		assert.ok(isAlive);
		
		// Bets.
		let bets = [];
		bets.push(game.bet("0", accounts[7], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("1", accounts[1], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("2", accounts[2], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("3", accounts[3], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("4", accounts[4], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		
		await Promise.all(bets);
		
		// Close the game.
		let endExRate = [120 // 20%
			, 240 // 20%
			, 270 // -10%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
	
		// Test the result.
		let coin0 = await game.coins.call(0);
		assert.equal(coin0[0], "Coin0"); // name
		assert.equal(coin0[1], 100);     // startExRate
		assert.equal(coin0[2], 0);     // endExRate
		
		let coin1 = await game.coins.call(1);
		assert.equal(coin1[0], "Coin1"); // name
		assert.equal(coin1[1], 200);     // startExRate
		assert.equal(coin1[2], 0);       // endExRate
		
		let coin2 = await game.coins.call(2);
		assert.equal(coin2[0], "Coin2"); // name
		assert.equal(coin2[1], 300);     // startExRate
		assert.equal(coin2[2], 0);     // endExRate
		
		let coin3 = await game.coins.call(3);
		assert.equal(coin3[0], "Coin3"); // name
		assert.equal(coin3[1], 400);     // startExRate
		assert.equal(coin3[2], 0);     // endExRate
		
		let coin4 = await game.coins.call(4);
		assert.equal(coin4[0], "Coin4"); // name
		assert.equal(coin4[1], 500);     // startExRate
		assert.equal(coin4[2], 0);     // endExRate
		
		let isClosed = await game.isClosed.call();
		assert.ok(!isClosed);
		
		let numberOfWinnerCoinIds = await game.numberOfWinnerCoinIds.call();
		assert.ok(numberOfWinnerCoinIds.isZero());
		
		let timeStampOfEndRateSol = await game.timeStampOfEndRate.call();
		assert.ok(timeStampOfEndRateSol.isZero());
		
		let closeTime = await game.closeTime.call();
		assert.ok(closeTime > timeStampOfEndRate);
	});
});

contract('MambaGameTest', function(accounts) {
	it("Game - Tied on highest and samllest change rate. Only one in the rest group, sole winner, one highest bets.", async function () {
		let game = await MambaGameTest.deployed();
		
		// Test is closed.
		let isAlive = await game.isAlive.call();
		assert.ok(isAlive);
		
		// Get balance at beginning.
		let balanceBegin0 = web3.eth.getBalance(accounts[7]);
		
		// Bets.
		let bets = [];
		bets.push(game.bet("0", accounts[7], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("1", accounts[1], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("2", accounts[2], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("3", accounts[3], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		bets.push(game.bet("4", accounts[4], {value: web3.toWei(10, "finney")
			, from: accounts[0]}));
		
		await Promise.all(bets);
		
		// Close the game.
		let endExRate = [100 // 0%
			, 240 // 20%
			, 270 // -10%
			, 360 // -10%
			, 600]; // 20%
		let timeStampOfEndRate = Math.floor(Date.now() / 1000);
		
		await game.close(endExRate, timeStampOfEndRate, {from: accounts[0], gasLimit: 371211});
	
		// Test the result.
		let coin0 = await game.coins.call(0);
		assert.equal(coin0[0], "Coin0"); // name
		assert.equal(coin0[1], 100);     // startExRate
		assert.equal(coin0[2], 100);     // endExRate
		
		let coin1 = await game.coins.call(1);
		assert.equal(coin1[0], "Coin1"); // name
		assert.equal(coin1[1], 200);     // startExRate
		assert.equal(coin1[2], 240);       // endExRate
		
		let coin2 = await game.coins.call(2);
		assert.equal(coin2[0], "Coin2"); // name
		assert.equal(coin2[1], 300);     // startExRate
		assert.equal(coin2[2], 270);     // endExRate
		
		let coin3 = await game.coins.call(3);
		assert.equal(coin3[0], "Coin3"); // name
		assert.equal(coin3[1], 400);     // startExRate
		assert.equal(coin3[2], 360);     // endExRate
		
		let coin4 = await game.coins.call(4);
		assert.equal(coin4[0], "Coin4"); // name
		assert.equal(coin4[1], 500);     // startExRate
		assert.equal(coin4[2], 600);     // endExRate
		
		let isClosed = await game.isClosed.call();
		assert.ok(isClosed);
		
		let numberOfWinnerCoinIds = await game.numberOfWinnerCoinIds.call();
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.winnerCoinIds.call(0);
		assert.ok(winnerId.eq(0));
		
		let timeStampOfEndRateSol = await game.timeStampOfEndRate.call();
		assert.ok(timeStampOfEndRateSol.eq(timeStampOfEndRate));
		
		let totalAwards = Web3.utils.toBN(web3.toWei(49750, "microether"));
		
		// Get balance at ending. 
		let balanceFinal0 = web3.eth.getBalance(accounts[7]);
		
		assert.ok(balanceBegin0.add(totalAwards).eq(balanceFinal0));
	});
});