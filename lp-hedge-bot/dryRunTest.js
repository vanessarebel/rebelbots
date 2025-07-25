require('dotenv').config();
const { getLPStatus } = require('./services/lpManager');
const { getShortPosition } = require('./services/hypercore');
const { getHypePrice } = require('./services/swap');
const { log } = require('./utils/logger');
const config = require('./strategy-config.json');

(async () => {
  log('🧪 Starting dry run test cycle...');

  const lp = await getLPStatus();
  const short = await getShortPosition();
  const price = await getHypePrice();

  log(`🔍 LP State:
    - HYPE: ${lp.hype.toFixed(2)}
    - USDT0: ${lp.feusdc.toFixed(2)}
    - HYPE Ratio: ${(lp.hypeRatio * 100).toFixed(2)}%
    - Too Far Off-Center: ${lp.tooFarOffCenter}
  `);

  log(`📊 HEDGE State:
    - Short HYPE Size: ${short.toFixed(2)}
    - Current Leverage: ${(short / config.hedge_margin).toFixed(2)}x
    - Price: $${price}
  `);

  // 1. Check if LP needs to be rebuilt
  if (lp.tooFarOffCenter || lp.hypeRatio > config.max_lp_hype_ratio || lp.hypeRatio < config.min_lp_hype_ratio) {
    log('⚠️ LP would be removed and rebuilt.');
    if (lp.hype > lp.feusdc * 1.3) {
      log(`💡 Would sell ${(lp.hype / 2).toFixed(2)} HYPE → USDT0`);
    } else if (lp.feusdc > lp.hype * 1.3) {
      log(`💡 Would buy ${(lp.feusdc / 2).toFixed(2)} HYPE using USDT0`);
    }
  } else {
    log('✅ LP is balanced and within range.');
  }

  // 2. Check hedge alignment
  const delta = lp.hype - short;
  const leverage = short > 0 ? short / config.hedge_margin : 0;

  if (
    Math.abs(delta) > lp.hype * config.hedge_delta_tolerance ||
    leverage > config.max_hedge_leverage ||
    leverage < config.min_hedge_leverage
  ) {
    log(`🧮 Would adjust hedge from ${short.toFixed(2)} to ${lp.hype.toFixed(2)} HYPE`);
  } else {
    log('✅ Hedge is within tolerance.');
  }

  log('🧪 Dry run complete. No live actions taken.');
})();
