// openloop.js
const { By, until } = require('selenium-webdriver');
const config = require('./config');
const { waitForElement, clickElement, safeClick } = require('./automationHelpers');
const log4js = require('log4js');

class OpenloopService {
  constructor() {
    this.logger = log4js.getLogger('OpenloopService');
  }

  async login(driver, username, password, proxyUrl) {
    try {
      this.logger.info(`Starting OpenLoop login for ${username}`);
      const { login_url, extension_url, selectors } = config.services.openloop;
      
      await driver.get(login_url);
      await safeClick(driver, selectors.continueButton, 1000);
      
      // Locate username, password, and login button using CSS selectors.
      const usernameField = await driver.wait(
        until.elementLocated(By.css('.el-input-wrapper[type="email"] > .relative > input.el-input')),
        10000
      );
      const passwordField = await driver.wait(
        until.elementLocated(By.css('.el-input-wrapper[type="password"] > .relative > input.el-input')),
        10000
      );
      const loginButton = await driver.wait(
        until.elementLocated(By.css('.btn.btn-white.mt-3')),
        10000
      );
      
      await usernameField.sendKeys(username);
      await passwordField.sendKeys(password);
      await loginButton.click();
      
      await driver.sleep(3000);
      await driver.get(extension_url);
      await safeClick(driver, selectors.continueButton, 2000);
      await waitForElement(driver, selectors.loginConfirmElement, 20000);
      return true;
    } catch (error) {
      this.logger.error(`OpenLoop login error for ${username}: ${error.message}`);
      return false;
    }
  }

  async check(driver, username, proxyUrl) {
    try {
      await driver.get(config.services.openloop.extension_url);
      const { selectors } = config.services.openloop;
      await safeClick(driver, selectors.continueButton);
      
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

      const [status, quality, earnings] = await Promise.all([
        getValueSafe(selectors.status),
        getValueSafe(selectors.quality),
        getValueSafe(selectors.earnings)
      ]);

      this.logger.info(`OpenLoop status for ${username}:
      Status: ${status}
      Connection Quality: ${quality}
      Earnings: ${earnings}`);

      return true;
    } catch (error) {
      this.logger.error(`OpenLoop check failed for ${username}: ${error.message}`);
      this.logger.warn(`Attempting to re-login OpenLoop for ${username}`);
      // Optionally, re-attempt login. You may want to use a secure method to retrieve the password.
      await this.login(driver, username, "Rtn@2024", proxyUrl);
      await driver.get(config.services.openloop.extension_url);
      await driver.sleep(3000);
      return false;
    }
  }
}

module.exports = new OpenloopService();
