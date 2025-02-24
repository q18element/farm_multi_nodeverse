import BrowserManager from "../../dist/src-ts/browser/browserManager.js";
import fs from "fs";
import PromptSync from "prompt-sync";
import { checkProxyWorks, convertNameToDirName } from "../../dist/src-ts/utils/index.js";
import ZeroGFaucetService from "../../dist/src-ts/services/zeroGFaucet.js";
import CaptchaSolverService from "../../dist/src-ts/services/captchaSolverService.js";

fs.mkdirSync("./temp", { recursive: true });
const prompt = PromptSync();

const seedphrases = txtToLinesArray("seedphrases.txt").filter((s) => _checkDate(s));
const bm = new BrowserManager();
const thread = parseInt(prompt("Số lượng luồng faucet muốn chạy: ")) || 1;

const groupedByGroupLength = seedphrases.reduce((acc, item, index) => {
  const groupIndex = Math.floor(index / thread);
  if (!acc[groupIndex]) {
    acc[groupIndex] = [];
  }
  acc[groupIndex].push(item);
  return acc;
}, []);

(async () => {
  const proxies = await checkProxyWorks(...txtToLinesArray("proxies.txt").filter((p) => _checkDate(p)));
  if (proxies.length == 0) {
    console.log("Khong co proxy nao");
    return;
  }
  for (let i = 0; i < groupedByGroupLength.length; i++) {
    const group = groupedByGroupLength[i];
    const pms = [];
    for (let j = 0; j < group.length; j++) {
      const address = group[j];
      pms.push(process(address, proxies.pop()));
    }
    await Promise.all(pms);
  }
})();

async function process(seedphrase, proxy) {
  const driver = await bm.startProfile({
    proxy,
  });
  const service = new ZeroGFaucetService({
    driver,
    account: {
      seedphrase: seedphrase,
    },
  });
  try {
    await service.uploadFile();
    saveTime(seedphrase);
    saveTime(proxy);
  } catch (e) {
    console.log("error upload", seedphrase, "with proxy", proxy, e);
  } finally {
    await driver.quit();
  }
}

function txtToLinesArray(p) {
  return fs.readFileSync(p, "utf-8").split(/\r?\n/);
}

function _checkDate(px) {
  try {
    return Date.now() - parseInt(fs.readFileSync(`./temp/${convertNameToDirName(px)}`)) >= 1000 * 60 * 60 * 24;
  } catch (e) {
    return true;
  }
}

function saveTime(name) {
  try {
    fs.writeFileSync(`./temp/${convertNameToDirName(name)}`, Date.now());
  } catch (e) {
    console.error("failed save time " + name + " " + e);
  }
}
