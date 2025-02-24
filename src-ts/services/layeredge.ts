import { By } from "selenium-webdriver";
import MetamaskService from "./metamask.js";
import BaseService, { BaseServiceOptions } from "./baseService.js";
import { Account } from "../database/AccountRepository.js";

export default class LayerEdgeService extends BaseService {
  metamaskService: MetamaskService;

  constructor(opts: BaseServiceOptions) {
    super(opts);
    this.metamaskService = this.childService(MetamaskService);
  }

  async _isLoggedIn() {
    const auto = this.auto;

    return await auto.driver.executeScript(() => {
      return localStorage["wagmi.recentConnectorId"] && !localStorage["wagmi.io.metamask.disconnected"];
    });
  }

  async check() {
    const auto = this.auto;

    await this.load();
    return await auto.driver.executeScript(() => {
      // @ts-ignore
      return document.querySelector('strong[class*="earning_total__"]')?.innerText || "unknown";
    });
  }

  async load() {
    const { seedphrase }: Account = this.account;
    const auto = this.auto;
    const driver = auto.driver;
    const metamaskService = this.metamaskService;
    await metamaskService.setupOldWallet(seedphrase);

    await driver.get("https://dashboard.layeredge.io/");
    if (!(await this._isLoggedIn())) {
      console.log("login");
      await auto.clickElement(By.css('button[class*="inviteModal_submitButton__"]:not(:disabled)'));
      await driver.sleep(500);
      await auto.clickElement(By.xpath('//div[text()="MetaMask" ]'));
      await driver.sleep(3000);
      await metamaskService.confirm_any();
      await driver.sleep(3000);
      /** @type {WebElement} */
    }
    let element = await auto.waitForElement(
      By.xpath(
        '(//*[text()="Please enter your invite code to access the platform"] |  //*[contains(text(),"Lightnode")] )[1]'
      )
    );
    if ((await element.getText()).includes("Please enter your invite code to access the platform")) {
      await auto.enterText(By.xpath('//input[@placeholder="Enter your invite code"]'), "aSwVnVxy");
      await auto.clickElement(By.xpath('//button[contains(text(),"Continue")]'));
    }
    await driver.sleep(3000);
    if (await auto.checkElementExists(By.xpath('//button[contains(text(),"Start Node")]'))) {
      console.log("start node  ");

      await driver.executeScript(() => {
        let element = document.querySelector('div[class*="earning_earning__"] button');
        if (element && element.textContent?.includes("Start Node")) {
          // @ts-ignore
          element.click();
        }
      });
      await driver.sleep(1000);

      await driver.executeScript(() => {
        let element = document.querySelector('div[class*="earning_earning__"] button');
        if (element && element.textContent?.includes("Start Node")) {
          // @ts-ignore
          element.click();
        }
      });

      await metamaskService.confirm_any();
    }
    await driver.sleep(3000);

    if (
      await auto.checkElementExists(By.xpath(`//*[contains(@class, "wrapper_main__")]//button[contains(@class, 'button_btn__') and span="Claim Reward"]`))
    ) {
      console.log("claim reward ");
      try {
        await auto.actionsClickElement(
          By.xpath(`//*[contains(@class, "wrapper_main__")]//button[contains(@class, 'button_btn__') and span="Claim Reward"]`),
          5000
        );
        await driver.sleep(1000);
        await auto.clickElement(By.css("#modal-root button"));
        await metamaskService.confirm_any();
        await auto.waitForElement(By.xpath(`(//button[contains(@class, 'button_btn__') and span="Claimed"])[2]`));
        await driver.executeScript(() => {
          window.location.reload();
        });
      } catch (e) {
        console.log("claim reward error", e);
      }
    }
  }
}
