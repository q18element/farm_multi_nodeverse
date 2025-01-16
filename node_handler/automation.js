const fs = require('fs');
const path = require('path');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const proxyChain = require("proxy-chain");
const TokenPlugin = require('./token_handler');  // Adjust path if needed
const log4js = require('log4js');

const log4jsConfig = {
  appenders: {
    file: { type: 'file', filename: 'automation.log' },
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ['console', 'file'], level: 'info' }
  }
};

// Configure log4js for structured logging
log4js.configure(log4jsConfig);

const logger = log4js.getLogger();

const tokenPlugin = new TokenPlugin();

// Path to the CRX files for extensions
const openloop_Extension_Path = path.resolve('./crxs/openloop.crx');
const gradient_Extension_Path = path.resolve('./crxs/gradient.crx');
const toggle_Extension_Path = path.resolve('./crxs/toggle.crx');

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36";

// Configure Chrome options
let options = new chrome.Options();
options.addArguments(
  'start-maximized',
  'disable-infobars',
  '--disable-application-cache',
  '--no-sandbox',
  '--disable-gpu',
  `--user-agent=${USER_AGENT}`,
  '--disable-web-security',
  '--ignore-certificate-errors',
  '--dns-prefetch-disable',
  '--enable-unsafe-swiftshader',
  '--headless', // Uncomment for headless mode
);

options.setChromeBinaryPath('/usr/bin/chromedriver');

options.addExtensions(openloop_Extension_Path);
options.addExtensions(gradient_Extension_Path);
options.addExtensions(toggle_Extension_Path);

const gradient_extension_url = "chrome-extension://caacbgbklghmpodbdafajbgdnegacfmo/popup.html";
const openloop_extension_url = "chrome-extension://effapmdildnpkiaeghlkicpfflpiambm/dist/popup/index.html";
const toggle_extension_url = "chrome-extension://bnkekngmddejlfdeefjilpfdhomeomgb/index.html";

