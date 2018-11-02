# mambagame.js

A dApp library to interact of Mamba Lottery Game smart contracts on Ethereum.
This library contains two modules which contains two main functionality for the smart contracts.
* The **MamabaGame** for all the game functionalities.
* The **MambaGamePool** for game queries and common properties.

## Usage
### Client-side suage

The library can be loaded ether as a standalone script, or an amd-compatible loader.
```html
<script type="text/javascript" src="dist/mambagame.js"></script>
<script type="text/javascript">
	mambaGamePool.init().then(function () {
		console.log(mambaGamePool.address);
	})
</script>
```

## API

### MambaGamePool

#### `mambaGamePool.init()`
This function MUST be called before any other operations. The function will initialize all needed modules for interaction with smart contracts.
##### Parameters
`None`
##### Returns
`Promise` - Returns void. 

#### `mambaGamePool.close()`
Stop to watch any event from blockchain about the game pool. Call this function to prevent the callbacks are called if you don't need this instance anymore.

#### `mambaGamePool.isInited`
##### Returns
`Boolean` - If true, the manager module has been inited successfully.

#### `mambaGamePool.abi`
##### Returns
`String` - Manager smart contract abi.

#### `mambaGamePool.address`
##### Returns
`String` - Smart contract address on Ethereum.

#### `mambaGamePool.numberOfGames`
Returns total number of mamaba games. This property exists after the `mambaGamePool.init()` was successfully called.
##### Returns
`Number` - Total number of mamaba games, includes the current game and past games.

#### `mambaGamePool.playerAddress`
Returns the player address on blockchain. This property exists after the `mambaGamePool.init()` was successfully called.
##### Returns
`Number` - The player address on blockchain.

#### `mambaGamePool.game(id)`
##### Parameters
`Number` - Game id.
##### Returns
`Promise` - Returns a MambaGame of given game id. Returns error if one of the following conditions happens.
* The `mambaGamePool.init()` was failed or not called.
* The given game id is out of range.
* Some error happens on interaction with Ethereum.

#### `mambaGamePool.getPlayerBetsHistory(startBlockNumber)`
Query player bets history from `startBlockNumber` to latest block. Not includes the pending tx.
##### Parameters
`Number` - Start block number to query. (default = 0).
##### Returns
`Promise` - Returns an array of bets records, an empty array if no bets history. Returns error if one of the following conditions happens.
* The `mambaGamePool.init()` was failed or not called.
* The given game id is out of range.
* Some error happens on interaction with Ethereum.

The record object has following fields.
* blockNumber `Number` - The mined block number of the bet tx.
* gameId `Number` - Game id of the bet.
* coinId `Number` - Coin id of the bet.
* betAmount `String` - Bet amount in ether.
* txHash `String` - The bet tx hash.
* timeStamp `Date` - The timestamp of mined block.

### MambaGame

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
* timeStampStartExRate `Date`: The recorded timestamp of `startExRate`.
* currentExRate `Number`: The exchange rate to USDT at the current time.
* endExRate `Number`: The exchange rate to USDT at the closing time of this game.
* timeStampEndExRate `Date`: The recorded timestamp of `endExRate`.
* totalBets `String`: Total bets on this coin.
* largestBets `String`: The largest bets on this coin.
* numberOfBets `Number`: Number of bets on this coins.

#### `mambaGame.id`
##### Returns
`Number` - The id of this game in smart contract.

#### `mambaGame.openTime`
##### Returns
`Date` - The opening time of this game.

#### `mambaGame.closeTime`
##### Returns
`Date` - The closing time of this game.

#### `mambaGame.duration`
##### Returns
`Number` - The duration in ms of one game preiod.

#### `mambaGame.Y`
##### Returns
`Number` - The percentage of awards distribution to preivous bets.

#### `mambaGame.A`
##### Returns
`Number` - The percentage of awards distribution to Y% of preivous bets.

#### `mambaGame.B`
##### Returns
`Number` - The percentage of awards distribution to (1-Y)% of bets.

#### `mambaGame.txFee`
##### Returns
`String` - The percentage of tx fee.

#### `mambaGame.minimumDifferenceBetsForWinner`
##### Returns
`String` - The minimum difference bets(in ether) for winner group.

#### `mambaGame.minimumBets`
##### Returns
`String` - The minimum bets amount in ether.

#### `mambaGame.hiddenTimeLengthBeforeClose`
##### Returns
`Number` - The time length before game closing to hide all information in order to avoid bad bet strategy.

#### `mambaGame.txFeeReceiver`
##### Returns
`String` - The address to receive tx fee.

