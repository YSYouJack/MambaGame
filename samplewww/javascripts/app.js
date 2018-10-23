window.addEventListener('load', function () {
	var game;
	
	mambaGameManager.init().then(function () {
		document.getElementById("manager-addr").innerHTML = mambaGameManager.address;
		document.getElementById("manager-is-inited").innerHTML = mambaGameManager.isInited;
		document.getElementById("number-of-games").innerHTML = mambaGameManager.numberOfGames;
		
		mambaGameManager.subscribeForNewGame(function (numberOfGames) {
			document.getElementById("number-of-games").innerHTML = numberOfGames;
			document.getElementById("game-event").innerHTML += 'New Game. ' + new Date() + '</br>';
			
			var opt = document.createElement('option');
			opt.value = numberOfGames - 1;
			opt.innerHTML = numberOfGames - 1;
			document.getElementById("game-selector").add(opt);
		});
		
		let el = document.getElementById("game-selector");
		for (let i = 0; i < mambaGameManager.numberOfGames; ++i) {
			el.innerHTML += '<option vaule="' + i + '">' + i + '</option>';
		}
		
		el.addEventListener('blur', function (event) {
			event.preventDefault();
			
			let gameId = parseInt(event.currentTarget.value);
			if (typeof gameId === 'undefined') {
				return;
			}
			
			mambaGameManager.game(gameId)
			.then(function (fetchGame) {
				if (game) {
					game.unsubscribe('Extended');
					game.unsubscribe('Closed');
					game.unsubscribe('Bet');
					game.unsubscribe('LargestBetChanged');
					game.unsubscribe('SendAwards');
					game.unsubscribe('ExrateUpdated');
				} 
				
				game = fetchGame;
				document.getElementById("game-id").innerHTML = gameId;
				document.getElementById("game-addr").innerHTML = game.address;
				document.getElementById("game-open-time").innerHTML = game.openTime;
				document.getElementById("game-close-time").innerHTML = game.closeTime;
				document.getElementById("game-duration").innerHTML = game.duration;
				document.getElementById("game-a").innerHTML = game.A;
				document.getElementById("game-b").innerHTML = game.B;
				document.getElementById("game-txfee").innerHTML = game.txFee;
				document.getElementById("game-min-diff-bets").innerHTML = game.minimumDifferenceBetsForWinner;
				document.getElementById("game-time-start-exrate").innerHTML = game.timeStampOfStartRate;
				document.getElementById("game-time-end-exrate").innerHTML = game.timeStampOfEndRate;
				document.getElementById("game-isclosed").innerHTML = game.isClosed;
				document.getElementById("game-min-bets").innerHTML = game.minimumBets;
				document.getElementById("game-hidden-time").innerHTML = game.hiddenTimeLengthBeforeClose;
				document.getElementById("game-wallet").innerHTML = game.teamWallet;
				document.getElementById("game-y-dist-length").innerHTML = game.YDistribution.length;
				document.getElementById("game-y-dist").innerHTML = game.YDistribution;
				
				if (game.winnerCoinIds) {
					document.getElementById("game-winner").innerHTML = game.winnerCoinIds;
				}
				
				for(let i = 0; i < game.coins.length; ++i) {
					document.getElementById("coins-" + i + "-name").innerHTML = game.coins[i].name;
					document.getElementById("coins-" + i + "-start-exrate").innerHTML = game.coins[i].startExRate;
					document.getElementById("coins-" + i + "-end-exrate").innerHTML = game.coins[i].endExRate;
					document.getElementById("coins-" + i + "-total-bets").innerHTML = game.coins[i].totalBets;
					document.getElementById("coins-" + i + "-largest-bets").innerHTML = game.coins[i].largestBets;
					document.getElementById("coins-" + i + "-number-of-bets").innerHTML = game.coins[i].numberOfBets;
				}
				
				game.subscribe('Extended', function (closeTime) {
					document.getElementById("game-event").innerHTML += '"Extended" ' + new Date() + '</br>';
					document.getElementById("game-close-time").innerHTML = closeTime;
				});
				
				game.subscribe('Closed', function () {
					document.getElementById("game-event").innerHTML += '"Closed" ' + new Date() + '</br>';
					document.getElementById("game-time-end-exrate").innerHTML = game.timeStampOfEndRate;;
					for(let i = 0; i < game.coins.length; ++i) {
						document.getElementById("coins-" + i + "-end-exrate").innerHTML = game.coins[i].endExRate;
					}
					document.getElementById("game-winner").innerHTML = game.winnerCoinIds;
				});
				
				game.subscribe('Bet', function (coinId, playerAddress, bets) {
					document.getElementById("game-event").innerHTML += '"Bet", ' + bets + ' ether from ' + playerAddress + '. ' + new Date() + '</br>';
					document.getElementById("coins-" + coinId + "-total-bets").innerHTML = game.coins[coinId].totalBets;
					document.getElementById("coins-" + coinId + "-number-of-bets").innerHTML = game.coins[coinId].numberOfBets;
				});
				
				game.subscribe('LargestBetChanged', function (coinId, bets) {
					document.getElementById("game-event").innerHTML += '"LargestBetChanged", ' + bets + ' ehter. ' + new Date() + '</br>';
					document.getElementById("coins-" + coinId + "-largest-bets").innerHTML = bets;
				});
				
				game.subscribe('SendAwards', function (playerAddress, awards) {
					document.getElementById("game-event").innerHTML += '"SendAwards", ' + awards + ' ether to ' + playerAddress + '. ' + new Date() + '</br>';
				});
				
				game.subscribe('ExrateUpdated', function (coinId, exrate) {
					document.getElementById("coins-" + coinId + "-current-exrate").innerHTML = exrate;
				});
				
				document.getElementById("bet-form-submit-btn").disabled = false;
			});
		});
		
		document.getElementById("bet-form").addEventListener('submit', function (event) {
			event.preventDefault();
			let coinId = document.getElementById("coin-id-selector").value;
			let bets = document.getElementById("bet-amount").value;
			if (game) {
				game.bet(coinId, bets).then(function () {
					console.log("Bets on " + coinId + ".");
				}).catch(console.error);
			}
		});
	}).catch(console.error);
	
});

