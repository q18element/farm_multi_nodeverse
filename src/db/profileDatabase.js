import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import AccountRepository from "./account.js";
import TaskRepository from "./taskDB.js";
import { ROOT_PATH } from "../config.js";
import csv from "csvtojson";

export default class ProfileDatabase {
  /** @protected */
  constructor({ db_path }) {
    this.db_path = db_path;
  }

  static async create({ db_path } = { db_path: path.resolve(ROOT_PATH, "./cache.db") }) {
    const profiledb = new ProfileDatabase({ db_path });
    await profiledb.initDB();
    return profiledb;
  }

  get accountRepository() {
    if (!this._accountRepository) {
      this._accountRepository = new AccountRepository(this.db);
    }
    return this._accountRepository;
  }

  get taskRepository() {
    if (!this._taskRepository) {
      this._taskRepository = new TaskRepository(this.db);
    }
    return this._taskRepository;
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
    id INTEGER PRIMARY KEY,
    username TEXT,
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
    this.db = db;
    return db;
  }

  async resetDB() {
    let db;
    try {
      db = this.initDB();

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

      logger.info("Database reset successfully");
    } catch (error) {
      logger.error(`Database reset failed: ${error.message}`);
      throw error; // Re-throw to handle in caller
    } finally {
      if (db) {
        await db.close();
      }
    }
  }

  async updateDBFromCSV(path) {
    await this.accountRepository.importAccounts(await csv().fromFile(path));
  }
}
