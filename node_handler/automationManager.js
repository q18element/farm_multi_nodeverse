// automationManager.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Builder } = require('selenium-webdriver');
const proxyChain = require('proxy-chain');
const TokenPlugin = require('./tokenHandler');
const { initDB } = require('../init_db');
const {
  MAX_LOGIN_RETRIES,
  PROFILE_CLEANUP_ON_FAILURE,
  CHECK_INTERVAL,
  STAGGER_DELAY,
  EXTENSIONS,
  configureChromeOptions,
  FAILED_TASKS_PATH,
  logger
} = require('./config');
const { tabReset } = require('./automationHelpers');



// Ensure output and profiles directories exist
['./output', './profiles'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

class AutomationManager {
  constructor() {
    this.tokenPlugin = new TokenPlugin();
    this.chromeOptions = configureChromeOptions();
    this.db = null;
  }

  async getDB() {
    if (!this.db) {
      this.db = await initDB();
    }
    return this.db;
  }

  async run() {
    try {
      const accounts = await this.loadAccountData();
      const taskPromises = [];

      for (const account of accounts) {
        for (const proxyConfig of account.proxies) {
          taskPromises.push(
            this.handleAccountProxyTask(account, proxyConfig)
              .catch(e => logger.error(`Task failed: ${e.message}`))
          );
          await this.sleep(STAGGER_DELAY);
        }
      }

      await Promise.all(taskPromises);
      logger.info('[SYSTEM] All automation tasks completed');

    } catch (error) {
      logger.error(`[SYSTEM ERROR] ${error.message}`);
    }
  }

  async handleAccountProxyTask(account, proxyConfig) {
    const { proxy, run: services } = proxyConfig;
    const profilePath = this.getProfilePath(account, proxy);
    let retryCounters = {};
    // Initialize per-service retry counters
    services.forEach(service => {
      retryCounters[service] = 0;
    });
    const wasProfileThere = fs.existsSync(profilePath);
    try {
      // Initialize tasks in the new table if not already created.
      await this.initializeTasks(account, proxy, services);
      // Get the list of pending tasks (i.e. not marked as "failed")
      let tasks = await this.getPendingTasks(account, proxy);

      // If there are no more pending tasks, quit the driver peacefully
      if (tasks.length === 0) {
        logger.info(`[PROFILE DONE] All tasks for ${account.username} on proxy ${proxy} have failed or completed. Not open this profile up.`);
        return; // Exit loop to prevent further execution
      }

      while (tasks.length > 0) {
        let driver;
        try {
          driver = await this.initializeDriver(profilePath, proxy);
          const newProfile = !wasProfileThere ||
            tasks.some(task => retryCounters[task] > 0);

          if (newProfile) {
            logger.info("Creating new profile at", profilePath);
            await this.markProfileExists(profilePath);
          } else {
            logger.info("Using existing profile at", profilePath);
          }

          await this.monitorServices(driver, account, proxy, tasks, retryCounters);

          // Refresh the pending tasks after a monitoring cycle
          tasks = await this.getPendingTasks(account, proxy);
          if (tasks.length === 0) break;
        } finally {
          await tabReset(driver);
        }
      }
    } catch (error) {
      logger.error(`[FATAL ERROR] ${account.username}: ${error.message}`);
      this.handleCleanup(profilePath, services);
    }
  }

  async monitorServices(driver, account, proxy, tasks, retryCounters) {
    while (tasks.length > 0) {
      // Fetch the latest pending tasks from the cache database
      tasks = await this.getPendingTasks(account, proxy);

      // If there are no more pending tasks, quit the driver peacefully
      if (tasks.length === 0) {
        logger.info(`[PROFILE DONE] All tasks for ${account.username} on proxy ${proxy} have failed or completed. Closing driver.`);
        await tabReset(driver);
        return; // Exit loop to prevent further execution
      }

      const checkResults = await this.checkServices(driver, account, proxy, tasks, retryCounters);
      const { shouldRetry, remainingTasks } = await this.processCheckResults(
        checkResults,
        tasks,
        retryCounters,
        account,
        proxy
      );

      tasks = remainingTasks;

      if (!shouldRetry) {
        await driver.get('about:blank');
        await this.sleep(CHECK_INTERVAL);
      } else {
        break;
      }
    }
  }

  async checkServices(driver, account, proxy, tasks, retryCounters) {
    let results = {};
    for (const service of tasks) {
      // console.log(`\n--- Processing service: ${service} ---`);
      try {
        await tabReset(driver);
        // Step 1: Check current login state.
        // console.log("Step 1: Calling checkLoginState");
        let loginState = await this.tokenPlugin.checkLoginState(driver, service);
        // console.log(`Step 2: Received loginState: ${loginState}`);
        let loginSuccess = loginState;
  
        // Step 3: Log the service name.
        // console.log(`Step 3: Starting processing for service: ${service}`);
  
        // Step 4: If not logged in, immediately try to login until success or max retries reached.
        while (!loginSuccess && retryCounters[service] < MAX_LOGIN_RETRIES) {   
          // console.log(`Step 4: loginSuccess is false, current retry count for ${service}: ${retryCounters[service]}`);
          try {
            // console.log(`Step 5: Attempting login via ${service}`);
            loginSuccess = await this.tokenPlugin.login(
              driver,
              service,
              account.username,
              account.password,
              proxy
            );
            // console.log(`Step 6: Login attempt result for ${service}: ${loginSuccess}`);
            if (!loginSuccess) {
              retryCounters[service]++;
              // console.log(`Step 7: Incremented retry counter for ${service}: ${retryCounters[service]}`);
              logger.warn(`[LOGIN RETRY] ${service} login failed for ${account.username}. Attempt ${retryCounters[service]}/${MAX_LOGIN_RETRIES}`);
            }
          } catch (error) {
            retryCounters[service]++;
            // console.log(`Step 8: Error during login for ${service}: ${error.message}. Retry counter: ${retryCounters[service]}`);
            logger.error(`[LOGIN ERROR] ${service} login error: ${error.message}. Attempt ${retryCounters[service]}/${MAX_LOGIN_RETRIES}`);
          }
        }
        // Step 9: If login succeeded, perform the check.
        if (loginSuccess) {
          // console.log(`Step 9: Login successful for ${service}. Proceeding to check.`);
          results[service] = await this.tokenPlugin.check(
            driver,
            service,
            account.username,
            proxy
          );
          // console.log(`Step 10: Check result for ${service}: ${results[service]}`);
        } else {
          await tabReset(driver);
          results[service] = false;
        }
      } catch (error) {
        results[service] = false;
        // console.log(`Step ERROR: An error occurred during processing of ${service}: ${error.message}`);
        logger.error(`[CHECK ERROR] ${service} check failed: ${error.message}`);
      }
    }
    // console.log("Step 12: Finished processing all services. Returning results.");
    return results;
  }
  

  // Process each service check and update its state in the new task_monitoring table.
  async processCheckResults(results, tasks, retryCounters, account, proxy) {
    let shouldRetry = false;
    const remainingTasks = [...tasks];
  
    for (const service of tasks) {
      if (results[service] !== false) {
        // The check process now returns a point value if successful.
        const point = results[service];
        await this.updateTaskState(account.id, proxy, service, "success", 0, point);
      } else {
        // When the check fails, point is set to 0.
        if (retryCounters[service] < MAX_LOGIN_RETRIES) {
          logger.warn(`[RETRY] ${service} check/login failed for ${account.username}. Attempt ${retryCounters[service]}/${MAX_LOGIN_RETRIES}`);
          await this.updateTaskState(account.id, proxy, service, "pending", 0, 0);
          shouldRetry = true;
        } else {
          logger.error(`[FAILURE] ${service} failed after ${MAX_LOGIN_RETRIES} attempts`);
          await this.updateTaskState(account.id, proxy, service, "failed", 0, 0);
          this.logFailedTask(account.username, proxy, service);
          const index = remainingTasks.indexOf(service);
          if (index > -1) {
            remainingTasks.splice(index, 1);
          }
        }
      }
    }
  
    return { shouldRetry, remainingTasks };
  }

  async performLoginWorkflow(driver, account, proxy, tasks) {
    const remainingTasks = [...tasks];
    
    for (const service of tasks) {
      try {
        const success = await this.tokenPlugin[`login_${service}`](
          driver,
          account.username,
          account.password,
          proxy
        );

        if (!success) {
          logger.error(`[LOGIN FAIL] ${service} login failed for ${account.username}`);
          remainingTasks.splice(remainingTasks.indexOf(service), 1);
        }
      } catch (error) {
        logger.error(`[LOGIN ERROR] ${service} login failed: ${error.message}`);
        remainingTasks.splice(remainingTasks.indexOf(service), 1);
      }
    }
    
    return remainingTasks;
  }

  // -- Helper Methods --

  getProfilePath(account, proxy) {
    const sanitized = `${account.username}_${proxy}`.replace(/[^a-zA-Z0-9]/g, '_');
    return path.resolve(`./profiles/${sanitized}`);
  }

  profileExists(profilePath) {
    return fs.existsSync(profilePath);
  }

  async markProfileExists(profilePath) {
    if (!this.profileExists(profilePath)) {
      fs.mkdirSync(profilePath, { recursive: true });
    }
  }

  async validateExtensions() {
    for (const [name, extConfig] of Object.entries(EXTENSIONS)) {
      try {
        await fs.promises.access(extConfig.path, fs.constants.R_OK);
        const buffer = await fs.promises.readFile(extConfig.path);
        extConfig.valid = buffer.slice(0, 4).toString() === 'Cr24';
        logger.info(`Extension ${name} ${extConfig.valid ? 'valid' : 'invalid'}`);
      } catch (error) {
        extConfig.valid = false;
        logger.error(`Extension ${name} check failed: ${error.message}`);
      }
    }
  }

  async initializeDriver(profilePath, proxyUrl) {
    const db = await this.getDB();
    // Optionally retrieve proxy-specific data from accounts_proxies if needed.
    const proxyRecord = await db.get(
      'SELECT proxy, services FROM accounts_proxies WHERE proxy = ?',
      [proxyUrl]
    );

    const options = configureChromeOptions();
    const parsedProxy = await this.processProxy(proxyUrl);
    
    options.addArguments(`--user-data-dir=${profilePath}`);
    options.addArguments(`--proxy-server=${parsedProxy.url}`);
    
    if (parsedProxy.auth) {
      options.addArguments(`--proxy-auth=${parsedProxy.auth}`);
    }

    await this.validateExtensions();

    // Load extensions based on the services registered in accounts_proxies.
    const services = proxyRecord && proxyRecord.services ? JSON.parse(proxyRecord.services) : [];
    services.forEach(service => {
      const extConfig = EXTENSIONS[service];
      if (extConfig && extConfig.valid) {
        try {
          options.addExtensions(extConfig.path);
          logger.info(`Loaded extension: ${service}`);
        } catch (error) {
          logger.error(`Failed to load extension ${service}: ${error.message}`);
        }
      }
    });
    
    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await driver.sleep(5000);
    
    await tabReset(driver);
    
    return driver;
  }

  

  async processProxy(proxyUrl) {
    const anonymized = await proxyChain.anonymizeProxy(`http://${proxyUrl}`);
    const parsed = new URL(anonymized);
    return {
      url: `${parsed.protocol}//${parsed.hostname}:${parsed.port}`,
      auth: parsed.username && parsed.password ? `${parsed.username}:${parsed.password}` : null
    };
  }

  async cleanupDriver(driver) {
    try {
      if (driver) {
        await driver.quit();
      }
    } catch (error) {
      logger.error(`[CLEANUP ERROR] ${error.message}`);
    }
  }

  handleCleanup(profilePath, tasks) {
    if (PROFILE_CLEANUP_ON_FAILURE && tasks.length === 0) {
      try {
        fs.rmSync(profilePath, { recursive: true, force: true });
        logger.info(`[CLEANUP] Removed profile ${profilePath}`);
      } catch (error) {
        logger.error(`[PROFILE CLEANUP ERROR] ${error.message}`);
      }
    }
  }

  logFailedTask(username, proxy, task) {
    const entry = { username, proxy, task, timestamp: new Date().toISOString() };
    const data = fs.existsSync(FAILED_TASKS_PATH)
      ? JSON.parse(fs.readFileSync(FAILED_TASKS_PATH))
      : [];
    
    data.push(entry);
    fs.writeFileSync(FAILED_TASKS_PATH, JSON.stringify(data, null, 2));
  }

  // New method: initialize tasks in the task_monitoring table if they don't already exist.
  async initializeTasks(account, proxy, services) {
    try {
      const db = await this.getDB();
      for (const service of services) {
        const existing = await db.get(
          `SELECT id FROM task_monitoring WHERE account_id = ? AND proxy = ? AND service = ?`,
          [account.id, proxy, service]
        );
        if (!existing) {
          await db.run(
            `INSERT INTO task_monitoring (account_id, proxy, service, state, retry_count) VALUES (?, ?, ?, 'pending', 0)`,
            [account.id, proxy, service]
          );
          logger.info(`Initialized task for ${account.username} - proxy: ${proxy}, service: ${service}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to initialize tasks for ${account.username} on proxy ${proxy}: ${error.message}`);
    }
  }

  // New method: retrieve pending tasks (i.e. tasks not marked as "failed") for the given account and proxy.
  async getPendingTasks(account, proxy) {
    try {
      const db = await this.getDB();
      const rows = await db.all(
        `SELECT service FROM task_monitoring WHERE account_id = ? AND proxy = ? AND state != 'failed'`,
        [account.id, proxy]
      );
      return rows.map(row => row.service);
    } catch (error) {
      logger.error(`Failed to fetch pending tasks for ${account.username} on proxy ${proxy}: ${error.message}`);
      return [];
    }
  }

  // New method: update the state and optionally increment the retry_count for a task in the task_monitoring table.
  async updateTaskState(accountId, proxy, service, state, retryIncrement = 0, point = 0) {
    try {
      const db = await this.getDB();
      await db.run(
        `UPDATE task_monitoring
         SET state = ?,
             retry_count = retry_count + ?,
             point = ?
         WHERE account_id = ? AND proxy = ? AND service = ?`,
        [state, retryIncrement, point, accountId, proxy, service]
      );
      logger.info(`Updated task state for account ${accountId} on proxy ${proxy}: ${service} -> ${state}, point: ${point}`);
    } catch (error) {
      logger.error(`Failed to update task state for account ${accountId} on proxy ${proxy}, service ${service}: ${error.message}`);
    }
  
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Modified loadAccountData to fetch account and proxy info from the existing table.
  async loadAccountData() {
    try {
      const db = await this.getDB();
      const accounts = await db.all(`
        SELECT a.id, a.username, a.password, 
               json_group_array(json_object(
                 'proxy', ap.proxy,
                 'run', json(ap.services)
               )) AS proxies
        FROM accounts a
        LEFT JOIN accounts_proxies ap ON a.id = ap.account_id
        GROUP BY a.id
      `);

      return accounts.map(account => ({
        ...account,
        proxies: account.proxies
          ? JSON.parse(account.proxies)
              .map(p => {
                p.run = typeof p.run === 'string' ? JSON.parse(p.run) : p.run;
                return p;
              })
              .filter(p => p.run.length > 0)
          : []
      }));
    } catch (error) {
      logger.error(`Failed to load accounts from DB: ${error.message}`);
      return [];
    }
  }
}

module.exports = AutomationManager;
