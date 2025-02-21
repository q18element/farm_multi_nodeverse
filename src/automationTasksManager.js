// src/TaskAutomationManager.js
const fs = require('fs');
const os = require('os');
const fetch = require('node-fetch');
const { initDB } = require('./db');
const {serviceManager} = require('./services');
const {accountRepository, taskRepository} = require('./repositories');
const {
  initializeDriver
} = require('./drivers');
const {AutomationAcions} = require('./utils/automationActions');
const {
  logger,
  sleep,
  logFailedTask,
  getProfilePath,
  markProfileExists,
  handleCleanup,
} = require('./utils');

const {
  MAX_LOGIN_RETRIES,
  CHECK_INTERVAL,
  STAGGER_DELAY,
} = require('./config');



class TaskAutomationManager {
  constructor() {
    this.serviceManager = null;
    this.auto = null;
    this.db = null;
    this.auto = null;
    this.task_monitoring_tables = null;
    this.accounts_table = null;
  }

  async getDB() {
    if (!this.db) {
      this.db = await initDB();
    }
    return this.db;
  }

  async run() {
    try {
      
      // Calling database
      const db = await initDB();
      this.task_monitoring_tables = new taskRepository(db);
      this.accounts_table = new accountRepository(db);
      
      const accounts = await this.accounts_table.loadAccounts();
      const taskPromises = [];

      for (const account of accounts) {
        for (const profileConfig of account.proxies) {
          taskPromises.push(
            this.handleProfileTasks(account, profileConfig)
              .catch(e => logger.error(`Task failed: ${e.message}`))
          );
          await sleep(STAGGER_DELAY);
        }
      }

      await Promise.all(taskPromises);
      logger.info('[SYSTEM] All automation tasks completed');

    } catch (error) {
      logger.error(`[SYSTEM ERROR] ${error.message}`);
    }
  }


  async handleProfileTasks(profile_id, task_ids) {
    // proxy: "aaa:xxx@1.1.1.1:2222"
    // task_ids = ["1", "2", "3",...]
    // tasks: [
    // "gradient": {
    //   "username": "user",
    //   "password": "pass"
    //   }
    // }, 
    // "bless": {
    //   "username": "user",
    //   "password": "pass"
    // }, 
    // "despeed": {
    //   "username": "user",
    //   "password": "pass",
    //   "seedphrase": "s s s s s s s s ..."
    // }
    // ]
    const profilePath = getProfilePath(profile);
    let retryCounters = {};
  
    // Initialize per-service retry counters
    tasks.forEach(service => {
      retryCounters[service] = 0;
    });
  
    const wasProfileThere = fs.existsSync(profilePath);
  
    try {
      // Initialize tasks in the new table if not already created.
      await this.task_monitoring_tables.initializeAutomations(profile.id, profile, tasks);
  
      // inside automationTask is service: {"service": "gradient", credentials: {username: "user", password: "pass", ...}, state: "pending", retry_count: 0}}
      // inside automationTasks is list of automationTask
      let automationTasks = await this.task_monitoring_tables.getPendingAutomations(profile.id);
  
      // If there are no more pending tasks, quit the driver peacefully
      if (automationTasks.length === 0) {
        logger.info(`[PROFILE DONE] All tasks for ${account.username} on proxy ${proxy} have failed or completed. Not opening this profile up.`);
        return; // Exit loop to prevent further execution
      }

      let services = Object.keys(tasks);
  
      while (automationTasks.length > 0) {
        let driver;
        driver = await initializeDriver(profilePath, proxy, services, 1);
  
        try {
          const newProfile = !wasProfileThere || automationTasks.some(task => retryCounters[task] > 0);
       
          if (newProfile) {
            logger.info("Creating new profile at", profilePath);
            markProfileExists(profilePath);
          } else {
            logger.info("Using existing profile at", profilePath);
          }
  
          await this.executeAutomationTasks(driver, profile, automationTasks, retryCounters);
  
          // Refresh the pending tasks after a monitoring cycle
          automationTasks = await this.task_monitoring_tables.getPendingAutomations(profile.id);
          if (automationTasks.length === 0) break;
        } finally {
          await this.safeTabReset(driver);
        }
      }
    } catch (error) {
      logger.error(`[FATAL ERROR] ${account.username}: ${error.message}`);
      handleCleanup(profilePath, services);
    }
  }
  

