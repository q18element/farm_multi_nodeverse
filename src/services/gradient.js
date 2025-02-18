const BaseService = require('./baseService');
const AutomationHelpers = require('../utils/automationActions');
const logger = require('../utils/logger');
const config = require('../config/config');

class GradientService extends BaseService {
  constructor(driver) {
    super('gradient', config.services.gradient);
    this.driver = driver; // Store driver
    this.helpers = new AutomationHelpers(driver); // Pass the driver once
  }

  async login(credentials) {
    const { username, password } = credentials;
    logger.info(`Starting Gradient login for ${username}`);

    const { loginUrl, extensionUrl, selectors } = this.config;

    await this.driver.get(loginUrl);

    try {
      await this.helpers.waitForElement(selectors.dashboardElement, 20000);
      logger.info(`Already logged in to Gradient for ${username}`);
      return true;
    } catch (e) {
      // Continue with login flow.
    }

    await this.helpers.enterText(selectors.usernameInput, username);
    await this.helpers.enterText(selectors.passwordInput, password);
    await this.helpers.clickElement(selectors.loginButton);
    await this.driver.sleep(3000);

    await this.driver.get(extensionUrl);
    await this.helpers.waitForElement(selectors.loginConfirmElement, 20000);

    logger.info(`Login success for Gradient ${username}`);
    return true;
  }

  async check(credentials) {
    const { username } = credentials;
    logger.info(`Checking Gradient status for ${username}`);

    const { extensionUrl, selectors } = this.config;
    await this.driver.get(extensionUrl);
    await this.driver.sleep(2000);

    await this.helpers.safeClick(selectors.gotItButton);
    await this.helpers.safeClick(selectors.yesButton);
    await this.helpers.safeClick(selectors.rewardSwitchButton);
    logger.info(`Switched to rewards view for ${username}`);

    const getValueSafe = async (selector) => {
      try {
        const element = await this.helpers.waitForElement(selector);
        return await element.getText();
      } catch (error) {
        logger.warn(`Element not found: ${selector}`);
        return 'N/A';
      }
    };

    const [status, tapToday, uptime, todayReward, sessionReward] = await Promise.all([
      getValueSafe(selectors.status),
      getValueSafe(selectors.tapToday),
      getValueSafe(selectors.uptime),
      getValueSafe(selectors.todayReward),
      getValueSafe(selectors.sessionReward),
    ]);

    logger.info(`Gradient status for ${username}:
      Status: ${status}
      Tap Today: ${tapToday}
      Uptime: ${uptime}
      Today's Reward: ${todayReward}
      Session Reward: ${sessionReward}
    `);

    let point = parseInt(sessionReward, 10);
    if (isNaN(point)) {
      point = 0;
    }
    return point;
  }
}

module.exports = GradientService;
