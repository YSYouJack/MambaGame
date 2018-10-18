# mambagame.js

A dApp library to interact of Mamba Lottery Game smart contracts on Ethereum.
This library contains two modules which contains two main functionality for the smart contracts.
* The **MamabaGame** for all the game functionalities.
* The **MambaGameManager** for game queries.

## Usage
### Client-side suage

The library can be loaded ether as a standalone script, or an amd-compatible loader.
```html
<script type="text/javascript" src="dist/mambagame.js"></script>
<script type="text/javascript">
	mambaGameManager.init().then(function () {
		console.log(mambaGameManager.address);
	})
</script>
```

## API

### MambaGameManager

#### `mambaGameManager.init()`
This function MUST be called before any other operations. The function will initialize all needed modules for interaction with smart contracts.
##### Parameters
`None`
##### Returns
`Promise` - Returns void. 

#### `mambaGameManager.isInited`
##### Returns
`Boolean` - If true, the manager module has been inited successfully.

#### `mambaGameManager.abi`
##### Returns
`String` - Manager smart contract abi.

#### `mambaGameManager.address`
##### Returns
`String` - Smart contract address on Ethereum.

#### `mambaGameManager.numberOfGames`
Returns total number of mamaba games. This property exists after the `mambaGameManager.init()` was successfully called.
##### Returns
`Number` - Total number of mamaba games, includes the current game and past games.

#### `mambaGameManager.game(id)`
##### Parameters
`Number` - Game id.
##### Returns
`Promise` - Returns a MambaGame of given game id. Returns error if one of the following conditions happens.
* The `mambaGameManager.init()` was failed or not called.
* The given game id is out of range.
* Some error happens on interaction with Ethereum.

### MambaGame

#### `mambaGame.abi`
##### Returns
`String` - Manager smart contract abi.

#### `mambaGame.address`
##### Returns
`String` - Smart contract address on Ethereum.

#### `mambaGame.YDistribution`
##### Returns
`Array` - 50 possible Y values. The smart contract will choose one of the value from this array as the final Y value.
This array contains 50 possible values.

#### `mambaGame.coins`
Returns the an array contains the information of all 5 target coin. 
##### Returns
`Array` - The array of `Object` contains information of 5 target coins. The object has 
* name `String`: The short name of the coin.
* startExRate `Number`: The exchange rate to USDT at the opening time of this game.
* currentExRate `Number`: The exchange rate to USDT at the current time.
* endExRate `Number`: The exchange rate to USDT at the closing time of this game.
* totalBets `String`: Total bets on this coin.
* largestBets `String`: The largest bets on this coin.
* numberOfBets `Number`: Number of bets on this coins.

#### `mambaGame.openTime`
##### Returns
`Date` - The opening time of this game.

#### `mambaGame.closeTime`
##### Returns
`Date` - The closing time of this game.

#### `mambaGame.duration`
##### Returns
`Number` - The duration in ms of one game preiod.

#### `mambaGame.A`
##### Returns
`String` - The percentage of awards distribution to Y% of preivous bets.

#### `mambaGame.B`
##### Returns
`String` - The percentage of awards distribution to (1-Y)% of bets.

#### `mambaGame.txFee`
##### Returns
`String` - The percentage of tx fee.

#### `mambaGame.minimumDifferenceBetsForWinner`
##### Returns
`String` - The minimum difference bets(in ether) for winner group.

#### `mambaGame.timeStampOfStartRate`
##### Returns
`Date` - The recording timestamp of starting exchange rate. 

#### `mambaGame.timeStampOfEndRate`
##### Returns
`Date` - The recording timestamp of ending exchange rate. 

#### `mambaGame.isClosed`
##### Returns
`Boolean` - Return true if the game has been closed.

#### `mambaGame.minimumBets`
##### Returns
`String` - The minimum bets amount in ether.

#### `mambaGame.hiddenTimeLengthBeforeClose`
##### Returns
`Number` - The time length before game closing to hide all information in order to avoid bad bet strategy.

#### `mambaGame.teamWallet`
##### Returns
`String` - The address to receive tx fee.

#### `mambaGame.winnerCoinIds`
##### Returns
`Array` - Winner coin ids. Only exists after the game has closed.

#### `mambaGame.bet(id)`
Give the bets to given coin id.
##### Parameters
`Number` - Coin id.
##### Returns
`Promise` - Returns void if the operation was successed. Returns error if one of the following conditions happens
* The game has not start. Please check `mambaGame.openTime`.
* The game has closed. Please check `mambaGame.closeTime`.
* The coin id is out of range.
* Some error happens on interaction with Ethereum.

#### `mambaGame.subscribe(eventType, callbackFn)`
Subscribe one of the event for immediately update.
##### Parameters
`String` - Event type
* Extended: Called when game has extended.
* Closed: Called when game has closed.
* Bet: Called when a player bet.
* LargestBetChanged: Called when a largest bet of some coin has changed.
* SendAwards: Called when smart contract send some awards to players.
* ExrateUpdated: Called when the current exchange rate has updated.

`Function` - The callback function. The function has the following types.
* Extended: 1 callback parameter, the extended closing time of this game.
* Closed: Empty callback data.
* Bet: 3 callback parameters, the coin id as the first parameter, player address as the second parameter, and bets amount in ether as the third parameter.
* LargestBetChanged: 2 callback parameters, the coin id as the first parameter and bets amount in ether as the second parameter.
* SendAwards: 2 callback parameters, recieving address as the first parameter and awards amount in ether as the second parameter.
* ExrateUpdated: 2 callback parameters, the coin id as the first parameter and current exchange rate as the second parameter.
##### Returns
Throw error when the event type was not supported or the event type has been subscribed.
##### Sample
```javascript
game.subscribe('Extended', function (closeTime) {
	...
});

game.subscribe('Closed', function () {
	...
});

game.subscribe('Bet', function (coinId, playerAddress, bets) {
	...
});

game.subscribe('LargestBetChanged', function (coinId, bets) {
	...
});

game.subscribe('SendAwards', function (playerAddress, awards) {
	...
});

game.subscribe('ExrateUpdated', function (coinId, exrate) {
	...
});

```

#### `mambaGame.unsubscribe(eventType)`
Unsubscribe one of the event.
##### Parameters
`String` - Event type
* Extended: Called when game has extended.
* Closed: Called when game has closed.
* Bet: Called when a player bet.
* LargestBetChanged: Called when a largest bet of some coin has changed.
* SendAwards: Called when smart contract send some awards to players.
* ExrateUpdated: Called when the current exchange rate has updated.
##### Returns
Throw error when the event type was not supported