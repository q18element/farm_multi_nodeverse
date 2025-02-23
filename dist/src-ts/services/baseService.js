import WebDriverHelper from "../driver_utils/webDriverHelper.js";
import log4js from "log4js";
export default class BaseService {
    serviceName;
    config;
    auto;
    pinTab;
    driver;
    account;
    logger;
    constructor({ serviceName, config, driver, auto, account }) {
        this.serviceName = serviceName;
        this.config = config;
        this.driver = driver;
        this.auto = auto || new WebDriverHelper(driver);
        this.account = account;
        this.logger = log4js.getLogger(new.target.name);
    }
    childService(service) {
        return new service({
            serviceName: this.serviceName,
            config: this.config,
            driver: this.driver,
            auto: this.auto,
            account: this.account,
        });
    }
}
