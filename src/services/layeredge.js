const log4js = require("log4js");
const { By, WebElement } = require("selenium-webdriver");
const MetamaskService = require("./metamask");
const {AutomationAcions} = require('../utils/automationActions');
const logger = require('../utils/logger');
const {Wallet} = require("ethers");

function seedPhraseToAddress(seedPhrase) {
  return  Wallet.fromPhrase(seedPhrase).address;
}


class LayerEdgeService {
  constructor(driver) {
    this.logger = log4js.getLogger("LayerEdgeService");
    this.auto = new AutomationAcions(driver);
    this.metamaskService = new MetamaskService(driver);
  }

  /** @param {WebDriver} driver */
  async _isLoggedIn() {
    return await this.auto.driver.executeScript(() => {
      return localStorage["wagmi.recentConnectorId"] && !localStorage["wagmi.io.metamask.disconnected"];
    });
  }

  async check(creds) {
    await this.login(creds);
    return await this.auto.driver.executeScript(() => {
      return document.querySelector('strong[class*="earning_total__"]').innerText;
    });
  }

  /** @param {WebDriver} driver  */
  async login({ seedPhrase }) {
    const driver = this.auto.driver;
    const metamaskService = this.metamaskService;
    await metamaskService.setupOldWallet(seedPhrase);
    await driver.get("https://dashboard.layeredge.io/");
    if (!(await this._isLoggedIn())) {
      console.log("login");
      await this.auto.clickElement(By.css('button[class*="inviteModal_submitButton__"]:not(:disabled)'));
      await driver.sleep(500);
      await this.auto.clickElement(By.xpath('//div[text()="MetaMask" ]'));
      await driver.sleep(3000);
      await metamaskService.confirm_any();
      await driver.sleep(3000);
      /** @type {WebElement} */
    }
    let element = await this.auto.waitForElement(
      By.xpath(
        '(//*[text()="Please enter your invite code to access the platform"] |  //*[contains(text(),"Lightnode")] )[1]'
      )
    );
    if ((await element.getText()).includes("Please enter your invite code to access the platform")) {
      await this.auto.enterText(By.xpath('//input[@placeholder="Enter your invite code"]'), "aSwVnVxy");
      await this.auto.clickElement(By.xpath('//button[contains(text(),"Continue")]'));
    }
    await driver.sleep(3000);
    if (await this.auto.checkElementExists(By.xpath('//button[contains(text(),"Start Node")]'))) {
      console.log("start node  ");

      await driver.executeScript(() => {
        let element = document.querySelector('div[class*="earning_earning__"] button');
        if (element && element.textContent.includes("Start Node")) {
          element.click();
        }
      });
      await driver.sleep(1000);

      await driver.executeScript(() => {
        let element = document.querySelector('div[class*="earning_earning__"] button');
        if (element && element.textContent.includes("Start Node")) {
          element.click();
        }
      });

      await metamaskService.confirm_any();
    }
    await driver.sleep(3000);

    if (
      await this.auto.checkElementExists(By.xpath(`//button[contains(@class, 'button_btn__') and span="Claim Reward"]`))
    ) {
      console.log("claim reward ");
      try {
        await this.auto.clickElement(By.xpath(`//button[contains(@class, 'button_btn__') and span="Claim Reward"]`), 5000);
        await driver.sleep(1000);
        await this.auto.clickElement(By.css('#modal-root button'))
        await metamaskService.confirm_any();
        await this.auto.waitForElement(By.xpath(`(//button[contains(@class, 'button_btn__') and span="Claimed"])[2]`))
        await driver.executeScript(() => {
          window.location.reload();
        })
        
      } catch (e) {
        console.log("claim reward error", e);
      }
    }
  }
}

module.exports = LayerEdgeService;
