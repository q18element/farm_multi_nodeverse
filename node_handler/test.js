// testDespeedService.js
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const despeedService = require('./despeed'); // our DespeedService instance

// Utility function to prompt user for OTP from the terminal
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

(async function testDespeedService() {
  // Initialize Chrome driver using default or custom options.
  const options = new chrome.Options();
  options.addArguments('window-size=1920,1080');
  options.addArguments('--disable-blink-features=AutomationControlled');
  options.addExtensions("./../crxs/despeed.crx");
  options.addExtensions("./../crxs/hcapchasolver.crx");

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  await driver.executeScript(
    "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
  );

  // Spoof navigator.plugins to return a non-empty array.
  await driver.executeScript(`
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
  `);

  // Spoof navigator.languages to return realistic language settings.
  await driver.executeScript(`
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en']
    });
  `);

  try {
    const testEmail = 'truongbodoi821@gmail.com'; // Replace with your test email address

    console.log("Starting DespeedService login...");

    // Initiate login, which navigates to the login page, enters the email, and triggers OTP delivery.
    await despeedService.login(driver, testEmail, "Rtn@2024", "1112345");
    console.log("Login Done.");

    // Call the check method to submit the OTP and retrieve token/pubKey
    const result = await despeedService.check(driver, testEmail, "1234");

    console.log("DespeedService check completed. Result:");
    console.log(result);

  } catch (error) {
    console.error("Test encountered an error:", error);
    sleep(99999999);
  } finally {
    sleep(99999999);
    console.log("Test success.");
  }
})();
