import { Builder } from "selenium-webdriver";
// @ts-ignore
import chrome from "selenium-webdriver/chrome.js";
import os from "os";
import { PROFILES_PATH } from "../constants.js";
import path from "path";
import { parseHttpProxyAuth, processProxy } from "../utils/index.js";
export default class BrowserManager {
    profileDir;
    constructor(opts) {
        this.profileDir = opts?.profileDir || PROFILES_PATH;
    }
    /**
     * Starts a new Chrome browser profile with the given options.
     * @param  opts - Options for starting the profile
     * @returns Selenium WebDriver
     */
    async startProfile({ profileDirName, proxy, args, driverPath, extensions }) {
        const options = new chrome.Options();
        const _args = [
            "--allow-pre-commit-input",
            "start-maximized",
            "disable-infobars",
            "--disable-application-cache",
            "--log-level=3",
            "--disable-blink-features=AutomationControlled",
            ...(args || []),
        ];
        if (profileDirName) {
            _args.push(`--user-data-dir=${path.join(this.profileDir, profileDirName)}`);
        }
        if (proxy) {
            let prox = await processProxy(parseHttpProxyAuth(proxy), 3);
            _args.push(`--proxy-server=${prox?.url}`);
            if (prox?.auth) {
                _args.push(`--proxy-auth=${prox?.auth}`);
            }
        }
        if (extensions) {
            if (Array.isArray(extensions)) {
                options.addExtensions(...extensions);
            }
            else {
                options.addExtensions(extensions);
            }
        }
        options.excludeSwitches("enable-automation");
        if (os.platform() === "linux") {
            _args.push("--headless", "--no-sandbox", "--disable-gpu");
            options.setChromeBinaryPath("/usr/bin/chromium-browser");
        }
        options.addArguments(..._args);
        const wdBuilder = new Builder().forBrowser("chrome").setChromeOptions(options);
        if (driverPath) {
            wdBuilder.setChromeService(new chrome.ServiceBuilder(driverPath));
        }
        const driver = await wdBuilder.build();
        return driver;
    }
}
