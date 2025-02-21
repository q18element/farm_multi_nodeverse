// src/services/layeredge.js
import log4js from "log4js";
import { By } from "selenium-webdriver";
import MetamaskService from "./metamask.js";
import BaseService from "./baseService.js";
import { EXTENSIONS } from "../config.js";

export default class LayerEdgeService extends BaseService {
  static get serviceName() {
    return "layeredge";
  }
  static get requiredExtensions() {
    return [EXTENSIONS.metamask.path];
  }

  constructor(driver) {
    super({
      serviceName: "layeredge",
      config: {},
      driver,
    });
    this.logger = log4js.getLogger("LayerEdgeService");
    this.metamaskService = new MetamaskService(driver);
  }

  /** @param {WebDriver} driver */
  async _isLoggedIn() {
    return await this.wd.driver.executeScript(() => {
      return localStorage["wagmi.recentConnectorId"] && !localStorage["wagmi.io.metamask.disconnected"];
    });
  }

  async check(creds) {
    await this.login(creds);
    return await this.wd.driver.executeScript(() => {
      return document.querySelector('strong[class*="earning_total__"]').innerText;
    });
  }

  /** @param {WebDriver} driver  */
  async login({ seedphrase }) {
    const driver = this.wd.driver;
    const metamaskService = this.metamaskService;
    await metamaskService.setupOldWallet(seedphrase);

    await driver.get("https://dashboard.layeredge.io/");
    if (!(await this._isLoggedIn())) {
      console.log("login");
      await this.wd.clickElement(By.css('button[class*="inviteModal_submitButton__"]:not(:disabled)'));
      await driver.sleep(500);
      await this.wd.clickElement(By.xpath('//div[text()="MetaMask" ]'));
      await driver.sleep(3000);
      await metamaskService.confirm_any();
      await driver.sleep(3000);
      /** @type {WebElement} */
    }
    let element = await this.wd.waitForElement(
      By.xpath(
        '(//*[text()="Please enter your invite code to access the platform"] |  //*[contains(text(),"Lightnode")] )[1]'
      )
    );
    if ((await element.getText()).includes("Please enter your invite code to access the platform")) {
      await this.wd.enterText(By.xpath('//input[@placeholder="Enter your invite code"]'), "aSwVnVxy");
      await this.wd.clickElement(By.xpath('//button[contains(text(),"Continue")]'));
    }
    await driver.sleep(3000);
    if (await this.wd.checkElementExists(By.xpath('//button[contains(text(),"Start Node")]'))) {
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
      await this.wd.checkElementExists(By.xpath(`//button[contains(@class, 'button_btn__') and span="Claim Reward"]`))
    ) {
      console.log("claim reward ");
      try {
        await this.wd.clickElement(
          By.xpath(`//button[contains(@class, 'button_btn__') and span="Claim Reward"]`),
          5000
        );
        await driver.sleep(1000);
        await this.wd.clickElement(By.css("#modal-root button"));
        await metamaskService.confirm_any();
        await this.wd.waitForElement(By.xpath(`(//button[contains(@class, 'button_btn__') and span="Claimed"])[2]`));
        await driver.executeScript(() => {
          window.location.reload();
        });
      } catch (e) {
        console.log("claim reward error", e);
      }
    }
    return true;
  }
}
