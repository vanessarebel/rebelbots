const axios = require('axios');
require('dotenv').config();

const API = process.env.HYPERCORE_API;
const WALLET = process.env.WALLET_ADDRESS;

// ✅ Get short position size from Hypercore
exports.getShortPosition = async () => {
  const { data } = await axios.post(`${API}/info`, {
    type: 'allMidsAndUser',
    user: WALLET
  });

  const position = data.userPositions.find(
    (p) => p.coin === 'HYPE' && p.side === 'short'
  );

  return position ? parseFloat(position.szi) : 0;
};

// ✅ Stubbed: adjust short position via Core Writer or order logic
exports.updateShortPosition = async (targetSize) => {
  // In dry run, we won’t actually trade — just log it
  return {
    action: 'adjust',
    amount: targetSize,
    newShort: targetSize
  };
};
