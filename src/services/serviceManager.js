const {AutomationAcions} = require('../utils');
const GradientService = require('./gradient');
// const ToggleService = require('./toggleService');
const BlessService = require('./bless');
// ... import other services as needed

class ServiceManager {
  constructor(driver) {
    // Create a registry mapping service names to service instances.
    this.serviceRegistry = new Map();
    this.driver = driver;
    this.auto = new AutomationAcions(this.driver);

    this.registerService('gradient', new GradientService(driver));
    // this.registerService('toggle', new ToggleService());
    this.registerService('bless', new BlessService(driver));
    // ... register additional services here.
  }

  registerService(serviceName, serviceInstance) {
    this.serviceRegistry.set(serviceName, serviceInstance);
  }

  /**
   * Checks the login state of the given service.
   * @param {WebDriver} driver
   * @param {string} serviceName
   */
  async checkLoginState(driver, serviceName) {
    const service = this.serviceRegistry.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} is not registered`);
    }
    try {
      // Example: navigate to the extension URL and verify the login confirmation element.
      await driver.get(service.config.extensionUrl);
      await driver.navigate().refresh();
      await driver.sleep(3000);
      // Reuse helper methods (imported in your automationHelpers, etc.)
      
      await this.auto.waitForElement(driver, service.config.selectors.loginConfirmElement, service.config.timeouts.loginCheck);
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
