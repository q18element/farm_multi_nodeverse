import path from "path";
import csv from "csvtojson";
import { ROOT_PATH } from "./constants";
import { DatabaseManager, Account } from "./database/index.js";
import BrowserManager from "./browser/browserManager.js";
export default class MainApp {
  private accountcsv: string; // Path to account file
  private proxycsv: string; // Path to proxy file

  private db_path: string;
  private _db?: DatabaseManager;
  browserManager: BrowserManager;

  constructor() {
    this.db_path = path.resolve(ROOT_PATH, "./data/profile_data.db");
    this.accountcsv = path.resolve(ROOT_PATH, "./input/accounts.csv");
    this.proxycsv = path.resolve(ROOT_PATH, "./input/proxy.csv");
    this.browserManager = new BrowserManager();
    this.processArgs();
  }

  processArgs(): void {
    // Process command line arguments
  }

  

  async getDB(): Promise<DatabaseManager> {
    return this._db ? this._db : (this._db = await DatabaseManager.open({ db_path: this.db_path }));
  }

  async getAccounts(): Promise<Account[]> {
    return await csv().fromFile(this.accountcsv);
  }
  
  protected async __beforeRun(): Promise<void> {
    const db = await this.getDB();
    await db.updateAccountFromCSV(this.accountcsv);
  }

  async run(): Promise<void> {
    await this.__beforeRun();

    const accounts = await this.getAccounts();
    for (const account of accounts) {
      await this.processAccountServices(account);
    }
  }

  async processAccountServices(account: Account) {
    throw new Error("Method not implemented.");
  }
}
