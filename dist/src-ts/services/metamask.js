import { By } from "selenium-webdriver";
import fs from "fs";
import path from "path";
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
    }
    catch (error) {
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
            }
            else {
                console.warn(`No word found for index ${index}.`);
            }
        }
    }
    catch (error) {
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
            }
            else {
                // console.debug(`Skipping ${testid}: invalid index or no corresponding word.`);
            }
        }
    }
    catch (error) {
        console.error("Error filling import SRP recovery words:", error);
    }
}
const config = {
    services: {
        mtm: {
            loginUrl: "chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#onboarding/welcome",
            selectors: {
                agreeCheckbox: By.xpath('//*[@id="onboarding__terms-checkbox"]'),
                createWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/ul/li[2]/button'),
                importWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/ul/li[3]/button'),
                agreeCheckbox2: By.xpath('//*[@id="metametrics-opt-in"]'),
                iagreeButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button[2]'),
                passwordInput: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[1]/label/input'),
                passwordRepeatInput: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[2]/label/input'),
                iunderstandCheckbox: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[3]/label/span[1]/input'),
                createNewWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/button'),
                secureMyWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button[2]'),
                revealMySecretButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[6]/button'),
                nextButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[6]/div/button'),
                confirmButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[5]/button'),
                doneButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[3]/button'),
                nextButton2: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button'),
                doneButton2: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button'),
                mainetText: By.xpath('//*[@id="app-content"]/div/div[2]/div/div[1]/button/p'),
                confirmSecretInputButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[4]/div/button'),
            },
        },
    },
};
export default class MetamaskService extends BaseService {
    daily() {
        throw new Error("Method not implemented.");
    }
    extensionId;
    load() {
        throw new Error("Method not implemented.");
    }
    check() {
        throw new Error("Method not implemented.");
    }
    constructor(opts) {
        super(opts);
        this.extensionId = "nkbihfbeogaeaoehlefnkodbefgpgknn";
    }
    async setupNewWallet() {
        const auto = this.browser;
        const driver = auto.driver;
        const { loginUrl, selectors } = config.services.mtm;
        await driver.get(loginUrl);
        await driver.sleep(3000);
        await auto.clickElement(selectors.agreeCheckbox);
        await driver.sleep(1000);
        await auto.clickElement(selectors.createWalletButton);
        await auto.clickElement(selectors.agreeCheckbox2);
        await auto.scrollToElement(selectors.iagreeButton);
        await auto.clickElement(selectors.iagreeButton);
        await auto.enterText(selectors.passwordInput, "Rtn@2024");
        await auto.enterText(selectors.passwordRepeatInput, "Rtn@2024");
        await auto.clickElement(selectors.iunderstandCheckbox);
        await auto.clickElement(selectors.createNewWalletButton);
        await auto.scrollToElement(selectors.secureMyWalletButton);
        await auto.clickElement(selectors.secureMyWalletButton);
        await auto.clickElement(selectors.revealMySecretButton);
        const recoveryKeyArray = await copyRecoveryPhrase(driver);
        await auto.clickElement(selectors.nextButton);
        await driver.sleep(5000);
        if (!recoveryKeyArray) {
            throw new Error("Recovery key array is empty");
        }
        await fillRecoveryInputsWithClickAndSendKeys(driver, recoveryKeyArray);
        await auto.clickElement(selectors.confirmButton);
        await driver.sleep(1000);
        await auto.clickElement(selectors.doneButton);
        await driver.sleep(1000);
        await auto.clickElement(selectors.nextButton2);
        await driver.sleep(1000);
        await auto.clickElement(selectors.doneButton2);
        await driver.sleep(7777);
        await auto.waitForElement(selectors.mainetText);
        this.logger.info(`Mtm setup success on proxy `);
    }
    async lockMetamask() {
        const auto = this.browser;
        try {
            await auto.driver.sleep(1000);
            await auto.clickElement(By.css('span[style*="./images/icons/more-vertical.svg"]'));
            await auto.clickElement(By.xpath('//button//div[text()="Lock MetaMask"]'));
        }
        catch (e) { }
    }
    async confirmAny() {
        const auto = this.browser;
        const driver = auto.driver;
        let currentWindow = await driver.getWindowHandle();
        const timeout = 10; // timeout in seconds
        const startTime = Date.now();
        while (Date.now() - startTime < timeout * 1000) {
            try {
                const windowHandles = await driver.getAllWindowHandles();
                for (const window of windowHandles) {
                    await driver.switchTo().window(window);
                    let url = await driver.getCurrentUrl();
                    this.logger.debug("checking url" + url);
                    if (url.includes("notification.html")) {
                        await driver.sleep(2000);
                        while (1) {
                            await driver.executeScript(() => {
                                document
                                    .querySelector('button[data-testid="confirmation-submit-button"]:not([disabled]), button[data-testid="confirm-btn"]:not([disabled]), button[data-testid="page-container-footer-next"]:not([disabled]), button[data-testid="confirm-footer-button"]:not([disabled])') // @ts-ignore
                                    ?.click();
                            });
                            await driver.sleep(1000);
                        }
                    }
                }
                await driver.sleep(500);
            }
            catch (e) {
                // throw new Error("Error during window checks: " + e.message);
            }
        }
        await driver.switchTo().window(currentWindow);
    }
    async setupOldWallet(seedphrase) {
        const auto = this.browser;
        const driver = auto.driver;
        const prevTab = await driver.getWindowHandle();
        await driver.switchTo().newWindow("tab");
        this.logger.info(`Starting Mtm setup`);
        const { loginUrl, selectors } = config.services.mtm;
        try {
            const current = await driver.getWindowHandle();
            await auto.get(loginUrl);
            driver.sleep(2000);
            await driver.switchTo().window(current);
            let e = await auto.waitForElement(By.xpath('(//*[@id="onboarding__terms-checkbox"] | //button[text()="Unlock"] | //button[text()="Tokens"])[1]'));
            if ((await e.getText()) === "Tokens") {
                // if already unlocked, skip, may it is retry
                this.logger.info("Metamask is already unlocked");
                return;
            }
            if ((await e.getText()) === "Unlock") {
                await auto.clickElement(By.xpath('//div[@class="unlock-page__links"]//a'));
                await driver.sleep(2000);
                await fillImportSrpRecoveryWords(driver, seedphrase);
                await auto.enterText(By.xpath('//*[@id="password"]'), "Rtn@2024");
                await auto.enterText(By.xpath('//*[@id="confirm-password"]'), "Rtn@2024");
                await auto.clickElement(By.xpath('//button[@data-testid="create-new-vault-submit-button"]'));
                await driver.sleep(1000);
                if (await auto.safeClick(selectors.doneButton)) {
                    await driver.sleep(1000);
                    await auto.safeClick(selectors.nextButton2);
                    await driver.sleep(1000);
                    await auto.safeClick(selectors.doneButton2);
                    await driver.sleep(7777);
                }
                await auto.waitForElement(selectors.mainetText);
            }
            else {
                await driver.sleep(3000);
                await auto.clickElement(selectors.agreeCheckbox);
                await auto.scrollToElement(selectors.importWalletButton);
                await auto.clickElement(selectors.importWalletButton);
                await auto.clickElement(selectors.agreeCheckbox2);
                await auto.scrollToElement(selectors.iagreeButton);
                await auto.clickElement(selectors.iagreeButton);
                await driver.sleep(2000);
                await fillImportSrpRecoveryWords(driver, seedphrase);
                await auto.clickElement(selectors.confirmSecretInputButton);
                await auto.enterText(selectors.passwordInput, "Rtn@2024");
                await auto.enterText(selectors.passwordRepeatInput, "Rtn@2024");
                await auto.clickElement(selectors.iunderstandCheckbox);
                await auto.clickElement(selectors.createNewWalletButton);
                await driver.sleep(1000);
                await auto.clickElement(selectors.doneButton);
                await driver.sleep(1000);
                await auto.clickElement(selectors.nextButton2);
                await driver.sleep(1000);
                await auto.clickElement(selectors.doneButton2);
                await driver.sleep(2000);
                await auto.waitForElement(selectors.mainetText);
                this.logger.info(`Mtm setup success on proxy`);
            }
        }
        finally {
            await this.resetMetamaskTab();
            try {
                await driver.switchTo().window(prevTab);
            }
            catch (e) {
                await driver.switchTo().window((await driver.getAllWindowHandles())[0]);
            }
        }
    }
    async resetMetamaskTab() {
        const driver = this.browser.driver;
        for (const tab of await driver.getAllWindowHandles()) {
            try {
                await driver.switchTo().window(tab);
                if ((await driver.getCurrentUrl()).startsWith("chrome-extension://" + this.extensionId)) {
                    if ((await driver.getAllWindowHandles()).length == 1) {
                        await driver.switchTo().newWindow("tab");
                        await driver.switchTo().window(tab);
                        await driver.close();
                        break;
                    }
                    else {
                        await driver.close();
                    }
                }
            }
            catch (e) { }
        }
    }
}
