import Service from "../src-ts/services/layeredge.js";
import { INSTALLED_EXTENSION } from "../src-ts/resources.js";
import BrowserManager from "../src-ts/browser/browserManager.js";

(async () => {
  const driver = await new BrowserManager().startProfile({ extensions: [INSTALLED_EXTENSION.metamask.path] });
  const service = new Service({
    serviceName: "layeredge",
    driver,
    // @ts-ignore
    account: {
      seedphrase: "ketchup evolve penalty rigid embark derive message layer oval fabric pride hundred",
    },
  });

  await driver.sleep(5000);

  await service.browser.tabReset();

  try {
    await service.load();
  } catch (error) {
    console.error("Test encountered an error:", error);
    await driver.sleep(99999999);
  } finally {
    await driver.sleep(99999999);
    console.log("Test success.");
    await driver.quit();
  }
})();
