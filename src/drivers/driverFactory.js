// src/drivers/driverFactory.js
const { Builder } = require('selenium-webdriver');
const proxyChain = require('proxy-chain');
const { configureChromeOptions, EXTENSIONS } = require('./chromeOptions');
const { sleep, logger, validateExtensions } = require('../utils');
const { AutomationAcions } = require('../utils/automationActions');

async function processProxy(proxyUrl, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const anonymized = await proxyChain.anonymizeProxy(`http://${proxyUrl}`);
      const parsed = new URL(anonymized);
      // logger.info(`[PROXY SUCCESS] Anonymized Proxy: ${anonymized}`);
      return {
        url: `${parsed.protocol}//${parsed.hostname}:${parsed.port}`,
        auth: parsed.username && parsed.password ? `${parsed.username}:${parsed.password}` : null,
      };
    } catch (error) {
      retries++;
      logger.error(`[PROXY ERROR] Failed to anonymize proxy ${proxyUrl}. Attempt ${retries}/${maxRetries}: ${error.message}`);
      if (retries === maxRetries) throw new Error(`Failed to process proxy: ${proxyUrl}`);
      await sleep(2000);
    }
  }
}

async function initializeDriver(profilePath, proxyUrl, services = [], maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const options = configureChromeOptions();
      const parsedProxy = await processProxy(proxyUrl);

      options.addArguments(`--user-data-dir=${profilePath}`);
      options.addArguments(`--proxy-server=${parsedProxy.url}`);

      if (parsedProxy.auth) {
        options.addArguments(`--proxy-auth=${parsedProxy.auth}`);
      }

      // Always add the hcapchaSolver extension.
      options.addExtensions(EXTENSIONS.hcapchaSolver.path);
      // logger.info(`Loaded extension: hcapchaSolver`);

      // Validate all extensions before adding.
      await validateExtensions();

      // Dynamically load service-specific extensions based on the provided `services` array.
      services.forEach((service) => {
        const extConfig = EXTENSIONS[service];
        if (extConfig && extConfig.valid !== false) {
          try {
            options.addExtensions(extConfig.path);
            // logger.info(`Loaded extension: ${service}`);
          } catch (error) {
            logger.error(`Failed to load extension ${service}: ${error.message}`);
          }
        } else {
          logger.warn(`Extension not found or invalid for service: ${service}`);
        }
      });

      const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

      const script = `
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
      `;
      await driver.sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument', { source: script });

      await driver.sleep(5000);
      await new AutomationAcions(driver).tabReset();

      logger.info(`[DRIVER SUCCESS] Driver initialized successfully for proxy ${proxyUrl}`);
      return driver;
    } catch (error) {
      retries++;
      logger.error(`[DRIVER ERROR] Failed to initialize driver for proxy ${proxyUrl}. Attempt ${retries}/${maxRetries}: ${error.message}`);
      if (error.message.includes('ECONNRESET') && retries < maxRetries) {
        logger.warn(`[RETRYING] Retrying driver initialization due to ECONNRESET...`);
        await sleep(3000);
      } else if (retries === maxRetries) {
        throw new Error(`Failed to initialize driver after ${maxRetries} attempts for proxy ${proxyUrl}`);
      }
    }
  }
}

async function cleanupDriver(driver) {
  try {
    if (driver) {
      await driver.quit();
    }
  } catch (error) {
    logger.error(`[CLEANUP ERROR] ${error.message}`);
  }
}

module.exports = { initializeDriver, processProxy, cleanupDriver };