Mamba Game 
==========

The Mamba Game is the lottery game of Mamba Coin. This repository contains the solidity 
code of smart contracts, the javascript dApp wrapper of smart contract, test code with 
truffle framework, and a simple html sample code.

Repository Folder Structure
----------------------------

We followed the folder structure of truffle framework.

 Path                              | Description 
-----------------------------------|--------------------------------------------------------
 contracts\                        | Contains the smart contract code. 
 contracts\GameLogic.sol           | Source code file of game logic library. 
 contracts\GamePool.sol            | Source code file of game pool contract. This contract is the main entry for all game operations. 
 contracts\GamePoolTestProxy.sol   | Source code file of game pool proxy contract. Used for testing. 
 contracts\Migrations.sol          | Contract for truffle migration. 
 doc\                              | Contains the document of javascript dApp warpper. 
 doc\JavascriptApi.md              | The API document of javascript dApp warpper. 
 jslib\                            | Contains the javascript code of dApp wrapper. 
 jslib\dist\mambagame.js           | The javascript code of dApp wrapper. 
 migrations\                       | Contains the truffle migration scripts. 
 migrations\1_initial_migration.js | The migration script of truffle. 
 migrations\2_deploy_contracts.js  | The migration script of truffle. 
 samplewww\                        | Contains the sample code to used dApp wrapper. 
 test\                             | Contains the truffle test scripts. 
 test\gamepooltest.js              | Automatic test script for smart contracts. 
 test\mambagametest.js             | Automatic test script for dApp wrapper. 
 third-contracts\                  | Contains the dependency of the 3rd smart contracts. We depends on [openzeppelin](https://github.com/OpenZeppelin/openzeppelin-solidity) and [oraclize](https://docs.oraclize.it/).
 bs-config.json                    | Config file for lite-server. We use lite-server for sample code testing.  
 LICENSE                           | License file. 
 package.json                      | Node.js config file. 
 README.md                         | This file. 
 truffle.js                        | Truffle config file. 
 
Install the Dependenies
-------------------------
1. [Node.js](https://nodejs.org/en/)
2. [truffle](https://truffleframework.com/docs/truffle/getting-started/installation)
3. [geth](https://geth.ethereum.org/downloads/) We need a private chain to do the test. Ganache would't work for oraclize. You can use other ethereum client as well.
4. [ethereum-bridge](https://github.com/oraclize/ethereum-bridge) The connector app of oraclize and private chain.

How to Run Test Cases
------------------------
1. Build & run a private chain. Make sure the rpc is openned for http://localhost:8545. [link](https://medium.com/mercuryprotocol/how-to-create-your-own-private-ethereum-blockchain-dad6af82fc9f)
2. Create & lock 11 accounts.
3. Mined or generated some ethers to all 11 accounts, at least 1 ether.
4. Run ethereum-bridge. `ethereum-bridge -H localhost:8545 -a 10`. Please don't use the default account or oraclize, because we use the default account to interact smart contracts in test cases.
5. Clone this repository. `git clone --recursive https://github.com/YSYouJack/MambaGame.git` 
6. Install dependencies. `npm install`
7. Run test. `truffle test`

Sometimes you will see some errors when the test cases called contract method but not the test failed.

How to Run Sample Http
------------------------
1. Deploy contracts. `truffle migration`.
2. Copy the contract address to mambagame.js mambaGamePool.address field.
3. Set MetaMask to connect private chain.
4. Run sample. `npm run dev` q q
