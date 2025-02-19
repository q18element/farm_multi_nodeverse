const Service = require("../services/layeredge");
if (require.main === module) {
  const { Builder } = require("selenium-webdriver");
  const chrome = require("selenium-webdriver/chrome");

  (async () => {
    const options = new chrome.Options();
    options.addArguments("start-maximized");
    options.addExtensions("./././crxs/mtm.crx");
    options.addArguments("--disable-blink-features=AutomationControlled");
    options.setChromeBinaryPath()
    const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
    const service = new Service(driver);

    await driver.sleep(5000);

    await service.auto.tabReset(driver);

    try {
      await service.login({
        seedPhrase: "ketchup evolve penalty rigid embark derive message layer oval fabric pride hundred",
      });
    } catch (error) {
      console.error("Test encountered an error:", error);
      driver.sleep(99999999);
    } finally {
      driver.sleep(99999999);
      console.log("Test success.");
    }
  })();
}
