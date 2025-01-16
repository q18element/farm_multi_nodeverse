const Farm = require('./node_handler/automation');
const { processProxies } = require('./proxy_handler/main');

async function main () {
  // Proxy processing
  await processProxies()

}

main()