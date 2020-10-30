const Web3 = require('web3');
const utilsFunctor = require('../utils');
const Presale = artifacts.require("Presale");
const Token = artifacts.require("Token");

module.exports = async function (deployer, network) {
  if (network == "test" || network == "soliditycoverage") {
    console.info("> Skip 'migrations/1603307938_presale.js' migration during tests...");
    return;
  }

  let token; // for rinkeby token only!
  const { presaleParams } = utilsFunctor(new Web3(deployer.provider));
  const params = await presaleParams(null, network);

  if (network == "rinkeby") {
    console.info(`> Ignore IERC20(${params._token}) token and deploy a new one...`);
    token = await deployer.deploy(Token);
    params._token = token.address;
    console.info(`> New IERC20(${params._token}) token deployed.`);
  }

  const presale = await deployer.deploy(
    Presale,
    params._owner,
    params._treasury,
    params._token,
    params._startBlock,
    params._endBlock,
    params._endRefundBlock,
    params._supply,
    params._rate,
    params._maxInvestment
  );

  if (network == "rinkeby") {
    await token.mint(presale.address, params._supply);
    const presaleBalance = await token.balanceOf.call(presale.address);

    console.info(`> Mint IERC20(${params._token}) tokens for Presale(${presale.address}).`);
    console.info(`> IERC20(${params._token}).balanceOf(${presale.address}) == ${presaleBalance.toString()}`);
  } else {
    console.info(
      `> Please mint or transfer an amount of ${params._supply} tokens (amount in wei, to match "_supply") ` +
      `from IERC20(${params._token}) to Presale(${presale.address}).`
    );  
  }

  return presale;
};
