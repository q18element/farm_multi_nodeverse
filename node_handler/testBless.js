// testBlessService.js
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const blockmeshService = require('./bmesh'); // our BlessService instance

// Utility function to prompt user for OTP from the terminal
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

(async function testBlessService() {
  // Initialize Chrome driver using default or custom options.
  const options = new chrome.Options();
  options.addArguments("--start-maximized");
  options.addExtensions("./../crxs/blockmesh.crx");

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  try {
    const testEmail = 'dawn45@nodeverse.ai'; // Replace with your test email address

    console.log("Starting BlessService login...");
    // Initiate login, which navigates to the login page, enters the email, and triggers OTP delivery.
    await blockmeshService.login(driver, testEmail, "Rtn@2024", "1112345");
    console.log("Login Done.");

    // Call the check method to submit the OTP and retrieve token/pubKey
    const result = await blockmeshService.check(driver, testEmail, "1234");
    console.log("BlessService check completed. Result:");
    console.log(result);

  } catch (error) {
    console.error("Test encountered an error:", error);
    sleep(99999999);
  } finally {
    sleep(99999999);
    console.log("Test success.");
  }
})();
