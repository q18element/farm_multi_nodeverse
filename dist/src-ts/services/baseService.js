import WebDriverHelper from "../driver_utils/webDriverHelper.js";
import log4js from "log4js";
export default class BaseService {
    serviceName;
    config;
    browser;
    pinTab;
    driver;
    account;
    logger;
    constructor({ serviceName, config, driver, browser, account }) {
        this.serviceName = serviceName;
        this.config = config;
        this.driver = driver;
        this.browser = browser || new WebDriverHelper(driver);
        this.account = account;
        this.logger = log4js.getLogger(new.target.name);
    }
    childService(service) {
        return new service({
            serviceName: this.serviceName,
            config: this.config,
            driver: this.driver,
            browser: this.browser,
            account: this.account,
        });
    }
}
