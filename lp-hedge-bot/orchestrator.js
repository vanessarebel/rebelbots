const { getLPStatus, removeLP, rebuildLP } = require('./services/evm');
const { getShortPosition, updateShortPosition } = require('./services/hypercore');
const { swapHYPEtoUSDT0, swapUSDT0toHYPE, getHypePrice } = require('./services/swap');
const { log } = require('./utils/logger');
const config = require('./strategy-config.json');

exports.orchestrate = async () => {
  try {
    const lp = await getLPStatus();
    const price = await getHypePrice();

    if (lp.tooFarOffCenter || lp.hypeRatio > config.max_lp_hype_ratio || lp.hypeRatio < config.min_lp_hype_ratio) {
      log('🔁 LP is off-center or imbalanced, removing...');
      const assets = await removeLP();

      if (assets.hype > assets.feusdc * 1.3) {
        await swapHYPEtoUSDT0(assets.hype / 2, config.slippage);
      } else if (assets.feusdc > assets.hype * 1.3) {
        await swapUSDT0toHYPE(assets.feusdc / 2, config.slippage);
      }

      await rebuildLP({ feeTier: 0.003, strategy: 'centered' });
    }

    const short = await getShortPosition();
    const delta = lp.hype - short;
    const leverage = short > 0 ? short / config.hedge_margin : 0;

    if (
      Math.abs(delta) > lp.hype * config.hedge_delta_tolerance ||
      leverage > config.max_hedge_leverage ||
      leverage < config.min_hedge_leverage
    ) {
      log(`🧮 Adjusting hedge to match LP HYPE: ${lp.hype}`);
      await updateShortPosition(lp.hype);
    }
  } catch (err) {
    log(`❌ Error in orchestrator: ${err.message}`);
  }
};
