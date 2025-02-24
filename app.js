import MainApp from "./dist/src-ts/MainApp.js";
import log4js from "log4js";

log4js.configure({
  appenders: {
    console: { type: "console" },
  },
  categories: {
    default: { appenders: ["console"], level: "debug" },
  },
});

(async () => {
  const app = new MainApp({ wd: "./" });
  await app.run().catch(console.error);
})();
