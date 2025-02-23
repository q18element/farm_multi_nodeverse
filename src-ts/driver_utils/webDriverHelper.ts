import { By, WebElement, until, WebDriver } from "selenium-webdriver";
import fs from "fs";

export default class WebDriverHelper {
  driver: WebDriver;
  defaultTimeout: { timeouts: { element: number } };

  constructor(driver: WebDriver, config = undefined) {
    this.driver = driver;
    this.defaultTimeout = config || {
      timeouts: {
        element: 60000,
      },
    };
  }

  async waitForElement(selector: By, timeout: number | undefined = undefined): Promise<WebElement> {
    timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
    try {
      return await this.driver.wait(until.elementLocated(selector), timeout);
    } catch (error: any) {
      throw new Error(`Element not found: ${selector} - ${error.message}`);
    }
  }

  async checkElementExists(selector: By, timeout: number | undefined = 5000): Promise<boolean> {
    timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
    try {
      await this.driver.wait(until.elementLocated(selector), timeout);
      return true;
    } catch {
      return false;
    }
  }

  async clickElement(selector: By, timeout: number | undefined = undefined): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await element.click();
  }

  async actionsClickElement(selector: By, timeout: number | undefined = undefined): Promise<void> {
    await this.driver
      .actions()
      .move({ origin: await this.waitForElement(selector, timeout) })
      .click()
      .perform();
  }

  async safeClick(selector: By, timeout: number | undefined = undefined): Promise<boolean> {
    timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
    try {
      const element = await this.driver.wait(until.elementLocated(selector), timeout);
      await element.click();
      return true;
    } catch {
      return false;
    }
  }

  async enterText(selector: By, text: string, timeout: number | undefined = undefined): Promise<void> {
    timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
    const element = await this.waitForElement(selector, timeout);
    await element.sendKeys(text);
  }

  async tabReset(): Promise<void> {
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
    } catch (error: any) {
      console.error(`[TAB CLEANUP ERROR] ${error.message}`);
    }
  }

  async scrollToElement(selector: By, timeout: number | undefined = undefined): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await this.driver.executeScript("arguments[0].scrollIntoView(true);", element);
  }

  async waitForElementToBeClickable(selector: By, timeout: number | undefined = undefined): Promise<WebElement> {
    timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
    try {
      const element = await this.waitForElement(selector, timeout);
      await this.driver.wait(until.elementIsVisible(element), timeout);
      await this.driver.wait(until.elementIsEnabled(element), timeout);
      return element;
    } catch (error: any) {
      throw new Error(`Element not clickable: ${selector} - ${error.message}`);
    }
  }

  async waitForElementToBeInvisible(selector: By, timeout : number | undefined = undefined): Promise<boolean> {
    timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
    try {
      await this.driver.wait(until.elementLocated(selector), timeout);
      return !!await this.driver.wait(until.elementIsNotVisible(this.driver.findElement(selector)), timeout);
    } catch (error: any) {
      throw new Error(`Element did not become invisible: ${selector} - ${error.message}`);
    }
  }

  async getElementText(selector: By, timeout: number | undefined = undefined): Promise<string> {
    const element = await this.waitForElement(selector, timeout);
    return await element.getText();
  }

  async getTextSafe(selector: By, timeout: number | undefined = undefined): Promise<string> {
    try {
      const element = await this.waitForElement(selector, timeout);
      return await element.getText();
    } catch (error: any) {
      console.warn(`Failed to get text from ${selector}: ${error.message}`);
      return "N/A";
    }
  }

  async selectDropdownByValue(selector: By, value: string, timeout: number | undefined = undefined): Promise<void> {
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

  async switchToNewWindow(): Promise<void> {
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

  async switchToWindowContainTitle(title: string): Promise<void> {
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

  async closeAllOtherTabs(): Promise<void> {
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

  async takeScreenshot(filepath: string): Promise<void> {
    const image = await this.driver.takeScreenshot();
    fs.writeFileSync(filepath, image, "base64");
  }

  async clearAndEnterText(selector: By, text: string, timeout: number | undefined = undefined): Promise<void> {
    const element = await this.waitForElement(selector, timeout);
    await element.clear();
    await element.sendKeys(text);
  }

  async waitForUrlToContain(substring: string, timeout : number | undefined = undefined): Promise<void> {
    timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
    try {
      await this.driver.wait(until.urlContains(substring), timeout);
    } catch (error: any) {
      throw new Error(`URL did not contain "${substring}" within ${timeout} ms - ${error.message}`);
    }
  }

  async getAttribute(selector: By, attribute: string, timeout: number | undefined = undefined): Promise<string> {
    timeout = timeout || this.defaultTimeout.timeouts.element || 60000;
    const element = await this.waitForElement(selector);
    return await element.getAttribute(attribute);
  }

  async switchToIframe(selector: By, timeout : number | undefined = undefined): Promise<void> {
    try {
      const iframe = await this.waitForElement(selector, timeout);
      await this.driver.switchTo().frame(iframe);
    } catch (error: any) {
      throw new Error(`Failed to switch to iframe: ${selector} - ${error.message}`);
    }
  }
}
