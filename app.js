import MainApp from "./src/App.js";

(async () => {
  const mainApp = new MainApp();
  await mainApp.run();
})();
