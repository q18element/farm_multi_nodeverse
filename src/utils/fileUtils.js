// src/utils/fileUtils.js
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { PROFILE_CLEANUP_ON_FAILURE } = require('../config');


function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
}

function logFailedTask(entry, failedTasksPath='./output/failedTasks.json') {
  let data = [];
  if (fs.existsSync(failedTasksPath)) {
    data = JSON.parse(fs.readFileSync(failedTasksPath));
  }
  data.push(entry);
  fs.writeFileSync(failedTasksPath, JSON.stringify(data, null, 2));
  logger.info(`Logged failed task: ${JSON.stringify(entry)}`);
}


function getProfilePath(account, proxy) {
  const sanitizedProxy = proxy.replace(/[:@.]/g, '_'); // Replace problematic characters
  sanitizedUsername = account.username.replace(/[:@.]/g, '_');
  return path.join(__dirname, '../../', 'profiles', `${sanitizedUsername}_${sanitizedProxy}`);
}

function profileExists(profilePath) {
  return fs.existsSync(profilePath);
}

function markProfileExists(profilePath) {
  if (profileExists(profilePath)) {
    fs.mkdirSync(profilePath, { recursive: true });
  }
}

function handleCleanup(profilePath, tasks) {
  if (PROFILE_CLEANUP_ON_FAILURE && tasks.length === 0) {
    try {
      fs.rmSync(profilePath, { recursive: true, force: true });
      logger.info(`[CLEANUP] Removed profile ${profilePath}`);
    } catch (error) {
      logger.error(`[PROFILE CLEANUP ERROR] ${error.message}`);
    }
  }
}

async function validateExtensions() {
  // Check all extension files
  const { EXTENSIONS } = require('../config/config');
  for (const [name, extConfig] of Object.entries(EXTENSIONS)) {
    try {
      await fs.promises.access(extConfig.path, fs.constants.R_OK);
      const buffer = await fs.promises.readFile(extConfig.path);
      extConfig.valid = buffer.slice(0, 4).toString() === 'Cr24';
      
    } catch (error) {
      extConfig.valid = false;
      logger.error(`Extension ${name} check failed: ${error.message}`);
    }
  }
  logger.info(`Extensions is valid`);
}

module.exports = { 
  ensureDirectory, 
  logFailedTask, 
  validateExtensions, 
  markProfileExists, 
  getProfilePath, 
  profileExists,
  handleCleanup
};
