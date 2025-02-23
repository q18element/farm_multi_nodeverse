import sqlite3 from "sqlite3";
import { open } from "sqlite";
import csv from "csvtojson";
import AccountRepository from "./AccountRepository.js";
export default class DatabaseManager {
    db_path;
    db;
    _accountRepository;
    constructor({ db_path }) {
        this.db_path = db_path;
    }
    get profileRepository() {
        if (!this.db) {
            throw new Error("Database not initialized");
        }
        if (!this._accountRepository) {
            this._accountRepository = new AccountRepository(this.db);
        }
        return this._accountRepository;
    }
    static async open({ db_path }) {
        const profiledb = new DatabaseManager({ db_path: db_path });
        await profiledb.initDB();
        return profiledb;
    }
    async initDB() {
        if (this.db) {
            return this.db;
        }
        const db = await open({
            filename: this.db_path,
            driver: sqlite3.Database,
        });
        await db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT,
          seedphrase TEXT,
          services TEXT,
          profile_volume INTEGER
      );

      CREATE TABLE IF NOT EXISTS task_monitoring (
          id INTEGER PRIMARY KEY,
          account_id INTEGER NOT NULL,
          proxy TEXT NOT NULL,
          service TEXT NOT NULL,
          state TEXT NOT NULL DEFAULT 'pending',
          retry_count INTEGER NOT NULL DEFAULT 0,
          point INTEGER NOT NULL DEFAULT 0,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(account_id) REFERENCES accounts(id)
      );
    `);
        return this.db = db;
    }
    async resetDB() {
        let db;
        try {
            db = await this.initDB();
            // Disable foreign key constraints (SQLite specific)
            await db.exec("PRAGMA foreign_keys = OFF;");
            // Drop tables in safe order
            await db.exec(`
        DROP TABLE IF EXISTS accounts_proxies;
        DROP TABLE IF EXISTS filtered_proxies;
        DROP TABLE IF EXISTS accounts;
        DROP TABLE IF EXISTS task_monitoring;
      `);
            // Re-enable foreign keys
            await db.exec("PRAGMA foreign_keys = ON;");
            console.info("Database reset successfully");
        }
        catch (error) {
            console.error(`Database reset failed: ${error.message}`);
            throw error; // Re-throw to handle in caller
        }
        finally {
            if (db) {
                await db.close();
            }
        }
    }
    async updateAccountFromCSV(filePath) {
        await this.profileRepository.importAccounts(await csv().fromFile(filePath));
    }
}
