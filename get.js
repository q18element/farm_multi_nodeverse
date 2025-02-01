const Farm = require('./node_handler/automation');
const { processProxies } = require('./proxy_handler/main');
const { processAccountsAndProxies } = require('./proxy_handler/assign_proxy');
const { initDB } = require('./init_db');
const log4js = require('log4js');

// Log4js configuration
log4js.configure({
  appenders: {
    file: { type: 'file', filename: 'automation.log' },
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ['console', 'file'], level: 'info' }
  }
});
const logger = log4js.getLogger();

async function resetDB() {
  const db = await initDB();
  try {
    // Disable foreign keys constraint for SQLite
    await db.exec('PRAGMA foreign_keys = OFF;');
    
    // Drop tables in proper order to avoid foreign key constraints
    await db.exec(`
      DROP TABLE IF EXISTS accounts_proxies;
      DROP TABLE IF EXISTS filtered_proxies;
      DROP TABLE IF EXISTS accounts;
    `);

    // Re-enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');
    
    logger.info('Database reset successfully');
  } finally {
    await db.close();
  }
}

async function main() {
  // Reset database first
  await resetDB();
  
  // Then process as normal
  await processProxies("./config/proxy.txt");
  await processAccountsAndProxies("./config/accounts.txt");
}

main();