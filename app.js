// main.js

const AutomationManager = require('./node_handler/automationManager');
const { processProxies } = require('./proxy_handler/main');
const { processAccountsAndProxies } = require('./proxy_handler/assign_proxy');
const { resetDB } = require('./db_utils'); // Your existing reset function

async function main() {
  await resetDB();
  
  // Process raw files into DB
  await processProxies("./config/proxy.txt");
  await processAccountsAndProxies("./config/accounts.txt");

  // Run automation from DB cache
  const manager = new AutomationManager();
  await manager.run();
}

main().catch(e => console.error('Main error:', e));