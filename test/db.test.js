import ProfileDatabase from "../src/db/profileDatabase.js";

ProfileDatabase.create()
  .then((db) => {
    db.updateDBFromCSV("./input/taikhoan.csv");
    return db;
  })
  .then((db) => db.accountRepository.loadAccounts().then(console.log));
