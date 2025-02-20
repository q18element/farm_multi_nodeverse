// src/services/gradient.js
const BaseService = require('./baseService');
const {AutomationAcions} = require('../utils/automationActions');
const logger = require('../utils/logger');
const {
  services: {
    gradient: gradientConfig
  }
} = require('../config');

class GradientService extends BaseService {
  constructor(driver) {
    super('gradient', gradientConfig);
    this.driver = driver;
    this.auto = new AutomationAcions(driver);
  }

  async login(credentials) {
    const username = credentials.username;
    const password = credentials.password;
    // logger.info(`Starting Gradient login for ${username}`);

    const { loginUrl, extensionUrl, selectors } = this.config;
    await this.driver.get(loginUrl);
    // logger.debug(`Navigated to login URL: ${loginUrl}`);

    try {
      await this.auto.waitForElement(selectors.dashboardElement, 20000);
      // logger.info(`Already logged in to Gradient for ${username}`);
      return true;
    } catch (e) {
      // logger.debug(`Dashboard element not found, proceeding with login for ${username}`);
    }

    await this.auto.enterText(selectors.usernameInput, username);
    // logger.debug(`Entered username for ${username}`);

    await this.auto.enterText(selectors.passwordInput, password);
    // logger.debug(`Entered password for ${username}`);

    await this.auto.clickElement(selectors.loginButton);
    // logger.debug(`Clicked login button for ${username}`);

    await this.driver.sleep(3000);

    await this.driver.get(extensionUrl);
    // logger.debug(`Navigated to extension URL: ${extensionUrl}`);

    await this.auto.waitForElement(selectors.loginConfirmElement, 20000);
    await this.driver.sleep(2000);
    // logger.info(`Login success for Gradient ${username}`);
    return true;
  }

  async check(credentials) {
    const username = credentials.username;
    // logger.info(`Checking Gradient status for ${username}`);

    const { extensionUrl, selectors } = this.config;
    await this.driver.get(extensionUrl);
    // logger.debug(`Navigated to extension URL: ${extensionUrl}`);

    await this.driver.sleep(2000);

    await this.auto.safeClick(selectors.gotItButton);
    // logger.debug(`Clicked 'Got It' button if present for ${username}`);

    await this.auto.safeClick(selectors.yesButton);
    // logger.debug(`Clicked 'Yes' button if present for ${username}`);

    await this.auto.safeClick(selectors.rewardSwitchButton);
    // logger.info(`Switched to rewards view for ${username}`);

    const getValueSafe = async (selector) => {
      try {
        const element = await this.auto.waitForElement(selector);
        const text = await element.getText();
        // logger.debug(`Fetched text for selector ${selector}: ${text}`);
        return text;
      } catch (error) {
        // logger.warn(`Element not found: ${selector}`);
        return 'N/A';
      }
    };

    const [sessionReward] = await Promise.all([
      getValueSafe(selectors.status),
      getValueSafe(selectors.tapToday),
      getValueSafe(selectors.uptime),
      getValueSafe(selectors.todayReward),
      getValueSafe(selectors.sessionReward),
    ]);

    // logger.info(`Gradient sessionReward for ${username} is ${sessionReward}`);

    let point = parseInt(sessionReward, 10);
    if (isNaN(point)) {
      point = 0;
    }
    // logger.debug(`Parsed session reward points for ${username}: ${point}`);
    return point;
  }
}

module.exports = GradientService;