// src/services/serviceManager.js
const {AutomationAcions} = require('../utils');
const GradientService = require('./gradient');
const BlessService = require('./bless');
const BlockmeshService = require('./blockmesh');
const DepinedService = require('./depined');
const DspeedService = require('./despeed');
const OpenloopService = require('./openloop');
const ToggleService = require('./toggle.js');

class ServiceManager {
  constructor(driver) {
    // Create a registry mapping service names to service instances.
    this.serviceRegistry = new Map();
    this.driver = driver;
    this.auto = new AutomationAcions(this.driver);

    this.registerService('gradient', new GradientService(driver));
    this.registerService('bless', new BlessService(driver));
    this.registerService('blockmesh', new BlockmeshService(driver));
    this.registerService('depined', new DepinedService(driver));
    this.registerService('despeed', new DspeedService(driver));
    this.registerService('openloop', new OpenloopService(driver));
    this.registerService('toggle', new ToggleService(driver));
  }

  registerService(serviceName, serviceInstance) {
    this.serviceRegistry.set(serviceName, serviceInstance);
  }

  /**
   * Checks the login state of the given service.
   * @param {WebDriver} driver
   * @param {string} serviceName
   */
  async checkLoginState(serviceName) {
    const service = this.serviceRegistry.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} is not registered`);
    }
    try {
      // Example: navigate to the extension URL and verify the login confirmation element.
      await this.driver.get(service.config.extensionUrl);
      await this.driver.navigate().refresh();
      await this.driver.sleep(3000);
      // Reuse helper methods (imported in your automationHelpers, etc.)
      
      await this.auto.waitForElement(service.config.selectors.loginConfirmElement, 10000);
      return true;
    } catch (error) {
      return false;
    }
  }

  
  /**
   * Performs a login for the specified service.
   * @param {string} serviceName
   * @param {Object} credentials - Must include username, password, etc.
   */
  async login(serviceName, credentials) {
    const service = this.serviceRegistry.get(serviceName);
    if (!service) {
      throw new Error(`Login method not found for service: ${serviceName}`);
    }
    return await service.login(credentials);
  }


  /**
   * Checks the service status (e.g., returns points or a success flag).
   * @param {string} serviceName
   * @param {Object} credentials - Additional parameters as needed.
   */
  async check(serviceName, credentials) {
    const service = this.serviceRegistry.get(serviceName);
    if (!service) {
      throw new Error(`Check method not found for service: ${serviceName}`);
    }
    return await service.check(credentials);
  }
}

module.exports = ServiceManager;
