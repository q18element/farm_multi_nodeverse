// gradient.js
const { By, until } = require('selenium-webdriver');
const config = require('./config');
const { waitForElement, clickElement, safeClick, enterText } = require('./automationHelpers');
const log4js = require('log4js');

class GradientService {
  constructor() {
    this.logger = log4js.getLogger('GradientService');
  }

  async login(driver, username, password, proxyUrl) {
    try {
      this.logger.info(`Starting Gradient login for ${username}`);

      const { login_url, extension_url, selectors } = config.services.gradient;
      await driver.get(login_url);

      // Check if already logged in by verifying the dashboard element.
      try {
        await waitForElement(driver, selectors.dashboardElement, 20000);
        this.logger.info(`Already loged in Gradient for ${username}`);
        return true;
      } catch (e) {
        // Not logged in; proceed with the login flow.
      }

      await enterText(driver, selectors.username, username);
      await enterText(driver, selectors.password, password);
      await clickElement(driver, selectors.loginButton);
      await driver.sleep(3000);
      await driver.get(extension_url);
      await waitForElement(driver, selectors.loginConfirmElement, 20000);

      this.logger.info(`Login success for Gradient ${username}`);
      return true;
    } catch (error) {
      this.logger.error(`Gradient login failed for ${username}: ${error.message}`);
      return false;
    }
  }

  async check(driver, username, proxyUrl) {
    try {
      await driver.get(config.services.gradient.extension_url);
      await driver.sleep(2000);
      const { selectors } = config.services.gradient;
      // Dismiss modal dialogs if present
      await safeClick(driver, selectors.gotItButton);
      await safeClick(driver, selectors.yesButton);
      // Switch to rewards view
      await safeClick(driver, selectors.rewardSwitchButton);
      this.logger.info(`Switched to rewards view for ${username}`);

      const getValueSafe = async (selector) => {
        try {
          const element = await waitForElement(driver, selector);
          return await element.getText();
        } catch (error) {
          this.logger.warn(`Element not found: ${selector}`);
          return 'N/A';
        }
      };

      const [status, tapToday, uptime, todayReward, sessionReward] = await Promise.all([
        getValueSafe(selectors.status),
        getValueSafe(selectors.tapToday),
        getValueSafe(selectors.uptime),
        getValueSafe(selectors.todayReward),
        getValueSafe(selectors.sessionReward)
      ]);

      this.logger.info(`
      Gradient status for ${username}:
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

    } catch (error) {
      this.logger.error(`Gradient check failed for ${username}: ${error.message}`);
      return false;
    }
  }
}

module.exports = new GradientService();
