GamePool Operations
======================

Send Orcalize Fee to GamePool Contract
----------------------------------------

Two methods to send the fee.
1. Call `GamePool.sendOraclizeFee` with some ether(like 100 finney). 
2. Send the fee to contract address.


Withdraw the Orcalize Fee
----------------------------------------
Call `GamePool.withdrawOraclizeFee`.


Game Operation
----------------------------------------
The life cycle of a game is ```Created -> Ready -> Open -> Stop -> WaitToClose -> Closed```.

