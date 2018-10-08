var Web3 = require("Web3");
var MambaGame = artifacts.require("./MambaGame.sol");

contract('MambaGame', function(accounts) {
	it("Initial Data", async function () {
		let game = await MambaGame.deployed();
		
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
		assert.equal(coin0[3], 0);       // finalChangeRate
		
		let coin1 = await game.coins.call(1);
		assert.equal(coin1[0], "Coin1"); // name
		assert.equal(coin1[1], 200);     // startExRate
		assert.equal(coin1[2], 0);       // endExRate
		assert.equal(coin1[3], 0);       // finalChangeRate
		
		let coin2 = await game.coins.call(2);
		assert.equal(coin2[0], "Coin2"); // name
		assert.equal(coin2[1], 300);     // startExRate
		assert.equal(coin2[2], 0);       // endExRate
		assert.equal(coin2[3], 0);       // finalChangeRate
		
		let coin3 = await game.coins.call(3);
		assert.equal(coin3[0], "Coin3"); // name
		assert.equal(coin3[1], 400);     // startExRate
		assert.equal(coin3[2], 0);       // endExRate
		assert.equal(coin3[3], 0);       // finalChangeRate
		
		let coin4 = await game.coins.call(4);
		assert.equal(coin4[0], "Coin4"); // name
		assert.equal(coin4[1], 500);     // startExRate
		assert.equal(coin4[2], 0);       // endExRate
		assert.equal(coin4[3], 0);       // finalChangeRate
		
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
			assert.equal(yDist[i], i % 10);
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
});