  async shouldProcessBlessTask(account, currentProxy) {
    try {
      const db = await this.getDB();
      // Fetch the pending bless task with the smallest id for this account.
      const row = await db.get(
        `SELECT id, proxy FROM task_monitoring 
         WHERE account_id = ? AND service = 'bless' AND state = 'pending' 
         ORDER BY id ASC LIMIT 1`,
         [account.id]
      );
      // No pending bless task exists – process the current one.
      if (!row) {
        return true;
      }
      // If the pending bless task belongs to the current proxy, process it.
      // Otherwise, it means a previous bless task is still pending.
      if (row.proxy === currentProxy) {
        return true;
      }
      // A previous bless task is still pending – skip processing this one.
      return false;
    } catch (error) {
      logger.error(`[BLESS CHECK ERROR] ${error.message}`);
      // On error, default to processing the task to avoid accidental skipping.
      return true;
    }
  }

  async executeAutomationTasks(driver, account, proxy, tasks, retryCounters) {
    while (tasks.length > 0) {

      if (tasks.length === 0) {
        logger.info(`[PROFILE DONE] [executeAutomationTasks] All tasks for ${account.username} on proxy ${proxy} have failed or completed. Closing driver.`);
        await this.safeTabReset(driver);
        return;
      }

      const checkResults = await this.doTask(driver, account, proxy, tasks, retryCounters);
      const { shouldRetry, remainingTasks } = await this.processAutomationResults(
        checkResults,
        tasks,
        retryCounters,
        account,
        proxy
      );

      tasks = remainingTasks;

      if (!shouldRetry) {
        await driver.get('about:blank');
        await sleep(CHECK_INTERVAL);
      } else {
        break;
      }
    }
  }

  async checkServices(driver, account, proxy, tasks, retryCounters) {
    let results = {};
    this.serviceManager = new serviceManager(driver);
    for (const service of tasks) {
      try {
        await this.safeTabReset(driver);

        // For the "bless" service, check if a previous bless task is pending.
        if (service === "bless") {
          const processBless = await this.shouldProcessBlessTask(account, proxy);
          if (!processBless) {
            logger.info(`[BLESS SKIP] A previous bless task is pending for ${account.username}. Skipping this bless task.`);
            // Optionally, set the result to null or handle it as you see fit,
            // ensuring that this task is not updated in the monitor table.
            results[service] = null;
            continue; // Skip processing for this service.
          }
        }

        // Process other services (or bless if allowed) as normal.
        let loginState = await this.safeServiceCheck(() => this.serviceManager.checkLoginState(service));

        let loginSuccess = loginState;

        while (!loginSuccess && retryCounters[service] < MAX_LOGIN_RETRIES) {
          try {
            loginSuccess = await this.serviceManager.login(
              service,
              account,
            );
            if (!loginSuccess) {
              retryCounters[service]++;
              logger.warn(`[LOGIN RETRY] ${service} login failed for ${account.username}. Attempt ${retryCounters[service]}/${MAX_LOGIN_RETRIES}`);
            }
          } catch (error) {
            retryCounters[service]++;
            logger.error(`[LOGIN ERROR] ${service} login error: ${error.message}. Attempt ${retryCounters[service]}/${MAX_LOGIN_RETRIES}`);
          }
        }
        if (loginSuccess) {
          results[service] = await this.serviceManager.check(
            service,
            account
          );
        } else {
          await this.safeTabReset(driver);
          results[service] = "login_failed";
        }
      } catch (error) {
        results[service] = false;
        logger.error(`[CHECK ERROR] ${service} check failed: ${error.message}`);
      }
    }
    return results;
  }

