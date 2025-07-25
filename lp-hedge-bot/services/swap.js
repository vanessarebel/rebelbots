const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config();

const routerAbi = [
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "tokenIn", "type": "address" },
          { "internalType": "address", "name": "tokenOut", "type": "address" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" },
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" },
          { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "internalType": "struct ISwapRouter.ExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInputSingle",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
];

const provider = new ethers.JsonRpcProvider(process.env.HYPERLIQUID_EVM_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const HYPE = '0x5555555555555555555555555555555555555555';
const USDT0 = '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb';
const ROUTER = '0x6D99e7f6747AF2cDbB5164b6DD50e40d4fbDe177'; // Verified router

const hype = new ethers.Contract(HYPE, erc20Abi, wallet);
const usdt0 = new ethers.Contract(USDT0, erc20Abi, wallet);
const router = new ethers.Contract(ROUTER, routerAbi, wallet);

exports.getHypePrice = async () => {
  const { data } = await axios.post('https://api.hyperliquid.xyz/info', {
    type: 'allMids'
  });
  return parseFloat(data.coinMids.HYPE.mid);
};

exports.swapHYPEtoUSDT0 = async (amount, slippage = 0.01) => {
  const price = await exports.getHypePrice();
  const amountIn = ethers.parseUnits(amount.toString(), 18);
  const minOut = ethers.parseUnits((amount * price * (1 - slippage)).toFixed(6), 6);

  await hype.approve(ROUTER, amountIn);

  const params = {
    tokenIn: HYPE,
    tokenOut: USDT0,
    fee: 3000,
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 60,
    amountIn: amountIn,
    amountOutMinimum: minOut,
    sqrtPriceLimitX96: 0
  };

  const tx = await router.exactInputSingle(params, { value: 0 });
  await tx.wait();
  console.log(`✅ Swapped ${amount} HYPE → USDT0`);
};

exports.swapUSDT0toHYPE = async (amount, slippage = 0.01) => {
  const price = await exports.getHypePrice();
  const amountIn = ethers.parseUnits(amount.toString(), 6);
  const minOut = ethers.parseUnits((amount / price * (1 - slippage)).toFixed(6), 18);

  await usdt0.approve(ROUTER, amountIn);

  const params = {
    tokenIn: USDT0,
    tokenOut: HYPE,
    fee: 3000,
    recipient: wallet.address,
    deadline: Math.floor(Date.now() / 1000) + 60,
    amountIn: amountIn,
    amountOutMinimum: minOut,
    sqrtPriceLimitX96: 0
  };

  const tx = await router.exactInputSingle(params, { value: 0 });
  await tx.wait();
  console.log(`✅ Swapped ${amount} USDT0 → HYPE`);
};
