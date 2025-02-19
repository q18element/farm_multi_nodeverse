const { By, Key, until } = require('selenium-webdriver');
const axios = require('axios');
const BaseService = require('./baseService');
const { AutomationAcions, logger } = require('../utils');
const {
  services: { bless: blessConfig, bizflycloud: bizflycloudConfig, veer: veerConfig },
} = require('../config');

class BlessService extends BaseService {
  constructor(driver) {
    super('bless', blessConfig);
    this.driver = driver;
    this.selectors = blessConfig.selectors;
    this.auto = new AutomationAcions(driver);
  }

  async getOtpBiz(credentials) {
    const email = credentials.username;
    const password = credentials.password;
    try {
      await this.driver.switchTo().newWindow('tab');
      await this.driver.get(bizflycloudConfig.loginUrl);

      const isLoggedIn = await this.auto.checkElementExists(bizflycloudConfig.selectors.inboxElement, 5000);
      if (!isLoggedIn) {
        await this.auto.enterText(bizflycloudConfig.selectors.emailInput, email);
        await this.driver.sleep(500);
        await this.auto.clickElement(bizflycloudConfig.selectors.nextButton);
        await this.driver.sleep(5000);
        await this.auto.enterText(bizflycloudConfig.selectors.passwordInput, password);
        await this.auto.clickElement(bizflycloudConfig.selectors.loginButton);
        await this.auto.waitForElement(bizflycloudConfig.selectors.inboxElement, 45000);
      }

      await this.auto.clickElement(bizflycloudConfig.selectors.refreshButton);
      await this.driver.sleep(3000);
      await this.auto.clickElement(bizflycloudConfig.selectors.firstMail);

      const emailContent = await this.auto.waitForElement(bizflycloudConfig.selectors.otpText, 20000);
      const emailText = await emailContent.getText();
      const otpMatch = emailText.match(/\b\d{6}\b/);

      await this.driver.close();

      return otpMatch ? otpMatch[0] : null;
    } catch (error) {
      logger.error(`getOtpBiz failed: ${error.message}`);
      return null;
    }
  }

  async getOtpVeer(credentials) {
    const email = credentials.username;
    const password = credentials.password;
    try {
      await this.driver.switchTo().newWindow('tab');
      await this.driver.get(veerConfig.loginUrl);

      const isLoggedIn = await this.auto.checkElementExists(veerConfig.selectors.inboxElement, 5000);
      if (!isLoggedIn) {
        await this.auto.enterText(veerConfig.selectors.emailInput, email);
        await this.auto.enterText(veerConfig.selectors.passwordInput, password);
        await this.auto.clickElement(veerConfig.selectors.loginButton);
        await this.auto.waitForElement(veerConfig.selectors.inboxElement, 10000);
      }

      await this.auto.clickElement(veerConfig.selectors.refreshButton);
      await this.driver.sleep(3000);

      await this.auto.clickElement(veerConfig.selectors.latestMail);
      const emailContent = await this.auto.waitForElement(veerConfig.selectors.otpText, 20000);
      const emailText = await emailContent.getText();
      const otpMatch = emailText.match(/\b\d{6}\b/);

      await this.driver.close();

      return otpMatch ? otpMatch[0] : null;
    } catch (error) {
      logger.error(`getOtpVeer failed: ${error.message}`);
      return null;
    }
  }

  async login(credentials) {
    const email = credentials.username;

    try {
      logger.info(`Logging into Bless for ${email}`);
      await this.driver.get(this.config.loginUrl);
      await this.driver.sleep(3000);

      const emailInput = await this.auto.waitForElement(this.selectors.emailInput);
      await this.auto.enterText(this.selectors.emailInput, email);
      await emailInput.sendKeys(Key.TAB, Key.RETURN);

      await this.driver.sleep(45000);

      const domain = email.split('@')[1];
      let otp = null;
      let attempts = 0;

      while (attempts < 5) {
        if (domain === 'veer.vn') {
          otp = await this.getOtpVeer(credentials);
        } else if (['tourzy.us', 'dealhot.vn'].includes(domain)) {
          otp = await this.getOtpBiz(credentials);
        } else {
          throw new Error(`Unsupported email domain: ${domain}`);
        }

        if (otp) break;

        attempts++;
        logger.info(`Retrying OTP retrieval for ${email}... (${attempts})`);
        await this.driver.sleep(30000);
      }

      if (!otp) throw new Error(`Failed to retrieve OTP for ${email}`);

      let handles = await this.driver.getAllWindowHandles();
      for (const handle of handles) {
        await this.driver.switchTo().window(handle);
        const title = await this.driver.getTitle();
        if (title.includes('Web3Auth')) break;
      }

      await this.auto.enterText(this.selectors.otpInput, otp);
      await this.driver.sleep(3000);

      handles = await this.driver.getAllWindowHandles();
      for (const handle of handles) {
        await this.driver.switchTo().window(handle);
        const title = await this.driver.getTitle();
        if (title.includes('Bless')) break;
      }

      await this.auto.waitForElement(this.selectors.dashboardElement, 20000);

      logger.info(`Bless login successful for ${email}`);
      return true;
    } catch (error) {
      logger.error(`Bless login failed for ${email}: ${error.message}`);
      return false;
    }
  }

  async check(credentials) {
    const { email } = credentials;
    try {
      let token = null;
      let attempts = 0;

      while (attempts < 5) {
        token = await this.driver.executeScript('return window.localStorage.getItem("B7S_AUTH_TOKEN");');
        if (token && token !== 'ERROR') break;

        attempts++;
        logger.info(`Retrying token retrieval for ${email}... (${attempts})`);
        await this.driver.sleep(3000);
        await this.driver.navigate().refresh();
      }

      if (!token || token === 'ERROR') throw new Error(`Token not found for ${email}`);

      const pubKey = await this.getPubKeyFromToken(token);
      const reward = await this.getReward(token, pubKey);

      logger.info(`Bless reward for ${email}: ${reward}`);
      return reward;
    } catch (error) {
      logger.error(`Bless check failed for ${email}: ${error.message}`);
      return false;
    }
  }

  async getPubKeyFromToken(token) {
    try {
      const response = await axios.get('https://gateway-run.bls.dev/api/v1/nodes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const node = response.data[0];
      return node ? node.pubKey : null;
    } catch (error) {
      throw new Error(`Failed to fetch pubKey: ${error.message}`);
    }
  }

  async getReward(token, pubKey) {
    try {
      const response = await axios.get('https://gateway-run.bls.dev/api/v1/nodes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const node = response.data.find((item) => item.pubKey === pubKey);
      if (!node) throw new Error('Node with provided pubKey not found');

      return node.totalReward;
    } catch (error) {
      throw new Error(`Failed to fetch reward: ${error.message}`);
    }
  }
}

module.exports = BlessService;
