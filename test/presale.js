const Presale = artifacts.require("Presale");
const Token = artifacts.require("Token");
const utilsFunctor = require('../utils');

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Presale", function(accounts) {
  var params, token, presale;

  const INVESTOR1 = accounts.pop();
  const INVESTOR2 = accounts.pop();
  const OWNER_WALLET = accounts.pop();
  const { eth, presaleParams, takeSnapshot, revertToSnapShot, advanceBlockUntil } = utilsFunctor(web3);

  before("Deploy Presale Contract", async () => {
    token = await Token.new();
    params = await presaleParams({
      _token: token.address,
      _startBlock: "+0",
      _endBlock: "+10",
      _endRefundBlock: "+10*2",
      _supply: "10 ether", // tokens supply
      _rate: "2", // 2 tokens per ether
      _maxInvestment: "3 ether",
    });
    presale = await Presale.new(
      params._owner,
      params._treasury,
      params._token,
      params._startBlock,
      params._endBlock,
      params._endRefundBlock,
      params._supply,
      params._rate,
      "1" // "_maxInvestment" to be tested in "update details test"
    );
    await token.mint(presale.address, params._supply);
  });

  it("update details", async () => {
    let failed = false;

    try {
      await presale.updateDetails(
        params._startBlock,
        params._endBlock,
        params._endRefundBlock,
        params._supply,
        params._rate,
        params._maxInvestment,
        { from: params._owner }
      );
    } catch (e) {
      failed = true;
    }

    assert.equal(
      failed,
      false,
      "owner was not able to update sale details"
    );
  });


  it("whitelist", async () => {
    assert.equal(
      await presale.isInvestor.call(INVESTOR1),
      false,
      "anyone can invest"
    );
    await presale.whitelistInvestors([ INVESTOR1, INVESTOR2, OWNER_WALLET ], { from: params._owner });
    assert.equal(
      await presale.isInvestor.call(OWNER_WALLET),
      true,
      "unable to whitelist an investor"
    );
    await presale.unwhitelistInvestors([  OWNER_WALLET ], { from: params._owner });
    assert.equal(
      await presale.isInvestor.call(OWNER_WALLET),
      false,
      "unable to unwhitelist an investor"
    );
  });

  it("investment calculus", async () => {
    const calcLess = await presale.calculateInvestment.call(INVESTOR1, eth(1));
    const calcWhole = await presale.calculateInvestment.call(INVESTOR1, eth(3));
    const calcMore = await presale.calculateInvestment.call(INVESTOR1, eth(4));

    assert.equal(
      calcLess.investment,
      eth(1),
      "[less] wrong investment amount"
    );
    assert.equal(
      calcLess.tokensToSend,
      eth(2),
      "[less] wrong amount of tokens to send"
    );
    assert.equal(
      calcLess.refundValue,
      "0",
      "[less] wrong refund value"
    );
    assert.equal(
      calcWhole.investment,
      eth(3),
      "[whole] wrong investment amount"
    );
    assert.equal(
      calcWhole.tokensToSend,
      eth(6),
      "[whole] wrong amount of tokens to send"
    );
    assert.equal(
      calcWhole.refundValue,
      "0",
      "[whole] wrong refund value"
    );
    assert.equal(
      calcMore.investment,
      eth(3),
      "[more] wrong investment amount"
    );
    assert.equal(
      calcMore.tokensToSend,
      eth(6),
      "[more] wrong amount of tokens to send"
    );
    assert.equal(
      calcMore.refundValue,
      eth(1),
      "[more] wrong refund value"
    );
  });

  it("investment", async () => {
    const treasuryBalance = await web3.eth.getBalance(params._treasury);

    assert.equal(
      (await presale.availableInvestment.call(INVESTOR1)).toString(),
      params._maxInvestment,
      "wrong investment amount is calculated"
    );
    
    // through invest()
    await presale.invest(INVESTOR1, { from: INVESTOR1, value: eth(1) });
    // through receive()
    await presale.sendTransaction({ from: INVESTOR1, value: eth(1) });
    // through fallback()
    await presale.sendTransaction({ from: INVESTOR1, value: eth(1), data: '0xcdcd77c000000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001' });

    assert.equal(
      (await presale.supply.call()).toString(),
      eth(4),
      "wrong remaining supply"
    );
    assert.equal(
      (await presale.invested.call()).toString(),
      eth(3),
      "wrong total investments amount"
    );
    assert.equal(
      (await presale.tokensSold.call()).toString(),
      eth(6),
      "wrong total investments amount"
    );
    assert.equal(
      (await presale.investedAmount.call(INVESTOR1)).toString(),
      eth(3),
      "wrong invested amount"
    );
    assert.equal(
      (await presale.tokensReceived.call(INVESTOR1)).toString(),
      eth(6),
      "wrong tokens received amount"
    );
    assert.equal(
      (await token.balanceOf.call(INVESTOR1)).toString(),
      eth(6),
      "wrong tokens received amount"
    );
    assert.equal(
      (await web3.eth.getBalance(params._treasury)).toString(),
      web3.utils.toBN(treasuryBalance)
        .add(
          web3.utils.toBN(eth(3))
        ).toString(),
      "wrong treasury balance"
    );
  });

  it("investment on funds overflow", async () => {
    const treasuryBalance = await web3.eth.getBalance(params._treasury);
    
    await presale.invest(INVESTOR2, { from: INVESTOR2, value: eth(3) });

    assert.equal(
      (await presale.supply.call()).toString(),
      eth(0),
      "wrong remaining supply"
    );
    assert.equal(
      (await presale.invested.call()).toString(),
      eth(5),
      "wrong total investments amount"
    );
    assert.equal(
      (await presale.tokensSold.call()).toString(),
      eth(10),
      "wrong total investments amount"
    );
    assert.equal(
      (await presale.investedAmount.call(INVESTOR2)).toString(),
      eth(2),
      "wrong invested amount"
    );
    assert.equal(
      (await presale.tokensReceived.call(INVESTOR2)).toString(),
      eth(4),
      "wrong tokens received amount"
    );
    assert.equal(
      (await token.balanceOf.call(INVESTOR2)).toString(),
      eth(4),
      "wrong tokens received amount"
    );
    assert.equal(
      (await web3.eth.getBalance(params._treasury)).toString(),
      web3.utils.toBN(treasuryBalance)
        .add(
          web3.utils.toBN(eth(2))
        ).toString(),
      "wrong treasury balance"
    );
  });

  it("investment fail when paused", async () => {
    let failed = false;

    await presale.updatePaused(true, { from: params._owner });

    try {
      await presale.invest(INVESTOR2, { from: INVESTOR2, value: eth(1) });
    } catch (e) {
      failed = true;
    }

    await presale.updatePaused(false, { from: params._owner });

    assert.equal(
      failed,
      true,
      "investor was able to invest when presale paused"
    );
  });

  it("refund", async () => {
    const snapshotId = await takeSnapshot();
    const investorBalance = await web3.eth.getBalance(INVESTOR2);

    assert.equal(
      (await presale.availableRefund.call(INVESTOR2)).toString(),
      eth(1),
      "wrong available refund amount"
    );
    
    await presale.claimRefund(INVESTOR2, { from: INVESTOR1 });

    assert.equal(
      (await presale.availableRefund.call(INVESTOR2)).toString(),
      eth(0),
      "wrong remaining refund amount"
    );
    assert.equal(
      (await presale.availableRefund.call(INVESTOR2)).toString(),
      eth(0),
      "wrong remaining refund amount"
    );

    assert.equal(
      (await web3.eth.getBalance(INVESTOR2)).toString(),
      web3.utils.toBN(investorBalance)
        .add(
          web3.utils.toBN(eth(1))
        ).toString(),
      "wrong investor balance after refund claimed"
    );

    await revertToSnapShot(snapshotId);
  });

  it("refund fail when paused", async () => {
    let failed = false;

    await presale.updatePaused(true, { from: params._owner });

    try {
      await presale.claimRefund(INVESTOR2, { from: INVESTOR1 });
    } catch (e) {
      failed = true;
    }

    await presale.updatePaused(false, { from: params._owner });

    assert.equal(
      failed,
      true,
      "investor was able to claim refund after presale paused"
    );
    assert.equal(
      (await presale.availableRefund.call(INVESTOR2)).toString(),
      eth(1),
      "wrong available refund amount after claim"
    );
  });

  it("refund fail after end block", async () => {
    await advanceBlockUntil(params._endRefundBlock + 1);

    assert.equal(
      (await presale.availableRefund.call(INVESTOR2)).toString(),
      eth(1),
      "wrong available refund amount"
    );

    let failed = false;

    try {
      await presale.claimRefund(INVESTOR2, { from: INVESTOR1 });
    } catch (e) {
      failed = true;
    }

    assert.equal(
      failed,
      true,
      "investor was able to claim refund after refund end block"
    );
    assert.equal(
      (await presale.availableRefund.call(INVESTOR2)).toString(),
      eth(1),
      "wrong available refund amount after claim"
    );
  });

  it("owner claim", async () => {
    const walletBalance = await web3.eth.getBalance(OWNER_WALLET);
    
    await token.mint(presale.address, eth(4));

    assert.equal(
      (await web3.eth.getBalance(presale.address)).toString(),
      eth(1),
      "wrong amount of ether remaining locked in presale contract"
    );

    await presale.claimUnclaimedRefunds(OWNER_WALLET, { from: params._owner });
    await presale.claimUnsoldTokens(OWNER_WALLET, { from: params._owner });

    assert.equal(
      (await web3.eth.getBalance(presale.address)).toString(),
      "0",
      "there remains some ether in presale contract after claim"
    );
    assert.equal(
      (await token.balanceOf.call(presale.address)).toString(),
      "0",
      "there remains some tokens in presale contract after claim"
    );
    assert.equal(
      (await web3.eth.getBalance(OWNER_WALLET)).toString(),
      web3.utils.toBN(walletBalance)
        .add(
          web3.utils.toBN(eth(1))
        ).toString(),
      "wrong amount of ether on owner wallet after claim"
    );
    assert.equal(
      (await token.balanceOf.call(OWNER_WALLET)).toString(),
      eth(4),
      "wrong amount of ether on owner wallet after claim"
    );
  });
});
