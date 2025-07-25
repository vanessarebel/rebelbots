require('dotenv').config();
const cron = require('node-cron');
const { orchestrate } = require('./orchestrator');
const { log } = require('./utils/logger');
require('./dashboard');

log('🚀 LP Hedge Bot Orchestrator Starting...');

const interval = parseInt(process.env.CHECK_INTERVAL || '30');

cron.schedule(`*/${interval} * * * * *`, async () => {
  log('🎯 Running orchestrator...');
  await orchestrate();
});