// Load account data from JSON file
function loadAccountData(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

async function switchToTab(driver, index, url = 'about:blank') {
  const windowHandles = await driver.getAllWindowHandles();
  if (index < windowHandles.length) {
    await driver.switchTo().window(windowHandles[index]);
  } else {
    await driver.executeScript(`window.open('${url}', '_blank');`);
    const newWindowHandles = await driver.getAllWindowHandles();
    await driver.switchTo().window(newWindowHandles[newWindowHandles.length - 1]);
  }
}

// Main automation process for account and proxy with dynamic tasks
async function runAutomationForAccountAndProxy(account, proxyUrl, tasks = []) {
  let driver;
  var isFirstLogin = true;
  let last2minValueGradient = 0;
  let last2minValueToggle = 0;
  proxyUrl = 'http://' + proxyUrl;
  const { username, password } = account;
  const newProxyUrl = await proxyChain.anonymizeProxy(proxyUrl);
  const proxyDetails = new URL(newProxyUrl);
  let driverOptions = options;
  
  try {
    driverOptions.addArguments(
      `--proxy-server=${proxyDetails.protocol}//${proxyDetails.hostname}:${proxyDetails.port}`
    );

    if (proxyDetails.username && proxyDetails.password) {
      driverOptions.addArguments(`--proxy-auth=${proxyDetails.username}:${proxyDetails.password}`);
    }

    driver = await new Builder().forBrowser('chrome').setChromeOptions(driverOptions).build();
    await driver.sleep(3000);

    const windowHandles = await driver.getAllWindowHandles();
    if (windowHandles.length > 1) {
      await driver.close();
      await switchToTab(driver, 0);
    }

    // Initialize task execution LOGIN
    for (const task of tasks) {
      if (task === 'openloop') {
        await switchToTab(driver, 0);
        try {
          const success = await tokenPlugin.login_openloop(driver, username, password, proxyUrl, isFirstLogin);
          if (!success) {
            logger.error(`[ERROR] Failed to login to openloop for ${username} on proxy ${proxyUrl}`);
            tasks = tasks.filter(t => t !== 'openloop');
          } else {
            logger.info(`[SUCCESS] Logged in to openloop for ${username}`);
          }
        } catch (err) {
          logger.error(`[ERROR] Error while logging in to openloop for ${username} on proxy ${proxyUrl}: ${err.message}`);
          tasks = tasks.filter(t => t !== 'openloop');
        }
      }

      if (task === 'gradient') {
        await switchToTab(driver, 0);
        try {
          const success = await tokenPlugin.login_gradient(driver, username, password, proxyUrl);
          if (!success) {
            logger.error(`[ERROR] Failed to login to gradient for ${username} on proxy ${proxyUrl}`);
            tasks = tasks.filter(t => t !== 'gradient');
          } else {
            logger.info(`[SUCCESS] Logged in to gradient for ${username}`);
          }
        } catch (err) {
          logger.error(`[ERROR] Error while logging in to gradient for ${username} on proxy ${proxyUrl}: ${err.message}`);
          tasks = tasks.filter(t => t !== 'gradient');
        }
      }

      if (task === 'toggle') {
        await switchToTab(driver, 0);
        try {
          const success = await tokenPlugin.login_toggle(driver, username, password, proxyUrl);
          if (!success) {
            logger.error(`[ERROR] Failed to login to toggle for ${username} on proxy ${proxyUrl}`);
            tasks = tasks.filter(t => t !== 'toggle');
          } else {
            logger.info(`[SUCCESS] Logged in to toggle for ${username}`);
          }
        } catch (err) {
          logger.error(`[ERROR] Error while logging in to toggle for ${username} on proxy ${proxyUrl}: ${err.message}`);
          tasks = tasks.filter(t => t !== 'toggle');
        }
      }

      // If tasks are empty, quit driver
      if (tasks.length === 0) {
        logger.info(`[INFO] All tasks completed or failed. Quitting driver for ${username} on proxy ${proxyUrl}`);
        return;
      }
    }

    // Token checking loop for the remaining tasks
    while (tasks.length > 0) {
      // Check token status for OpenLoop
      if (tasks.includes('openloop')) {
        await switchToTab(driver, 0);
        try {
          const success = await tokenPlugin.navigateToExtension(driver, openloop_extension_url);
          if (!success) {
            tasks = tasks.filter(task => task !== 'openloop');
          } else {
            const checkSuccess = await tokenPlugin.check_openloop(driver, username, password, proxyUrl);
            if (checkSuccess) {
              logger.info(`[SUCCESS] Checked OpenLoop token for ${username}`);
            } else {
              logger.error(`[ERROR] OpenLoop token check failed for ${username}`);
              tasks = tasks.filter(task => task !== 'openloop');
            }
          }
        } catch (err) {
          logger.error(`[ERROR] Failed to check openloop for ${username} on proxy ${proxyUrl}: ${err.message}`);
          tasks = tasks.filter(task => task !== 'openloop');
        }
      }

      // Check token status for Gradient
      if (tasks.includes('gradient')) {
        await switchToTab(driver, 0);
        try {
          const success = await tokenPlugin.navigateToExtension(driver, gradient_extension_url);
          if (!success) {
            tasks = tasks.filter(task => task !== 'gradient');
          } else {
            const checkSuccess = await tokenPlugin.check_gradient(driver, username, proxyUrl, isFirstLogin, last2minValueGradient);
            if (checkSuccess) {
              logger.info(`[SUCCESS] Checked Gradient token for ${username}`);
            } else {
              logger.error(`[ERROR] Gradient token check failed for ${username}`);
              tasks = tasks.filter(task => task !== 'gradient');
            }
          }
        } catch (err) {
          logger.error(`[ERROR] Failed to check gradient for ${username} on proxy ${proxyUrl}: ${err.message}`);
          tasks = tasks.filter(task => task !== 'gradient');
        }
      }

      // Check token status for Toggle
      if (tasks.includes('toggle')) {
        await switchToTab(driver, 0);
        try {
          const success = await tokenPlugin.navigateToExtension(driver, toggle_extension_url);
          if (!success) {
            tasks = tasks.filter(task => task !== 'toggle');
          } else {
            const checkSuccess = await tokenPlugin.check_toggle(driver, username, proxyUrl, last2minValueToggle);
            if (checkSuccess) {
              logger.info(`[SUCCESS] Checked Toggle token for ${username}`);
            } else {
              logger.error(`[ERROR] Toggle token check failed for ${username}`);
              tasks = tasks.filter(task => task !== 'toggle');
            }
          }
        } catch (err) {
          logger.error(`[ERROR] Failed to check toggle for ${username} on proxy ${proxyUrl}: ${err.message}`);
          tasks = tasks.filter(task => task !== 'toggle');
        }
      }

      await driver.executeScript(`window.open('', '_blank');`);
      await driver.close();

      // If tasks are empty, quit driver
      if (tasks.length === 0) {
        logger.info(`[INFO] All tasks completed or failed. Quitting driver for ${username} on proxy ${proxyUrl}`);
        await driver.quit();
        return;
      }

      await driver.sleep(20000);
    }
  } catch (error) {
    logger.error(`[ERROR] Error initializing WebDriver or running automation for Account: ${username}, Proxy: ${proxyUrl} - ${error.message}`);
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

class Farm {
  async run() {
    try {
      const jsonFilePath = './config/account_with_proxy.json';
      const accountsData = loadAccountData(jsonFilePath);

      const taskPromises = [];
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      for (const account of accountsData) {
        const { username, proxies } = account;

        for (const proxyObject of proxies) {
          const { proxy, run } = proxyObject;

          if (!Array.isArray(run)) {
            logger.error(`[ERROR] 'run' field is missing or incorrectly formatted for account: ${username} with proxy: ${proxy}`);
            continue;
          }

          logger.info(`[INFO] Found services to run for account ${username} with proxy ${proxy}: ${run.join(', ')}`);

          const taskPromise = new Promise(async (resolve, reject) => {
            try {
              await runAutomationForAccountAndProxy(account, proxy, run);
              resolve();
            } catch (err) {
              reject(err);
            }
          });

          taskPromises.push(taskPromise);
          await sleep(120000);
        }
      }

      await Promise.all(taskPromises);
      logger.info(`[SUCCESS] All automation tasks have completed.`);
    } catch (err) {
      logger.error(`[ERROR] Error during the automation setup: ${err.message}`);
    }
  }
}

module.exports = Farm;
