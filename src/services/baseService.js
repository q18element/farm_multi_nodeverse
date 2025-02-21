import { WebDriverHelper } from "../drivers/webDriverHelper.js";

/**
 * @typedef {{
 * username: string,
 * password: string
 * seedphrase: string
 * }} Credentials
 */

export default class BaseService {
  constructor({ serviceName, config, driver }) {
    this.serviceName = serviceName;
    this.config = config;
    this.auto = new WebDriverHelper(driver);
  }

  /** @param {Credentials} credentials */
  async login(credentials) {
    throw new Error(`login() not implemented for ${this.serviceName}`);
  }

  /** @param {Credentials} credentials */
  async check(credentials) {
    throw new Error(`check() not implemented for ${this.serviceName}`);
  }

  async moveToPinTab() {
    if (this.pinTab) {
      await this.driver.switchTo().window(this.pinTab);
    } else {
      this.pinTab = await this.driver.getWindowHandle();
    }
  }
}
