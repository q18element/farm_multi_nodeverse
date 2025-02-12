const { waitForElement, clickElement, enterText, getElementText, switchToIframe } = require('./automationHelpers');
const log4js = require('log4js');
const config = require('./config');
const { By, until } = require('selenium-webdriver');

const veerSelectors = config.services.veer.selectors;
const logger = log4js.getLogger('HcapchaService');

/**
 * Returns a promise that resolves after a random delay between min and max milliseconds.
 */
function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Moves the mouse to the element in a human-like way and clicks it.
 * Locator can be a By object or a CSS selector string.
 */
async function humanClickElement(driver, locator) {
    let element;
    if (typeof locator === 'string') {
        // Assume a CSS selector if a string is passed.
        element = await driver.findElement(By.css(locator));
    } else {
        element = await driver.findElement(locator);
    }
    // Use WebDriver actions to simulate mouse movement.
    const actions = driver.actions({ async: true });
    await actions.move({ origin: element }).perform();
    await randomDelay(200, 600);
    await actions.click().perform();
}

async function getCookieFromVeer(driver, username, password) {
    try {
        await driver.switchTo().newWindow('tab');
        await driver.get("https://mail.veer.vn");

        console.log("Current URL:", await driver.getCurrentUrl());

        const isLogin = await checkElementExsist(driver, veerSelectors.inboxElement, 5000);

        if (!isLogin) {
            // Use the provided username (email) and password.
            await enterText(driver, veerSelectors.emailInput, username);
            await randomDelay(300, 800);
            await enterText(driver, veerSelectors.passwordInput, password);
            await randomDelay(300, 800);
            await humanClickElement(driver, veerSelectors.loginButton);
            await randomDelay(500, 1000);
            await waitForElement(driver, veerSelectors.inboxElement);
        }
        
        await randomDelay(2000, 4000);
        await humanClickElement(driver, veerSelectors.refreshButton);
        await randomDelay(2000, 4000);

        const firstMailTitle = await getElementText(driver, By.xpath('//*[@id="mail-item-0"]/div/div/div[1]/span/button'));

        let retry = 0;
        while (retry < 3) {
            if (firstMailTitle === "status ") {
                await humanClickElement(driver, By.id('mail-item-0'));
                break;
            } else {
                await randomDelay(4000, 6000);
                await humanClickElement(driver, veerSelectors.refreshButton);
                await randomDelay(3000, 5000);
                retry++;
            }
        }
        
        await waitForElement(driver, By.xpath('//*[@id="mail-box-toggle"]/div[3]/div/div[2]/div/div[1]/h2'));
        await switchToIframe(driver, By.tagName('iframe'));
        await humanClickElement(driver, By.css('#tinymce > table > tbody > tr > td.container > div > table > tbody > tr > td > table > tbody > tr > td > table > tbody > tr > td > a'));
       
        await driver.close();
        return true;
    } catch (error) {
        console.error('Error extracting OTP:', error);
    }
}

async function getCookieFromBiz(driver, username, password) {
    try {
        await driver.switchTo().newWindow('tab');
        await driver.get("https://mail.veer.vn");

        console.log("Current URL:", await driver.getCurrentUrl());

        const isLogin = await checkElementExsist(driver, veerSelectors.inboxElement, 5000);

        if (!isLogin) {
            await enterText(driver, veerSelectors.emailInput, username);
            await randomDelay(300, 800);
            await enterText(driver, veerSelectors.passwordInput, password);
            await randomDelay(300, 800);
            await humanClickElement(driver, veerSelectors.loginButton);
            await randomDelay(500, 1000);
            await waitForElement(driver, veerSelectors.inboxElement);
        }
        
        await randomDelay(2000, 4000);
        await humanClickElement(driver, veerSelectors.refreshButton);
        await randomDelay(2000, 4000);

        const firstMailTitle = await getElementText(driver, By.xpath('//*[@id="mail-item-0"]/div/div/div[1]/span/button'));

        let retry = 0;
        while (retry < 3) {
            if (firstMailTitle === "status ") {
                await humanClickElement(driver, By.id('mail-item-0'));
                break;
            } else {
                await randomDelay(4000, 6000);
                await humanClickElement(driver, veerSelectors.refreshButton);
                await randomDelay(3000, 5000);
                retry++;
            }
        }
        
        await waitForElement(driver, By.xpath('//*[@id="mail-box-toggle"]/div[3]/div/div[2]/div/div[1]/h2'));
        await switchToIframe(driver, By.tagName('iframe'));
        await humanClickElement(driver, By.css('#tinymce > table > tbody > tr > td.container > div > table > tbody > tr > td > table > tbody > tr > td > table > tbody > tr > td > a'));
       
        await driver.close();
        return true;
    } catch (error) {
        console.error('Error extracting OTP:', error);
    }
}

async function setHcapchaCookie(driver, username, password) {
    try {
        const { accessSignupUrl, h_selectors } = config.services.hcapcha;
        await driver.get(accessSignupUrl);
        await humanClickElement(driver, By.xpath('/html/body/section/div/div/p[1]/a'));
        await waitForElement(driver, By.xpath('//*[@id="root"]/div/div[1]/div/div[2]/div[1]/h1'));
        await enterText(driver, h_selectors.emailInput, username);
        await humanClickElement(driver, By.xpath('//*[@id="root"]/div/div[1]/div/div[2]/div[5]/button'));
        await waitForElement(driver, h_selectors.congratsText);
        
        const domain = username.split('@')[1];
        let gotoSetcookie = false;

        if (domain === 'veer.vn') {
            gotoSetcookie = await getCookieFromVeer(driver, username, password);
        } else if (domain === 'tourzy.us' || domain === 'dealhot.vn') {
            gotoSetcookie = await getCookieFromBiz(driver, username, password);
        } else {
            throw new Error('Unsupported email domain');
        }

        if (gotoSetcookie) {
            console.log('success');
        } else {
            console.log('failed to set cookie');
        }

    } catch (err) {
        logger.debug("Fail to set Hcapcha Cookie: ", err);
        // For debugging purposes only. In production, you would likely handle this differently.
        await driver.sleep(999999999);
    }
}

module.exports = {
    setHcapchaCookie
};
