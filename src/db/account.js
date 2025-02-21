import sqlite3 from "sqlite3";

import log4js from "log4js";
const logger = log4js.getLogger("ProfileDB");

export default class AccountDB {
  constructor(db) {
    /** @type {sqlite3.Database} */
    this.db = db;
  }

  /** @returns {Promise<Account[]>} */
  async loadAccounts() {
    try {
      const accounts = await this.db.all(`
        SELECT * FROM accounts a
      `);
      return accounts.map((account) => ({
        ...account,
        services: JSON.parse(account.services),
      }));
    } catch (error) {
      logger.error(`Failed to load accounts from DB: ${error.message}`);
      return [];
    }
  }
  async importAccounts(accounts) {
    for (const account of accounts) {
      await this.db.run(
        `INSERT INTO accounts (id, username, password, seedphrase, services, profile_volume)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET 
           username = excluded.username,
           password = excluded.password,
           seedphrase = excluded.seedphrase,
           services = excluded.services,
           profile_volume = excluded.profile_volume`,
        [
          account.id,
          account.username,
          account.password,
          account.seedphrase || "",
          JSON.stringify(account.services || []),
          account.profileVolume,
        ]
      );
    }
  }
}
