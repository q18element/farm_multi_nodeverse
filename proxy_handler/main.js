// proxy_handler/main.js
const fs = require("fs");
const { Worker, isMainThread, parentPort } = require("worker_threads");
const log4js = require("log4js");

// Configure log4js
log4js.configure({
  appenders: {
    file: { type: 'file', filename: 'process.log' },
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ['console', 'file'], level: 'info' }
  }
});

// Get the logger instance
const logger = log4js.getLogger();

const inputFile = "./config/proxy.txt";
const outputFile = "./config/filtered_proxy.json";

const PROXY_CHUNK_SIZE = 10;

// Function to create a worker and process a chunk of proxies
async function processWithWorker(proxies) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./proxy_handler/worker.js');

    worker.on('message', (results) => {
      logger.info("Worker finished processing chunk.");
      resolve(results);
      worker.terminate();
    });

    worker.on('error', (error) => {
      logger.error(`Worker encountered an error: ${error.message}`);
      reject(error);
      worker.terminate();
    });

    worker.postMessage({ proxies });
  });
}

// Function to split proxies into chunks for workers
function chunkArray(arr, chunkSize) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

// Main function to process proxies
async function processProxies() {
  try {
    logger.info("Starting proxy processing...");

    const proxyList = fs.readFileSync(inputFile, "utf-8").split("\n").filter(Boolean); // Read and clean the list
    logger.info(`Loaded ${proxyList.length} proxies from ${inputFile}`);

    const proxyChunks = chunkArray(proxyList, PROXY_CHUNK_SIZE);
    logger.info(`Splitting proxies into ${proxyChunks.length} chunks`);

    // Create workers to process chunks of proxies
    const workerPromises = proxyChunks.map((chunk, index) => {
      logger.info(`Processing chunk ${index + 1} of ${proxyChunks.length}`);
      return processWithWorker(chunk);
    });

    // Wait for all workers to complete
    const allResults = await Promise.all(workerPromises);
    logger.info("All workers have completed their tasks.");

    // Flatten results from all workers
    const combinedResults = allResults.flat();

    // Save the results to a file
    fs.writeFileSync(outputFile, JSON.stringify(combinedResults, null, 2), "utf-8");
    logger.info(`Results saved to ${outputFile}`);
  } catch (error) {
    logger.error("Error processing proxies:", error);
  }
}

module.exports = { processProxies };
