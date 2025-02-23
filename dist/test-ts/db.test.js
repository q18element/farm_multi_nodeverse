import { DATABASE_PATH } from "../src-ts/constants.js";
import DatabaseManager from "../src-ts/database/database.js";
DatabaseManager.open({ db_path: DATABASE_PATH }).then((db) => db.profileRepository.loadAccounts().then((accounts) => console.log(accounts)));
