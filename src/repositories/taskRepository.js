const {logger} = require('../utils');

class TaskRepository {
  constructor(db) {
    this.db = db;
  }

  async initializeAutomations(accountId, proxy, services) {
    for (const service of services) {
      const existing = await this.db.get(
        `SELECT id FROM task_monitoring WHERE account_id = ? AND proxy = ? AND service = ?`,
        [accountId, proxy, service]
      );
      if (!existing) {
        await this.db.run(
          `INSERT INTO task_monitoring (account_id, proxy, service, state, retry_count) VALUES (?, ?, ?, 'pending', 0)`,
          [accountId, proxy, service]
        );
        // logger.info(`Initialized task for account ${accountId} on proxy ${proxy} - service: ${service}`);
      }
    }
  }

  async getPendingAutomations(profileId) {
    const rows = await this.db.all(
      `SELECT service FROM task_monitoring WHERE profile_id = ? AND state != 'failed'`,
      [profileId]
    );
    return rows.map(row => row.service);
  }

  async updateTaskState(accountId, proxy, service, state, retryIncrement = 0, point = 0) {
    await this.db.run(
      `UPDATE task_monitoring
       SET state = ?,
           retry_count = retry_count + ?,
           point = ?
       WHERE account_id = ? AND proxy = ? AND service = ?`,
      [state, retryIncrement, point, accountId, proxy, service]
    );
    logger.info(`Updated task state for account ${accountId} on proxy ${proxy}: ${service} -> ${state}, point: ${point}`);
  }
}

module.exports = TaskRepository;
