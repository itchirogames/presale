#!/usr/bin/env sh

AVG_BLOCK_TIME="13.3";

if [ -z "$1" ]; then
  echo "Usage: ./block-time.sh 11165645"
  exit 1
fi

echo "> Fetching latest Ethereum Mainnet block"

ETH_BLOCK=$(curl -s 'https://api.blockcypher.com/v1/eth/main' | python3 -c "import sys, json; print(json.load(sys.stdin)['height'])")
BLOCK_IN_HOURS=$(printf  %.1f $(echo "($1 - $ETH_BLOCK) * $AVG_BLOCK_TIME / 3600" | bc -l))
BLOCK_IN_SECONS=$(echo "($1 - $ETH_BLOCK) * $AVG_BLOCK_TIME" | bc)
BLOCK_UNIX_TIMESTAMP=$(echo "$(date +%s) + $BLOCK_IN_SECONS" | bc)

echo "> Current block: $ETH_BLOCK"
echo "The block $1 occurs in approx. $BLOCK_IN_HOURS hours ($(date --date "@$BLOCK_UNIX_TIMESTAMP"))"
