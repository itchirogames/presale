const pify = require('pify');
const DEFAULT_PARAMS = require('../parameters.json');

const BASIS_POINTS_DEN = 100;
const AVG_BLOCK_TIME = 13.3;
const BLOCK_MATH_PARAMS = [
  '_startBlock', '_endBlock', '_endRefundBlock',
];
const HUMAN_VALUE_PARAMS = [
  '_supply', '_maxInvestment',
];
const BASIS_POINTS_PARAMS = [
  '_rate',
];

const presaleParams = async (web3, params = {}, network = null) => {
  let accounts = [];

  if (network) {
    params = DEFAULT_PARAMS[network];
  }

  try {
    accounts = await web3.eth.getAccounts();
  } catch (e) {
    console.warn(`> [getAccounts()]: ${e.message}`);
  }

  const block = await web3.eth.getBlock('latest');
  const result = Object.assign({
    "_owner": accounts[0],
    "_treasury": accounts[1],
    "_wallet": accounts[2],
  }, params);

  for (const bmp of BLOCK_MATH_PARAMS) {
    if (!/^\s*\d/.test(result[bmp])) {
      // if "+1000" prefix w/ current block
      result[bmp] = eval(`${block.number}${result[bmp]}`);
    } else {
      // if "100+2352" do not prefix
      result[bmp] = eval(`${result[bmp]}`);
    }

    console.info(
      `> ${bmp}=${result[bmp]} (+${result[bmp] - block.number} blocks) occurs in approx. ` +
      `${ Number(((result[bmp] - block.number) * AVG_BLOCK_TIME) / 3600).toFixed(1) } hours (~13.3 sec/block)`
    );
  }

  for (const hvp of HUMAN_VALUE_PARAMS) {
    result[hvp] = web3.utils.toWei(...result[hvp].split(' ').filter(Boolean));
  }

  for (const bpp of BASIS_POINTS_PARAMS) {
    result[bpp] = result[bpp] * BASIS_POINTS_DEN;
  }

  console.info(`> [${network || 'N/A'}] Params: ${JSON.stringify(result, null, '  ')}`);

  return result;
};

const advanceTime = async (web3, time) => {
  console.info(`> Advance to Block: ${time}`);

  return pify(web3.currentProvider.send)({
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [time],
    id: new Date().getTime(),
  });
}

const advanceBlock = async (web3, _noPrint = false) => {
  await pify(web3.currentProvider.send)({
    jsonrpc: '2.0',
    method: 'evm_mine',
    id: new Date().getTime(),
  });

  const newBlock = (await web3.eth.getBlock('latest')).number;

  _noPrint || console.info(`> Advance to Block: ${newBlock}`);

  return newBlock;
}

const advanceBlockUntil = async (web3, blockNumber) => {
  console.info(`> Advance to Block: ${blockNumber}`);

  while ((await web3.eth.getBlock('latest')).number < blockNumber) {
    await advanceBlock(web3, true);
  }

  return blockNumber;
}

const takeSnapshot = async (web3) => {
  const { result } = await pify(web3.currentProvider.send)({
    jsonrpc: '2.0',
    method: 'evm_snapshot',
    id: new Date().getTime(),
  });

  console.info(`> Snapshot created: ${result}`);

  return result;
}

const revertToSnapShot = async (web3, id) => {
  console.info(`> Revert to: ${id}`);

  return pify(web3.currentProvider.send)({
    jsonrpc: '2.0',
    method: 'evm_revert',
    params: [id],
    id: new Date().getTime(),
  });
}

const eth = (web3, amount) => {
  return web3.utils.toWei(`${amount}`, "ether").toString();
}

module.exports = (web3) => {
  return {
    eth: (...args) => eth(web3, ...args),
    presaleParams: (...args) => presaleParams(web3, ...args),
    advanceTime: (...args) => advanceTime(web3, ...args),
    advanceBlock: (...args) => advanceBlock(web3, ...args),
    advanceBlockUntil: (...args) => advanceBlockUntil(web3, ...args),
    takeSnapshot: (...args) => takeSnapshot(web3, ...args),
    revertToSnapShot: (...args) => revertToSnapShot(web3, ...args),
  };
};
