const fs = require('fs');
const path = require('path');
const log4js = require('log4js');
const { initDB } = require('../db');

const logger = log4js.getLogger();

// Reads filtered proxies from the DB
async function getFilteredProxiesFromDB(db) {
  const rows = await db.all('SELECT proxy, success, fail FROM filtered_proxies');
  return rows.map(row => ({
    proxy: row.proxy,
    success: JSON.parse(row.success || '[]'),
    fail: JSON.parse(row.fail || '[]')
  }));
}

// (Legacy) reading from text file – kept for reference if needed
function readAccountsFromFile(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .map(line => {
      const [username, ...passwordParts] = line.split(':');
      return { 
        username: username.trim(),
        password: passwordParts.join(':').trim() 
      };
    })
    .filter(acc => acc.username && acc.password);
}

// Reads all account credentials from a CSV file.
// Expected CSV headers: id,services,username,password,seedphrase,profile volume
function readAccountsFromCSV(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
  
  if (lines.length < 2) return []; // no data

  // Get header names from the first line
  const headers = lines[0].split(',').map(header => header.trim());

  const accounts = lines.slice(1).map(line => {
    const values = line.split(',').map(val => val.trim());
    let account = {};
    
    headers.forEach((header, index) => {
      account[header] = values[index] || '';
    });

    // Convert numeric fields
    if (account.id) {
      account.id = parseInt(account.id, 10);
    }
    if (account['profile volume']) {
      account.profileVolume = parseInt(account['profile volume'], 10);
      delete account['profile volume'];
    } else {
      account.profileVolume = 1; // default to 1 if not specified
    }

    // Convert services to an array assuming they are space separated (e.g., "hahawallet layeredge")
    if (account.services) {
      account.services = account.services.split(' ').filter(item => item !== '');
    }
    
    return account;
  });

  return accounts;
}

// Save all account credentials and their proxy associations into cache.db
async function saveAccountProxyMappings(db, accountsWithProxies) {
  for (const account of accountsWithProxies) {
    // Insert (or ignore) the account into the accounts table.
    // Adjust the column names to match your DB schema.
    await db.run(
      `INSERT OR IGNORE INTO accounts (username, password, seedphrase, services, profile_volume)
       VALUES (?, ?, ?, ?, ?)`,
      [
        account.username,
        account.password,
        account.seedphrase || '',
        JSON.stringify(account.services || []),
        account.profileVolume
      ]
    );
    
    // Get the account ID (assuming username is unique)
    const row = await db.get(
      'SELECT id FROM accounts WHERE username = ?',
      [account.username]
    );
    const accountId = row.id;

    // Insert proxy associations
    for (const proxyMapping of account.proxies) {
      await db.run(
        `INSERT OR IGNORE INTO accounts_proxies (account_id, proxy, services) 
         VALUES (?, ?, ?)`,
        [accountId, proxyMapping.proxy, JSON.stringify(proxyMapping.run)]
      );
    }
  }
}

function assignProxiesToAccounts(accounts, proxies) {
  // Create a working copy of the proxy list
  const availableProxies = [...proxies];
  
  return accounts.map(account => {
    // Determine number of proxies to assign from the account's profileVolume
    const numProxies = account.profileVolume;
    // Take the first numProxies from the available list (ensuring no duplicates)
    const assignedProxies = availableProxies.splice(0, numProxies);

    return {
      ...account,
      proxies: assignedProxies.map(proxy => ({
        proxy: proxy.proxy,
        // Directly assign the account's services instead of filtering
        run: account.services
      }))
    };
  });
}

// Save failed proxies to a text file in the output directory
async function saveFailedProxies(proxies, outputDir = '../output') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const failedProxies = proxies
    .filter(p => p.fail.length > 0)
    .map(p => p.proxy);

  const filePath = path.join(outputDir, 'failed_proxies.txt');
  fs.writeFileSync(filePath, failedProxies.join('\n'), 'utf8');
  logger.info(`Total failed proxies saved: ${failedProxies.length}`);
}

async function processAccountsAndProxies(accountFilePath, outputDir = '../output') {
  try {
    const db = await initDB();
    
    // Load tested proxies from DB
    const proxyList = await getFilteredProxiesFromDB(db);
    // Read account credentials from CSV
    const accounts = readAccountsFromCSV(accountFilePath);
    
    // Assign proxies based on each account's profileVolume (ensuring no duplicates)
    const accountsWithProxies = assignProxiesToAccounts(accounts, proxyList);
    
    // Save account details and their proxy associations to the database
    await saveAccountProxyMappings(db, accountsWithProxies);
    
    // Save failed proxies to an output file
    await saveFailedProxies(proxyList, outputDir);
    
    await db.close();
    logger.info('Proxy assignment completed successfully');
  } catch (error) {
    logger.error(`Processing failed: ${error.message}`);
  }
}

module.exports = { processAccountsAndProxies };
