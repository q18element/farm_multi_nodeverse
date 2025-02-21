const log4js = require('log4js');

// ─── LOG4JS CONFIGURATION ─────────────────────────────────────────────────
log4js.configure({
  appenders: { out: { type: 'stdout' } },
  categories: { default: { appenders: ['out'], level: 'debug' } }
});

// log4js.configure({
//   appenders: { out: { type: 'stdout' } },
//   categories: { default: { appenders: ['out'], level: 'info' } }
// });
  
const logger = log4js.getLogger();

module.exports = logger;
