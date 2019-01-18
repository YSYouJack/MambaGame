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

contract('GamePoolTestProxy', function(accounts) {
	
	it("Initial Data", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		let numberOfGames = await game.numberOfGames.call();
		assert.equal(numberOfGames, 0);
		
		let txFeeReceiver = await game.txFeeReceiver.call();
		assert.equal(txFeeReceiver, accounts[0]);
		
		let oraclizeFee = await game.oraclizeFee.call();
		assert.equal(oraclizeFee, 0);
		
		let ORICALIZE_GAS_LIMIT = await game.ORICALIZE_GAS_LIMIT.call();
		assert.equal(ORICALIZE_GAS_LIMIT, 120000);
		
		let MIN_BET = await game.MIN_BET.call();
		assert.ok(MIN_BET.eq(web3.toWei("10", "finney")));
		
		let HIDDEN_TIME_BEFORE_CLOSE = await game.HIDDEN_TIME_BEFORE_CLOSE.call();
		assert.equal(HIDDEN_TIME_BEFORE_CLOSE, 300);
		
		let CLAIM_AWARD_TIME_AFTER_CLOSE = await game.CLAIM_AWARD_TIME_AFTER_CLOSE.call();
		assert.equal(CLAIM_AWARD_TIME_AFTER_CLOSE, 2592000);
		
        let CLAIM_REFUND_TIME_AFTER_CLOSE = await game.CLAIM_REFUND_TIME_AFTER_CLOSE.call();
		assert.equal(CLAIM_REFUND_TIME_AFTER_CLOSE, 21600);
        
		let MAX_FETCHING_TIME_FOR_END_EXRATE = await game.MAX_FETCHING_TIME_FOR_END_EXRATE.call();
		assert.equal(MAX_FETCHING_TIME_FOR_END_EXRATE, 3600);
		
		let packedData = await game.packedCommonData.call();
		assert.equal(packedData.length, 7);
		assert.equal(packedData[0], txFeeReceiver);
		assert.ok(packedData[1].eq(MIN_BET));
		assert.ok(packedData[2].eq(HIDDEN_TIME_BEFORE_CLOSE));
		assert.ok(packedData[3].eq(CLAIM_AWARD_TIME_AFTER_CLOSE));
        assert.ok(packedData[4].eq(CLAIM_REFUND_TIME_AFTER_CLOSE));
		assert.ok(packedData[5].eq(MAX_FETCHING_TIME_FOR_END_EXRATE));
		assert.ok(packedData[6].eq(numberOfGames));
	});
	
	it("Send & withdraw oraclize fee", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		await game.sendTransaction({from: accounts[0], value: web3.toWei("1", "gwei")});
		await game.sendOraclizeFee({from: accounts[0], value: web3.toWei("1", "gwei")});
		
		let oraclizeFee = await game.oraclizeFee.call();
		assert.equal(oraclizeFee, web3.toWei("2", "gwei"));
		
		let balance = await getBalance(game.address);
		assert.equal(balance, web3.toWei("2", "gwei"));
		
		let balanceBefore = await getBalance(accounts[0]);
		await game.withdrawOraclizeFee({from: accounts[0]});
		
		let balanceAfter = await getBalance(accounts[0]);
		assert.equal(balanceAfter.sub(balanceBefore), web3.toWei("2", "gwei"));
		
		oraclizeFee = await game.oraclizeFee.call();
		assert.equal(oraclizeFee, 0);
		
		balance = await getBalance(game.address);
		assert.equal(balance, 0);
	});
	
	it("Create game", async function () {
		await createNewTestGame(accounts);
		
		let game = await GamePoolTestProxy.deployed();
		
		let numberOfGames = await game.numberOfGames.call();
		assert.equal(numberOfGames, 1);
		
		let gameData = await game.games.call(0);
		assert.equal(gameData.length, 14);
		
		// Test game data from 'games' getter.
		// Game id.
		assert.equal(gameData[0], 0);
		
		// Test opening time,  duration and closing time.
		let openingTime = gameData[1];
		let closingTime = gameData[2];
		let duration = gameData[3];
		
		assert.equal(duration, 600);
		assert.ok(closingTime.eq(openingTime.add(duration).sub(1)));
		
		// Hidden time
		assert.equal(gameData[4], 300);
		
		// Claimed award time.
        let claimAwardsTime = gameData[5].modulo("0x100000000000000000000000000000000", 16); // 1 << 128
        let claimRefundsTime = gameData[5].dividedBy("0x100000000000000000000000000000000", 16); // 1 << 128;
		assert.equal(claimAwardsTime, 2592000);
        assert.equal(claimRefundsTime, 21600);
		
		// Max fetching time for end exrate.
		assert.equal(gameData[6], 3600);
		
		// Y, A, B, tx fee
		assert.equal(gameData[7], 0);
		assert.equal(gameData[8], 10);
		assert.equal(gameData[9], 20);
		assert.equal(gameData[10], 5);
		
		// Is finished, is y choosed.
		assert.equal(gameData[11], false);
		assert.equal(gameData[12], false);
		
		// Minimum difference bets.
		assert.equal(gameData[13], web3.toWei("10", "finney"));	
		
		// Test game data from 'gamePackedCommonData' getter.
		gameData = await game.gamePackedCommonData.call(0);
		assert.equal(gameData.length, 11);
		assert.ok(gameData[0].eq(openingTime));
		assert.ok(gameData[1].eq(closingTime));
		assert.ok(gameData[2].eq(duration));
		
		assert.equal(gameData[3].length, 50);
		for (let i = 0; i < 50; ++i) {
			assert.equal(gameData[3][i], (i % 10) + 1);
		}
		
		assert.ok(gameData[4].isZero());  // Y
		assert.ok(gameData[5].eq(10));    // A
		assert.ok(gameData[6].eq(20));    // B
		assert.ok(gameData[7].eq(1));     // state
		assert.ok(gameData[8].isZero());  // winnerMasks
		assert.ok(gameData[9].eq(5));     // txFee
		assert.ok(gameData[10].eq(web3.toWei("10", "finney"))); // minDiffBets
		
		// Test coins.
		for (let i = 0; i < 5; ++i) {
			let coin = await game.gameCoinData.call(0, i);
			assert.equal(coin.length, 5);
			
			// name
			if (0 == i) {
				assert.equal(coin[0], "BTC");
			} else if (1 == i) {
				assert.equal(coin[0], "LTC");
			} else if (2 == i) {
				assert.equal(coin[0], "BCC");
			} else if (3 == i) {
				assert.equal(coin[0], "ETH");
			} else {
				assert.equal(coin[0], "ETC");
			}
			
			assert.equal(coin[1], 0); 	   // startExRate
			assert.equal(coin[2], 0); 	   // timeStampOfStartExRate
			assert.equal(coin[3], 0); 	   // endExRate
			assert.equal(coin[4], 0); 	   // timeStampOfEndExRate	
		}
		
		// Test coins from packed output.
		let packedCoinData = await game.gamePackedCoinData.call(0);
		assert.equal(packedCoinData.length, 5);
		assert.equal(packedCoinData[0].length, 5);
		assert.equal(packedCoinData[1].length, 5);
		assert.equal(packedCoinData[2].length, 5);
		assert.equal(packedCoinData[3].length, 5);
		assert.equal(packedCoinData[4].length, 5);
		assert.equal(web3.toAscii(packedCoinData[0][0]).replace(/\0/g, ''), "BTC"); // Name
		assert.equal(web3.toAscii(packedCoinData[0][1]).replace(/\0/g, ''), "LTC");
		assert.equal(web3.toAscii(packedCoinData[0][2]).replace(/\0/g, ''), "BCC");
		assert.equal(web3.toAscii(packedCoinData[0][3]).replace(/\0/g, ''), "ETH");
		assert.equal(web3.toAscii(packedCoinData[0][4]).replace(/\0/g, ''), "ETC");
		assert.equal(packedCoinData[1][0], 0); // timeStampOfStartExRate
		assert.equal(packedCoinData[1][1], 0);
		assert.equal(packedCoinData[1][2], 0);
		assert.equal(packedCoinData[1][3], 0);
		assert.equal(packedCoinData[1][4], 0);
		assert.equal(packedCoinData[2][0], 0); // timeStampOfEndExRate
		assert.equal(packedCoinData[2][1], 0);
		assert.equal(packedCoinData[2][2], 0);
		assert.equal(packedCoinData[2][3], 0);
		assert.equal(packedCoinData[2][4], 0);
		assert.equal(packedCoinData[3][0], 0); // startExRate
		assert.equal(packedCoinData[3][1], 0);
		assert.equal(packedCoinData[3][2], 0);
		assert.equal(packedCoinData[3][3], 0);
		assert.equal(packedCoinData[3][4], 0);
		assert.equal(packedCoinData[4][0], 0); // endExRate
		assert.equal(packedCoinData[4][1], 0);
		assert.equal(packedCoinData[4][2], 0);
		assert.equal(packedCoinData[4][3], 0);
		assert.equal(packedCoinData[4][4], 0);
		
		// getCoinBetData;
		for (let i = 0; i < 5; ++i) {
			let coinbets = await game.gameBetData.call(0, i);
			assert.ok(coinbets[0].isZero()); // totalBets
			assert.ok(coinbets[1].isZero()); // largestBets
			assert.ok(coinbets[2].isZero()); // numberOfBets
		}
		
		// Test bet data from packed output.
		let packedBetData = await game.gamePackedBetData.call(0);
		assert.equal(packedBetData.length, 3);
		assert.equal(packedBetData[0].length, 5);
		assert.equal(packedBetData[1].length, 5);
		assert.equal(packedBetData[2].length, 5);
		for (let i = 0; i < 3; ++i) {
			for (let j = 0; j < 5; ++j) {
				assert.ok(packedBetData[i][j].isZero());
			}
		}
		
		// Test winner ids.
		let numberOfWinnerIds = await game.gameNumberOfWinnerCoinIds(0);
		assert.equal(numberOfWinnerIds, 0);
		
		// Test winner mask.
		let winnerMask = await game.gameWinnerMask(0);
		assert.equal(winnerMask, 0);
	});
	
	it("Game State", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames.sub(1);
		
		let now = Math.floor(Date.now() / 1000);
		
		await game.setOpenCloseTime(gameId, now + 300, now + 600);
		let gameState = await game.gameState(gameId);
		assert.equal(gameState, 1); // Created
		
		await game.setStartExRate(gameId, [10000, 20000, 30000, 50, 4000]);
		gameState = await game.gameState(gameId);
		assert.equal(gameState, 2); // Ready
		
		await game.setOpenCloseTime(gameId, now - 300, now + 300);
		gameState = await game.gameState(gameId);
		assert.equal(gameState, 3); // Open
		
		await game.setOpenCloseTime(gameId, now - 600, now - 300);
		gameState = await game.gameState(gameId);
		assert.equal(gameState, 5); // WaitToClose
		
		await game.setOpenCloseTime(gameId, now - 300, now + 300);
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[1]});
		
		await game.setOpenCloseTime(gameId, now - 600, now - 300);
		gameState = await game.gameState(gameId);
		assert.equal(gameState, 4); // Stop
		
		await game.setEndExRate(gameId, [10000, 20000, 30000, 50, 4000]);
		await game.setY(gameId, 20);
		gameState = await game.gameState(gameId);
		assert.equal(gameState, 5); // WaitToClose
			
		await game.setIsFinished(gameId, true);
		gameState = await game.gameState(gameId);
		assert.equal(gameState, 6); // Closed
		
		await game.setStartExRate(gameId, [0, 0, 0, 0, 0]);
		await game.setIsFinished(gameId, false);
		gameState = await game.gameState(gameId);
		assert.equal(gameState, 7); // Error
		
		gameState = await game.gameState(numberOfGames);
		assert.equal(gameState, 0); // Not exists
	});
});

