// src/services/despeed.js
const BaseService = require('./baseService');
const {AutomationAcions} = require('../utils/automationActions');
const logger = require('../utils/logger');
const { services: { despeed: despeedConfig, hcapchaSolver: hcapchaSolverConfig } } = require('../config');

class DespeedService extends BaseService {
  constructor(driver) {
    super('despeed', despeedConfig);
    this.driver = driver;
    this.selectors = despeedConfig.selectors;
    this.auto = new AutomationAcions(driver);
  }

  /**
   * Logs into Despeed using the provided credentials.
   * @param {Object} credentials - { username, password }
   */
  async login(credentials) {
    const { username, password } = credentials;
    try {
      // logger.info(`Starting Despeed login for ${username}`);

      // Open hCaptcha Solver extension URL
      await this.driver.get(hcapchaSolverConfig.extensionUrl);
      await this.driver.sleep(3000);

      // Open login URL
      await this.driver.get(this.config.loginUrl);

      // Wait for hCaptcha to be solved
      await this.auto.waitForElement(this.selectors.hcapchaChecked, 300000); // Adjust timeout if needed
      // logger.info(`Captcha solved for ${username}`);

      // Perform login
      await this.auto.enterText(this.selectors.usernameInput, username);
      await this.auto.enterText(this.selectors.passwordInput, password);
      await this.driver.sleep(1000);
      await this.auto.clickElement(this.selectors.loginButton);

      await this.auto.waitForElement(this.selectors.loginConfirmDashboard, 10000);

      // logger.info(`Despeed login successful for ${username}`);
      return true;
    } catch (error) {
      // logger.error(`Despeed login failed for ${username}: ${error.message}`);
      return false;
    }
  }

  /**
   * Checks the point balance on Despeed for the given credentials.
   * @param {Object} credentials - { username }
   */
  async check(credentials) {
    const { username } = credentials;
    try {
      await this.driver.get(this.config.extensionUrl);

      const pointValueText = await this.auto.getTextSafe(this.selectors.pointValue);

      // logger.info(`Despeed point value for ${username}: ${pointValueText}`);

      let points = parseInt(pointValueText.replace(/\D/g, ''), 10);
      if (isNaN(points)) points = 0;

      return points;
    } catch (error) {
      // logger.error(`Despeed check failed for ${username}: ${error.message}`);
      return false;
    }
  }
}

module.exports = DespeedService;
