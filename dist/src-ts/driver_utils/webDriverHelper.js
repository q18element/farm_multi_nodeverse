import { By, until } from "selenium-webdriver";
import fs from "fs";
export default class WebDriverHelper {
    driver;
    defaultTimeout;
    assignedTab;
    _assignedTab;
    constructor(driver, config = undefined) {
        this.driver = driver;
        this.defaultTimeout = config || {
            timeouts: {
                element: 60000,
                pageLoad: 60000,
            },
        };
        this.assignedTab = {};
        this._assignedTab = [];
    }
    async assignTab(tabName) {
        if (this.assignedTab[tabName]) {
            await this.driver.switchTo().window(this.assignedTab[tabName]);
            return;
        }
        const currentHandle = await this.driver.getWindowHandle();
        if (this._assignedTab.includes(currentHandle)) {
            await this.driver.switchTo().newWindow("tab");
            const newHandle = await this.driver.getWindowHandle();
            this.assignedTab[tabName] = newHandle;
            this._assignedTab.push(newHandle);
        }
        else {
            this.assignedTab[tabName] = currentHandle;
            this._assignedTab.push(currentHandle);
        }
        // Switch to the assigned tab
        await this.driver.switchTo().window(this.assignedTab[tabName]);
    }
    async get(url) {
        const driver = this.driver;
        await driver.get(url);
        await driver.wait(async () => {
            return await driver.executeScript("return document.readyState").then((state) => {
                return state === "complete";
            });
        }, this.defaultTimeout.timeouts.pageLoad);
    }
    async waitForElement(selector, timeout = undefined) {
        timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
        try {
            return await this.driver.wait(until.elementLocated(selector), timeout);
        }
        catch (error) {
            throw new Error(`Element not found: ${selector} - ${error.message}`);
        }
    }
    async checkElementExists(selector, timeout = 5000) {
        timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
        try {
            await this.driver.wait(until.elementLocated(selector), timeout);
            return true;
        }
        catch {
            return false;
        }
    }
    async clickElement(selector, timeout = undefined) {
        const element = await this.waitForElement(selector, timeout);
        await element.click();
    }
    async actionsClickElement(selector, timeout = undefined) {
        await this.driver
            .actions()
            .move({ origin: await this.waitForElement(selector, timeout) })
            .click()
            .perform();
    }
    async safeClick(selector, timeout = 5000) {
        timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
        try {
            const element = await this.driver.wait(until.elementLocated(selector), timeout);
            await element.click();
            return true;
        }
        catch {
            return false;
        }
    }
    async enterText(selector, text, timeout = undefined) {
        timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
        const element = await this.waitForElement(selector, timeout);
        await element.sendKeys(text);
    }
    async tabReset() {
        try {
            const handles = await this.driver.getAllWindowHandles();
            if (handles.length > 1) {
                for (let i = handles.length - 1; i > 0; i--) {
                    await this.driver.switchTo().window(handles[i]);
                    await this.driver.close();
                }
                await this.driver.switchTo().window(handles[0]);
            }
            await this.driver.get("about:blank");
        }
        catch (error) {
            console.error(`[TAB CLEANUP ERROR] ${error.message}`);
        }
    }
    async scrollToElement(selector, timeout = undefined) {
        const element = await this.waitForElement(selector, timeout);
        await this.driver.executeScript("arguments[0].scrollIntoView(true);", element);
    }
    async waitForElementToBeClickable(selector, timeout = undefined) {
        timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
        try {
            const element = await this.waitForElement(selector, timeout);
            await this.driver.wait(until.elementIsVisible(element), timeout);
            await this.driver.wait(until.elementIsEnabled(element), timeout);
            return element;
        }
        catch (error) {
            throw new Error(`Element not clickable: ${selector} - ${error.message}`);
        }
    }
    async waitForElementToBeInvisible(selector, timeout = undefined) {
        timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
        try {
            await this.driver.wait(until.elementLocated(selector), timeout);
            return !!(await this.driver.wait(until.elementIsNotVisible(this.driver.findElement(selector)), timeout));
        }
        catch (error) {
            throw new Error(`Element did not become invisible: ${selector} - ${error.message}`);
        }
    }
    async getElementText(selector, timeout = undefined) {
        const element = await this.waitForElement(selector, timeout);
        return await element.getText();
    }
    async getTextSafe(selector, timeout = undefined) {
        try {
            const element = await this.waitForElement(selector, timeout);
            return await element.getText();
        }
        catch (error) {
            console.warn(`Failed to get text from ${selector}: ${error.message}`);
            return "N/A";
        }
    }
    async selectDropdownByValue(selector, value, timeout = undefined) {
        const element = await this.waitForElement(selector, timeout);
        const options = await element.findElements(By.css("option"));
        for (let option of options) {
            const optionValue = await option.getAttribute("value");
            if (optionValue === value) {
                await option.click();
                break;
            }
        }
    }
    async switchToNewWindow() {
        const originalWindow = await this.driver.getWindowHandle();
        const windows = await this.driver.getAllWindowHandles();
        for (let handle of windows) {
            if (handle !== originalWindow) {
                await this.driver.switchTo().window(handle);
                return;
            }
        }
        throw new Error("No new window found");
    }
    async switchToWindowContainTitle(title) {
        const originalWindow = await this.driver.getWindowHandle();
        const windows = await this.driver.getAllWindowHandles();
        for (let handle of windows) {
            await this.driver.switchTo().window(handle);
            if ((await this.driver.getTitle()) === title) {
                return;
            }
        }
        await this.driver.switchTo().window(originalWindow);
        throw new Error(`No window found with title: ${title}`);
    }
    async closeAllOtherTabs() {
        const currentHandle = await this.driver.getWindowHandle();
        const handles = await this.driver.getAllWindowHandles();
        for (let handle of handles) {
            if (handle !== currentHandle) {
                await this.driver.switchTo().window(handle);
                await this.driver.close();
            }
        }
        await this.driver.switchTo().window(currentHandle);
    }
    async takeScreenshot(filepath) {
        const image = await this.driver.takeScreenshot();
        fs.writeFileSync(filepath, image, "base64");
    }
    async clearAndEnterText(selector, text, timeout = undefined) {
        const element = await this.waitForElement(selector, timeout);
        await element.clear();
        await element.sendKeys(text);
    }
    async waitForUrlToContain(substring, timeout = undefined) {
        timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
        try {
            await this.driver.wait(until.urlContains(substring), timeout);
        }
        catch (error) {
            throw new Error(`URL did not contain "${substring}" within ${timeout} ms - ${error.message}`);
        }
    }
    async getAttribute(selector, attribute, timeout = undefined) {
        timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
        const element = await this.waitForElement(selector);
        return await element.getAttribute(attribute);
    }
    async switchToIframe(selector, timeout = undefined) {
        try {
            const iframe = await this.waitForElement(selector, timeout);
            await this.driver.switchTo().frame(iframe);
        }
        catch (error) {
            throw new Error(`Failed to switch to iframe: ${selector} - ${error.message}`);
        }
    }
    async sleep(ms) {
        await this.driver.sleep(ms);
    }
}
