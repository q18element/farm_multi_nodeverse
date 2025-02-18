const { services } = require('./servicesConfig');
const { timeouts } = require('./timeoutsConfig');
const { MAX_LOGIN_RETRIES, PROFILE_CLEANUP_ON_FAILURE, CHECK_INTERVAL, STAGGER_DELAY, USER_AGENT, FAILED_TASKS_PATH } = require('./constants');
const { EXTENSIONS } = require('./extensionsConfig');
const { configureChromeOptions } = require('./chromeOptions');
const { logger } = require('./logger');

module.exports = {
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
};
