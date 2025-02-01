// proxy_handler/worker.js
const { parentPort } = require("worker_threads");
const request = require("request");
const log4js = require("log4js");

// Configure log4js
log4js.configure({
  appenders: {
    file: { type: "file", filename: "worker.log" },
    console: { type: "console" }
  },
  categories: {
    default: { appenders: ["console", "file"], level: "info" }
  }
});

// Get the logger instance
const logger = log4js.getLogger();

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36";

const domains = [
  "https://app.gradient.network",
  "https://toggle.pro/sign-in",
  "https://openloop.so/auth/login",
];

const services = {
  'https://app.gradient.network': 'gradient',
  'https://toggle.pro/sign-in': 'toggle',
  'https://openloop.so/auth/login': 'openloop'
};

// Function to test a proxy against a list of domains
async function testProxy(proxyUrl, domains) {
  const results = {
    proxy: proxyUrl,
    success: [],
    fail: [],
  };

  for (let domain of domains) {
    const options = {
      url: domain,
      proxy: `http://${proxyUrl}`,
      timeout: 10000, // 20 seconds timeout
      headers: {
        "User-Agent": USER_AGENT,
      },
    };

    try {
      await new Promise((resolve, reject) => {
        request(options, (error, response) => {
          if (error || response.statusCode !== 200) {
            return reject(new Error(`Failed to access ${domain}`));
          }
          resolve(response);
        });
      });
      results.success.push(services[domain]);
      // logger.info(`Proxy ${proxyUrl} successfully pinged ${domain}`);
    } catch (err) {
      results.fail.push(services[domain]);
      // logger.error(`Proxy ${proxyUrl} failed to ping ${domain}: ${err.message}`);
    }
  }

  return results;
}

// Listen for messages from the parent thread
parentPort.on("message", async (data) => {
  logger.info("Worker started processing proxies...");
  const results = await Promise.all(
    data.proxies.map(async (proxy) => {
      return testProxy(proxy, domains);
    })
  );
  // Send the results back to the main thread
  logger.info("Worker completed proxy processing.");
  parentPort.postMessage(results);
});
