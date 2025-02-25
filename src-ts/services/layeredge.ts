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
  async configDriver() {}

  async _isLoggedIn() {
    const auto = this.auto;

    return !(
      await (
        await auto.waitForElement(
          By.xpath('(//button[text()="Connect Wallet"] | //*[contains(text(),"Lightnode")])[1]')
        )
      ).getText()
    ).includes("Connect Wallet");
  }

  async check() {
    const auto = this.auto;

    await this.load();
    return await auto.driver.executeScript(() => {
      // @ts-ignore
      return document.querySelector('strong[class*="earning_total__"]')?.innerText || "unknown";
    });
  }
  async daily(): Promise<void> {
    await this.load();
  }
  async load() {
    const { seedphrase }: Account = this.account;
    const auto = this.auto;
    const driver = auto.driver;
    const metamaskService = this.metamaskService;
    const get = await auto.assignTabGet("layeredge");

    await metamaskService.setupOldWallet(seedphrase);

    await get("https://dashboard.layeredge.io/");
    await driver.sleep(2500);
    if (!(await this._isLoggedIn())) {
      this.logger.info("login");
      await auto.clickElement(By.css('button[class*="inviteModal_submitButton__"]:not(:disabled)'));
      await auto.sleep(500);
      await auto.clickElement(By.xpath('//div[text()="MetaMask" ]'));
      await auto.sleep(3000);
      await metamaskService.confirmAny();
      await auto.sleep(3000);
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
    await auto.sleep(3000);
    if (await auto.checkElementExists(By.xpath('//button[contains(text(),"Start Node")]'))) {
      this.logger.info("start node  ");

      await driver.executeScript(() => {
        let element = document.querySelector('div[class*="earning_earning__"] button');
        if (element && element.textContent?.includes("Start Node")) {
          // @ts-ignore
          element.click();
        }
      });
      await auto.sleep(1000);

      await driver.executeScript(() => {
        let element = document.querySelector('div[class*="earning_earning__"] button');
        if (element && element.textContent?.includes("Start Node")) {
          // @ts-ignore
          element.click();
        }
      });

      await metamaskService.confirmAny();
    }
    await driver.sleep(3000);

    if (
      await auto.checkElementExists(
        By.xpath(
          `//*[contains(@class, "wrapper_main__")]//button[contains(@class, 'button_btn__') and span="Claim Reward"]`
        )
      )
    ) {
      this.logger.info("claim reward ");
      try {
        await auto.actionsClickElement(
          By.xpath(
            `//*[contains(@class, "wrapper_main__")]//button[contains(@class, 'button_btn__') and span="Claim Reward"]`
          ),
          5000
        );
        await driver.sleep(1000);
        await auto.clickElement(By.css("#modal-root button"));
        await metamaskService.confirmAny();
        await driver.sleep(2000);

        // await auto.waitForElement(By.xpath(`(//button[contains(@class, 'button_btn__') and span="Claimed"])[2]`));
      } catch (e) {
        this.logger.info("claim reward error", e);
      } finally {
        await driver.executeScript(() => {
          window.location.reload();
        });
      }
    }
    let i = 0;
    while (i <= 3) {
      i++;

      if (await auto.safeClick(By.xpath('//button[contains(text(),"Start Node")]'))) {
        this.logger.info("start node  ");
        try {
          await this.metamaskService.confirmAny();
        } catch (e) {
          continue;
        }
      }
    }
  }
}
