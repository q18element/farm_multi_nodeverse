// src/services/toggle.js
const BaseService = require('./baseService');
const AutomationAcions = require('../utils/automationActions');
const logger = require('../utils/logger');
const { services: { toggle: toggleConfig } } = require('../config');

class ToggleService extends BaseService {
  constructor(driver) {
    super('toggle', toggleConfig);
    this.driver = driver;
    this.selectors = toggleConfig.selectors;
    this.auto = new AutomationAcions(driver);
  }

  /**
   * Logs into Toggle using the provided credentials.
   * @param {Object} credentials - { username, password }
   */
  async login(credentials) {
    const { username, password } = credentials;
    try {
      // logger.info(`Starting Toggle login for ${username}`);

      const { loginUrl, selectors } = this.config;
      await this.driver.get(loginUrl);

      // Check if already logged in
      try {
        await this.auto.waitForElement(selectors.dashboardElement, 5000);
        // logger.info(`Already logged in to Toggle for ${username}`);
        return true;
      } catch (e) {
        // logger.info(`Proceeding with login for ${username}`);
      }

      await this.auto.enterText(selectors.usernameInput, username);
      await this.auto.enterText(selectors.passwordInput, password);
      await this.auto.clickElement(selectors.loginButton);

      await this.auto.waitForElement(selectors.dashboardElement, 20000);

      // logger.info(`Toggle login success for ${username}`);
      return true;
    } catch (error) {
      // logger.error(`Toggle login failed for ${username}: ${error.message}`);
      return false;
    }
  }

  /**
   * Checks the point balance on Toggle for the given credentials.
   * @param {Object} credentials - { username }
   */
  async check(credentials) {
    const { username } = credentials;
    try {
      const { extensionUrl, selectors } = this.config;

      await this.driver.get(extensionUrl);
      await this.driver.sleep(3000);

      const qualityText = await this.auto.getTextSafe(selectors.quality);
      const epochText = await this.auto.getTextSafe(selectors.epoch);
      const uptimeText = await this.auto.getTextSafe(selectors.uptime);

      // logger.info(`Toggle status for ${username}:
    //   Connection Quality: ${qualityText}
    //   Epoch Value: ${epochText}
    //   Uptime: ${uptimeText}`);

      let points = parseInt(epochText.replace(/\D/g, ''), 10);
      if (isNaN(points)) points = 0;

      return points;
    } catch (error) {
      // logger.error(`Toggle check failed for ${username}: ${error.message}`);
      return false;
    }
  }
}

module.exports = ToggleService;