#### `mambaGame.winnerCoinIds`
##### Returns
`Array` - Winner coin ids. Only exists after the game has closed.

#### `mambaGame.state`
##### Returns
`String` - The current state of the game.
* NotExists - The game has not been created. You should never saw this value.
* Created - The game has been created but no ready, because the start exchange rates have not been updated.
* Ready - All the parameters have been updated. Waiting for the opening time is reached.
* Open - Players can bet on their preferred coins.
* Stop - The closing time of the game was reached but the final exchange rates have not been updated. Players cannot bet anymore.
* WaitToClose - The final exchange rates have been updated. Waiting for the Mamba Team to close it.
* Closed - The Mamba Team has closed the game. Players can claim their awards before the next game reached the `Open` state.
* Error - The game is in error state. Waiting for the Mamba Team to close it.

#### `mambaGame.fetchConstantValue()`
Fetch all constant parameters value of given game.
##### Returns
`Promise` - Returns void if the operation was successed. Returns error if one of the following conditions happens
* The game has not start. Please check `mambaGame.openTime`.
* The game has closed. Please check `mambaGame.closeTime`.
* The coin id is out of range.
* Some error happens on interaction with Ethereum.

#### `mambaGame.close()`
Stop to watch any event from blockchain about the game. Call this function to prevent the callbacks are called if you don't need this game instance anymore.

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

#### `mambaGame.calculateAwards()`
Calculate the awards amount after the game has been closed. If the game has not been closed, 
##### Returns
`Promise` - Returns the award amount in ether if the operation was successed. Returns error if one of the following conditions happens
* The game has not start. Please check `mambaGame.openTime`.
* The game has closed. Please check `mambaGame.closeTime`.
* The coin id is out of range.
* Some error happens on interaction with Ethereum.

#### `mambaGame.getAwards()`
Claim the rewards of the player. 
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
* Bet: Called when a player bet.
* LargestBetChanged: Called when a largest bet of some coin has changed.
* SendAwards: Called when smart contract send some awards to players.
* ExrateUpdated: Called when the current exchange rate has updated.
* StartExRateUpdated: Called when the start exchange rate has been written to blockchain.
* EndExRateUpdated: Called when the end exchange rate has been written to blockchain.
* GameYChoosed: Called when the randomly choonsed Y has been written to blockchain.
* StateChanged: Called when the game state has been changed.

`Function` - The callback function. The function has the following types.
* Bet: 3 callback parameters, the coin id as the first parameter, player address as the second parameter, and bets amount in ether as the third parameter.
* LargestBetChanged: 2 callback parameters, the coin id as the first parameter and bets amount in ether as the second parameter.
* SendAwards: 2 callback parameters, recieving address as the first parameter and awards amount in ether as the second parameter.
* ExrateUpdated: 2 callback parameters, the coin id as the first parameter and current exchange rate as the second parameter.
* StartExRateUpdated: 3 callback parameters, the coin id as the first parameter, recorded exchange rate as the second parameter and the timestamp is the third.
* EndExRateUpdated: 3 callback parameters, the coin id as the first parameter, recorded exchange rate as the second parameter and the timestamp is the third.
* GameYChoosed: 1 callback parameter, the choosed Y value of the game.
* StateChanged: 1 callback parameter, the current state.
##### Returns
Throw error when the event type was not supported or the event type has been subscribed.
##### Sample
```javascript

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

game.subscribe('StartExRateUpdated', function (coinId, exrate, timestamp) {
	...
});

game.subscribe('EndExRateUpdated', function (coinId, exrate, timestamp) {
	...
});

game.subscribe('GameYChoosed', function (Y) {
	...
});

game.subscribe('StateChanged', function (state) {
	...
});

```

#### `mambaGame.unsubscribe(eventType)`
Unsubscribe one of the event.
##### Parameters
`String` - Event type
* Bet: Called when a player bet.
* LargestBetChanged: Called when a largest bet of some coin has changed.
* SendAwards: Called when smart contract send some awards to players.
* ExrateUpdated: Called when the current exchange rate has updated.
* StartExRateUpdated: Called when the start exchange rate has been written to blockchain.
* EndExRateUpdated: Called when the end exchange rate has been written to blockchain.
* GameYChoosed: Called when the randomly choonsed Y has been written to blockchain.
* StateChanged: Called when the game state has been changed.
##### Returns
Throw error when the event type was not supported

#### `mambaGame.isBetInformationHidden()`
##### Returns
`Boolean` - If true, the Bet and LargestBetChanged will not be triggered.
