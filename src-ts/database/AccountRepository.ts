import { Database } from "sqlite";

export interface Account {
  id: number;
  username: string;
  password: string;
  seedphrase: string;
  services: string[];
  profile_volume: number;
}

export default class AccountRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async loadAccounts(): Promise<Account[]> {
    try {
      const accounts = await new Promise<any[]>((resolve, reject) => {
        this.db.all(`SELECT * FROM accounts`, (err: any, rows: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });

      return accounts.map((account) => ({
        ...account,
        services: JSON.parse(account.services),
      }));
    } catch (error: any) {
      return [];
    }
  }

  async importAccounts(accounts: Account[]): Promise<void> {
    for (const account of accounts) {
      await new Promise<void>((resolve, reject) => {
        this.db.run(
          `INSERT INTO accounts ( username, password, seedphrase, services, profile_volume)
           VALUES ( ?, ?, ?, ?, ?)
           ON CONFLICT(username) DO UPDATE SET 
             password = excluded.password,
             seedphrase = excluded.seedphrase,
             services = excluded.services,
             profile_volume = excluded.profile_volume`,
          [
            account.id,
            account.username,
            account.password,
            account.seedphrase || "",
            JSON.stringify(account.services || []),
            account.profile_volume,
          ],
          (err: any) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    }
  }
}