contract('GamePoolTestProxy', function(accounts) {
	this.startExRate = [100, 200, 300, 400, 500];
	this.threshold = web3.toBigNumber(web3.toWei("10", "finney"));
	
	beforeEach(async function() {
		await createNewTestGame(accounts);
		
		let game = await GamePoolTestProxy.deployed();
		let numberOfGames = await game.numberOfGames.call();
		
		await game.setStartExRate(numberOfGames - 1, startExRate);
	});
	
	it("Take bets", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Test is closed.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// First bet.
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[1]});
			
		let netBets0 = web3.toBigNumber(web3.toWei("9950", "microether"));
		let coinbets = await game.gameBetData.call(gameId, 0);
		assert.ok(coinbets[0].eq(netBets0)); // totalBets
		assert.ok(coinbets[1].eq(netBets0)); // largestBets
		assert.ok(coinbets[2].eq(1));        // numberOfBets
		
		// Same largest bet on same coin.
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[2]});
			
		coinbets = await game.gameBetData.call(gameId, 0);
		assert.ok(coinbets[0].eq(netBets0.add(netBets0))); // totalBets
		assert.ok(coinbets[1].eq(netBets0)); // largestBets
		assert.ok(coinbets[2].eq(2));       // numberOfBets
		
		// Another bigger bet on same coin.
		await game.bet(gameId, 0, {value: web3.toWei(100, "finney"), from: accounts[3]});
			
		let netBets1 = web3.toBigNumber(web3.toWei("99500", "microether"));
		coinbets = await game.gameBetData.call(gameId, 0);
		assert.ok(coinbets[0].eq(netBets1.add(netBets0).add(netBets0))); // totalBets
		assert.ok(coinbets[1].eq(netBets1)); // largestBets
		assert.ok(coinbets[2].eq(3));        // numberOfBets
		
		// Change bet to another coins
		await game.bet(gameId, 1, {value: web3.toWei(100, "finney"), from: accounts[4]});
			
		coinbets = await game.gameBetData.call(gameId, 1);
		assert.ok(coinbets[0].eq(netBets1)); // totalBets
		assert.ok(coinbets[1].eq(netBets1)); // largestBets
		assert.ok(coinbets[2].eq(1));        // numberOfBets
	});
	
	it("Game - Largest rasing coin, sole winner, two highest bets", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Test is closed.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// Bets.
		await game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[7]});
		await game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[8]});
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[9]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
		await game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]});
		await game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]});
		
		// Close the game.
		let endExRate = [200 // 100%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		await game.setEndExRate(gameId, endExRate);
		await game.setY(gameId, 10);
		await game.close(gameId, {from: accounts[0], gasLimit: 371211});
		
		// Test the coin result.
		for (let i = 0; i < 5; ++i) {
			let coin = await game.gameCoinData.call(gameId, i);
			assert.equal(coin[1], startExRate[i]); 		// startExRate
			assert.ok(coin[2] != 0);                    // timeStampOfStartExRate
			assert.equal(coin[3], endExRate[i]);   		// endExRate
			assert.ok(coin[4] != 0);                    // timeStampOfEndExRate
		}
		
		// Test the game state.
		let gameState = await game.gameState.call(gameId);
		assert.equal(gameState, 6); // Close state.
		
		// Test the winners.
		let numberOfWinnerCoinIds = await game.gameNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.gameWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));
		
		// Calculate awards.
		let gameData = await game.games.call(gameId);
		
		let A = gameData[8];
		let B = gameData[9];
		
		let oneHundred = web3.toBigNumber("100");
		
		let totalAwards = web3.toBigNumber(web3.toWei(99500, "microether"));
		
		let bet0 = web3.toBigNumber(web3.toWei(29850, "microether")); 
		let bet1 = web3.toBigNumber(web3.toWei(29850, "microether"));
		let bet2 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		
		let awardsOfB = totalAwards.mul(B).dividedToIntegerBy(oneHundred);
		
		let awards0 = totalAwards.mul(A).div(oneHundred);
		let awards1 = awardsOfB.mul(bet1).dividedToIntegerBy(bet1.add(bet2));
		let awards2 = awardsOfB.mul(bet2).dividedToIntegerBy(bet1.add(bet2));
		
		let highestAwards = totalAwards.sub(awards0).sub(awardsOfB).dividedToIntegerBy(web3.toBigNumber("2"));
		awards0 = awards0.add(highestAwards);
		awards1 = awards1.add(highestAwards);
        
		let awardsFromContract0 = await game.calculateAwardAmount(gameId, {from: accounts[7]});
		let awardsFromContract1 = await game.calculateAwardAmount(gameId, {from: accounts[8]});
		let awardsFromContract2 = await game.calculateAwardAmount(gameId, {from: accounts[9]});
        
		assert.ok(awardsFromContract0.eq(awards0));
		assert.ok(awardsFromContract1.eq(awards1));
		assert.ok(awardsFromContract2.eq(awards2));
		
		// Get balance at beginning.
		let balanceBegin0 = await getBalance(accounts[7]);
		let balanceBegin1 = await getBalance(accounts[8]);
		let balanceBegin2 = await getBalance(accounts[9]);
		
		// Withdraw.
		await game.getAwards(gameId, {from: accounts[7]});
		await game.getAwards(gameId, {from: accounts[8]});
		await game.getAwards(gameId, {from: accounts[9]});
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		let balanceFinal1 = await getBalance(accounts[8]);
		let balanceFinal2 = await getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).sub(balanceFinal0).lte(threshold));
		assert.ok(balanceBegin1.add(awards1).sub(balanceFinal1).lte(threshold));
		assert.ok(balanceBegin2.add(awards2).sub(balanceFinal2).lte(threshold));
	});

	it("Game - Largest rasing coin, sole winner, two highest bets, force Y = 0", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Test is closed.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// Bets.
		await game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[7]});
		await game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[8]});
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[9]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
		await game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]});
		await game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]});
		
		// Set Y to zero.
		await game.setY(gameId, 0);
		
		// Close the game.
		let endExRate = [200 // 100%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		await game.setEndExRate(gameId, endExRate);
		
		await game.close(gameId, {from: accounts[0], gasLimit: 371211});
		
		// Test the coin result.
		for (let i = 0; i < 5; ++i) {
			let coin = await game.gameCoinData.call(gameId, i);
			assert.equal(coin[1], startExRate[i]); // startExRate
			assert.ok(coin[2] != 0);               // timeStampOfStartExRate
			assert.equal(coin[3], endExRate[i]);   // endExRate
			assert.ok(coin[4] != 0);               // timeStampOfEndExRate
		}
		
		// Test the game state.
		let gameState = await game.gameState.call(gameId);
		assert.equal(gameState, 6); // Close state.
		
		// Test the winners.
		let numberOfWinnerCoinIds = await game.gameNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.gameWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));
		
		// Calculate awards.
		let gameData = await game.games.call(gameId);
		
		let A = gameData[8];
		let B = gameData[9];
		
		let oneHundred = web3.toBigNumber("100");
		
		let totalAwards = web3.toBigNumber(web3.toWei(99500, "microether"));
		
		let bet0 = web3.toBigNumber(web3.toWei(29850, "microether")); 
		let bet1 = web3.toBigNumber(web3.toWei(29850, "microether"));
		let bet2 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		
		let awardsOfB = totalAwards.mul(B).dividedToIntegerBy(oneHundred);
		
		let awards0 = awardsOfB.mul(bet0).dividedToIntegerBy(bet0.add(bet1).add(bet2));
		let awards1 = awardsOfB.mul(bet1).dividedToIntegerBy(bet0.add(bet1).add(bet2));
		let awards2 = awardsOfB.mul(bet2).dividedToIntegerBy(bet0.add(bet1).add(bet2));
		
		let highestAwards = totalAwards.sub(awardsOfB).dividedToIntegerBy(web3.toBigNumber("2"));
		awards0 = awards0.add(highestAwards);
		awards1 = awards1.add(highestAwards);
		
		let awardsFromContract0 = await game.calculateAwardAmount(gameId, {from: accounts[7]});
		let awardsFromContract1 = await game.calculateAwardAmount(gameId, {from: accounts[8]});
		let awardsFromContract2 = await game.calculateAwardAmount(gameId, {from: accounts[9]});
		
		assert.ok(awardsFromContract0.eq(awards0));
		assert.ok(awardsFromContract1.eq(awards1));
		assert.ok(awardsFromContract2.eq(awards2));
		
		// Get balance at beginning.
		let balanceBegin0 = await getBalance(accounts[7]);
		let balanceBegin1 = await getBalance(accounts[8]);
		let balanceBegin2 = await getBalance(accounts[9]);
		
		// Withdraw.
		await game.getAwards(gameId, {from: accounts[7]});
		await game.getAwards(gameId, {from: accounts[8]});
		await game.getAwards(gameId, {from: accounts[9]});
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		let balanceFinal1 = await getBalance(accounts[8]);
		let balanceFinal2 = await getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).sub(balanceFinal0).lte(threshold));
		assert.ok(balanceBegin1.add(awards1).sub(balanceFinal1).lte(threshold));
		assert.ok(balanceBegin2.add(awards2).sub(balanceFinal2).lte(threshold));
	});
	
	it("Game - Smallest rasing coin, sole winner, one highest bets", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Test is closed.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// Bets.
		await game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[7]});
		await game.bet(gameId, 0, {value: web3.toWei(20, "finney"), from: accounts[8]});
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[9]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
		await game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]});
		await game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]});
		await game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]});
		
		// Close the game.
		let endExRate = [50 // -50%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		await game.setEndExRate(gameId, endExRate);
		await game.setY(gameId, 10);
		await game.close(gameId, {from: accounts[0], gasLimit: 371211});
		
		// Test the coin result.
		for (let i = 0; i < 5; ++i) {
			let coin = await game.gameCoinData.call(gameId, i);
			assert.equal(coin[1], startExRate[i]); // startExRate
			assert.ok(coin[2] != 0);               // timeStampOfStartExRate
			assert.equal(coin[3], endExRate[i]);   // endExRate
			assert.ok(coin[4] != 0);               // timeStampOfEndExRate
		}

		// Test the game state.
		let gameState = await game.gameState.call(gameId);
		assert.equal(gameState, 6); // Close state.
		
		// Test the winners.
		let numberOfWinnerCoinIds = await game.gameNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.gameWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));

		// Calculate awards.
		let gameData = await game.games.call(gameId);
		
		let A = gameData[8];
		let B = gameData[9];
		
		let oneHundred = web3.toBigNumber("100");
		
		let totalAwards = web3.toBigNumber(web3.toWei(99500, "microether"));
		
		let bet0 = web3.toBigNumber(web3.toWei(29850, "microether")); 
		let bet1 = web3.toBigNumber(web3.toWei(19900, "microether"));
		let bet2 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		
		let awardsOfB = totalAwards.mul(B).dividedToIntegerBy(oneHundred);
		
		let awards0 = totalAwards.mul(A).dividedToIntegerBy(oneHundred);
		let awards1 = awardsOfB.mul(bet1).dividedToIntegerBy(bet1.add(bet2));
		let awards2 = awardsOfB.mul(bet2).dividedToIntegerBy(bet1.add(bet2));
		
		let highestAwards = totalAwards.sub(awards0).sub(awardsOfB);
		awards0 = awards0.add(highestAwards);
		
		let awardsFromContract0 = await game.calculateAwardAmount(gameId, {from: accounts[7]});
		let awardsFromContract1 = await game.calculateAwardAmount(gameId, {from: accounts[8]});
		let awardsFromContract2 = await game.calculateAwardAmount(gameId, {from: accounts[9]});
		
		assert.ok(awardsFromContract0.eq(awards0));
		assert.ok(awardsFromContract1.eq(awards1));
		assert.ok(awardsFromContract2.eq(awards2));
		
		// Get balance at beginning.
		let balanceBegin0 = await getBalance(accounts[7]);
		let balanceBegin1 = await getBalance(accounts[8]);
		let balanceBegin2 = await getBalance(accounts[9]);
		
		// Withdraw.
		await game.getAwards(gameId, {from: accounts[7]});
		await game.getAwards(gameId, {from: accounts[8]});
		await game.getAwards(gameId, {from: accounts[9]});
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		let balanceFinal1 = await getBalance(accounts[8]);
		let balanceFinal2 = await getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).sub(balanceFinal0).lte(threshold));
		assert.ok(balanceBegin1.add(awards1).sub(balanceFinal1).lte(threshold));
		assert.ok(balanceBegin2.add(awards2).sub(balanceFinal2).lte(threshold));
	});
	
	it("Game - Tied on highest and smallest change rate, sole winner, one highest bets", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Test is closed.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// Bets.
		await game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[7]});
		await game.bet(gameId, 0, {value: web3.toWei(20, "finney"), from: accounts[8]});
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[9]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
		await game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]});
		await game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]});
		await game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]});
		
		// Close the game.
		let endExRate = [100 // 0%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		await game.setEndExRate(gameId, endExRate);
		await game.setY(gameId, 10);
		await game.close(gameId, {from: accounts[0], gasLimit: 371211});
		
		// Test the coin result.
		for (let i = 0; i < 5; ++i) {
			let coin = await game.gameCoinData.call(gameId, i);
			assert.equal(coin[1], startExRate[i]); // startExRate
			assert.ok(coin[2] != 0);               // timeStampOfStartExRate
			assert.equal(coin[3], endExRate[i]);   // endExRate
			assert.ok(coin[4] != 0);               // timeStampOfEndExRate
		}

		// Test the game state.
		let gameState = await game.gameState.call(gameId);
		assert.equal(gameState, 6); // Close state.
		
		// Test the winners.
		let numberOfWinnerCoinIds = await game.gameNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.gameWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));
		
		// Calculate awards.
		let gameData = await game.games.call(gameId);
		
		let A = gameData[8];
		let B = gameData[9];
		
		let oneHundred = web3.toBigNumber("100");
		
		let totalAwards = web3.toBigNumber(web3.toWei(99500, "microether"));
		
		let bet0 = web3.toBigNumber(web3.toWei(29850, "microether")); 
		let bet1 = web3.toBigNumber(web3.toWei(19900, "microether"));
		let bet2 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		
		let awardsOfB = totalAwards.mul(B).dividedToIntegerBy(oneHundred);
			
		let awards0 = totalAwards.mul(A).dividedToIntegerBy(oneHundred);
		let awards1 = awardsOfB.mul(bet1).dividedToIntegerBy(bet1.add(bet2));
		let awards2 = awardsOfB.mul(bet2).dividedToIntegerBy(bet1.add(bet2));
		
		let highestAwards = totalAwards.sub(awards0).sub(awardsOfB);
		awards0 = awards0.add(highestAwards);
		
		// Get calculated awards.
		let awardsFromContract0 = await game.calculateAwardAmount(gameId, {from: accounts[7]});
		let awardsFromContract1 = await game.calculateAwardAmount(gameId, {from: accounts[8]});
		let awardsFromContract2 = await game.calculateAwardAmount(gameId, {from: accounts[9]});
		
		assert.ok(awardsFromContract0.eq(awards0));
		assert.ok(awardsFromContract1.eq(awards1));
		assert.ok(awardsFromContract2.eq(awards2));
		
		// Get balance at beginning.
		let balanceBegin0 = await getBalance(accounts[7]);
		let balanceBegin1 = await getBalance(accounts[8]);
		let balanceBegin2 = await getBalance(accounts[9]);
		
		// Withdraw.
		await game.getAwards(gameId, {from: accounts[7]});
		await game.getAwards(gameId, {from: accounts[8]});
		await game.getAwards(gameId, {from: accounts[9]});
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		let balanceFinal1 = await getBalance(accounts[8]);
		let balanceFinal2 = await getBalance(accounts[9]);
		
		assert.ok(balanceBegin0.add(awards0).sub(balanceFinal0).lte(threshold));
		assert.ok(balanceBegin1.add(awards1).sub(balanceFinal1).lte(threshold));
		assert.ok(balanceBegin2.add(awards2).sub(balanceFinal2).lte(threshold));
	});
	
	it("Game - Two highest change rate winner, one highest bets", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Test is closed.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// Bets.
		await game.bet(gameId, 0, {value: web3.toWei(30, "finney"), from: accounts[7]});
		await game.bet(gameId, 0, {value: web3.toWei(20, "finney"), from: accounts[8]});
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[9]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
		await game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]});
		await game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]});
		await game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]});
		
		// Close the game.
		let endExRate = [120 // 20%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		await game.setEndExRate(gameId, endExRate);
		await game.setY(gameId, 10);
		await game.close(gameId, {from: accounts[0], gasLimit: 371211});
		
		// Test the coin result.
		for (let i = 0; i < 5; ++i) {
			let coin = await game.gameCoinData.call(gameId, i);
			assert.equal(coin[1], startExRate[i]); // startExRate
			assert.ok(coin[2] != 0);               // timeStampOfStartExRate
			assert.equal(coin[3], endExRate[i]);   // endExRate
			assert.ok(coin[4] != 0);               // timeStampOfEndExRate
		}
		
		// Test the game state.
		let gameState = await game.gameState.call(gameId);
		assert.equal(gameState, 6); // Close state.
		
		// Test the winners.
		let numberOfWinnerCoinIds = await game.gameNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(2));
		
		let winnerId = await game.gameWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));
		
		winnerId = await game.gameWinnerCoinIds.call(gameId, 1);
		assert.ok(winnerId.eq(4));
		
		// Calculate awards.
		let gameData = await game.games.call(gameId);
		
		let A = gameData[8];
		let B = gameData[9];
		
		let oneHundred = web3.toBigNumber("100");
		
		let totalAwards = web3.toBigNumber(web3.toWei(99500, "microether"));
		totalAwards = totalAwards.dividedToIntegerBy(web3.toBigNumber("2"));
		
		let bet0 = web3.toBigNumber(web3.toWei(29850, "microether")); 
		let bet1 = web3.toBigNumber(web3.toWei(19900, "microether"));
		let bet2 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		let bet4 = web3.toBigNumber(web3.toWei(9950, "microether")); 
		
		let awardsOfB = totalAwards.mul(B).dividedToIntegerBy(oneHundred); 
		
		let awards0 = totalAwards.mul(A).dividedToIntegerBy(oneHundred);
		let awards1 = awardsOfB.mul(bet1).dividedToIntegerBy(bet1.add(bet2));
		let awards2 = awardsOfB.mul(bet2).dividedToIntegerBy(bet1.add(bet2));
		let awards3 = totalAwards;
		
		let highestAwards = totalAwards.sub(awards0).sub(awardsOfB);
		awards0 = awards0.add(highestAwards);
		
		// Get calculated awards.
		let awardsFromContract0 = await game.calculateAwardAmount(gameId, {from: accounts[7]});
		let awardsFromContract1 = await game.calculateAwardAmount(gameId, {from: accounts[8]});
		let awardsFromContract2 = await game.calculateAwardAmount(gameId, {from: accounts[9]});
		let awardsFromContract3 = await game.calculateAwardAmount(gameId, {from: accounts[4]});
		
		assert.ok(awardsFromContract0.eq(awards0));
		assert.ok(awardsFromContract1.eq(awards1));
		assert.ok(awardsFromContract2.eq(awards2));
		assert.ok(awardsFromContract3.eq(awards3));
		
		// Get balance at beginning.
		let balanceBegin0 = await getBalance(accounts[7]);
		let balanceBegin1 = await getBalance(accounts[8]);
		let balanceBegin2 = await getBalance(accounts[9]);
		let balanceBegin3 = await getBalance(accounts[4]);
		
		// Withdraw.
		await game.getAwards(gameId, {from: accounts[7]});
		await game.getAwards(gameId, {from: accounts[8]});
		await game.getAwards(gameId, {from: accounts[9]});
		await game.getAwards(gameId, {from: accounts[4]});
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		let balanceFinal1 = await getBalance(accounts[8]);
		let balanceFinal2 = await getBalance(accounts[9]);
		let balanceFinal3 = await getBalance(accounts[4]);
		
		assert.ok(balanceBegin0.add(awards0).sub(balanceFinal0).lte(threshold));
		assert.ok(balanceBegin1.add(awards1).sub(balanceFinal1).lte(threshold));
		assert.ok(balanceBegin2.add(awards2).sub(balanceFinal2).lte(threshold));
		assert.ok(balanceBegin3.add(awards3).sub(balanceFinal3).lte(threshold));
	});
	
	it("Game - No winners. Total bets are equal.", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Get game id.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// Bets.
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[7]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
		await game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]});
		await game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]});
		await game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]});
	
		// Close the game.
		let endExRate = [100 // 0%
			, 220 // 10%
			, 300 // 0%
			, 360 // -10%
			, 600]; // 20%
		await game.setEndExRate(gameId, endExRate);
		await game.setY(gameId, 10);
		await game.close(gameId, {from: accounts[0], gasLimit: 371211});
		
		// Test the game state.
		let gameState = await game.gameState.call(gameId);
		assert.equal(gameState, 3); // Open state.
		
		// Test the winners.
		let numberOfWinnerCoinIds = await game.gameNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(0));
	});
	
	it("Game - No winners. Every coins are highest or smallest change rate.", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Test is closed.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// Bets.
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[7]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
		await game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]});
		await game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]});
		await game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]});
	
		// Close the game.
		let endExRate = [120 // 20%
			, 240 // 20%
			, 270 // -10%
			, 360 // -10%
			, 600]; // 20%
		await game.setEndExRate(gameId, endExRate);
		await game.setY(gameId, 10);
		await game.close(gameId, {from: accounts[0], gasLimit: 371211});
		
		// Test the game state.
		let gameState = await game.gameState.call(gameId);
		assert.equal(gameState, 3); // Open state.
		
		// Test the winners.
		let numberOfWinnerCoinIds = await game.gameNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(0));
	});
	
	it("Game - Tied on highest and samllest change rate. Only one in the rest group, sole winner, one highest bets.", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Test is closed.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// Bets.
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[7]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
		await game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]});
		await game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]});
		await game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]});
		
		// Close the game.
		let endExRate = [100 // 0%
			, 240 // 20%
			, 270 // -10%
			, 360 // -10%
			, 600]; // 20%
		await game.setEndExRate(gameId, endExRate);
		await game.setY(gameId, 10);
		await game.close(gameId, {from: accounts[0], gasLimit: 371211});
		
		// Test the coin result.
		for (let i = 0; i < 5; ++i) {
			let coin = await game.gameCoinData.call(gameId, i);
			assert.equal(coin[1], startExRate[i]); // startExRate
			assert.ok(coin[2] != 0);               // timeStampOfStartExRate
			assert.equal(coin[3], endExRate[i]);   // endExRate
			assert.ok(coin[4] != 0);               // timeStampOfEndExRate
		}
		
		// Test the game state.
		let gameState = await game.gameState.call(gameId);
		assert.equal(gameState, 6); // Close state.
		
		// Test the winners.
		let numberOfWinnerCoinIds = await game.gameNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.gameWinnerCoinIds.call(gameId, 0);
		assert.ok(winnerId.eq(0));
	
		// Calculate awards
		let totalAwards = web3.toBigNumber(web3.toWei(49750, "microether"));
		
		let awardsFromContract = await game.calculateAwardAmount(gameId, {from: accounts[7]});
		assert.ok(awardsFromContract.eq(totalAwards));
		
		// Get balance at beginning.
		let balanceBegin0 = await getBalance(accounts[7]);
		
		// Withdraw.
		await game.getAwards(gameId, {from: accounts[7]});
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[7]);
		
		assert.ok(balanceBegin0.add(totalAwards).sub(balanceFinal0).lte(threshold));
	});
	
	it("Game - Claim refund on error games.", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Test is closed.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// Bets.
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[7]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
		await game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]});
		await game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]});
		await game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]});
		
		// Change the game time.
		let now = Math.floor(Date.now() / 1000);
		let maxFetchingTime = await game.MAX_FETCHING_TIME_FOR_END_EXRATE.call();
		maxFetchingTime = maxFetchingTime.toNumber();
		
		await game.setOpenCloseTime(gameId, now - maxFetchingTime - 600, now - maxFetchingTime - 300);
		let gameState = await game.gameState(gameId);
		assert.equal(gameState, 7);
		
		// Claim refunds.
		let refunds = await game.calculateRefund(gameId, {from: accounts[7]});
		assert.ok(refunds.eq(web3.toWei("0.00995", "ether")));
		
		let balanceBegin0 = await getBalance(accounts[7]);
		await game.claimRefunds(gameId, {from: accounts[7]});
		let balanceFinal0 = await getBalance(accounts[7]);
		
		assert.ok(balanceBegin0.add(refunds).sub(balanceFinal0).lte(threshold));
	
		refunds = await game.calculateRefund(gameId, {from: accounts[7]}); // Clear refunds.
		assert.ok(refunds.isZero);
			
		// Owner get the unclaimed refunds.
		let maxClaimTime = await game.CLAIM_AWARD_TIME_AFTER_CLOSE.call();
		
		await game.setOpenCloseTime(gameId, now - maxClaimTime - 600, now - maxClaimTime - 300);
		refunds = await game.calculateRefund(gameId, {from: accounts[1]});
		assert.ok(refunds.isZero);
		
		let balanceBegin1 = await getBalance(accounts[0]);
		await game.getUnclaimedAward(gameId, {from: accounts[0]});
		let balanceFinal1 = await getBalance(accounts[0]);
		
		assert.ok(balanceBegin1.add(web3.toWei("0.0398", "ether")).sub(balanceFinal1).lte(threshold));
	});
    
    it("Game - Tied because on sole winner in other group.", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Test is closed.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// Bets.
		await game.bet(gameId, 0, {value: web3.toWei(10, "finney"), from: accounts[7]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
		await game.bet(gameId, 2, {value: web3.toWei(10, "finney"), from: accounts[2]});
		await game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]});
        await game.bet(gameId, 3, {value: web3.toWei(10, "finney"), from: accounts[3]});
		await game.bet(gameId, 4, {value: web3.toWei(10, "finney"), from: accounts[4]});
		
		// Close the game.
        let startExRate = [29070
			, 12025000
			, 423450
			, 4467
			, 2075000];
        await game.setStartExRate(gameId, startExRate);
            
		let endExRate = [29180
			, 12065000
			, 423790
			, 4493
			, 2087000];
		await game.setEndExRate(gameId, endExRate);
		await game.setY(gameId, 10);
		await game.close(gameId, {from: accounts[0], gasLimit: 371211});
		
		// Test the game state.
		let gameState = await game.gameState.call(gameId);
		assert.equal(gameState, 3); // Open state.
	});
    
    it("Game - Excludes two coin, sole winner in other group.", async function () {
		let game = await GamePoolTestProxy.deployed();
		
		// Test is closed.
		let numberOfGames = await game.numberOfGames.call();
		assert.ok(numberOfGames > 0);
		
		let gameId = numberOfGames - 1;
		
		// Bets.
		await game.bet(gameId, 0, {value: web3.toWei(20, "finney"), from: accounts[7]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
		await game.bet(gameId, 1, {value: web3.toWei(10, "finney"), from: accounts[1]});
        await game.bet(gameId, 3, {value: web3.toWei(40, "finney"), from: accounts[3]});
		
		// Close the game.
        let startExRate = [409625000
			, 14335000
			, 293030
			, 42809
			, 844000];
        await game.setStartExRate(gameId, startExRate);
            
		let endExRate = [406780000
			, 14665000
			, 284530
			, 41444
			, 852800];
		await game.setEndExRate(gameId, endExRate);
		await game.setY(gameId, 10);
		await game.close(gameId, {from: accounts[0], gasLimit: 371211});
		
		// Test the coin result.
		for (let i = 0; i < 5; ++i) {
			let coin = await game.gameCoinData.call(gameId, i);
			assert.equal(coin[1], startExRate[i]); // startExRate
			assert.ok(coin[2] != 0);               // timeStampOfStartExRate
			assert.equal(coin[3], endExRate[i]);   // endExRate
			assert.ok(coin[4] != 0);               // timeStampOfEndExRate
		}
		
		// Test the game state.
		let gameState = await game.gameState.call(gameId);
		assert.equal(gameState, 6); // Close state.
		
		// Test the winners.
		let numberOfWinnerCoinIds = await game.gameNumberOfWinnerCoinIds.call(gameId);
		assert.ok(numberOfWinnerCoinIds.eq(1));
		
		let winnerId = await game.gameWinnerCoinIds.call(gameId, 0);
		console.log(winnerId.toString());
        assert.ok(winnerId.eq(3));
	
		// Calculate awards
		let totalAwards = web3.toBigNumber(web3.toWei(79600, "microether"));
		
		let awardsFromContract = await game.calculateAwardAmount(gameId, {from: accounts[3]});
		assert.ok(awardsFromContract.eq(totalAwards));
		
		// Get balance at beginning.
		let balanceBegin0 = await getBalance(accounts[3]);
		
		// Withdraw.
		await game.getAwards(gameId, {from: accounts[3]});
		
		// Get balance at ending. 
		let balanceFinal0 = await getBalance(accounts[3]);
		
		assert.ok(balanceBegin0.add(totalAwards).sub(balanceFinal0).lte(threshold));
    });
});