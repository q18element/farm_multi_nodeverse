// src/config/index.js
const { services } = require('./servicesConfig');
const { timeouts } = require('./timeoutsConfig');
const { MAX_LOGIN_RETRIES, PROFILE_CLEANUP_ON_FAILURE, CHECK_INTERVAL, STAGGER_DELAY, USER_AGENT, FAILED_TASKS_PATH, randomUserAgent } = require('./constants');

module.exports = {
  services,
  timeouts,
  MAX_LOGIN_RETRIES,
  PROFILE_CLEANUP_ON_FAILURE,
  CHECK_INTERVAL,
  STAGGER_DELAY,
  USER_AGENT,
  FAILED_TASKS_PATH,
  randomUserAgent
};
