export { initializeDriver };

import { Builder } from "selenium-webdriver";
import proxyChain from "proxy-chain";
import { WebDriverHelper } from "./webDriverHelper.js";
import { randomUserAgent } from "../config.js";
import os from "os";
import chrome from "selenium-webdriver/chrome";
import { EXTENSIONS } from "../constants.js";

const configureChromeOptions = () => {
  const options = new chrome.Options();
  const args = [
    `--user-agent=${randomUserAgent()}`,
    "--allow-pre-commit-input",
    "start-maximized",
    "disable-infobars",
    "--disable-application-cache",
    "--log-level=3",
    "--disable-blink-features=AutomationControlled",
  ];

  options.excludeSwitches("enable-automation");

  if (os.platform() === "linux") {
    args.push("--headless", "--no-sandbox", "--disable-gpu");
    options.setChromeBinaryPath("/usr/bin/chromium-browser");
  }

  options.addArguments(args);
  return options;
};

/**
 * [OK] this just parse proxy to {url: http://host:port, auth: user:pass}
 * @param {string} proxyUrl
 * @param {number} maxRetries
 * @returns {{url: string, auth: string}}
 */
async function processProxy(proxyUrl, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const anonymized = await proxyChain.anonymizeProxy(`http://${proxyUrl}`);
      const parsed = new URL(anonymized);
      return {
        url: `${parsed.protocol}//${parsed.hostname}:${parsed.port}`,
        auth: parsed.username && parsed.password ? `${parsed.username}:${parsed.password}` : null,
      };
    } catch (error) {
      retries++;
      logger.error(
        `[PROXY ERROR] Failed to anonymize proxy ${proxyUrl}. Attempt ${retries}/${maxRetries}: ${error.message}`
      );
      if (retries === maxRetries) throw new Error(`Failed to process proxy: ${proxyUrl}`);
      await sleep(2000);
    }
  }
}

/**
 * @param {import("../App.js").Profile} account
 * @param {string[]} loadExtensions
 */
async function initializeDriver(account, loadExtensions = [], maxRetries = 3) {
  let retries = 0;
  let profilePath = path.join(ROOT_PATH, `data/profiles/profile_${account.id}`);
  while (retries < maxRetries) {
    try {
      const options = configureChromeOptions();
      const parsedProxy = await processProxy(proxyUrl);

      options.addArguments(`--user-data-dir=${profilePath}`);
      options.addArguments(`--proxy-server=${parsedProxy.url}`);

      if (parsedProxy.auth) {
        options.addArguments(`--proxy-auth=${parsedProxy.auth}`);
      }

      for (const extension of loadExtensions) {
        options.addExtensions(extension);
      }
      if (EXTENSIONS.hcaptchaSolver.path in loadExtensions) {
        options.addExtensions(EXTENSIONS.hcaptchaSolver.path);
      }

      const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

      const script = `
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
      `;
      await driver.sendDevToolsCommand("Page.addScriptToEvaluateOnNewDocument", { source: script });

      await driver.sleep(5000);
      await new WebDriverHelper(driver).tabReset();

      logger.info(`[DRIVER SUCCESS] Driver initialized successfully for proxy ${proxyUrl}`);
      return driver;
    } catch (error) {
      retries++;
      logger.error(
        `[DRIVER ERROR] Failed to initialize driver for proxy ${proxyUrl}. Attempt ${retries}/${maxRetries}: ${error.message}`
      );
      if (error.message.includes("ECONNRESET") && retries < maxRetries) {
        logger.warn(`[RETRYING] Retrying driver initialization due to ECONNRESET...`);
        await sleep(3000);
      } else if (retries === maxRetries) {
        throw new Error(`Failed to initialize driver after ${maxRetries} attempts for proxy ${proxyUrl}`);
      }
    }
  }
}
