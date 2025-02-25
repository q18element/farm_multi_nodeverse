import path from "path";
import csv from "csvtojson";
import log4js from "log4js";
import { Mutex, Semaphore, withTimeout } from "async-mutex";

import DatabaseManager from "./database/database.js";
import { Account } from "./database/AccountRepository.js";
import BrowserManager from "./browser/browserManager.js";
import { nameToServiceConfig, ServiceConfig } from "./services/servicesMapping.js";
import { checkProxyWorks, convertNameToDirName, groupArray } from "./utils/index.js";
import BaseService from "./services/baseService.js";
import { ONE_HOUR_MS } from "./constants.js";

interface MainAppOptions {
  wd: string; // working directory
}

interface ProfileExecution {
  account: Account;
  index: number;
  load: () => Promise<void>;
  daily: () => Promise<void>;
  check: () => Promise<any>;
  quit: () => Promise<void>;
}

export default class MainApp {
  protected _accountcsv: string; // Path to account file
  protected _proxycsv: string; // Path to proxy file
  protected _dbPath: string;
  protected _db?: DatabaseManager;
  protected _serviceCache: { [accountUsername: string]: { [profileIndex: string]: BaseService[] } }; // cache account services
  protected _proxies: string[];

  browserManager: BrowserManager;
  logger: log4js.Logger;
  mutex: Mutex;
  thread: number;
  loadRetry: number;
  _loadedExecutions: ProfileExecution[];
  chromeSize: { width: number; height: number; scale: number };

  constructor({ wd }: MainAppOptions) {
    wd = wd || "./";

    this._dbPath = path.resolve(wd, "./data/profile_data.db");
    this._accountcsv = path.resolve(wd, "./input/accounts.csv");
    this._proxycsv = path.resolve(wd, "./input/proxy.csv");
    this.browserManager = new BrowserManager({
      profileDir: path.resolve(wd, "./data/profiles"),
    });
    this._proxies = [];
    this._serviceCache = {};
    this.mutex = new Mutex();
    this.thread = 5;
    this.loadRetry = 3;
    this._loadedExecutions = [];
    this.chromeSize = { width: 1920, height: 1080, scale: 0.5 };
    this.processArgs();
    this.logger = log4js.getLogger(new.target.name);
  }

  protected processArgs(): void {
    // Process command line arguments
  }

  protected async getDB(): Promise<DatabaseManager> {
    return this._db ? this._db : (this._db = await DatabaseManager.open({ dbPath: this._dbPath }));
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

    const executions = groupArray(await this.getProfileExecutions(accounts), this.thread);
    for (const execution of executions) {
      await Promise.all(
        execution.map(async (exe) => {
          this.logger.info(`Processing Profile: ${exe.account.username} index: ${exe.index}`);
          try {
            await exe.load();
            this._loadedExecutions.push(exe);
          } catch (e) {
            this.logger.error(`Error on load Profile ${exe.account.username} index: ${exe.index} err ${e}`);
          }
        })
      );
    }

    this.dailyInterval();
  }
  async getProfileExecutions(accounts: Account[]): Promise<ProfileExecution[]> {
    const executions: ProfileExecution[] = [];
    for (const account of accounts) {
      this._serviceCache[account.username] = this._serviceCache[account.username] || [];

      // start export required extension and service from account.services
      const acc_services = account.services.split(" ");
      const _serviceStack: Set<ServiceConfig> = new Set<ServiceConfig>();
      const requiredExtension: Set<string> = new Set<string>();
      for (const service of acc_services) {
        let __s = nameToServiceConfig(service);
        if (__s) {
          _serviceStack.add(__s);
          __s.extensions.map((e) => requiredExtension.add(e.path));
        }
      }

      if (_serviceStack.size <= 0) {
        this.logger.error(`No valid service found for ${account.username}`);
        console.log(`No valid service found for ${account.username}`);
        continue;
      }
      const serviceStack = Array.from(_serviceStack);
      for (let i = 0; i < account.profile_volume; i++) {
        executions.push({
          load: async () => {
            let _proxy = this._proxies.pop(); // get a proxy
            let _driver = await this.browserManager.startProfile({
              profileDirName: `profile-${convertNameToDirName(account.username)}-${i}`,
              extensions: Array.from(requiredExtension),
              proxy: _proxy,
              chromeSize: this.chromeSize,
            });

            const mainService = new serviceStack[0].service({
              driver: _driver,
              account,
            });
            let _services = [mainService];

            for (let j = 1; j < serviceStack.length; j++) {
              // @ts-ignore
              if (typeof serviceStack[j].maxVolume === "number" && serviceStack[j].maxVolume < i + 1) {
                this.logger.debug(
                  "Skip service " + serviceStack[j].service.name + " because max volume reached " + (i + 1)
                );
                continue;
              }
              _services.push(mainService.childService(serviceStack[j].service));
            }

            this._serviceCache[account.username][i] = _services;
            for (const service of _services) {
              for (let l = 0; l < this.loadRetry; l++) {
                try {
                  await service.load();
                  break;
                } catch (e) {
                  this.logger.error(`Error on load Profile ${account.username} index: ${i} err ${e} retry i: ${l + 1}`);
                  await service.auto.resetTabs();
                }
              }
            }
          },
          daily: async () => {
            for (const service of this._serviceCache[account.username][i]) {
              await service.daily();
            }
          },
          check: async () => {
            for (const service of this._serviceCache[account.username][i]) {
              await service.check();
            }
          },
          quit: async () => {
            for (const service of this._serviceCache[account.username][i]) {
              await service.driver.quit();
              this._serviceCache[account.username][i] = [];
              return;
            }
          },
          account,
          index: i,
        });
      }
    }
    this.logger.debug(executions);

    return executions;
  }

  protected async dailyExecution() {
    const realease = await this.mutex.acquire();
    try {
      const executions = groupArray(this._loadedExecutions, this.thread);
      for (const execution of executions) {
        await Promise.all(execution.map((e) => e.daily().catch((e) => this.logger.error(e))));
      }
    } finally {
      realease();
    }
  }
  async dailyInterval() {
    return setInterval(async () => await this.dailyExecution(), ONE_HOUR_MS);
  }
}
