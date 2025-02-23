import MainApp from "./src-ts/app";

(async () => {
  const app = new MainApp();
  await app.run();
})().catch(console.error);
