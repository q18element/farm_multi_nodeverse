import { Builder, WebDriver } from "selenium-webdriver";
// @ts-ignore
import chrome from "selenium-webdriver/chrome.js";
import os from "os";
import path from "path";
import { parseHttpProxyAuth, processProxy } from "../utils/index.js";

interface ChromeStartedResponse {
  remoteDebuggingUrl?: number;
  driverPath?: string;
  driver?: WebDriver;
}

interface StartProfileOptions {
  profileDirName?: string;
  proxy?: string;
  args?: string[];
  extensions?: string[] | string;
  driverPath?: string;
  chromeSize?: { width: number; height: number; scale: number };
}

interface BrowserManagerOptions {
  profileDir: string;
}

export default class BrowserManager {
  protected profileDir?: string;
  lastPos: { x: number; y: number };
  screen: { width: number; height: number };
  constructor(opts?: BrowserManagerOptions) {
    this.profileDir = opts?.profileDir;
    this.lastPos = { x: 0, y: 0 };
    this.screen = { width: 1920, height: 1080 };
  }

  /**
   * Starts a new Chrome browser profile with the given options.
   * @param  opts - Options for starting the profile
   * @returns Selenium WebDriver
   */
  async startProfile({
    profileDirName,
    proxy,
    args,
    driverPath,
    extensions,
    chromeSize = { width: 800, height: 600, scale: 0.7 },
  }: StartProfileOptions): Promise<WebDriver> {
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
      if (!this.profileDir) {
        throw Error('"profileDir" is required when "profileDirName" is provided');
      }
      _args.push(`--user-data-dir=${path.join(this.profileDir, profileDirName)}`);
    }
    if (proxy) {
      let prox = await processProxy(parseHttpProxyAuth(proxy), 3);
      _args.push(`--proxy-server=${prox?.url}`);

      if (prox?.auth) {
        _args.push(`--proxy-auth=${prox?.auth}`);
      }
    }
    if (chromeSize) {
      _args.push(`--window-size=${chromeSize.width},${chromeSize.height}`);
      _args.push(`--force-device-scale-factor=${chromeSize.scale}`);
      _args.push(`--window-position=${this.lastPos.x},${this.lastPos.y}`);

      let x = this.lastPos.x + chromeSize.width * chromeSize.scale;
      let y = this.lastPos.y;
      if (x > this.screen.width) {
        x = 0;
        y += chromeSize.height * chromeSize.scale;
      }
      if (y > this.screen.height) {
        y = 0;
      }
      this.lastPos = { x: Math.floor(x), y: Math.floor(y) };
    }
    if (extensions) {
      if (Array.isArray(extensions)) {
        options.addExtensions(...extensions);
      } else {
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
    driver.sleep(1000);

    // fix metamask offscreen
    await driver.switchTo().newWindow("tab");
    const cur = await driver.getWindowHandle();
    for (const tab of await driver.getAllWindowHandles()) {
      if (tab !== cur) {
        await driver.switchTo().window(tab);
        await driver.close();
      }
    }
    await driver.switchTo().window(cur);
    return driver;
  }
}
