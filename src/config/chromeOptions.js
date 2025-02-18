const os = require('os');
const chrome = require('selenium-webdriver/chrome');
const { USER_AGENT } = require('./constants');

const configureChromeOptions = () => {
  const options = new chrome.Options();
  const args = [
    `--user-agent=${USER_AGENT}`,
    '--allow-pre-commit-input',
    'start-maximized',
    'disable-infobars',
    '--disable-application-cache',
    '--log-level=3',
  ];

  if (os.platform() === 'linux') {
    args.push('--headless', '--no-sandbox', '--disable-gpu');
    options.setChromeBinaryPath('/usr/bin/chromium-browser');
  }

  options.addArguments(args);
  return options;
};

module.exports = { configureChromeOptions };
