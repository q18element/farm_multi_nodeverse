// toggle.js
const { By, until } = require('selenium-webdriver');
const config = require('./config');
const { waitForElement, clickElement, safeClick, enterText } = require('./automationHelpers');
const log4js = require('log4js');

class ToggleService {
  constructor() {
    this.logger = log4js.getLogger('ToggleService');
  }

  async login(driver, username, password, proxyUrl) {
    try {
      this.logger.info(`Starting Toggle login for ${username}`);
      const { login_url, extension_url, selectors } = config.services.toggle;
      await driver.get(login_url);
      
      // Check if already logged in by verifying the dashboard element.
      try {
        await waitForElement(driver, selectors.dashboardElement, 20000);
        this.logger.info(`Already loged in Toggle for ${username}`);
        return true;
      } catch (e) {
        // Not logged in; proceed with the login flow.
      }
      
      await enterText(driver, selectors.username, username);
      await enterText(driver, selectors.password, password);
      await clickElement(driver, selectors.loginButton);
      await driver.sleep(3000);
      await waitForElement(driver, selectors.dashboardElement, 20000);
      this.logger.info(`Toggle login success for ${username}`);
      return true;
    } catch (error) {
      this.logger.error(`Toggle login failed for ${username}: ${error.message}`);
      return false;
    }
  }

  async check(driver, username, proxyUrl) {
    try {
      await driver.get(config.services.toggle.login_url);
      await driver.sleep(2000);
      await driver.get(config.services.toggle.extension_url);
      await driver.sleep(3000);
      const { selectors } = config.services.toggle;
      
      const getValueSafe = async (selector) => {
        try {
          const element = await waitForElement(driver, selector);
          return await element.getText();
        } catch (error) {
          this.logger.warn(`Element not found: ${selector}`);
          return 'N/A';
        }
      };

      const [quality, epoch, uptime] = await Promise.all([
        getValueSafe(selectors.quality),
        getValueSafe(selectors.epoch),
        getValueSafe(selectors.uptime)
      ]);

      this.logger.info(`Toggle status for ${username}:
      Connection Quality: ${quality}
      Epoch Value: ${epoch}
      Uptime: ${uptime}`);

      let point = parseInt(epoch, 10);
      if (isNaN(point)) {
        point = 0;
      }
      return point;

    } catch (error) {
      this.logger.error(`Toggle check error for ${username}: ${error.message}`);
      return false;
    }
  }
}

module.exports = new ToggleService();
