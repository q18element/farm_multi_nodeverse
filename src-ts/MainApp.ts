import path from "path";
import csv from "csvtojson";
import log4js from "log4js";
import DatabaseManager from "./database/database.js";
import { Account } from "./database/AccountRepository.js";
import BrowserManager from "./browser/browserManager.js";
import { nameToServiceConfig } from "./services/servicesMapping.js";
import { checkProxyWorks, convertNameToDirName } from "./utils/index.js";
import BaseService from "./services/baseService.js";

interface MainAppOptions {
  wd: string;
}

export default class MainApp {
  protected _accountcsv: string; // Path to account file
  protected _proxycsv: string; // Path to proxy file
  protected _db_path: string;
  protected _db?: DatabaseManager;
  protected _serviceCache: { [accountUsername: string]: { [profileIndex: string]: BaseService[] } }; // cache account services
  protected _proxies: string[];

  browserManager: BrowserManager;
  logger: log4js.Logger;

  constructor({ wd }: MainAppOptions) {
    wd = wd || "./";

    this._db_path = path.resolve(wd, "./data/profile_data.db");
    this._accountcsv = path.resolve(wd, "./input/accounts.csv");
    this._proxycsv = path.resolve(wd, "./input/proxy.csv");
    this.browserManager = new BrowserManager({
      profileDir: path.resolve(wd, "./data/profiles"),
    });
    this._proxies = [];
    this._serviceCache = {};
    this.processArgs();
    this.logger = log4js.getLogger(new.target.name);
  }

  protected processArgs(): void {
    // Process command line arguments
  }

  protected async getDB(): Promise<DatabaseManager> {
    return this._db ? this._db : (this._db = await DatabaseManager.open({ dbPath: this._db_path }));
  }

  /** read all account on account.csv */
  async getAccounts(): Promise<Account[]> {
    return await csv().fromFile(this._accountcsv);
  }

  protected async __beforeRun(): Promise<void> {
    const db = await this.getDB();
    await db.profileRepository.importAccounts(await this.getAccounts());
    this._proxies = await checkProxyWorks(...(await csv().fromFile(this._proxycsv)).map((p) => p.proxy));
  }

  async run(): Promise<void> {
    await this.__beforeRun();

    const accounts = await this.getAccounts();
    this.logger.debug(accounts);
    for (const account of accounts) {
      this.logger.debug(`Processing account: ${account.username}`);
      await this.processAccountServices(account);
    }
  }

  async processAccountServices(account: Account) {
    this._serviceCache[account.username] = this._serviceCache[account.username] || []; // cache account services

    // start export required extension and service from account.services
    const acc_services = account.services.split(" ");
    const serviceStack = [];
    const requiredExtension = [];
    for (const service of acc_services) {
      let __s = nameToServiceConfig(service);
      if (__s) {
        serviceStack.push(__s);
        requiredExtension.push(...__s.extensions.map((e) => e.path));
      }
    }

    if (serviceStack.length <= 0) {
      this.logger.error(`No valid service found for ${account.username}`);
      console.log(`No valid service found for ${account.username}`);
      return;
    }

    // process profiles of account with proxy
    for (let i = 0; i < account.profile_volume; i++) {
      let _proxy = this._proxies.pop();
      let _driver = await this.browserManager.startProfile({
        profileDirName: `profile-${convertNameToDirName(account.username)}-${i}`,
        extensions: requiredExtension,
        proxy: _proxy,
      });
      const mainService = new serviceStack[0].service({
        driver: _driver,
        account,
      });
      let _services = [mainService];

      for (let i = 1; i < serviceStack.length; i++) {
        _services.push(mainService.childService(serviceStack[i].service));
      }

      this._serviceCache[account.username][i] = _services;
      for (const service of _services) {
        await service.load(account);
      }
    }
  }
}
