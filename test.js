const GradientService = require('./src/services/gradient');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async () => {

  const options = new chrome.Options();
  options.addArguments('start-maximized');
  options.addArguments('--disable-blink-features=AutomationControlled');
  options.addExtensions("./crxs/gradient.crx");

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  const gradientService = new GradientService(driver);

  const credentials = {
    username: 'bull1@veer.vn',
    password: 'Rtn@2024',
  };

  try {
    const loginSuccess = await gradientService.login(credentials);
    console.log(`Login Success: ${loginSuccess}`);

    if (loginSuccess) {
      const points = await gradientService.check(credentials);
      console.log(`Points: ${points}`);
    }
  } catch (error) {
    console.error(`Test failed: ${error.message}`);
  } finally {
    await driver.quit();
  }
})();