  async processAutomationResults(results, tasks, retryCounters, account, proxy) {
    let shouldRetry = false;
    const remainingTasks = [...tasks];
  
    for (const service of tasks) {
      // Skip bless service when appropriate.
      if (service === "bless" && results[service] === null) {
        logger.info(`[BLESS SKIP] Skipping update for bless service for ${account.username}`);
        continue;
      }
  
      if (results[service] !== false && results[service] !== "login_failed") {
        // Successful check returns a point value.
        const point = results[service];
        await this.task_monitoring_tables.updateTaskState(account.id, proxy, service, "success", 0, point);
        await this.reportServicePoint(account, service, point, proxy);
        
      } else if (results[service] === "login_failed") {
        // Login failure: mark as failed only if max retries are reached.
        if (retryCounters[service] < MAX_LOGIN_RETRIES) {
          logger.warn(`[RETRY] ${service} login failed for ${account.username}. Attempt ${retryCounters[service]}/${MAX_LOGIN_RETRIES}`);
          await this.task_monitoring_tables.updateTaskState(account.id, proxy, service, "pending", 0, 0);
          shouldRetry = true;
        } else {
          logger.error(`[FAILURE] ${service} login failed after ${MAX_LOGIN_RETRIES} attempts`);
          await this.task_monitoring_tables.updateTaskState(account.id, proxy, service, "failed", 0, 0);
          const entry = { account, proxy, service, timestamp: new Date().toISOString() };
          logFailedTask(entry);
          const index = remainingTasks.indexOf(service);
          if (index > -1) {
            remainingTasks.splice(index, 1);
          }
        }
      } else {
        // Check failure (login was successful but check returned false).
        logger.warn(`[CHECK FAILURE] ${service} check returned false for ${account.username}`);
        await this.task_monitoring_tables.updateTaskState(account.id, proxy, service, "pending", 0, 0);
        // Continue to retry check failures without marking them as failed.
        shouldRetry = true;
      }
    }
  
    return { shouldRetry, remainingTasks };
  }
  
  async safeServiceCheck(serviceCheckFunc, retries = 3) {
    let attempts = 0;
    while (attempts < retries) {
      try {
        return await serviceCheckFunc();
      } catch (error) {
        attempts++;
        if (error.message.includes('ECONNRESET')) {
          logger.warn(`[SERVICE CHECK RETRY] ECONNRESET for service check. Attempt ${attempts}/${retries}`);
          await this.sleep(2000);
        } else {
          throw error;
        }
      }
    }
    throw new Error(`Service check failed after ${retries} attempts`);
  }

  async safeTabReset(driver) {
    try {
      await new AutomationAcions(driver).tabReset();
    } catch (error) {
      logger.warn(`[TAB RESET ERROR] Failed to reset tab: ${error.message}`);
    }
  }

    /**
   * Report a service’s point to the external API endpoint.
   * @param {object} account - The account object (includes username, etc.).
   * @param {string} service - The name of the service (e.g. "gradient", "bless").
   * @param {number} point - The point value returned by check function.
   * @param {string} proxy - The proxy string in use (e.g. "user:pass@host:port").
   */
  async reportServicePoint(account, service, point, proxy) {
    // Convert service name to uppercase for "type" as requested:
    const type = service.toUpperCase();

    // Build request body as shown in your example
    const requestBody = {
      secretKey: 'Nodeverse-report-tool',
      type: type,
      // If your "account.username" is an email, you can use it directly here.
      email: account.username,
      point: point,
      // Or something like: email: account.email, if your DB has an actual email field
      device: os.type(), // e.g. "Linux", "Windows_NT", etc.
      ip: {
        status: 'CONNECTED',
        proxy: proxy,
        point: point
      }
    };

    try {
      const response = await fetch('https://report.nodeverse.ai/api/report-node/update-point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();

      if (response.ok) {
        logger.info(`[REPORT SUCCESS] ${service} -> ${point} for ${account.username}. API response: ${JSON.stringify(data)}`);
      } else {
        logger.error(`[REPORT FAILED] Status: ${response.status}, body: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      logger.error(`[REPORT ERROR] Could not report point for ${service}, account ${account.username}. Error: ${error.message}`);
    }
  }
}

module.exports = TaskAutomationManager;