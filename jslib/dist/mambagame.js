"use strict";

(function(global, factory){
	if (typeof exports === 'object' && typeof module !== 'undefined') {
		module.exports = factory();
	} else if (typeof define === 'function' && define.amd) {
		define(factory);
	} else {
		global.mambaGameManager = factory();
	}
}(this, function(){
	
	// Mamba game definition.
	function MambaGame(id) {
		this.id = id;
		
		this.cb = {'Extended': null
			, 'Closed': null
			, 'Bet': null
			, 'LargestBetChanged': null
			, 'SendAwards': null
			, 'ExrateUpdated': null
		};
	}
	
	MambaGame.prototype.initBlockNumber = null;
	MambaGame.prototype.contract = null;
	MambaGame.prototype.minimumBets = null;
	MambaGame.prototype.hiddenTimeLengthBeforeClose = null;
	MambaGame.prototype.teamWallet = null;
	MambaGame.prototype.fetchConstantValue = function() {
		// Get reference of this.
		var obj;
		obj = this;
	
		return new Promise(function (resolve, reject) {
			obj.contract.gameData(obj.id, function (error, result) {
				if (error) {
					reject(error);
				} else {
					obj.openTime = new Date(1000 * result[1].toNumber());
					obj.closeTime = new Date(1000 * result[2].toNumber());
					obj.duration = 1000 * result[3].toNumber();
					obj.Y = result[4].toNumber();
					obj.A = result[5].toNumber();
					obj.B = result[6].toNumber();
					obj.txFee = result[7].toNumber() / 10;
					obj.minimumDifferenceBetsForWinner = web3.fromWei(result[8].toString(), 'ether');
					obj.timeStampOfStartRate = new Date(1000 * result[9].toNumber());
					if (!result[10].isZero()) {
						obj.timeStampOfEndRate = new Date(1000 * result[10].toNumber());
					}			
					
					obj.isClosed = result[11];
					resolve();
				}
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.getGameYDistribution(obj.id, function (error, result) {
					if (error) {
						reject(error);
					} else {
						obj.YDistribution = result;
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.getGameCoinData(obj.id, function (error, result) {
					if (error) {
						reject(error);
					} else {
						obj.coins = new Array(5);
						for (let i = 0; i < 5; ++i) {
							obj.coins[i] = { name: result[i]
								, startExRate: result[5][i].toNumber() / 100
								, currentExRate: result[5][i].toNumber() / 100
								, endExRate: result[6][i].toNumber() / 100
							};
						}
						resolve();
					}
				});
			});
		}).then(function () {
			let promises = [];
			for (let i = 0; i < 5; ++i) {
				promises.push(new Promise(function (resolve, reject) {
					obj.contract.getGameBetData(obj.id, i, function (error, result) {
						if (error) {
							reject(error);
						} else {
							resolve(result);
						}
					});
				}));
			}
			
			return Promise.all(promises).then(function (values) {
				for (let i = 0; i < 5; ++i) {
					obj.coins[i].totalBets = web3.fromWei(values[i][0].toString(), 'ether');
					obj.coins[i].largestBets = web3.fromWei(values[i][1].toString(), 'ether');
					obj.coins[i].numberOfBets = values[i][2].toNumber();
				}
				
				return Promise.resolve();
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.getNumberOfWinnerCoinIds(obj.id, function (error, result) {
					if (error) {
						reject(error);
					} else {
						resolve(result.toNumber());
					}
				});
			});
		}).then(function (numberOfWinnerCoinIds) {
			if (0 == numberOfWinnerCoinIds) {
				return Promise.resolve();
			} else {
				let promises = [];
				for (let i = 0; i < numberOfWinnerCoinIds; ++i) {
					promises.push(new Promise(function (resolve, reject) {
						obj.contract.getWinnerCoinIds(obj.id, i, function(error, result) {
							if (error) {
								reject(error);
							} else {
								resolve(result.toNumber());
							}
						});
					}));
				}
				
				return Promise.all(promises).then(function (values) {
					obj.winnerCoinIds = values;
					return Promise.resolve();
				});
			}
		}).then(function () {
			let extendEvent = obj.contract.Extended({gameId: obj.id}, {fromBlock: 'latest'});
			extendEvent.watch(function(error, result) {
				if (!error) {
					if (result.blockNumber > obj.initBlockNumber) {
						obj.callbackForExtended();
					}
				} else {
					console.error(error);
				}
			});
			
			let closedEvent = obj.contract.Closed({gameId: obj.id}, {fromBlock: 'latest'});
			closedEvent.watch(function(error, result) {
				if (!error) {
					if (result.blockNumber > obj.initBlockNumber) {
						obj.callbackForClosed();
					}
				} else {
					console.error(error);
				}
			});
			
			let coinBetEvent = obj.contract.CoinBet({gameId: obj.id}, {fromBlock: 'latest'});
			coinBetEvent.watch(function(error, result) {
				if (!error) {
					if (result.blockNumber > obj.initBlockNumber) {
						obj.callbackForCoinBet(result.args.coinId.toNumber(), result.args.player, result.args.bets);
					}
				} else {
					console.error(error);
				}
			});
			
			let coinLargestBetEvent = obj.contract.CoinLargestBet({gameId: obj.id}, {fromBlock: 'latest'});
			coinLargestBetEvent.watch(function(error, result) {
				if (!error) {
					if (result.blockNumber > obj.initBlockNumber) {
						obj.callbackForCoinLargestBet(result.args.coinId.toNumber(), result.args.bets);
					}
				} else {
					console.error(error);
				}
			});
			
			let sendAwardsBetEvent = obj.contract.SendAwards({gameId: obj.id}, {fromBlock: 'latest'});
			sendAwardsBetEvent.watch(function(error, result) {
				if (!error) {
					if (result.blockNumber > obj.initBlockNumber) {
						obj.callbackForSendAwards(result.args.player, result.args.awards);
					}
				} else {
					console.error(error);
				}
			});
			
			function openBinanceWss() {
				var wsUrl = "wss://stream.binance.com:9443/stream?streams=";
				for (let i = 0; i < obj.coins.length; ++i) {
					if (i != 0) {
						wsUrl += '/';
					}
					wsUrl += obj.coins[i].name.toLowerCase() + 'usdt@miniTicker';
				}
				
				var ws = new WebSocket(wsUrl);
				
				ws.onopen = function () {
					console.log("Websocket connected to binance.");
				}
				
				ws.onmessage = function(event) {
					let msg = JSON.parse(event.data);
					for (let i = 0; i < obj.coins.length; ++i) {
						let symbol = obj.coins[i].name.toUpperCase() + 'USDT';
						if (symbol === msg.data.s) {
							obj.callbackForUpdateExrate(i, Number.parseFloat(msg.data.c));
							break;
						}
					}
				};
			
				ws.onclose = function() {
					console.log("Websocket closed on connection to binance");
					ws.removeAllListeners();
					ws = openBinanceWss();
				};
			
				ws.onerror = function(error) {
					console.log("Websocket errro: " + error);
					ws.removeAllListeners();
					ws = openBinanceWss();
				};
				
				return ws;
			}
			
			
			openBinanceWss();
			
		}).catch(function (error) {
			if (obj.teamWallet) {
				delete obj.teamWallet;
			}
			
			if (obj.hiddenTimeLengthBeforeClose) {
				delete obj.hiddenTimeLengthBeforeClose;
			}
			
			if (obj.minimumBets) {
				delete obj.minimumBets;
			}
			
			if (obj.isClosed) {
				delete obj.isClosed;
			}
			
			if (obj.timeStampOfStartRate) {
				delete obj.timeStampOfStartRate;
			}
			
			if (obj.minimumDifferenceBetsForWinner) {
				delete obj.minimumDifferenceBetsForWinner;
			}
			
			if (obj.txFee) {
				delete obj.txFee;
			}
			
			if (obj.B) {
				delete obj.B;
			}
			
			if (obj.A) {
				delete obj.A;
			}
			
			if (obj.duration) {
				delete obj.duration;
			}
			
			if (obj.closeTime) {
				delete obj.closeTime;
			}
			
			if (obj.openTime) {
				delete obj.openTime;
			}
			
			if (obj.coins) {
				delete obj.coins;
			}
			
			return Promise.reject(error);
		});
	};
	
	MambaGame.prototype.bet = function (coinId, betsInEther) {
		var obj;
		obj = this;
		
		console.log("bet" + new Date);
		
		return new Promise(function (resolve, reject) {
			let now = new Date();
			if (now < obj.openTime) {
				reject("The game is not opened yet!");
			} else if (now > obj.closeTime) {
				reject("The game was closed!");
			} else if (coinId < 0 || coinId >= obj.coins.length) {
				reject("Coin id is out of range.");
			} else {
				let betsInWei = web3.toBigNumber(web3.toWei(betsInEther, 'ether'));
				let minBets = web3.toBigNumber(web3.toWei(obj.minimumBets, 'ether'));
				
				if (minBets > betsInWei) {
					reject("Your bets amount is less than mininum bets.");
				} else {
					obj.contract.bet(obj.id, coinId, {value: betsInWei}, function(error, result) {
						if (error) {
							reject(error);
						} else {
							resolve();
						}
					});
				}
			}
		});
	}
	
	MambaGame.prototype.subscribe = function (eventType, callbackFn) {
		if (eventType in this.cb) {
			if (!this.cb[eventType]) {
				this.cb[eventType] = callbackFn;
			} else {
				throw new Error("Already has an existing subscribe.");
			}
		} else {
			throw new Error("Unknown event type " + eventType + ".");
		}
	}
	
	MambaGame.prototype.unsubscribe = function (eventType) {
		if (eventType in this.cb) {
			this.cb[eventType] = null;
		} else {
			throw new Error("Unknown event type " + eventType + ".");
		}
	}
	
	MambaGame.prototype.callbackForExtended = function () {
		this.closeTime = new Date(this.closeTime.getTime() + this.duration);
		var closeTime = this.closeTime;
		console.log(closeTime);
		if (this.cb['Extended']) {
			this.cb['Extended'](closeTime);
		}
	}
	
	MambaGame.prototype.callbackForClosed = function () {
		this.isClosed = true;
		
		var obj;
		obj = this;
		
		new Promise(function (resolve, reject) {
			obj.contract.gameData(obj.id, function (error, result) {
				if (error) {
					reject(error);
				} else {
					obj.timeStampOfEndRate = new Date(1000 * result[10].toNumber());			
					obj.isClosed = true;
					resolve();
				}
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.getGameCoinData(obj.id, function (error, result) {
					if (error) {
						reject(error);
					} else {
						for (let i = 0; i < 5; ++i) {
							obj.coins[i].endExRate = result[6][i].toNumber() / 100;
						}
						resolve();
					}
				});
			});
		}).then(function (numberOfWinnerCoinIds) {
			if (0 == numberOfWinnerCoinIds) {
				return Promise.resolve();
			} else {
				let promises = [];
				for (let i = 0; i < numberOfWinnerCoinIds; ++i) {
					promises.push(new Promise(function (resolve, reject) {
						obj.contract.getWinnerCoinIds(obj.id, i, function(error, result) {
							if (error) {
								reject(error);
							} else {
								resolve(result.toNumber());
							}
						});
					}));
				}
				
				return Promise.all(promises).then(function (values) {
					obj.winnerCoinIds = values;
					return Promise.resolve();
				});
			}
		}).then(function () {
			if (obj.cb['Closed']) {
				obj.cb['Closed']();
			}
		}).catch(console.error);
	}
	
	MambaGame.prototype.callbackForCoinBet = function (id, player, bets) {
		this.coins[id].numberOfBets += 1;
		var totalBets = web3.toBigNumber(web3.toWei(this.coins[id].totalBets, 'ether'));
		totalBets = totalBets.add(bets);
		this.coins[id].totalBets = web3.fromWei(totalBets, 'ether').toString();
			
		if (this.cb['Bet']) {
			this.cb['Bet'](id
				, player
				, web3.fromWei(bets, 'ether').toString());
		}
	}
	
	MambaGame.prototype.callbackForCoinLargestBet = function (id, bets) {
		bets = web3.fromWei(bets, 'ether').toString();
		this.coins[id].largestBets = bets 
		if (this.cb['LargestBetChanged']) {
			this.cb['LargestBetChanged'](id, bets);
		}
	}
	
	MambaGame.prototype.callbackForSendAwards = function (player, awards) {
		awards = web3.fromWei(awards, 'ether').toString();
		if (this.cb['SendAwards']) {
			this.cb['SendAwards'](player, awards);
		}
	}
	
	MambaGame.prototype.callbackForUpdateExrate = function (coinId, price) {
		this.coins[coinId].currentExRate = price;
		if (this.cb['ExrateUpdated']) {
			this.cb['ExrateUpdated'](coinId, price);
		}
	}
	
	// Mamba game manager definition.
	var mambaGameManager = {
		isInited: false
		, abi: [{"constant":true,"inputs":[{"name":"_gameId","type":"uint256"},{"name":"_coinId","type":"uint256"}],"name":"getGameBetData","outputs":[{"name":"totalBets","type":"uint256"},{"name":"largestBets","type":"uint256"},{"name":"numberOfBets","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_gameId","type":"uint256"}],"name":"isBetInformationHidden","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_openTime","type":"uint256"},{"name":"_gameDuration","type":"uint256"},{"name":"_coinName0","type":"string"},{"name":"_coinName1","type":"string"},{"name":"_coinName2","type":"string"},{"name":"_coinName3","type":"string"},{"name":"_coinName4","type":"string"},{"name":"_startExRate","type":"int32[5]"},{"name":"_exRateTimeStamp","type":"uint256"},{"name":"_YDistribution","type":"uint8[50]"},{"name":"_A","type":"uint8"},{"name":"_B","type":"uint8"},{"name":"_txFee","type":"uint16"},{"name":"_minDiffBets","type":"uint256"}],"name":"createNewGame","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"HIDDEN_TIME_BEFORE_CLOSE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_gameId","type":"uint256"}],"name":"getNumberOfWinnerCoinIds","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"teamWallet","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MIN_BET","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_gameId","type":"uint256"},{"name":"_coinId","type":"uint256"}],"name":"bet","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_gameId","type":"uint256"}],"name":"getGameCoinData","outputs":[{"name":"coinName0","type":"string"},{"name":"coinName1","type":"string"},{"name":"coinName2","type":"string"},{"name":"coinName3","type":"string"},{"name":"coinName4","type":"string"},{"name":"startExRate","type":"int32[5]"},{"name":"endExRate","type":"int32[5]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_gameId","type":"uint256"},{"name":"_winnerId","type":"uint256"}],"name":"getWinnerCoinIds","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"gameData","outputs":[{"name":"id","type":"uint256"},{"name":"openTime","type":"uint256"},{"name":"closeTime","type":"uint256"},{"name":"gameDuration","type":"uint256"},{"name":"Y","type":"uint8"},{"name":"A","type":"uint8"},{"name":"B","type":"uint8"},{"name":"txFee","type":"uint16"},{"name":"minDiffBets","type":"uint256"},{"name":"timeStampOfStartRate","type":"uint256"},{"name":"timeStampOfEndRate","type":"uint256"},{"name":"isClosed","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_gameId","type":"uint256"},{"name":"_endExRate","type":"int32[5]"},{"name":"_timeStampOfEndRate","type":"uint256"}],"name":"close","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_gameId","type":"uint256"}],"name":"getGameYDistribution","outputs":[{"name":"","type":"uint8[50]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"numberOfGameData","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_teamWallet","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"gameId","type":"uint256"}],"name":"Closed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"gameId","type":"uint256"}],"name":"Extended","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"gameId","type":"uint256"},{"indexed":true,"name":"coinId","type":"uint256"},{"indexed":false,"name":"player","type":"address"},{"indexed":false,"name":"bets","type":"uint256"}],"name":"CoinBet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"gameId","type":"uint256"},{"indexed":true,"name":"coinId","type":"uint256"},{"indexed":false,"name":"bets","type":"uint256"}],"name":"CoinLargestBet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"gameId","type":"uint256"},{"indexed":false,"name":"player","type":"address"},{"indexed":false,"name":"awards","type":"uint256"}],"name":"SendAwards","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"gameId","type":"uint256"},{"indexed":false,"name":"teamWallet","type":"address"},{"indexed":false,"name":"awards","type":"uint256"}],"name":"SendRemainAwards","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"gameId","type":"uint256"},{"indexed":false,"name":"openTime","type":"uint256"}],"name":"GameCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"}],"name":"OwnershipRenounced","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}]
		, address: '0xce68bb77cba4b493b5e215429a5b318d012cc0fc'
		, init: function () {
			let promise = null;
			if (window.ethereum) {
				window.web3 = new Web3(ethereum);
				promise = ethereum.enable();
			} else if (window.web3) {
				if (web3.eth.accounts.length == 0) {
					promise = Promise.reject("MetaMask is locked or no available accounts.");
				} else {
					promise = Promise.resolve();
				}
			} else {
				promise = Promise.reject('Non-Ethereum browser detected. You should consider trying MetaMask!');
			}
			
			return promise.then(function () {
				var Contract = web3.eth.contract(mambaGameManager.abi);
				mambaGameManager.contract = Contract.at(mambaGameManager.address);
				return Promise.resolve();
			}).then(function () {
				return new Promise(function (resolve, reject) {
					web3.eth.getBlockNumber(function (error, result) {
						if (!error) {
							mambaGameManager.initBlockNumber = result;
							resolve();
						} else {
							reject(error);
						}
					});
				});
			}).then(function () {
				return new Promise(function (resolve, reject) {
					mambaGameManager.contract.teamWallet(function(error, result) {
						if (error) {
							reject(error);
						} else {
							mambaGameManager.teamWallet = result;
							resolve();
						}
					});
				});
			}).then(function () {
				return new Promise(function (resolve, reject) {
					mambaGameManager.contract.numberOfGameData(function(error, result) {
						if (error) {
							reject(error);
						} else {
							mambaGameManager.numberOfGames = result.toNumber();
							resolve();
						}
					});
				});
			}).then(function () {
				return new Promise(function (resolve, reject) {
					mambaGameManager.contract.MIN_BET(function(error, result) {
						if (error) {
							reject(error);
						} else {
							mambaGameManager.minimumBets = web3.fromWei(result.toString(), 'ether');
							resolve();
						}
					});
				});
			}).then(function () {
				return new Promise(function (resolve, reject) {
					mambaGameManager.contract.HIDDEN_TIME_BEFORE_CLOSE(function(error, result) {
						if (error) {
							reject(error);
						} else {
							mambaGameManager.hiddenTimeLengthBeforeClose = 1000 * result.toNumber();
							resolve();
						}
					});
				});
			}).then(function () {
				let gameAddedEvent = mambaGameManager.contract.GameCreated({}, {fromBlock: 'latest'});
				gameAddedEvent.watch(function(error, result) {
					if (!error) {
						if (result.blockNumber > mambaGameManager.initBlockNumber) {
							++mambaGameManager.numberOfGames;
							if (mambaGameManager.callbackFnForNewGame) {
								mambaGameManager.callbackFnForNewGame(mambaGameManager.numberOfGames);
							}
						}
					} else {
						console.error(error);
					}
				});
				
				return Promise.resolve();
			
			}).then(function () {
				mambaGameManager.isInited = true;
				return Promise.resolve();
			}).catch(function (error) {
				mambaGameManager.isInited = false;
				if (mambaGameManager.numberOfGames) {
					delete mambaGameManager.numberOfGames;
				}
				
				if (mambaGameManager.teamWallet) {
					delete mambaGameManager.teamWallet;
				}
				
				if (mambaGameManager.contract) {
					delete mambaGameManager.contract;
				}
				
				if (mambaGameManager.initBlockNumber) {
					delete mambaGameManager.initBlockNumber;
				}
				
				if (mambaGameManager.minimumBets) {
					delete mambaGameManager.minimumBets;
				}
				
				if (mambaGameManager.hiddenTimeLengthBeforeClose) {
					delete mambaGameManager.hiddenTimeLengthBeforeClose;
				}
				
				return Promise.reject(error);
			});
		}
		, game: function(id) {
			
			if (!this.isInited) {
				return Promise.reject("Mamba game manager was not initialized successfully.");
			} else if (id < 0 || id >= this.numberOfGames) {
				return Promise.reject("Game id out of range.");
			} else {
				var game = new MambaGame(id);
				if (!game.initBlockNumber) {
					game.initBlockNumber = mambaGameManager.initBlockNumber;
				}
				
				if (!game.contract) {
					game.contract = this.contract;
				}
				
				if (!game.minimumBets) {
					game.minimumBets = this.minimumBets;
				}
				
				if (!game.hiddenTimeLengthBeforeClose) {
					game.hiddenTimeLengthBeforeClose = this.hiddenTimeLengthBeforeClose;
				}
				
				if (!game.teamWallet) {
					game.teamWallet = this.teamWallet;
				}
				
				return game.fetchConstantValue().then(function () {
					return Promise.resolve(game);
				});
			}
		}
		, callbackFnForNewGame: null
		, subscribeForNewGame: function (cb) {
			if (this.callbackFnForNewGame) {
				throw new Error("Already subscribed.");
			} else {
				this.callbackFnForNewGame = cb;
			}
		}
		, unsubscribeForNewGame: function () {
			this.callbackFnForNewGame = null;
		}
	}
	
	return mambaGameManager;
}))