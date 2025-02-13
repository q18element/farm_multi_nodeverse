// testDepinedService.js
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const depinedService = require('./depined'); 

// Utility function to prompt user for OTP from the terminal
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

(async function testDepinedService() {
  // Initialize Chrome driver using default or custom options.
  const options = new chrome.Options();
  options.addArguments('window-size=1920,1080');
  options.addArguments('--disable-blink-features=AutomationControlled');
  options.addExtensions("./../crxs/depined.crx");

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  try {
    const testEmail = 'bull1000@veer.vn'; // Replace with your test email address

    console.log("Starting DepinedService login...");

    // Initiate login, which navigates to the login page, enters the email, and triggers OTP delivery.
    await depinedService.login(driver, testEmail, "Rtn@2024", "1112345");
    console.log("Login Done.");

    // Call the check method to submit the OTP and retrieve token/pubKey
    const result = await depinedService.check(driver, testEmail, "1234");

    console.log("DepinedService check completed. Result:");
    console.log(result);

  } catch (error) {
    console.error("Test encountered an error:", error);
    sleep(99999999);
  } finally {
    sleep(99999999);
    console.log("Test success.");
  }
})();
