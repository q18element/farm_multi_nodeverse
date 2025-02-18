const GradientService = require('./gradient');
// const ToggleService = require('./toggleService');
// const BlessService = require('./blessService');
// ... import other services as needed

class ServiceManager {
  constructor() {
    // Create a registry mapping service names to service instances.
    this.serviceRegistry = new Map();
    this.registerService('gradient', new GradientService());
    // this.registerService('toggle', new ToggleService());
    // this.registerService('bless', new BlessService());
    // ... register additional services here.
  }

  registerService(serviceName, serviceInstance) {
    this.serviceRegistry.set(serviceName, serviceInstance);
  }

  /**
   * Checks the login state of the given service.
   * @param {WebDriver} driver
   * @param {string} serviceName
   * @param {Object} credentials - Can include extra parameters if needed.
   */
  async checkLoginState(driver, serviceName, credentials = {}) {
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
      const { waitForElement } = require('../utils/automationActions');
      await waitForElement(driver, service.config.selectors.loginConfirmElement, service.config.timeouts.loginCheck);
      return true;
    } catch (error) {
      return false;
    }
  }

  
  /**
   * Performs a login for the specified service.
   * @param {WebDriver} driver
   * @param {string} serviceName
   * @param {Object} credentials - Must include username, password, etc.
   */
  async login(driver, serviceName, credentials) {
    const service = this.serviceRegistry.get(serviceName);
    if (!service) {
      throw new Error(`Login method not found for service: ${serviceName}`);
    }
    return await service.login(driver, credentials);
  }


  /**
   * Checks the service status (e.g., returns points or a success flag).
   * @param {WebDriver} driver
   * @param {string} serviceName
   * @param {Object} credentials - Additional parameters as needed.
   */
  async check(driver, serviceName, credentials) {
    const service = this.serviceRegistry.get(serviceName);
    if (!service) {
      throw new Error(`Check method not found for service: ${serviceName}`);
    }
    return await service.check(driver, credentials);
  }
}

module.exports = ServiceManager;
