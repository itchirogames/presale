const path = require('path');
const fs = require('fs');

const DEFAULT_GAS_PRICE = 60;
const GAS_REPORT_FILE = path.resolve(__dirname, '.gasprice.json');

/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const HDWalletProvider = require('@truffle/hdwallet-provider');
// const infuraKey = "fj4jll3k.....";
//
// const fs = require('fs');
// const mnemonic = fs.readFileSync(".secret").toString().trim();

function etherscanApiKey() {
  return process.env.ETHERSCAN_API_KEY;
}

function providerFunctor(network) {
  return () => {
    const { PRIVATE_KEY, INFURA_API_KEY } = process.env;

    if (!PRIVATE_KEY || !INFURA_API_KEY) {
      throw new Error(`"PRIVATE_KEY" and "INFURA_API_KEY" environment variables MUST be provider`);
    }

    switch(network) {
      case 'rinkeby':
      case 'mainnet':
        break;
      default: throw new Error(`Unknown Infura network "${network}"`);
    }

    return new HDWalletProvider(
      PRIVATE_KEY,
      `https://${network}.infura.io/v3/${INFURA_API_KEY}`,
    );
  };
}

function gasPrice(network) {
  if (!process.env.GAS_PRICE && network == "mainnet") {
    if (!fs.existsSync(GAS_REPORT_FILE)) {
      throw new Error('You MUST wither provide "GAS_PRICE" environment variable or run ./gas.sh script!');
    }
    process.env.GAS_PRICE = JSON.parse(fs.readFileSync(GAS_REPORT_FILE)).estimates.fast;

    if (!process.env.GAS_PRICE) {
      throw new Error(`Failed to parse gas prices from ${path.basename(GAS_REPORT_FILE)}`);
    }
  }

  const price = parseInt(process.env.GAS_PRICE || DEFAULT_GAS_PRICE, 10) * 1000000000;

  console.info(`> [${network}] Gas Price: ${price / 1000000000} gwei (might be overriden by providing "GAS_PRICE" [in gwei] environment variable)`);

  return price;
}

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    rinkeby: {
      provider: providerFunctor("rinkeby"),
      network_id: 4,
      gas: 2000000,
      gasPrice: gasPrice("rinkeby"),
      skipDryRun: true,
    },
    mainnet: {
      provider: providerFunctor("mainnet"),
      network_id: 1,
      gas: 3000000,
      gasPrice: gasPrice("mainnet"),
      skipDryRun: true,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.6.12",
      settings: {
       optimizer: {
         enabled: true,
         runs: 200
       },
       evmVersion: "byzantium",
      }
    },
  },

  api_keys: {
    etherscan: etherscanApiKey(),
  },

  plugins: ["solidity-coverage", "truffle-plugin-verify"],
};
