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
	function MambaGame(address) {
		this.address = address;
		
		var Contract = web3.eth.contract(this.abi);
		this.contract = Contract.at(this.address);
		
		this.cb = {'Extended': null
			, 'Closed': null
			, 'Bet': null
			, 'LargestBetChanged': null
			, 'SendAwards': null
		};
	}
	
	MambaGame.prototype.initBlockNumber = null;
	MambaGame.prototype.abi = [{"constant":true,"inputs":[],"name":"timeStampOfEndRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"B","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_endExRate","type":"int32[5]"},{"name":"_timeStampOfEndRate","type":"uint256"}],"name":"close","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"isAlive","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"HIDDEN_TIME_BEFORE_CLOSE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"Y","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"YDistribution","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"teamWallet","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"uint256"},{"name":"_player","type":"address"}],"name":"bet","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"closeTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MIN_BET","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"minDiffBets","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"timeStampOfStartRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"numberOfWinnerCoinIds","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"openTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"winnerCoinIds","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isClosed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"coins","outputs":[{"name":"name","type":"string"},{"name":"startExRate","type":"int32"},{"name":"endExRate","type":"int32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"txFee","outputs":[{"name":"","type":"uint16"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"gameDuration","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_id","type":"uint256"}],"name":"getCoinBetData","outputs":[{"name":"totalBets","type":"uint256"},{"name":"largestBets","type":"uint256"},{"name":"numberOfBets","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"A","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_openTime","type":"uint256"},{"name":"_gameDuration","type":"uint256"},{"name":"_coinName0","type":"string"},{"name":"_coinName1","type":"string"},{"name":"_coinName2","type":"string"},{"name":"_coinName3","type":"string"},{"name":"_coinName4","type":"string"},{"name":"_startExRate","type":"int32[5]"},{"name":"_exRateTimeStamp","type":"uint256"},{"name":"_YDistribution","type":"uint8[50]"},{"name":"_A","type":"uint8"},{"name":"_B","type":"uint8"},{"name":"_txFee","type":"uint16"},{"name":"_minDiffBets","type":"uint256"},{"name":"_teamWallet","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[],"name":"Closed","type":"event"},{"anonymous":false,"inputs":[],"name":"Extended","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"coinId","type":"uint256"},{"indexed":true,"name":"player","type":"address"},{"indexed":false,"name":"bets","type":"uint256"}],"name":"CoinBet","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"coinId","type":"uint256"},{"indexed":false,"name":"bets","type":"uint256"}],"name":"CoinLargestBet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"player","type":"address"},{"indexed":false,"name":"awards","type":"uint256"}],"name":"SendAwards","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"teamWallet","type":"address"},{"indexed":false,"name":"awards","type":"uint256"}],"name":"SendRemainAwards","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"}],"name":"OwnershipRenounced","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}];
	MambaGame.prototype.fetchConstantValue = function() {
		// Get reference of this.
		var obj;
		obj = this;
		
		function fetchYDistribution() {
			let promises = [];
			for (let i = 0; i < 50; ++i) {
				promises.push(new Promise(function (resolve, reject) {
					obj.contract.YDistribution(i, function(error, result) {
						if (error) {
							reject(error);
						} else {
							resolve(result.toNumber());
						}
					});
				}));
			}
			
			return Promise.all(promises).then(function (value) {
				obj.YDistribution = value;
				return Promise.resolve();
			});
		}
		
		function fetchCoin(id) {
			if (!obj.coins) {
				obj.coins = [];
			}
			
			if (id == 5) {
				return Promise.resolve();
			} else {
				return new Promise(function (resolve, reject) {
					obj.contract.coins(id, function(error, result) {
						if (error) {
							reject(error);
						} else {
							obj.coins.push({
								name: result[0]
								, startExRate: result[1].toNumber() / 100
								, endExRate: result[2].toNumber() / 100
							});
							resolve();
						}
					});
				}).then(function () {
					return fetchCoin(id + 1);
				});
			}
		}
		
		function fetchCoinBet(id) {
			if (id == 5) {
				return Promise.resolve();
			} else {
				return new Promise(function (resolve, reject) {
					obj.contract.getCoinBetData(id, function(error, result) {
						if (error) {
							reject(error);
						} else {
							obj.coins[id].totalBets = web3.fromWei(result[0].toString(), 'ether');
							obj.coins[id].largestBets = web3.fromWei(result[1].toString(), 'ether');
							obj.coins[id].numberOfBets = result[2].toNumber();
								name: result[0]
							resolve();
						}
					});
				}).then(function () {
					return fetchCoinBet(id + 1);
				});
			}
		}
		
		return fetchYDistribution().then(function () {
			return fetchCoin(0);
		}).then(function () {
			return fetchCoinBet(0);
		}).then(function() {
			return new Promise(function (resolve, reject) {
				obj.contract.openTime(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.openTime = new Date(1000 * result.toNumber());
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.closeTime(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.closeTime = new Date(1000 * result.toNumber());
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.gameDuration(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.duration = 1000 * result.toNumber();
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.A(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.A = result + '%';
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.B(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.B = result + '%';
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.txFee(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.txFee = result.toNumber() / 10 + '%';
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.minDiffBets(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.minimumDifferenceBetsForWinner = web3.fromWei(result.toString(), 'ether');
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.timeStampOfStartRate(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.timeStampOfStartRate = new Date(1000 * result.toNumber());
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.timeStampOfEndRate(function(error, result) {
					if (error) {
						reject(error);
					} else {
						if (!result.isZero()) {
							obj.timeStampOfEndRate = new Date(1000 * result.toNumber());
						}
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.isClosed(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.isClosed = result;
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.MIN_BET(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.minimumBets = web3.fromWei(result.toString(), 'ether');
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.HIDDEN_TIME_BEFORE_CLOSE(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.hiddenTimeLengthBeforeClose = 1000 * result.toNumber();
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.teamWallet(function(error, result) {
					if (error) {
						reject(error);
					} else {
						obj.teamWallet = result;
						resolve();
					}
				});
			});
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.numberOfWinnerCoinIds(function(error, result) {
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
						obj.contract.winnerCoinIds(i, function(error, result) {
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
			let filter = web3.eth.filter('latest');
			
			let extendEvent = obj.contract.Extended(null, filter);
			extendEvent.watch(function(error, result) {
				if (!error) {
					if (result.blockNumber > obj.initBlockNumber) {
						obj.callbackForExtended();
					}
				} else {
					console.error(error);
				}
			});
			
			let closedEvent = obj.contract.Closed(null, filter);
			closedEvent.watch(function(error, result) {
				if (!error) {
					if (result.blockNumber > obj.initBlockNumber) {
						obj.callbackForClosed();
					}
				} else {
					console.error(error);
				}
			});
			
			let coinBetEvent = obj.contract.CoinBet(null, filter);
			coinBetEvent.watch(function(error, result) {
				if (!error) {
					if (result.blockNumber > obj.initBlockNumber) {
						obj.callbackForCoinBet(result.args.coinId.toNumber(), result.args.player, result.args.bets);
					}
				} else {
					console.error(error);
				}
			});
			
			let coinLargestBetEvent = obj.contract.CoinLargestBet(null, filter);
			coinLargestBetEvent.watch(function(error, result) {
				if (!error) {
					if (result.blockNumber > obj.initBlockNumber) {
						obj.callbackForCoinLargestBet(result.args.coinId.toNumber(), result.args.bets);
					}
				} else {
					console.error(error);
				}
			});
			
			let sendAwardsBetEvent = obj.contract.SendAwards(null, filter);
			sendAwardsBetEvent.watch(function(error, result) {
				if (!error) {
					if (result.blockNumber > obj.initBlockNumber) {
						obj.callbackForSendAwards(result.args.player, result.args.awards);
					}
				} else {
					console.error(error);
				}
			});
			
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
			
			if (obj.gameDuration) {
				delete obj.gameDuration;
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
	
	MambaGame.prototype.bet = function (id) {
		var obj;
		obj = this;
		
		return new Promise(function (resolve, reject) {
			let now = new Date();
			if (now < obj.openTime) {
				reject("The game is not opened yet!");
			} else if (now > obj.closeTime) {
				reject("The game was closed!");
			} else if (id < 0 || id >= obj.coins.length) {
				reject("Coin id is out of range.");
			} else {
				obj.contract.bet(id, web3.eth.defaultAccount, function(error, result) {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
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
		
		if (this.cb['Extended']) {
			this.cb['Extended'](closeTime);
		}
	}
	
	MambaGame.prototype.callbackForClosed = function () {
		this.isClosed = true;
		
		var obj;
		obj = this;
		
		function fetchCoinEndExRate() {
			let promises = [];
			for (let i = 0; i < 5; ++i) {
				promises.push(new Promise(function (resolve, reject) {
					obj.contract.coins(i, function(error, result) {
						if (error) {
							reject(error);
						} else {
							resolve(result[2].toNumber() / 100);
						}
					});
				}));
			}
			
			return Promise.all(promises).then(function (value) {
				for (let i = 0; i < value.length; ++i) {
					obj.coins[i].endExRate = value[i];
				}
				
				return Promise.resolve();
			});
		}
		
		fetchCoinEndExRate().then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.timeStampOfEndRate(function(error, result) {
					if (error) {
						reject(error);
					} else {
						if (!result.isZero()) {
							obj.timeStampOfEndRate = new Date(1000 * result.toNumber());
						}
						resolve();
					}
				});
			});
			
		}).then(function () {
			return new Promise(function (resolve, reject) {
				obj.contract.numberOfWinnerCoinIds(function(error, result) {
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
						obj.contract.winnerCoinIds(i, function(error, result) {
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
	
	// Mamba game manager definition.
	var mambaGameManager = {
		isInited: false
		, abi: [{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"games","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"teamWallet","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"game","type":"address"}],"name":"addGame","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"numberOfGames","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_teamWallet","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"gameAddr","type":"address"},{"indexed":false,"name":"openTime","type":"uint256"}],"name":"GameAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"}],"name":"OwnershipRenounced","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"}]
		, address: '0x6c3a8a952d564ac7bc1a80866355fed85d46cb43'
		, init: function () {
			return new Promise(function (resolve, reject) {
				if (typeof web3 === 'undefined') {
					reject("MetaMask is not found.");
				} else if (web3.eth.accounts.length == 0) {
					reject("MetaMask is locked or no available accounts.");
				} else {
					var Contract = web3.eth.contract(mambaGameManager.abi);
					mambaGameManager.contract = Contract.at(mambaGameManager.address);
					resolve();
				}
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
					mambaGameManager.contract.numberOfGames(function(error, result) {
						if (error) {
							reject(error);
						} else {
							mambaGameManager.numberOfGames = result.toNumber();
							resolve();
						}
					});
				});
			}).then(function () {
				let filter = web3.eth.filter('latest');
			
				let gameAddedEvent = mambaGameManager.contract.GameAdded(null, filter);
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
				
				return Promise.reject(error);
			});
		}
		, game: function(id) {
			
			if (!this.isInited) {
				return Promise.reject("Mamba game manager was not initialized successfully.");
			} else if (id < 0 || id >= this.numberOfGames) {
				return Promise.reject("Game id out of range.");
			} else {
				var game;
				return new Promise(function (resolve, reject) {
					mambaGameManager.contract.games(id, function(error, result) {
						if (error) {
							reject(error);
						} else {					
							game = new MambaGame(result);
							if (!game.initBlockNumber) {
								game.initBlockNumber = mambaGameManager.initBlockNumber;
							}
							resolve();
						}
					});
				}).then(function () {
					return game.fetchConstantValue();
				}).then(function () {
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