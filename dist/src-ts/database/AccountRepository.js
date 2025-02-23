export default class AccountRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async loadAccounts() {
        try {
            const accounts = await new Promise((resolve, reject) => {
                this.db.all(`SELECT * FROM accounts`, (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(rows);
                    }
                });
            });
            return accounts.map((account) => ({
                ...account,
                services: JSON.parse(account.services),
            }));
        }
        catch (error) {
            return [];
        }
    }
    async importAccounts(accounts) {
        for (const account of accounts) {
            this.db.run(`INSERT INTO accounts (username, password, seedphrase, services, profile_volume)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(username) DO UPDATE SET 
           password = excluded.password,
           seedphrase = excluded.seedphrase,
           services = excluded.services,
           profile_volume = excluded.profile_volume`, [
                // account.id,
                account.username,
                account.password,
                account.seedphrase || "",
                account.services || "",
                account.profile_volume,
            ]);
        }
    }
}
