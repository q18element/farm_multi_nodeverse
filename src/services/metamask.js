import { By } from "selenium-webdriver";
import config from "../config/config.js";
import log4js from "log4js";
import fs from "fs";
import path from "path";
import { AutomationAcions } from "../utils/automationActions.js";
import BaseService from "./baseService.js";

async function copyRecoveryPhrase(driver) {
  try {
    const chipElements = await driver.findElements(By.css('[data-testid^="recovery-phrase-chip-"]'));

    const phrases = [];
    for (let chipElement of chipElements) {
      const text = await chipElement.getText();
      phrases.push(text.trim());
    }

    const recoveryPhrase = phrases.join(" ");

    const outputDir = path.join(__dirname, "./output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const filePath = path.join(outputDir, "recovery_phrase.txt");
    fs.writeFileSync(filePath, recoveryPhrase, "utf8");

    return phrases;
  } catch (error) {
    console.error("Error copying recovery phrase:", error);
  }
}

async function fillRecoveryInputsWithClickAndSendKeys(driver, recoveryKeyArray) {
  if (typeof recoveryKeyArray === "string") {
    recoveryKeyArray = recoveryKeyArray.split(" ");
  }
  try {
    const inputElements = await driver.findElements(By.css('input[data-testid^="recovery-phrase-input-"]'));

    for (let inputElement of inputElements) {
      const testid = await driver.executeScript("return arguments[0].dataset.testid;", inputElement);

      if (!testid) {
        console.warn("Could not retrieve data-testid via dataset.");
        continue;
      }

      const parts = testid.split("-");
      const index = parseInt(parts[parts.length - 1], 10);

      if (index < recoveryKeyArray.length) {
        const word = recoveryKeyArray[index];
        await inputElement.click();
        await inputElement.clear();
        await inputElement.sendKeys(word);
      } else {
        console.warn(`No word found for index ${index}.`);
      }
    }
  } catch (error) {
    console.error("Error filling recovery inputs with click and sendKeys:", error);
  }
}

async function fillImportSrpRecoveryWords(driver, recoveryKeyArray) {
  if (typeof recoveryKeyArray === "string") {
    recoveryKeyArray = recoveryKeyArray.split(" ");
  }
  try {
    const inputElements = await driver.findElements(By.css('input[data-testid^="import-srp__srp-word-"]'));

    for (let inputElement of inputElements) {
      const testid = await driver.executeScript("return arguments[0].dataset.testid;", inputElement);

      const parts = testid.split("-");
      const index = parseInt(parts[parts.length - 1], 10);

      if (!isNaN(index) && index < recoveryKeyArray.length) {
        const word = recoveryKeyArray[index];
        await inputElement.click();
        await inputElement.clear();
        await inputElement.sendKeys(word);
      } else {
        console.warn(`Skipping ${testid}: invalid index or no corresponding word.`);
      }
    }
  } catch (error) {
    console.error("Error filling import SRP recovery words:", error);
  }
}

export default class MetamaskService extends BaseService {
  constructor(driver) {
    super("MtmService", {});
    this.logger = log4js.getLogger("MtmService");
    this.wd = new AutomationAcions(driver);
  }

  async setupNewWallet() {
    const driver = this.wd.driver;
    try {
      this.logger.info(`Starting Mtm setup`);
      const { loginUrl, selectors } = config.services.mtm;
      await driver.get(loginUrl);

      await driver.sleep(3000);
      await this.wd.clickElement(selectors.agreeCheckbox);
      await driver.sleep(1000);
      await this.wd.clickElement(selectors.createWalletButton);

      await this.wd.clickElement(selectors.agreeCheckbox2);
      await this.wd.scrollToElement(selectors.iagreeButton);
      await this.wd.clickElement(selectors.iagreeButton);

      await this.wd.enterText(selectors.passwordInput, "Rtn@2024");
      await this.wd.enterText(selectors.passwordRepeatInput, "Rtn@2024");
      await this.wd.clickElement(selectors.iunderstandCheckbox);
      await this.wd.clickElement(selectors.createNewWalletButton);

      await this.wd.scrollToElement(selectors.secureMyWalletButton);
      await this.wd.clickElement(selectors.secureMyWalletButton);

      await this.wd.clickElement(selectors.revealMySecretButton);
      const recoveryKeyArray = await copyRecoveryPhrase(driver);
      await this.wd.clickElement(selectors.nextButton);

      await driver.sleep(5000);
      await fillRecoveryInputsWithClickAndSendKeys(driver, recoveryKeyArray);
      await this.wd.clickElement(selectors.confirmButton);

      await driver.sleep(1000);
      await this.wd.clickElement(selectors.doneButton);
      await driver.sleep(1000);
      await this.wd.clickElement(selectors.nextButton2);
      await driver.sleep(1000);
      await this.wd.clickElement(selectors.doneButton2);
      await driver.sleep(7777);
      await this.wd.waitForElement(selectors.mainetText);

      this.logger.info(`Mtm setup success on proxy `);
      return true;
    } catch (error) {
      this.logger.error(`Mtm setup failed for: ${error.message}`);
      return false;
    }
  }

  async lockMetamask() {
    try {
      await this.wd.driver.sleep(1000);
      await this.wd.clickElement(By.css('span[style*="./images/icons/more-vertical.svg"]'));
      await this.wd.clickElement(By.xpath('//button//div[text()="Lock MetaMask"]'));
    } catch (e) {}
  }

  /** @param {WebDriver} driver  */
  async confirm_any() {
    const driver = this.wd.driver;
    let currentWindow = await driver.getWindowHandle();
    const timeout = 10; // timeout in seconds
    const startTime = Date.now();

    while (Date.now() - startTime < timeout * 1000) {
      try {
        const windowHandles = await driver.getAllWindowHandles();

        for (const window of windowHandles) {
          await driver.switchTo().window(window);
          let url = await driver.getCurrentUrl();
          console.log("checking url" + url);

          // if (title.includes("MetaMask") && !title.includes("creen")) {
          if (url.includes("notification.html")) {
            // await this.auto.waitForElement( By.xpath('//div[@id="app-content"]//div'));
            await driver.sleep(2000);

            // try {
            //   let btn_xpath =
            //     '//button[(@data-testid="confirmation-submit-button" or @data-testid="confirm-btn" or @data-testid="page-container-footer-next" or @data-testid="confirm-footer-button") and not(@disabled)]';

            //   const button = await driver.wait(until.elementLocated(By.xpath(btn_xpath)), 5000);

            //   if (button) {
            //     await driver.actions().move({ origin: button }).click().perform();
            //     await driver.switchTo().window(currentWindow);
            //     return true;
            //   }
            // } catch (e) {
            //   console.log("Button not found or not clickable:", e.message);
            // }

            // Send Tab key 5 times
            // for (let i = 0; i < 5; i++) {
            //   await driver.actions().sendKeys(Key.TAB).perform();
            // }

            // // Press Enter
            // await driver.actions().sendKeys(Key.ENTER).perform();

            while (1) {
              await driver.executeScript(() => {
                document
                  .querySelector(
                    'button[data-testid="confirmation-submit-button"]:not([disabled]), button[data-testid="confirm-btn"]:not([disabled]), button[data-testid="page-container-footer-next"]:not([disabled]), button[data-testid="confirm-footer-button"]:not([disabled])'
                  )
                  ?.click();
              });
              await driver.sleep(1000);
            }
          }
        }

        // Add a small delay between window checks
        await driver.sleep(500);
      } catch (e) {
        // throw new Error("Error during window checks: " + e.message);
      }
    }

    await driver.switchTo().window(currentWindow);
  }
  /** @param {WebDriver} driver  */
  async setupOldWallet(seedPhrase) {
    console.log(seedPhrase);
    const driver = this.wd.driver;
    try {
      this.logger.info(`Starting Mtm setup`);
      const { loginUrl, selectors } = config.services.mtm;
      await driver.get(loginUrl);
      driver.sleep(2000);

      let currentUrl = await driver.getCurrentUrl();

      if (currentUrl.endsWith("#unlock")) {
        await this.wd.clickElement(By.xpath('//div[@class="unlock-page__links"]//a'));
        await fillImportSrpRecoveryWords(driver, seedPhrase);
        await this.wd.enterText(By.xpath('//*[@id="password"]'), "Rtn@2024");
        await this.wd.enterText(By.xpath('//*[@id="confirm-password"]'), "Rtn@2024");
        await this.wd.clickElement(By.xpath('//button[@data-testid="create-new-vault-submit-button"]'));
        await driver.sleep(1000);
        await this.wd.safeClick(selectors.doneButton);
        await driver.sleep(1000);
        await this.wd.safeClick(selectors.nextButton2);
        await driver.sleep(1000);
        await this.wd.safeClick(selectors.doneButton2);
        await driver.sleep(7777);
        await this.wd.waitForElement(selectors.mainetText);
      } else {
        await driver.sleep(3000);
        await this.wd.clickElement(selectors.agreeCheckbox);
        await this.wd.scrollToElement(selectors.importWalletButton);
        await this.wd.clickElement(selectors.importWalletButton);

        await this.wd.clickElement(selectors.agreeCheckbox2);
        await this.wd.scrollToElement(selectors.iagreeButton);
        await this.wd.clickElement(selectors.iagreeButton);

        await driver.sleep(2000);
        await fillImportSrpRecoveryWords(driver, seedPhrase);
        await this.wd.clickElement(selectors.confirmSecretInputButton);

        await this.wd.enterText(selectors.passwordInput, "Rtn@2024");
        await this.wd.enterText(selectors.passwordRepeatInput, "Rtn@2024");
        await this.wd.clickElement(selectors.iunderstandCheckbox);
        await this.wd.clickElement(selectors.createNewWalletButton);

        await driver.sleep(1000);
        await this.wd.clickElement(selectors.doneButton);
        await driver.sleep(1000);
        await this.wd.clickElement(selectors.nextButton2);
        await driver.sleep(1000);
        await this.wd.clickElement(selectors.doneButton2);
        await driver.sleep(7777);
        await this.wd.waitForElement(selectors.mainetText);

        this.logger.info(`Mtm setup success on proxy`);
        return true;
      }
    } catch (error) {
      this.logger.error(`Mtm setup failed for: ${error.message}`);
      throw error;
    }
  }
}
