#!/usr/bin/env sh

echo "> Fetching Ethereum Mainnet gas prices..."
curl https://fees.upvest.co/estimate_eth_fees > .gasprice.json
