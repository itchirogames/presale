Itchiro Presale Contracts
===================

This repository contains Itchiro Presale contracts written in Solidity language.

Prerequisites
--------

  - [ ] Truffle v5.1.49
  - [ ] Node v12.x.x

Usage
----

Install Truffle: `npm i -g truffle@5.1.49`

Install dependencies: `npm install`

Deploy contracts:
  - Deploy to Rinkeby: `INFURA_API_KEY=... PRIVATE_KEY=... npm run deploy:testnet`
  - Deploy to Mainnet: `INFURA_API_KEY=... PRIVATE_KEY=... npm run deploy`

Verify contracts on Etherscan:
  - Verify on Rinkeby: `ETHERSCAN_API_KEY=... npm run verify:testnet`
  - Verify on Mainnet: `ETHERSCAN_API_KEY=... npm run verify`

Run Tests: `npm run test`

Generate Coverage Report: `npm run coverage`

Contracts Web UI
-------------

Install library: `npm install -g eth95`

Start [Web UI](http://localhost:3000): `eth95 --truffle`

Managing Presale
---------------

  - `whitelistInvestors(1)` and `unwhitelistInvestors(1)`
    - `address[] _investors` > **["0xA64ed2A497E86265764d029E05592F5Ef60BcC0C"]** (comma separated; up to 256 addresses)
  - `updateDetails(6)` (e.g. start another investment round)
    - `uint _startBlock` > **11172295** (first round `_endBlock`)
    - `uint _endBlock` > **11173920** (second round lasts *1625* blocks, approx. 6 hours)
    - `uint _endRefundBlock` > **11178945** (same as before)
    - `uint _supply` > **0** (sell all unsold tokens from first round)
    - `uint _rate` > **225** (*2.25* tokens per 1 eth)
    - `uint _maxInvestment` > **9999000000000000000000** (allow investing up to *9999* eth, so basically allow unlim)
  - `claimUnsoldTokens(1)` (strictly after `_endBlock`)
    - `address wallet` > **0x5771C19F4DF99fa9b783cB933A5D7a83fE941c6C** (Wallet to receive unsold tokens, presumably same multisig)
  - `claimUnclaimedRefunds(1)` (strictly after `_endRefundBlock`)
    - `address payable wallet` > **0x5771C19F4DF99fa9b783cB933A5D7a83fE941c6C** (Wallet to receive unclaimed ether, presumably same multisig)
  - `updatePaused(1)` Freeze or unfreeze the contract (checked only for `invest(1)` and `claimRefund(1)` functions)
    - `bool paused` > `true` or `false`

> Presale contract ABI can be copied from `./presale.abi.json` (e.g. import into a *Gnosis Multisig Wallet*)

Contracts Parameters (`./parameters.json`)
-----------------------

```javascript
{
  "mainnet": {
    "_owner": "0x5771C19F4DF99fa9b783cB933A5D7a83fE941c6C", // Gnosis Multisig (https://wallet.gnosis.pm/#/wallet/0x5771C19F4DF99fa9b783cB933A5D7a83fE941c6C)
    "_treasury": "0x5771C19F4DF99fa9b783cB933A5D7a83fE941c6C", // Gnosis Multisig (https://wallet.gnosis.pm/#/wallet/0x5771C19F4DF99fa9b783cB933A5D7a83fE941c6C)
    "_token": "0x21cf09BC065082478Dcc9ccB5fd215A978Dc8d86", // JEM token (https://etherscan.io/token/0x21cf09BC065082478Dcc9ccB5fd215A978Dc8d86)
    "_startBlock": "11165645", // approx. block supposed to be mined on: Saturday, October 31st, at 12 pm Eastern Time (ET).
    "_endBlock": "11165645+6650", // +24 hours after _startBlock
    "_endRefundBlock": "11165645+6650*2", // +48 hours after _startBlock
    "_supply": "3150 ether", // 3150 tokens
    "_rate": 3, // 3 tokens per 1 eth
    "_maxInvestment": "3 ether" // allow 3 eth per whitelisted investor
  },
  "rinkeby": {
    "_owner": "0x4C4CD2A219F141C324CA4F181dcc14A5D84578Ba", // Gnosis Multisig (https://wallet.gnosis.pm/#/wallet/0x4C4CD2A219F141C324CA4F181dcc14A5D84578Ba)
    "_treasury": "0x4C4CD2A219F141C324CA4F181dcc14A5D84578Ba", // Gnosis Multisig (https://wallet.gnosis.pm/#/wallet/0x4C4CD2A219F141C324CA4F181dcc14A5D84578Ba)
    "_token": "0x0", // is deployed from migration
    "_startBlock": "+0", // right away after deploy
    "_endBlock": "+6500*7",  // 7 days after deploy
    "_endRefundBlock": "+6500*7*2",  // 14 days after deploy
    "_supply": "3150 ether", // 3150 tokens
    "_rate": 3, // 3 tokens per 1 eth
    "_maxInvestment": "3 ether" // allow 3 eth per whitelisted investor
  }
}
```

Deployments
----------

  - *Mainnet* Presale Contract address: [0x4620AC1eDFF8753012418a66A0b435C4B51F77A9](https://etherscan.io/address/0x4620AC1eDFF8753012418a66A0b435C4B51F77A9)
  - *Rinkeby* Presale Contract: [0x2ea27bdc38731Fa4bCc2FB1C7C8a571D2504215D](https://rinkeby.etherscan.io/address/0x2ea27bdc38731Fa4bCc2FB1C7C8a571D2504215D)
  - *Rinkeby* Token Contract: [0x625b0B4762CDaE888946C4aDc9fAaB55D8810C9F](https://rinkeby.etherscan.io/address/0x625b0B4762CDaE888946C4aDc9fAaB55D8810C9F)

> `+6500` means around 24 hours (~13-15 sec/block).
> To calculate Presale start time base on `_startBlock` parameter run `./block-time.sh 11165645`

Analysis
------

  - [ConsenSys Solidity Metrics](/solidity-metrics.html)
  - [Coverage Report](/coverage/index.html)

Coverage
------

```
--------------|----------|----------|----------|----------|----------------|
File          |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
--------------|----------|----------|----------|----------|----------------|
 contracts/   |      100 |     62.5 |      100 |      100 |                |
  Presale.sol |      100 |     62.5 |      100 |      100 |                |
--------------|----------|----------|----------|----------|----------------|
All files     |      100 |     62.5 |      100 |      100 |                |
--------------|----------|----------|----------|----------|----------------|
```