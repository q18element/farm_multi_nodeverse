import { parentPort } from 'worker_threads';
import request from 'request';
import { logger } from '../utils.js';

const headers = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'en-US,en;q=0.6',
  'cache-control': 'max-age=0',
  'priority': 'u=0, i',
  'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132", "Brave";v="132"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-user': '?1',
  'sec-gpc': '1',
  'upgrade-insecure-requests': '1',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
};

// Added google.com as the first domain to test.
const domains = [
  "https://www.google.com",
  "https://app.gradient.network",
  "https://toggle.pro/sign-in",
  "https://openloop.so/auth/login",
  "https://bless.network",
  "https://app.blockmesh.xyz/",
  "https://app.despeed.net/",
  "https://app.depined.org/onboarding"
];

const services = {
  "https://www.google.com": "google",
  "https://app.gradient.network": "gradient",
  "https://toggle.pro/sign-in": "toggle",
  "https://openloop.so/auth/login": "openloop",
  "https://bless.network": "bless",
  "https://app.blockmesh.xyz/": "blockmesh",
  "https://app.despeed.net/": "despeed",
  "https://app.depined.org/onboarding": "depined"
};

const skipDomains = [
  // "https://app.gradient.network", // not skipped so it gets tested normally
  "https://toggle.pro/sign-in",
  "https://openloop.so/auth/login",
  "https://bless.network",
  "https://app.blockmesh.xyz/",
  "https://app.despeed.net/",
  "https://app.depined.org/onboarding"
];

// Function to test a proxy against a list of domains
async function testProxy(proxyUrl, domains) {
  const results = {
    proxy: proxyUrl,
    success: [],
    fail: [],
  };

  for (let domain of domains) {
    if (skipDomains.includes(domain)) {
      results.success.push(services[domain]);
      continue;
    }

    const options = {
      url: domain,
      proxy: `http://${proxyUrl}`,
      timeout: 10000, // 10 seconds timeout
      headers: headers,
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
    } catch (err) {
      results.fail.push(services[domain]);
      logger.error(`Proxy ${proxyUrl} failed to ping ${domain}: ${err.message}`);
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
  logger.info("Worker completed proxy processing.");
  parentPort.postMessage(results);
});
