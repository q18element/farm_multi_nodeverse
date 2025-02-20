// src/services/depined.js
const BaseService = require('./baseService');
const {AutomationAcions} = require('../utils/automationActions');
const logger = require('../utils/logger');
const { services: { depined: depinedConfig } } = require('../config');

class DepinedService extends BaseService {
  constructor(driver) {
    super('depined', depinedConfig);
    this.driver = driver;
    this.selectors = depinedConfig.selectors;
    this.auto = new AutomationAcions(driver);
  }

  /**
   * Logs into Depined using the provided credentials.
   * @param {Object} credentials - { username, password }
   */
  async login(credentials) {
    const { username, password } = credentials;
    try {
      // logger.info(`Starting Depined login for ${username}`);

      const { loginUrl, selectors } = this.config;
      await this.driver.get(loginUrl);

      await this.auto.enterText(selectors.usernameInput, username);
      await this.auto.enterText(selectors.passwordInput, password);

      await this.auto.clickElement(selectors.loginButton);
      await this.driver.sleep(3000);

      await this.auto.waitForElement(selectors.loginConfirmDashboard, 10000);

      // logger.info(`Depined login success for ${username}`);
      return true;
    } catch (error) {
      // logger.error(`Depined login failed for ${username}: ${error.message}`);
      return false;
    }
  }

  /**
   * Checks the point balance on Depined for the given credentials.
   * @param {Object} credentials - { username }
   */
  async check(credentials) {
    const { username } = credentials;
    try {
      const { extensionUrl, selectors } = this.config;

      await this.driver.get(extensionUrl);
      await this.driver.sleep(2000);

      await this.auto.safeClick(selectors.connectButton);
      await this.driver.sleep(5000);

      const pointValueText = await this.auto.getTextSafe(selectors.pointValue);
      // logger.info(`Depined point value for ${username}: ${pointValueText}`);

      let points = parseInt(pointValueText.replace(/\D/g, ''), 10);
      if (isNaN(points)) points = 0;

      return points;
    } catch (error) {
      // logger.error(`Depined check failed for ${username}: ${error.message}`);
      return false;
    }
  }
}

module.exports = DepinedService;
