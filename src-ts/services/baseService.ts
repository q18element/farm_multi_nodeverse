import { WebDriver } from "selenium-webdriver";
import WebDriverHelper from "../driver_utils/webDriverHelper.js";
import { Account } from "../database/AccountRepository.js";
import log4js from "log4js";
export { BaseServiceOptions };
interface BaseServiceOptions {
  serviceName?: string;
  config?: Record<string, any>;
  driver: WebDriver;
  account: Account;
  auto?: WebDriverHelper;
}

export default abstract class BaseService {
  serviceName?: string;
  config?: Record<string, any>;
  auto: WebDriverHelper;
  protected pinTab?: string;
  driver: WebDriver;
  account: Account;
  logger: log4js.Logger;

  constructor({ serviceName, config, driver, auto, account }: BaseServiceOptions) {
    this.serviceName = serviceName;
    this.config = config;
    this.driver = driver;
    this.auto = auto || new WebDriverHelper(driver);
    this.account = account;
    this.logger = log4js.getLogger(new.target.name);
  }
  childService<T extends BaseService>(service: new (opt: BaseServiceOptions) => T): T {
    return new service({
      serviceName: this.serviceName,
      config: this.config,
      driver: this.driver,
      auto: this.auto,
      account: this.account,
    });
  }

  /** this function run on service start to makesure service account is logged in */
  abstract load(): Promise<void>;
  /** this will check and return point then back to load state */
  abstract check(): Promise<any>;
  /** run daily tab */
  abstract daily(): Promise<void>;
}
