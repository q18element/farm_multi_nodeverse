// src/drivers/chromeOptions.js
const os = require('os');
const chrome = require('selenium-webdriver/chrome');
const { randomUserAgent } = require('../config');
const path = require('path');

const configureChromeOptions = () => {
  const options = new chrome.Options();
  const args = [
    `--user-agent=${randomUserAgent()}`,
    '--allow-pre-commit-input',
    'start-maximized',
    'disable-infobars',
    '--disable-application-cache',
    '--log-level=3',
    "--disable-blink-features=AutomationControlled",
  ];
  
  options.excludeSwitches('enable-automation');

  if (os.platform() === 'linux') {
    args.push('--headless', '--no-sandbox', '--disable-gpu');
    options.setChromeBinaryPath('/usr/bin/chromium-browser');
  }

  options.addArguments(args);
  return options;
};


const EXTENSIONS = {
  openloop: { path: path.resolve('./crxs/openloop.crx') },
  gradient: { path: path.resolve('./crxs/gradient.crx') },
  toggle: { path: path.resolve('./crxs/toggle.crx') },
  bless: { path: path.resolve('./crxs/bless.crx') },
  blockmesh: { path: path.resolve('./crxs/blockmesh.crx') },
  despeed: { path: path.resolve('./crxs/despeed.crx') },
  hcapchaSolver: { path: path.resolve('./crxs/hcapchasolver.crx') },
  depined: { path: path.resolve('./crxs/depined.crx') },
};

module.exports = { 
  configureChromeOptions,
  EXTENSIONS 
};

