// testDepinedService.js
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const mtmService = require('./mtm'); 
const { tabReset, clickElement, safeClick, enterText } = require('./automationHelpers');
const layeredgeService = require('./layeredge');
// Utility function to prompt user for OTP from the terminal
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

(async function testDepinedService() {
  // Initialize Chrome driver using default or custom options.
  const options = new chrome.Options();
  options.addArguments('start-maximized');
  options.addArguments('--disable-blink-features=AutomationControlled');
  options.addExtensions("././crxs/metamask.crx");

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  await driver.sleep(10000)

  await tabReset(driver)

  try {

    console.log("Starting MTM setup...");

    const recoveryKeyArray = [
      "decade",
      "bless",
      "twice",
      "candy",
      "tube",
      "donate",
      "middle",
      "laugh",
      "pottery",
      "ginger",
      "assume",
      "summer"
    ]
    ;
    layeredgeService.seedPhrase = recoveryKeyArray.join(' ')
    await layeredgeService.login(driver)
    // await mtmService.setupOldWallet(driver, recoveryKeyArray, "dummy_proxy");
    // await mtmService.lockMetamask(driver);
    // await mtmService.setupOldWallet(driver, recoveryKeyArray, "dummy_proxy");

    // console.log("Login Done.");

    // // Call the check method to submit the OTP and retrieve token/pubKey
    // const result = await mtmService.check(driver, testEmail, "1234");

    // console.log("DepinedService check completed. Result:");
    // console.log(result);

  } catch (error) {
    console.error("Test encountered an error:", error);
    sleep(99999999);
  } finally {
    sleep(99999999);
    console.log("Test success.");
  }
})();
