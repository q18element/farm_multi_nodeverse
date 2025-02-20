// src/repositories/accountRepository.js
const {logger} = require('../utils');

class AccountRepository {
  constructor(db) {
    this.db = db;
  }

  async loadAccounts() {
    try {
      const accounts = await this.db.all(`
        SELECT a.id, a.username, a.password,
               json_group_array(json_object(
                 'proxy', ap.proxy,
                 'run', json(ap.services)
               )) AS proxies
        FROM accounts a
        LEFT JOIN accounts_proxies ap ON a.id = ap.account_id
        GROUP BY a.id
      `);
      return accounts.map(account => ({
        ...account,
        proxies: account.proxies
          ? JSON.parse(account.proxies)
              .map(p => {
                p.run = typeof p.run === 'string' ? JSON.parse(p.run) : p.run;
                return p;
              })
              .filter(p => Array.isArray(p.run) && p.run.length > 0)
          : []
      }));
    } catch (error) {
      logger.error(`Failed to load accounts from DB: ${error.message}`);
      return [];
    }
  }
}

module.exports = AccountRepository;