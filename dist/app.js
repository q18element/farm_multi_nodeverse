import MainApp from "./src-ts/MainApp.js";
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
    const app = new MainApp();
    await app.run().catch(console.error);
})();
