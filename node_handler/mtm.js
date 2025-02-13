// node_handler/mtm.js
const { By, until } = require('selenium-webdriver');
const config = require('./config');
const { tabReset, clickElement, enterText, scrollToElement, waitForElement } = require('./automationHelpers');
const log4js = require('log4js');
const fs = require('fs');
const path = require('path');
const { parseHeader } = require('node-imap');

async function copyRecoveryPhrase(driver) {
    try {
      // Find all elements whose data-testid starts with "recovery-phrase-chip-"
      const chipElements = await driver.findElements(By.css('[data-testid^="recovery-phrase-chip-"]'));
      
      // Extract text from each element (assuming document order is correct)
      const phrases = [];
      for (let chipElement of chipElements) {
        const text = await chipElement.getText();
        phrases.push(text.trim());
      }
      
      // Join the phrases (here separated by a space; you could also use newlines)
      const recoveryPhrase = phrases.join(' ');
      
      // Ensure the output directory exists
      const outputDir = path.join(__dirname, './output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      // Write the recovery phrase to a file named "recovery_phrase.txt"
      const filePath = path.join(outputDir, 'recovery_phrase.txt');
      fs.writeFileSync(filePath, recoveryPhrase, 'utf8');
      
      // console.log('Recovery phrase saved to:', filePath);

      return phrases;
    } catch (error) {
      console.error('Error copying recovery phrase:', error);
    }
  }

async function fillRecoveryInputsWithClickAndSendKeys(driver, recoveryKeyArray) {
    try {
      // Find all input elements whose data-testid starts with "recovery-phrase-input-"
      const inputElements = await driver.findElements(By.css('input[data-testid^="recovery-phrase-input-"]'));
      
      for (let inputElement of inputElements) {
        // Instead of inputElement.getAttribute, use executeScript to access dataset.testid.
        // This can sometimes bypass LavaMoat's restrictions.
        const testid = await driver.executeScript("return arguments[0].dataset.testid;", inputElement);
        
        if (!testid) {
          console.warn("Could not retrieve data-testid via dataset.");
          continue;
        }
        
        // Extract the index from the testid string (assumes format like "recovery-phrase-input-2")
        const parts = testid.split('-');
        const index = parseInt(parts[parts.length - 1], 10);
        
        if (index < recoveryKeyArray.length) {
          const word = recoveryKeyArray[index];
          await inputElement.click();
          await inputElement.clear();
          await inputElement.sendKeys(word);
          // console.log(`Filled input ${testid} with word "${word}".`);
        } else {
          console.warn(`No word found for index ${index}.`);
        }
      }
      // console.log("All missing recovery words filled successfully using click and sendKeys.");
    } catch (error) {
      console.error("Error filling recovery inputs with click and sendKeys:", error);
    }
  }

async function fillImportSrpRecoveryWords(driver, recoveryKeyArray) {
try {
    // Find all input elements with data-testid starting with "import-srp__srp-word-"
    const inputElements = await driver.findElements(By.css('input[data-testid^="import-srp__srp-word-"]'));
    
    for (let inputElement of inputElements) {
        // Retrieve the data-testid attribute (e.g., "import-srp__srp-word-0")
        const testid = await driver.executeScript("return arguments[0].dataset.testid;", inputElement);
        
        // Extract the index from the testid by splitting on "-" and converting the last part to a number.
        const parts = testid.split('-');
        const index = parseInt(parts[parts.length - 1], 10);
        
        if (!isNaN(index) && index < recoveryKeyArray.length) {
            const word = recoveryKeyArray[index];
            // Click to focus, clear any existing value, and send the word.
            await inputElement.click();
            await inputElement.clear();
            await inputElement.sendKeys(word);
            // console.log(`Filled ${testid} with word "${word}".`);
        } else {
            console.warn(`Skipping ${testid}: invalid index or no corresponding word.`);
        }
    }
    // console.log("All import SRP recovery words filled successfully.");
} catch (error) {
    console.error("Error filling import SRP recovery words:", error);
}
}

class MtmService {
  constructor() {
    this.logger = log4js.getLogger('MtmService');
  }

  async setupNewWallet(driver, proxyUrl) {
    try {
      this.logger.info(`Starting Mtm setup`);
      const { loginUrl, selectors } = config.services.mtm;
      await driver.get(loginUrl);

      await driver.sleep(3000)
      await clickElement(driver, selectors.agreeCheckbox)
      await driver.sleep(1000)
      await clickElement(driver, selectors.createWalletButton)

      await clickElement(driver, selectors.agreeCheckbox2)
      await scrollToElement(driver, selectors.iagreeButton)
      await clickElement(driver, selectors.iagreeButton)

      await enterText(driver, selectors.passwordInput, "Rtn@2024")
      await enterText(driver, selectors.passwordRepeatInput, "Rtn@2024")
      await clickElement(driver, selectors.iunderstandCheckbox)
      await clickElement(driver, selectors.createNewWalletButton)

      await scrollToElement(driver, selectors.secureMyWalletButton)
      await clickElement(driver, selectors.secureMyWalletButton)

      await clickElement(driver, selectors.revealMySecretButton)
      const recoveryKeyArray = await copyRecoveryPhrase(driver)
      await clickElement(driver, selectors.nextButton)
    
      await driver.sleep(5000)
      await fillRecoveryInputsWithClickAndSendKeys(driver, recoveryKeyArray)
      await clickElement(driver, selectors.confirmButton)

      await driver.sleep(1000)
      await clickElement(driver, selectors.doneButton)
      await driver.sleep(1000)
      await clickElement(driver, selectors.nextButton2)
      await driver.sleep(1000)
      await clickElement(driver, selectors.doneButton2)
      await driver.sleep(7777)
      await waitForElement(driver, selectors.mainetText)
      
      this.logger.error(`Mtm setup success on proxy ${proxyUrl}`);
      return true;
    } catch (error) {
      this.logger.error(`Mtm setup failed for: ${error.message}`);
      return false;
    }
  }

  async setupOldWallet(driver, seedPhrases, proxyUrl) {
    try {
      this.logger.info(`Starting Mtm setup`);
      const { loginUrl, selectors } = config.services.mtm;
      await driver.get(loginUrl);

      await driver.sleep(3000)
      await clickElement(driver, selectors.agreeCheckbox)
      await scrollToElement(driver, selectors.importWalletButton)
      await clickElement(driver, selectors.importWalletButton)

      await clickElement(driver, selectors.agreeCheckbox2)
      await scrollToElement(driver, selectors.iagreeButton)
      await clickElement(driver, selectors.iagreeButton)

      await driver.sleep(2000)
      await fillImportSrpRecoveryWords(driver, seedPhrases)
      await clickElement(driver, selectors.confirmSecretInputButton)

      await enterText(driver, selectors.passwordInput, "Rtn@2024")
      await enterText(driver, selectors.passwordRepeatInput, "Rtn@2024")
      await clickElement(driver, selectors.iunderstandCheckbox)
      await clickElement(driver, selectors.createNewWalletButton)

      await driver.sleep(1000)
      await clickElement(driver, selectors.doneButton)
      await driver.sleep(1000)
      await clickElement(driver, selectors.nextButton2)
      await driver.sleep(1000)
      await clickElement(driver, selectors.doneButton2)
      await driver.sleep(7777)
      await waitForElement(driver, selectors.mainetText)
      
      this.logger.error(`Mtm setup success on proxy ${proxyUrl}`);
      return true;
    } catch (error) {
      this.logger.error(`Mtm setup failed for: ${error.message}`);
      return false;
    }
  }
}

module.exports = new MtmService();
