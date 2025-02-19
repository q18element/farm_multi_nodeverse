// src/services/baseService.js
class BaseService {
    constructor(serviceName, config) {
      this.serviceName = serviceName;
      this.config = config; // contains URLs, selectors, timeouts, etc.
    }
  
    /**
     * Performs a login.
     * @param {Object} credentials - Must contain at least username and password,
     *   but can also include extra parameters as needed.
     */
    async login(credentials) {
      throw new Error(`login() not implemented for ${this.serviceName}`);
    }
  
    /**
     * Checks the service status (e.g., to return a points value or similar).
     * @param {Object} credentials - Additional parameters can be passed here.
     */
    async check(credentials) {
      throw new Error(`check() not implemented for ${this.serviceName}`);
    }
    
  }
  
module.exports = BaseService;