window.addEventListener('load', function () {
	var game;
	
	function updateTimeStamp(elementId, timeStamp) {
		if (timeStamp.getTime() == 0) {
			document.getElementById(elementId).innerHTML = "";
		} else {
			document.getElementById(elementId).innerHTML = timeStamp;
		}
	}
	
	// Initialize the mambaGamePool. This function MUST be called before most operations.
	mambaGamePool.init().then(function () {
		
		// The smart contract address on ethereum.
		document.getElementById("addr").innerHTML = mambaGamePool.address;
		
		// The initialization status of mambaGamePool.
		document.getElementById("is-inited").innerHTML = mambaGamePool.isInited;
		
		// Number of games recorded in the game pool, including closed and ongoing games.
		document.getElementById("number-of-games").innerHTML = mambaGamePool.numberOfGames;
		
		// The minimum bets amount (in ether) which player must send in a single bet.
		// Smart contract will reject if the given bet amount was less than this value.
		document.getElementById("min-bets").innerHTML = mambaGamePool.minimumBets;
		
		// The wallet address which receives the transaction fee.
		document.getElementById("tx-fee-receiver").innerHTML = mambaGamePool.txFeeReceiver;
		
		// Wallet address of current player, which is also the current addres in MetaMask.
		document.getElementById("player-address").innerHTML = mambaGamePool.playerAddress;
		
		// This function queries the bet history of the current player with an argument `startBlockNumber`.
		// The `startBlockNumber` is the earliest block number which we search the bet history from the Ethereum
		// block chain. We will search the history until the most recent block. Developer can record and update 
		// this value to avoid duplicate searching. 
		
		// 0 means the first block of the Ethereum blockchain.
		var startBlockNumber = 0;
		function updateBetHistory() {
			mambaGamePool.getPlayerBetsHistory(startBlockNumber).then(function (history) {
				let el = document.getElementById("bet-history-table");
				for (let i = 0; i < history.length; ++i) {
					let row = el.insertRow(-1);
					
					// Game id of the searched bet record.
					row.insertCell(0).innerHTML = history[i].gameId;
					
					// Coin id of the searched bet record.
					row.insertCell(1).innerHTML = history[i].coinId;
					
					// Bet amount of the searched bet record.
					row.insertCell(2).innerHTML = history[i].betAmount + ' ether';
					
					// Transaction hash of the bet. 
					row.insertCell(3).innerHTML = history[i].txHash;
					
					// The timestamp of mined block which records the bet transaction.
					row.insertCell(4).innerHTML = history[i].timeStamp;
					
					// Update this value to avoid duplicate searching. Developer can also
					// record this value in database.
					startBlockNumber = Math.max(startBlockNumber, history[i].blockNumber + 1);
				}
			}).catch(function (error) {
				console.error(error);
				alert(error.message);
			});
		}
		
		// Keeps update the bet history every 10 minutes.
		setInterval(updateBetHistory, 60000);
		
		// The first load of bet history.
		updateBetHistory();
		
		// Subscribe an event which will trigger when the Mamba Team has created a new game
		// in game pool. The callback function will get a parameter `numberOfGames` which 
		// means the latest total number of games in game pool. The id the created game 
		// is `numberOfGames - 1`.
		mambaGamePool.subscribeForNewGame(function (numberOfGames) {
			document.getElementById("number-of-games").innerHTML = numberOfGames;
			document.getElementById("game-event").innerHTML += 'New Game. ' + new Date() + '</br>';
			
			// Update the drop-down menu to select games.
			var opt = document.createElement('option');
			opt.value = numberOfGames - 1;
			opt.innerHTML = numberOfGames - 1;
			document.getElementById("game-selector").add(opt);
		});
		
		let el = document.getElementById("game-selector");
		for (let i = 0; i < mambaGamePool.numberOfGames; ++i) {
			el.innerHTML += '<option vaule="' + i + '">' + i + '</option>';
		}
		
		// When player selected a game.
		el.addEventListener('blur', function (event) {
			event.preventDefault();
			
			let gameId = parseInt(event.currentTarget.value);
			if (typeof gameId === 'undefined' || isNaN(gameId) || (game && gameId == game.id)) {
				return;
			}
			
			// Get the game instance. We use async function because we have to query all
			// game information from blockchain and the blockchain query is async.
			mambaGamePool.game(gameId)
			.then(function (fetchGame) {
				
				// Close the previous selected game. Please remember to close unused game to avoid
				// any unwanted callback. 
				if (game) {
					game.close();
				} 
				
				// Get the game parameters.
				game = fetchGame;				
				document.getElementById("game-id").innerHTML = gameId;
				document.getElementById("game-open-time").innerHTML = game.openTime;
				document.getElementById("game-close-time").innerHTML = game.closeTime;
				document.getElementById("game-duration").innerHTML = game.duration;
				document.getElementById("game-fetch-endexrate").innerHTML = new Date(game.closeTime.getTime() + game.maximumFetchingTimeForEndExRate);
				document.getElementById("game-claim-time").innerHTML = new Date(game.closeTime.getTime() + game.claimAwardTimeAfterClose);
				document.getElementById("game-y").innerHTML = game.Y;
				document.getElementById("game-a").innerHTML = game.A;
				document.getElementById("game-b").innerHTML = game.B;
				document.getElementById("game-txfee").innerHTML = game.txFee;
				document.getElementById("game-min-diff-bets").innerHTML = game.minimumDifferenceBetsForWinner;
				document.getElementById("game-state").innerHTML = game.state;
				document.getElementById("game-hidden-time").innerHTML = game.hiddenTimeLengthBeforeClose;
				document.getElementById("game-y-dist-length").innerHTML = game.YDistribution.length;
				document.getElementById("game-y-dist").innerHTML = game.YDistribution;
				
				// The winner coins ids of the selected game.
				if (game.winnerCoinIds) {
					document.getElementById("game-winner").innerHTML = game.winnerCoinIds;
				}
				
				// Get coin data.
				for (let i = 0; i < game.coins.length; ++i) {
					document.getElementById("coins-" + i + "-name").innerHTML = game.coins[i].name;
					document.getElementById("coins-" + i + "-start-exrate").innerHTML = game.coins[i].startExRate;
					updateTimeStamp("coins-" + i + "-start-exrate-time", game.coins[i].timeStampOfStartExRate);
					document.getElementById("coins-" + i + "-end-exrate").innerHTML = game.coins[i].endExRate;
					updateTimeStamp("coins-" + i + "-end-exrate-time", game.coins[i].timeStampOfEndExRate);
					document.getElementById("coins-" + i + "-total-bets").innerHTML = game.coins[i].totalBets;
					document.getElementById("coins-" + i + "-largest-bets").innerHTML = game.coins[i].largestBets;
					document.getElementById("coins-" + i + "-number-of-bets").innerHTML = game.coins[i].numberOfBets;
					
					if (0 != game.coins[i].endExRate) {
						document.getElementById("coins-" + i + "-current-value").innerHTML 
							= (100 * (game.coins[i].endExRate - game.coins[i].startExRate) / game.coins[i].startExRate).toFixed(2) + '%';
					} else {
						document.getElementById("coins-" + i + "-current-value").innerHTML = "";
					}
				}
				
				// Subscribe an event for on game state changed. The detail explanation please goto https://github.com/YSYouJack/MambaGame/blob/master/doc/GamePool_Contract_Operations.md .
				game.subscribe('StateChanged', function (state) {
					
					if (state === 'Open') {
						// Please update the `closeTime`, `startExRate`, `timeStampOfStartExRate`, `endExRate` 
						// and the `timeStampOfEndExRate` because these values may changed when game goes 
						// to `Open` state from other game states.
						
						document.getElementById("game-close-time").innerHTML = game.closeTime;
						document.getElementById("game-fetch-endexrate").innerHTML = new Date(game.closeTime.getTime() + game.maximumFetchingTimeForEndExRate);
						document.getElementById("game-claim-time").innerHTML = new Date(game.closeTime.getTime() + game.claimAwardTimeAfterClose);
						document.getElementById("game-y").innerHTML = game.Y;
						for (let i = 0; i < game.coins.length; ++i) {
							document.getElementById("coins-" + i + "-start-exrate").innerHTML = game.coins[i].startExRate;
							updateTimeStamp("coins-" + i + "-start-exrate-time", game.coins[i].timeStampOfStartExRate);
							document.getElementById("coins-" + i + "-end-exrate").innerHTML = game.coins[i].endExRate;
							updateTimeStamp("coins-" + i + "-end-exrate-time", game.coins[i].timeStampOfEndExRate);
							
							if (0 != game.coins[i].endExRate) {
								document.getElementById("coins-" + i + "-current-value").innerHTML 
									= (100 * (game.coins[i].endExRate - game.coins[i].startExRate) / game.coins[i].startExRate).toFixed(2) + '%';
							} else {
								document.getElementById("coins-" + i + "-current-value").innerHTML = "";
							}
						}
						
						// Player can only bets in `Open` state.
						document.getElementById("bet-form-submit-btn").disabled = false;
					} else if (state === 'Ready') {
						
						// Please update the `startExRate`, and `timeStampOfStartExRate`.
						for (let i = 0; i < game.coins.length; ++i) {
							document.getElementById("coins-" + i + "-start-exrate").innerHTML = game.coins[i].startExRate;
							updateTimeStamp("coins-" + i + "-start-exrate-time", game.coins[i].timeStampOfStartExRate);
						}
						document.getElementById("bet-form-submit-btn").disabled = true;
					} else if (state === 'WaitToClose') {
						
						// Please update the `endExRate`, and `timeStampOfEndExRate`.
						for (let i = 0; i < game.coins.length; ++i) {
							document.getElementById("coins-" + i + "-end-exrate").innerHTML = game.coins[i].endExRate;
							updateTimeStamp("coins-" + i + "-end-exrate-time", game.coins[i].timeStampOfEndExRate);
							
							if (0 != game.coins[i].endExRate) {
								document.getElementById("coins-" + i + "-current-value").innerHTML 
									= (100 * (game.coins[i].endExRate - game.coins[i].startExRate) / game.coins[i].startExRate).toFixed(2) + '%';
								document.getElementById("coins-" + i + "-current-exrate").innerHTML = "";
							} else {
								document.getElementById("coins-" + i + "-current-value").innerHTML = "";
								document.getElementById("coins-" + i + "-current-exrate").innerHTML = "";
							}
						}
						document.getElementById("game-y").innerHTML = game.Y;
						document.getElementById("bet-form-submit-btn").disabled = true;
					} else if (state === 'Closed') {
						
						// Please update the `winnerCoinIds`.
						if (game.winnerCoinIds) {
							document.getElementById("game-winner").innerHTML = game.winnerCoinIds;
						}
						
						// Calculate the awards amount of the player.
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
					} else if (state === 'Error') {
						document.getElementById("bet-form-submit-btn").disabled = true;
						game.calculateRefunds().then(function (awards) {
							document.getElementById("unclaimed-refunds").innerHTML = awards;
							if (Number.parseFloat(awards) != 0) {
								document.getElementById("get-refunds").disabled = false;
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
				
				// Subscribe the event of when any players bets successfully. Please don't use this 
				// callback to record the bet history of current player, because this event will not 
				// be fired if the game was in hidden period before game stops.
				game.subscribe('Bet', function (coinId, playerAddress, bets) {
					document.getElementById("game-event").innerHTML += '"Bet", ' + bets + ' ether from ' + playerAddress + '. ' + new Date() + '</br>';
					document.getElementById("coins-" + coinId + "-total-bets").innerHTML = game.coins[coinId].totalBets;
					document.getElementById("coins-" + coinId + "-number-of-bets").innerHTML = game.coins[coinId].numberOfBets;
				});
				
				// Subscribe the event of when the largest bet of any coin has changed. This event 
				// will not be fired if the game was in hidden period before game stops.
				game.subscribe('LargestBetChanged', function (coinId, bets) {
					document.getElementById("game-event").innerHTML += '"LargestBetChanged", ' + bets + ' ehter. ' + new Date() + '</br>';
					document.getElementById("coins-" + coinId + "-largest-bets").innerHTML = bets;
				});
				
				// Subscribe the event of when any awards has been sent to players.
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
				
				// Subscribe the event of current exchange rate from Binance. This event will not be fired 
				// after the start time of the hidden period, and in `Stop`, `WaitToClose`, and `Close` states.
				game.subscribe('ExrateUpdated', function (coinId, exrate) {
					document.getElementById("coins-" + coinId + "-current-exrate").innerHTML = exrate;
					let value = (exrate - game.coins[coinId].startExRate) * 100 / game.coins[coinId].startExRate;
					document.getElementById("coins-" + coinId + "-current-value").innerHTML = value.toFixed(2) + '%';
				});
				
				if (game.state === 'Open') {
					document.getElementById("bet-form-submit-btn").disabled = false;
				} else {
					document.getElementById("bet-form-submit-btn").disabled = true;
				}
				
				// Calculate awards.
				return game.calculateAwards();
			}).then(function (awards) {
				document.getElementById("unclaimed-awards").innerHTML = awards;
				if (Number.parseFloat(awards) != 0) {
					document.getElementById("get-awards").disabled = false;
				}
				return game.calculateRefunds();
			}).then(function (awards) {
				document.getElementById("unclaimed-refunds").innerHTML = awards;
				if (Number.parseFloat(awards) != 0) {
					document.getElementById("get-refunds").disabled = false;
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
		
		// Get awards from this game.
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
		
		// Get refunds from this game.
		document.getElementById("get-refunds").addEventListener('click', function (event) {
			event.preventDefault();
			if (game) {
				game.getRefunds().then(function () {
					document.getElementById("unclaimed-refunds").innerHTML = 0;
					document.getElementById("get-refunds").disabled = true;
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

