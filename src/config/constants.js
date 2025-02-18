const path = require('path');

const MAX_LOGIN_RETRIES = 2;
const PROFILE_CLEANUP_ON_FAILURE = true;
const CHECK_INTERVAL = 360000;
const STAGGER_DELAY = 45000;
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36";
const FAILED_TASKS_PATH = path.resolve('./output/fail_tasks.json');

module.exports = {
  MAX_LOGIN_RETRIES,
  PROFILE_CLEANUP_ON_FAILURE,
  CHECK_INTERVAL,
  STAGGER_DELAY,
  USER_AGENT,
  FAILED_TASKS_PATH,
};
