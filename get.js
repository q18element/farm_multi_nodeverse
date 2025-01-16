const Farm = require('./node_handler/automation');
const { processProxies } = require('./proxy_handler/main');
const { processAccountsAndProxies } = require('./proxy_handler/assign_proxy');

const accountFilePath = "./config/accounts.txt";
const outputFilePath = "./config/account_with_proxy.json";


async function main () {
  // Proxy processing
  await processProxies()
  // Account processing
  const assignedAccounts = await processAccountsAndProxies(accountFilePath, outputFilePath);

}

main()