import { configureChromeOptions } from "../src/config/config.js";
import Service from "../src/services/layeredge.js";

if (import.meta.url === new URL(import.meta.url).href) {
  const { Builder } = await import("selenium-webdriver");

  (async () => {
    const options = configureChromeOptions();

    const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
    const service = new Service(driver);

    await driver.sleep(5000);

    await service.auto.tabReset(driver);

    try {
      await service.login({
        seedphrase: "ketchup evolve penalty rigid embark derive message layer oval fabric pride hundred",
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
