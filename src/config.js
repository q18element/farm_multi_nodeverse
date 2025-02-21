export {
  services,
  timeouts,
  MAX_LOGIN_RETRIES,
  PROFILE_CLEANUP_ON_FAILURE,
  CHECK_INTERVAL,
  STAGGER_DELAY,
  USER_AGENT,
  FAILED_TASKS_PATH,
  EXTENSIONS,
  configureChromeOptions,
  logger,
  ROOT_PATH,
};

import fs from "fs";
import path from "path";
import os from "os";
import log4js from "log4js";
import { By } from "selenium-webdriver";
import { fileURLToPath } from "url";
import chrome from "selenium-webdriver/chrome.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.resolve(__dirname, "../output", "log");

// ─── EXTENSIONS CONFIGURATION ─────────────────────────────────────────────
const EXTENSIONS = {
  metamask: { path: path.resolve(ROOT_PATH, "./crxs/metamask.crx") },
  hcaptchaSolver: { path: path.resolve(ROOT_PATH, "./crxs/hcapchasolver.crx") },
};

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ─── SERVICES CONFIGURATION ──────────────────────────────────────────────
const services = {
  hcapcha: {
    accessSignupUrl: "https://www.hcaptcha.com/accessibility",
    setCookieUrl: "",
    h_selectors: {
      emailInput: By.xpath('//*[@id="email"]'),
      congratsText: By.xpath('//*[@id="root"]/div/div[1]/div/div[2]/p[1]'),
      setCookieButton: By.xpath('//*[@id="root"]/div[2]/div/div/div[3]/button'),
      setCookieConfirm: By.xpath('//*[@id="root"]/div[2]/div/div/div[3]/span'),
    },
  },
  hcapchaSolver: {
    extensionUrl: "chrome-extension://hlifkpholllijblknnmbfagnkjneagid/popup/popup.html",
    selectors: {
      capchaSolved: By.xpath('//*[@id="anchor-state"]/div[3]/img'),
    },
  },
  veer: {
    loginUrl: "https://mail.veer.vn",
    selectors: {
      emailInput: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[1]/input'),
      passwordInput: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[2]/input'),
      loginButton: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[3]/button'),
      loginConfirmElement: By.xpath('//*[@id="mail-box-toggle"]/div[3]'),
      inboxElement: By.xpath('//*[@id="mail-box-toggle"]/div[3]'),
      firstMail: By.xpath('//*[@id="mail-item-0"]/div'),
      refreshButton: By.xpath('//*[@id="mail-box-toggle"]/div[3]/div/div/div[1]/div[1]/div[3]/a'),
    },
  },
  bizflycloud: {
    loginUrl: "https://id.bizflycloud.vn/login?service=https%3A%2F%2Fmail.bizflycloud.vn%2F&_t=webmail",
    selectors: {
      emailInput: By.xpath(
        '//*[@id="app"]/div/div/main/div/div/div/div[1]/div/div/div/div/div[1]/form/div[1]/div/div/input'
      ),
      passwordInput: By.xpath(
        '//*[@id="app"]/div/div/main/div/div/div/div/div/div/div/div/div[2]/form/div/div/div/input'
      ),
      nextButton: By.xpath(
        '//*[@id="app"]/div/div/main/div/div/div/div[1]/div/div/div/div/div[1]/form/div[1]/div/button'
      ),
      loginButton: By.xpath(
        '//*[@id="app"]/div/div/main/div/div/div/div/div/div/div/div/div[2]/form/div/div/div/div/button'
      ),
      loginConfirmElement: By.xpath('//*[@id="app"]/div/div/div[3]/div[1]/div[2]/div'),
      inboxElement: By.xpath('//*[@id="app"]/div/div/div[3]/div[1]/div[2]/div'),
      firstMail: By.xpath('//*[@id="threads_list"]/div[1]/div[3]/div[1]'),
      refreshButton: By.xpath('//*[@id="refresh-threads-btn"]'),
    },
  },
  mtm: {
    loginUrl: "chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#onboarding/welcome",
    selectors: {
      agreeCheckbox: By.xpath('//*[@id="onboarding__terms-checkbox"]'),
      createWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/ul/li[2]/button'),
      importWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/ul/li[3]/button'),
      agreeCheckbox2: By.xpath('//*[@id="metametrics-opt-in"]'),
      iagreeButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button[2]'),
      passwordInput: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[1]/label/input'),
      passwordRepeatInput: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[2]/label/input'),
      iunderstandCheckbox: By.xpath(
        '//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[3]/label/span[1]/input'
      ),
      createNewWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/button'),
      secureMyWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button[2]'),
      revealMySecretButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[6]/button'),
      nextButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[6]/div/button'),
      confirmButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[5]/button'),
      doneButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[3]/button'),
      nextButton2: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button'),
      doneButton2: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button'),
      mainetText: By.xpath('//*[@id="app-content"]/div/div[2]/div/div[1]/button/p'),
      confirmSecretInputButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[4]/div/button'),
    },
  },
};

// ─── TIMEOUTS CONFIGURATION ───────────────────────────────────────────────
const timeouts = {
  element: 60000,
  page: 60000,
  action: 10000,
  loginCheck: 10000,
};

// ─── AUTOMATION CONSTANTS ─────────────────────────────────────────────────
const MAX_LOGIN_RETRIES = 2;
const PROFILE_CLEANUP_ON_FAILURE = true;
const CHECK_INTERVAL = 360000;
const STAGGER_DELAY = 45000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36";
const FAILED_TASKS_PATH = path.resolve("./output/fail_tasks.json");

// ─── CHROME OPTIONS SETUP ───────────────────────────────────────────────
const configureChromeOptions = () => {
  const options = new chrome.Options();
  const args = [
    `--user-agent=${USER_AGENT}`,
    // '--disable-web-security',
    // '--ignore-certificate-errors',
    // '--dns-prefetch-disable',
    // '--enable-unsafe-swiftshader',
    // '--no-first-run',
    // '--enable-automation',
    // '--allow-remote-origin',
    "--allow-pre-commit-input",
    "start-maximized",
    "disable-infobars",
    "--disable-application-cache",
    // WebRTC-related flags
    // '--disable-webrtc',
    // '--disable-features=WebRtcHideLocalIpsWithMdns',
    // '--force-webrtc-ip-handling-policy=public_interface_only',
    // Reduce logging verbosity
    "--log-level=3",
    // '--vmodule=*/webrtc/*=0,*/libjingle/*=0',
    // Run headless
    // '--headless'
  ];

  if (os.platform() === "linux") {
    args.push("--headless", "--no-sandbox", "--disable-gpu");
    options.setChromeBinaryPath("/usr/bin/chromium-browser");
  }

  options.addArguments(args);
  return options;
};

// ─── LOG4JS CONFIGURATION ─────────────────────────────────────────────────
log4js.configure({
  appenders: {
    file: { type: "file", filename: "automation.log" },
    console: { type: "console" },
  },
  categories: {
    default: { appenders: ["console", "file"], level: "info" },
  },
});

const logger = log4js.getLogger();
