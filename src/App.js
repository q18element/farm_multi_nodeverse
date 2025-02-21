import path from "path";
import csv from "csvtojson";

import { ROOT_PATH } from "./config.js";
import ProfileDatabase from "./db/profileDatabase.js";

import { initializeDriver } from "./drivers/driverFactory.js";



/**
 * @typedef {{
 * id: number
 * username: string,
 * password: string
 * seedphrase: string
 * services: string
 * proxy: string
 * }} Profile
 */

export default class MainApp {
  constructor() {
    this.db_path = path.resolve(ROOT_PATH, "./data/profile_data.db");
    this.accountcsv = path.resolve(ROOT_PATH, "./input/taikhoan.csv");
    // this.proxyTxt = path.resolve(ROOT_PATH, "./input/proxy.csv");
    this.processArgs();
  }

  processArgs() {
    // Process command line arguments
  }
  // async getProxies() {
  //   return await csv().fromFile(this.proxyTxt);
  // }
  async getDB() {
    return this._db ? this._db : (this._db = await ProfileDatabase.create({ db_path: this.db_path }));
  }

  async getAccounts() {
    return await csv().fromFile(this.accountcsv);
  }
  async run() {
    const db = await this.getDB();
    await db.updateDBFromCSV(this.accountcsv);

    // Process open process
    for (const account of await this.getAccounts()) {
      await this.processAccountServices(account);
    }
  }

  async processAccountServices(account) {
    const servicesName = account.services.split(" ");
    const loadExtensions = [];
    const services = [];
    for (const serviceName of servicesName) {
      const Service = ServicesMapping[serviceName.toLowerCase()];
      if (Service) {
        loadExtensions.concat(Service.requiredExtensions());
        services.push(Service);
      }
    }
    const driver = await initializeDriver(account, loadExtensions);
    for (const service of services) {
      const serviceInstance = new service(driver);
      await serviceInstance.login(account);
    }
  }
}
