// automationHelpers.js
const { By, until } = require('selenium-webdriver');
const config = require('./config');

async function waitForElement(driver, selector, timeout = config.timeouts.element) {
  try {
    return await driver.wait(until.elementLocated(By.xpath(selector)), timeout);
  } catch (error) {
    throw new Error(`Element not found: ${selector} - ${error.message}`);
  }
}

async function clickElement(driver, selector) {
  const element = await waitForElement(driver, selector);
  await element.click();
}

async function safeClick(driver, selector, timeout = 2000) {
  try {
    const element = await driver.wait(until.elementLocated(By.xpath(selector)), timeout);
    await element.click();
    return true;
  } catch (error) {
    return false;
  }
}

async function enterText(driver, selector, text) {
  const element = await waitForElement(driver, selector);
  await element.clear();
  await element.sendKeys(text);
}

module.exports = {
  waitForElement,
  clickElement,
  safeClick,
  enterText,
};
