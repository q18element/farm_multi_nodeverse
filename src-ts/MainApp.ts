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
  loadedExecutions: ProfileExecution[];
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
    this.loadedExecutions = [];
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
            this.loadedExecutions.push(exe);
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
      const serviceStack: ServiceConfig[] = [];
      const requiredExtension: string[] = [];
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
        continue;
      }

      for (let i = 0; i < account.profile_volume; i++) {
        executions.push({
          load: async () => {
            let _proxy = this._proxies.pop(); // get a proxy
            let _driver = await this.browserManager.startProfile({
              profileDirName: `profile-${convertNameToDirName(account.username)}-${i}`,
              extensions: requiredExtension,
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
              for (let l = 0; l < this.loadRetry; i++) {
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
        await service.load();
      }
    }
  }
  async dailyExecution() {
    const realease = await this.mutex.acquire();
    try {
      for (const accountUsername in this._serviceCache) {
        for (const profileIndex in this._serviceCache[accountUsername]) {
          for (const service of this._serviceCache[accountUsername][profileIndex]) {
            try {
              await service.daily();
            } catch {
              this.logger.error(
                `Daily execution failed for ${accountUsername} profile ${profileIndex} service ${service.serviceName}`
              );
            }
          }
        }
      }
    } finally {
      realease();
    }
  }
  async dailyInterval() {}
}
