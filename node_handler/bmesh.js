// blockmesh.js
const { By, until } = require('selenium-webdriver');
const config = require('./config');
const { waitForElement, clickElement, safeClick, enterText } = require('./automationHelpers');
const log4js = require('log4js');
const { password } = require('@inquirer/prompts');

class BlockmeshService {
  constructor() {
    this.logger = log4js.getLogger('BlockmeshService');
  }

  async login(driver, username, password, proxyUrl) {
    try {
      this.logger.info(`Starting Blockmesh login for ${username}`);
      const { login_url, extension_url, selectors } = config.services.blockmesh;
      
      await driver.get(login_url);
      await enterText(driver, selectors.usernameInput, username);
      await enterText(driver, selectors.passwordInput, password);
      await driver.sleep(888);
      await clickElement(driver, selectors.loginButton);
      await driver.sleep(2000);

      await waitForElement(driver, selectors.dashboardBtn);

      this.logger.info(`Login success for Blockmesh ${username}`);
      return true;
    } catch (error) {
      this.logger.error(`Blockmesh login error for ${username}: ${error.message}`);
      return false;
    }
  }

  async check(driver, username, proxyUrl) {
    try {
      await driver.get(config.services.blockmesh.check_url);
      const { selectors } = config.services.blockmesh;

      await enterText(driver, selectors.emailDashbardInput, username);
      await enterText(driver, selectors.passDashboardInput, "Rtn@2024");
      await driver.sleep(888);
      await clickElement(driver, selectors.loginDashboardBtn);

      await waitForElement(driver, selectors.pointValue);

      // Helper to safely get element text.
      const getValueSafe = async (selector) => {
        try {
          const element = await waitForElement(driver, selector);
          return await element.getText();
        } catch (error) {
          this.logger.warn(`Element not found: ${selector}`);
          return 'N/A';
        }
      };

      const [pointValue] = await Promise.all([
        getValueSafe(selectors.pointValue)
      ]);

      this.logger.info(`Blockmesh status for ${username}:
      pointValue: ${pointValue}`);

      let point = parseInt(pointValue, 10);
      if (isNaN(point)) {
        point = 0;
      }
      return point;

    } catch (error) {
      this.logger.error(`Blockmesh check failed for ${username}: ${error.message}`);
      return false;
    }
  }
}

module.exports = new BlockmeshService();
