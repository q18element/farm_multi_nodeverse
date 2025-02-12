// despeed.js
const { By, until } = require('selenium-webdriver');
const config = require('./config');
const { waitForElement, clickElement, switchToIframe, enterText, waitForElementToBeInvisible } = require('./automationHelpers');
const log4js = require('log4js');
// const { setHcapchaCookie } = require('./hcapcha');

class DespeedService {
  constructor() {
    this.logger = log4js.getLogger('DespeedService');
  }

  async login(driver, username, password, proxyUrl) {
    try {
      this.logger.info(`Starting Despeed login for ${username}`);
      const { loginUrl, extensionUrl, selectors } = config.services.despeed;
      const { h_selectors } = config.services.hcapcha;
      
      // await setHcapchaCookie(driver, username);

      await driver.get(loginUrl);
    //   await waitForElementToBeClickable(driver, selectors.hcapchaCheckbox);

      await waitForElementToBeInvisible(driver, selectors.hcapchaCheckbox, 300000);
      
      await enterText(driver, selectors.usernameInput, username);
      await enterText(driver, selectors.passwordInput, password);
      await switchToIframe(driver, selectors.hcapchaIframe);
      await clickElement(driver, selectors.hcapchaCheckbox);
      await driver.switchTo().defaultContent();
      await clickElement(driver, selectors.loginButton);

      await waitForElement(driver, selectors.loginConfirmDashboard, 10000);

      this.logger.info(`Login success for Despeed ${username}`);
      return true;
    } catch (error) {
      this.logger.error(`Despeed login error for ${username}: ${error.message}`);
      return false;
    }
  }

  async check(driver, username, proxyUrl) {
    try {
      await driver.get(config.services.despeed.extensionUrl);
      const { selectors } = config.services.despeed;
      
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

      this.logger.info(`OpenLoop status for ${username}:
      point: ${pointValue}`);

      let point = parseInt(pointValue, 10);
      if (isNaN(point)) {
        point = 0;
      }
      return point;

    } catch (error) {
      this.logger.error(`OpenLoop check failed for ${username}: ${error.message}`);
      return false;
    }
  }
}

module.exports = new DespeedService();
