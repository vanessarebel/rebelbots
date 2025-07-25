const fs = require('fs-extra');
const path = './logs/trades.csv';

// ✅ Console logger with timestamp
exports.log = (msg) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${msg}`);
};

// ✅ CSV logger for LP/hedge actions
exports.logTradeCSV = async (lp, short, delta, action, amount) => {
  const now = new Date().toISOString();
  await fs.ensureFile(path);

  const line = `${now},${lp},${short},${delta},${action},${amount}\n`;

  const exists = fs.existsSync(path);
  const needsHeader = !exists || fs.readFileSync(path).toString().trim() === '';

  if (needsHeader) {
    await fs.appendFile(path, 'timestamp,lp_hype,short_hype,delta,action,amount\n');
  }

  await fs.appendFile(path, line);
};
