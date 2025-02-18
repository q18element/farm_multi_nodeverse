const fs = require('fs');
const path = require('path');
const logger = require('./logger');

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
}

function logFailedTask(entry, failedTasksPath) {
  let data = [];
  if (fs.existsSync(failedTasksPath)) {
    data = JSON.parse(fs.readFileSync(failedTasksPath));
  }
  data.push(entry);
  fs.writeFileSync(failedTasksPath, JSON.stringify(data, null, 2));
  logger.info(`Logged failed task: ${JSON.stringify(entry)}`);
}

async function validateExtensions() {
  // Check all extension files
  const { EXTENSIONS } = require('../config/config');
  for (const [name, extConfig] of Object.entries(EXTENSIONS)) {
    try {
      await fs.promises.access(extConfig.path, fs.constants.R_OK);
      const buffer = await fs.promises.readFile(extConfig.path);
      extConfig.valid = buffer.slice(0, 4).toString() === 'Cr24';
      logger.info(`Extension ${name} is ${extConfig.valid ? 'valid' : 'invalid'}`);
    } catch (error) {
      extConfig.valid = false;
      logger.error(`Extension ${name} check failed: ${error.message}`);
    }
  }
}

module.exports = { ensureDirectory, logFailedTask, validateExtensions };
