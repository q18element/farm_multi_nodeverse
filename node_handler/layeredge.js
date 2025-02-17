const log4js = require("log4js");
const { By, WebDriver } = require("selenium-webdriver");

const MtmService = require("./mtm");
const { waitForElement, clickElement } = require("./automationHelpers");

class LayerEdgeService {
  constructor() {
    this.logger = log4js.getLogger("LayerEdgeService");
    this.seedPhrase = undefined;
  }

  /** @param {WebDriver} driver */
  async _isLoggedIn(driver) {
    return await driver.executeScript(() => {
      return localStorage["wagmi.recentConnectorId"] && !localStorage["wagmi.io.metamask.disconnected"];
    });
  }
  /** @param {WebDriver} driver  */
  async login(driver, username, password, proxyUrl, seedPhrases) {
    const metamaskService = MtmService;
    seedPhrases = this.seedPhrase;
    await metamaskService.setupOldWallet(driver, seedPhrases.split(" "));
    await driver.get("https://dashboard.layeredge.io/");
    if (!(await this._isLoggedIn(driver))) {
      console.log("login");
      await clickElement(driver, By.css('button[class*="inviteModal_submitButton__"]:not(:disabled)'));
      await driver.sleep(500);
      await clickElement(driver, By.xpath('//div[text()="MetaMask" ]'));
      await driver.sleep(3000);
      await metamaskService.confirm_any(driver);
      await driver.sleep(3000);
      try {
        await clickElement(driver, By.xpath('//button[contains(text(),"Start Node")]'));
        await metamaskService.confirm_any(driver);
      } catch (e) {}
    }
  }
}

module.exports = new LayerEdgeService();
