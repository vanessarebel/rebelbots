const { ethers } = require('ethers');
require('dotenv').config();

const LP_MANAGER_ADDRESS = '0x56abfaf40f5b7464e9cc8cff1af13863d6914508';
const LP_ABI = [
  'function getPosition(uint256 tokenId) view returns (uint160 sqrtPriceX96, int24 tickLower, int24 tickUpper, uint256 amount0, uint256 amount1)'
];

const provider = new ethers.JsonRpcProvider(process.env.HYPERLIQUID_EVM_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const lpManager = new ethers.Contract(LP_MANAGER_ADDRESS, LP_ABI, provider);

const config = require('../strategy-config.json');

exports.getLPStatus = async () => {
  const tokenId = parseInt(process.env.LP_POSITION_ID);
  const [sqrtPriceX96, tickLower, tickUpper, amount0, amount1] = await lpManager.getPosition(tokenId);

  const price = Math.pow(sqrtPriceX96 / Math.pow(2, 96), 2);
  const currentTick = Math.floor(Math.log(price) / Math.log(1.0001));
  const midTick = (tickLower + tickUpper) / 2;

  const tooFarOffCenter = Math.abs(currentTick - midTick) > config.lp_tick_deviation_limit;

  const hype = parseFloat(ethers.formatUnits(amount0, 18));
  const feusdc = parseFloat(ethers.formatUnits(amount1, 18));
  const hypeRatio = hype / (hype + feusdc);

  return { hype, feusdc, hypeRatio, tooFarOffCenter };
};
