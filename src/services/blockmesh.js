const BaseService = require('./baseService');
const {AutomationAcions} = require('../utils/automationActions');
const logger = require('../utils/logger');
const { services: { blockmesh: blockmeshConfig } } = require('../config');

class BlockmeshService extends BaseService {
  constructor(driver) {
    super('blockmesh', blockmeshConfig);
    this.driver = driver;
    this.selectors = blockmeshConfig.selectors;
    this.auto = new AutomationAcions(driver);
  }

  /**
   * Logs into Blockmesh using the provided credentials.
   * @param {Object} credentials - { username, password }
   */
  async login(credentials) {
    const { username, password } = credentials;
    try {
      // logger.info(`Starting Blockmesh login for ${username}`);

      const { loginUrl, selectors } = this.config;
      await this.driver.get(loginUrl);

      await this.auto.enterText(selectors.usernameInput, username);
      await this.auto.enterText(selectors.passwordInput, password);
      await this.driver.sleep(888);

      await this.auto.clickElement(selectors.loginButton);
      await this.driver.sleep(2000);

      await this.auto.waitForElement(selectors.dashboardButton, 15000);

      // logger.info(`Blockmesh login success for ${username}`);
      return true;
    } catch (error) {
      // logger.error(`Blockmesh login failed for ${username}: ${error.message}`);
      return false;
    }
  }

  /**
   * Checks the point balance on Blockmesh for the given credentials.
   * @param {Object} credentials - { username, password }
   */
  async check(credentials) {
    const { username, password } = credentials;
    try {
      const { checkUrl, selectors } = this.config;

      await this.driver.get(checkUrl);

      await this.auto.enterText(selectors.emailDashboardInput, username);
      await this.auto.enterText(selectors.passwordDashboardInput, password);
      await this.driver.sleep(888);

      await this.auto.clickElement(selectors.loginDashboardButton);
      await this.auto.waitForElement(selectors.pointValue, 15000);

      const pointValueText = await this.auto.getTextSafe(selectors.pointValue);
      // logger.info(`Blockmesh point value for ${username}: ${pointValueText}`);

      let points = parseInt(pointValueText.replace(/\D/g, ''), 10);
      if (isNaN(points)) points = 0;

      return points;
    } catch (error) {
      // logger.error(`Blockmesh check failed for ${username}: ${error.message}`);
      return false;
    }
  }
}

module.exports = BlockmeshService;
