const log4js = require('log4js');

// ─── LOG4JS CONFIGURATION ─────────────────────────────────────────────────
log4js.configure({
    appenders: {
      file: { type: 'file', filename: 'automation.log' },
      console: { type: 'console' }
    },
    categories: {
      default: { appenders: ['console', 'file'], level: 'info' }
    }
  });
  

const logger = log4js.getLogger();

module.exports = logger;
