// src/services/openloop.js
const BaseService = require('./baseService');
const {AutomationAcions} = require('../utils/automationActions');
const logger = require('../utils/logger');
const { services: { openloop: openloopConfig } } = require('../config');

class OpenloopService extends BaseService {
  constructor(driver) {
    super('openloop', openloopConfig);
    this.driver = driver;
    this.selectors = openloopConfig.selectors;
    this.auto = new AutomationAcions(driver);
  }

  /**
   * Logs into Openloop using the provided credentials.
   * @param {Object} credentials - { username, password }
   */
  async login(credentials) {
    const { username, password } = credentials;
    try {
      // logger.info(`Starting Openloop login for ${username}`);

      const { loginUrl, extensionUrl, selectors } = this.config;

      await this.driver.get(loginUrl);
      await this.auto.safeClick(selectors.continueButton, 1000);

      const usernameField = await this.auto.waitForElement(selectors.usernameInput, 10000);
      const passwordField = await this.auto.waitForElement(selectors.passwordInput, 10000);
      const loginButton = await this.auto.waitForElement(selectors.loginButton, 10000);

      await usernameField.sendKeys(username);
      await passwordField.sendKeys(password);
      await loginButton.click();

      await this.driver.sleep(3000);

      // Navigate to extension URL to confirm login
      await this.driver.get(extensionUrl);
      await this.auto.safeClick(selectors.continueButton, 2000);
      await this.auto.waitForElement(selectors.loginConfirmElement, 20000);

      // logger.info(`Openloop login success for ${username}`);
      return true;
    } catch (error) {
      // logger.error(`Openloop login failed for ${username}: ${error.message}`);
      return false;
    }
  }

  /**
   * Checks the earnings on Openloop for the given credentials.
   * @param {Object} credentials - { username }
   */
  async check(credentials) {
    const { username } = credentials;
    try {
      const { extensionUrl, selectors } = this.config;

      await this.driver.get(extensionUrl);
      await this.auto.safeClick(selectors.continueButton);

      const statusText = await this.auto.getTextSafe(selectors.status);
      const qualityText = await this.auto.getTextSafe(selectors.quality);
      const earningsText = await this.auto.getTextSafe(selectors.earnings);

      // logger.info(`Openloop status for ${username}:
    //   Status: ${statusText}
    //   Connection Quality: ${qualityText}
    //   Earnings: ${earningsText}`);

      let points = parseFloat(earningsText.replace(/[^\d.]/g, ''));
      if (isNaN(points)) points = 0;

      return points;
    } catch (error) {
      // logger.error(`Openloop check failed for ${username}: ${error.message}`);
      return false;
    }
  }
}

module.exports = OpenloopService;
