const Farm = require('./node_handler/automation');
const { processAccountsAndProxies } = require('./proxy_handler/assign_proxy');

const accountFilePath = "./config/accounts.txt";
const outputFilePath = "./config/account_with_proxy.json";


async function main () {
  const assignedAccounts = await processAccountsAndProxies(accountFilePath, outputFilePath);
}

main()