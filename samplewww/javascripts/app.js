window.addEventListener('load', function () {
	var game;
	
	function updateTimeStamp(elementId, timeStamp) {
		if (timeStamp.getTime() == 0) {
			document.getElementById(elementId).innerHTML = "";
		} else {
			document.getElementById(elementId).innerHTML = timeStamp;
		}
	}
	
	mambaGamePool.init().then(function () {
		document.getElementById("addr").innerHTML = mambaGamePool.address;
		document.getElementById("is-inited").innerHTML = mambaGamePool.isInited;
		document.getElementById("number-of-games").innerHTML = mambaGamePool.numberOfGames;
		document.getElementById("min-bets").innerHTML = mambaGamePool.minimumBets;
		document.getElementById("tx-fee-receiver").innerHTML = mambaGamePool.txFeeReceiver;
		document.getElementById("player-address").innerHTML = mambaGamePool.playerAddress;
		
		var startBlockNumber = 0;
		function updateBetHistory() {
			mambaGamePool.getPlayerBetsHistory(startBlockNumber).then(function (history) {
				let el = document.getElementById("bet-history-table");
				for (let i = 0; i < history.length; ++i) {
					let row = el.insertRow(-1);
					row.insertCell(0).innerHTML = history[i].gameId;
					row.insertCell(1).innerHTML = history[i].coinId;
					row.insertCell(2).innerHTML = history[i].betAmount + ' ether';
					row.insertCell(3).innerHTML = history[i].txHash;
					row.insertCell(4).innerHTML = history[i].timeStamp;
					
					startBlockNumber = Math.max(startBlockNumber, history[i].blockNumber + 1);
				}
			}).catch(function (error) {
				console.error(error);
				alert(error.message);
			});
		}
		
		setInterval(updateBetHistory, 60000);
		updateBetHistory();
		
		mambaGamePool.subscribeForNewGame(function (numberOfGames) {
			document.getElementById("number-of-games").innerHTML = numberOfGames;
			document.getElementById("game-event").innerHTML += 'New Game. ' + new Date() + '</br>';
			
			var opt = document.createElement('option');
			opt.value = numberOfGames - 1;
			opt.innerHTML = numberOfGames - 1;
			document.getElementById("game-selector").add(opt);
		});
		
		let el = document.getElementById("game-selector");
		for (let i = 0; i < mambaGamePool.numberOfGames; ++i) {
			el.innerHTML += '<option vaule="' + i + '">' + i + '</option>';
		}
		
		el.addEventListener('blur', function (event) {
			event.preventDefault();
			
			let gameId = parseInt(event.currentTarget.value);
			if (typeof gameId === 'undefined') {
				return;
			}
			
			mambaGamePool.game(gameId)
			.then(function (fetchGame) {
				if (game) {
					game.close();
				} 
				
				game = fetchGame;
				document.getElementById("game-id").innerHTML = gameId;
				document.getElementById("game-open-time").innerHTML = game.openTime;
				document.getElementById("game-close-time").innerHTML = game.closeTime;
				document.getElementById("game-duration").innerHTML = game.duration;
				document.getElementById("game-y").innerHTML = game.Y;
				document.getElementById("game-a").innerHTML = game.A;
				document.getElementById("game-b").innerHTML = game.B;
				document.getElementById("game-txfee").innerHTML = game.txFee;
				document.getElementById("game-min-diff-bets").innerHTML = game.minimumDifferenceBetsForWinner;
				document.getElementById("game-state").innerHTML = game.state;
				document.getElementById("game-hidden-time").innerHTML = game.hiddenTimeLengthBeforeClose;
				document.getElementById("game-y-dist-length").innerHTML = game.YDistribution.length;
				document.getElementById("game-y-dist").innerHTML = game.YDistribution;
				
				if (game.winnerCoinIds) {
					document.getElementById("game-winner").innerHTML = game.winnerCoinIds;
				}
				
				for (let i = 0; i < game.coins.length; ++i) {
					document.getElementById("coins-" + i + "-name").innerHTML = game.coins[i].name;
					document.getElementById("coins-" + i + "-start-exrate").innerHTML = game.coins[i].startExRate;
					updateTimeStamp("coins-" + i + "-start-exrate-time", game.coins[i].timeStampOfStartExRate);
					document.getElementById("coins-" + i + "-end-exrate").innerHTML = game.coins[i].endExRate;
					updateTimeStamp("coins-" + i + "-end-exrate-time", game.coins[i].timeStampOfEndExRate);
					document.getElementById("coins-" + i + "-total-bets").innerHTML = game.coins[i].totalBets;
					document.getElementById("coins-" + i + "-largest-bets").innerHTML = game.coins[i].largestBets;
					document.getElementById("coins-" + i + "-number-of-bets").innerHTML = game.coins[i].numberOfBets;
				}
				
				game.subscribe('StateChanged', function (state) {
					if (state === 'Open') {
						document.getElementById("game-close-time").innerHTML = game.closeTime;
						document.getElementById("game-y").innerHTML = game.Y;
						for (let i = 0; i < game.coins.length; ++i) {
							document.getElementById("coins-" + i + "-start-exrate").innerHTML = game.coins[i].startExRate;
							updateTimeStamp("coins-" + i + "-start-exrate-time", game.coins[i].timeStampOfStartExRate);
							document.getElementById("coins-" + i + "-end-exrate").innerHTML = game.coins[i].endExRate;
							updateTimeStamp("coins-" + i + "-end-exrate-time", game.coins[i].timeStampOfEndExRate);
						}
						document.getElementById("bet-form-submit-btn").disabled = false;
					} else if (state === 'Ready') {
						for (let i = 0; i < game.coins.length; ++i) {
							document.getElementById("coins-" + i + "-start-exrate").innerHTML = game.coins[i].startExRate;
							updateTimeStamp("coins-" + i + "-start-exrate-time", game.coins[i].timeStampOfStartExRate);
						}
						document.getElementById("bet-form-submit-btn").disabled = true;
					} else if (state === 'WaitToClose') {
						for (let i = 0; i < game.coins.length; ++i) {
							document.getElementById("coins-" + i + "-end-exrate").innerHTML = game.coins[i].endExRate;
							updateTimeStamp("coins-" + i + "-end-exrate-time", game.coins[i].timeStampOfEndExRate);
						}
						document.getElementById("game-y").innerHTML = game.Y;
						document.getElementById("bet-form-submit-btn").disabled = true;
					} else if (state === 'Closed') {
						
						if (game.winnerCoinIds) {
							document.getElementById("game-winner").innerHTML = game.winnerCoinIds;
						}
						
						document.getElementById("bet-form-submit-btn").disabled = true;
						game.calculateAwards().then(function (awards) {
							document.getElementById("unclaimed-awards").innerHTML = awards;
							if (Number.parseFloat(awards) != 0) {
								document.getElementById("get-awards").disabled = false;
							}
						}).catch(function (error) {
							console.error(error);
							alert(error.message);
						});
					} else {
						document.getElementById("bet-form-submit-btn").disabled = true;
					}
					
					document.getElementById("game-state").innerHTML = state;
					document.getElementById("game-event").innerHTML += '"StateChanged" ' + state + ' ' + new Date() + '</br>';
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
					if (playerAddress == mambaGamePool.playerAddress) {
						game.calculateAwards().then(function (awards) {
							document.getElementById("unclaimed-awards").innerHTML = awards;
						}).catch(function (error) {
							console.error(error);
							alert(error.message);
						});
					}
				});
				
				game.subscribe('ExrateUpdated', function (coinId, exrate) {
					document.getElementById("coins-" + coinId + "-current-exrate").innerHTML = exrate;
					let value = (game.coins[coinId].startExRate - exrate) * 100 / game.coins[coinId].startExRate;
					document.getElementById("coins-" + coinId + "-current-value").innerHTML = value.toFixed(2) + '%';
				});
				
				if (game.state === 'Open') {
					document.getElementById("bet-form-submit-btn").disabled = false;
				} else {
					document.getElementById("bet-form-submit-btn").disabled = true;
				}
				
				return game.calculateAwards();
			}).then(function (awards) {
				document.getElementById("unclaimed-awards").innerHTML = awards;
				if (Number.parseFloat(awards) != 0) {
					document.getElementById("get-awards").disabled = false;
				}
			}).catch(function (error) {
				console.error(error);
				alert(error.message);
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
		
		document.getElementById("get-awards").addEventListener('click', function (event) {
			event.preventDefault();
			if (game) {
				game.getAwards().then(function () {
					document.getElementById("unclaimed-awards").innerHTML = 0;
					document.getElementById("get-awards").disabled = true;
				}).catch(function (error) {
					console.error(error);
					alert(error.message);
				});
			}
		});
		
	}).catch(function (error) {
		console.error(error);
		alert(error.message);
	});
	
});

