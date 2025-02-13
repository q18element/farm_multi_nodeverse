const AutomationManager = require('./node_handler/automationManager');
const { processProxies } = require('./proxy_handler/main');
const { processAccountsAndProxies } = require('./proxy_handler/assign_proxy');
const { resetDB } = require('./db_utils');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { MultiSelect } = require('enquirer');

// Ensure required directories exist
const directories = ['./output', './profiles', './db', './config'];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created missing directory: ${dir}`);
  }
});

// Helper function to ask a question and return a Promise for the answer
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer.trim().toLowerCase());
  }));
}

async function main() {
  try {
    // Ask if user wants to reset the DB
    const resetAnswer = await askQuestion('Có muốn xóa data cũ kh (profile, cache db) (y/n): ');
    if (resetAnswer === 'y' || resetAnswer === 'yes') {
      console.log('Resetting the database...');
      await resetDB();

      // Delete the profiles folder and its contents
      const profilesDir = path.join(__dirname, 'profiles');
      if (fs.existsSync(profilesDir)) {
        await fs.promises.rm(profilesDir, { recursive: true, force: true });
        console.log(`Deleted profiles folder: ${profilesDir}`);
      } else {
        console.log(`Profiles folder not found at: ${profilesDir}`);
      }
    } else {
      console.log('Skipping database reset.');
    }

    // Ask if user wants to process proxies and assign them to accounts
    const proxyAnswer = await askQuestion('Có check và gán proxy lại cho các account kh? (y/n): ');
    if (proxyAnswer === 'y' || proxyAnswer === 'yes') {
      console.log('Processing proxies from ./config/proxy.txt ...');
      await processProxies("./config/proxy.txt");

      // Use Enquirer's MultiSelect prompt to allow selection of multiple services
      const multiSelectPrompt = new MultiSelect({
        name: 'services',
        message: 'Select the services to run:',
        choices: ['gradient', 'toggle', 'bless', 'openloop', 'blockmesh', 'despeed', 'depined']
      });
      const service_chosen = await multiSelectPrompt.run();
      console.log('Selected services:', service_chosen);

      console.log('Processing accounts and proxies from ./config/accounts.txt ...');
      await processAccountsAndProxies("./config/accounts.txt", './output', service_chosen);
    } else {
      console.log('Skipping proxy and account processing.');
    }

    // Run automation manager
    const manager = new AutomationManager();
    await manager.run();

  } catch (e) {
    console.error('Main error:', e);
  }
}

main();
