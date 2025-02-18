class BaseService {
    constructor(serviceName, config) {
      this.serviceName = serviceName;
      this.config = config; // contains URLs, selectors, timeouts, etc.
    }
  
    /**
     * Performs a login.
     * @param {WebDriver} driver
     * @param {Object} credentials - Must contain at least username and password,
     *   but can also include extra parameters as needed.
     */
    async login(driver, credentials) {
      throw new Error(`login() not implemented for ${this.serviceName}`);
    }
  
    /**
     * Checks the service status (e.g., to return a points value or similar).
     * @param {WebDriver} driver
     * @param {Object} credentials - Additional parameters can be passed here.
     */
    async check(driver, credentials) {
      throw new Error(`check() not implemented for ${this.serviceName}`);
    }
    
  }
  
module.exports = BaseService;
  