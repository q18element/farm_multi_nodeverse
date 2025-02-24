import { By } from "selenium-webdriver";
import BaseService from "./baseService.js";
import MetamaskService from "./metamask.js";
import fs from "fs";
import path from "path";
export default class ZeroGFaucetService extends BaseService {
    metamaskServcie;
    constructor(opts) {
        super(opts);
        this.metamaskServcie = this.childService(MetamaskService);
    }
    load() {
        throw new Error("Method not implemented.");
    }
    check() {
        throw new Error("Method not implemented.");
    }
    daily() {
        throw new Error("Method not implemented.");
    }
    async faucet(address) {
        const { auto } = this;
        const addressInput = By.xpath('//input[@id="address"]');
        const faucetBtn = By.xpath('//button[@type="submit" and not(disabled) and contains(text(), "Request AOGI Token")]');
        await auto.get("https://faucet.0g.ai/");
        await auto.waitForElement(By.xpath('//iframe[contains(@data-hcaptcha-response, "ey")]'), 60000 * 15);
        await auto.enterText(addressInput, address);
        await auto.clickElement(faucetBtn);
        await auto.sleep(10000);
    }
    async uploadFile() {
        const { seedphrase } = this.account;
        const auto = this.auto;
        const driver = auto.driver;
        await this.metamaskServcie.setupOldWallet(seedphrase);
        await auto.get("https://chainlist.org/chain/16600");
        if (await driver.executeAsyncScript(async (callback) => {
            try {
                // @ts-ignore
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0x40d8" }],
                });
            }
            catch (error) {
                if (error.code === 4902) {
                    // @ts-ignore
                    window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: "0x40d8",
                                chainName: "0G-Newton-Testnet",
                                nativeCurrency: {
                                    name: "0G Testnet",
                                    symbol: "A0GI",
                                    decimals: 18,
                                },
                                rpcUrls: ["https://evmrpc-testnet.0g.ai"],
                                blockExplorerUrls: ["https://chainscan-newton.0g.ai"],
                            },
                        ],
                    });
                    callback(true);
                }
            }
        })) {
            await auto.sleep(2000);
            await this.metamaskServcie.confirmAny();
            await auto.sleep(2000);
        }
        await auto.get("https://storagescan-newton.0g.ai/tool");
        await auto.sleep(2000);
        let e = await auto.waitForElement(By.xpath('(//div[text()="Please connect your wallet first."]  | //p[text()="Browse File"])[1]'));
        if ((await e.getText()).includes("Please connect your wallet first.")) {
            this.logger.info("Connecting Metamask");
            await auto.actionsClickElement(By.xpath("//w3m-button"));
            await auto.sleep(1000);
            try {
                await auto.driver.wait(async () => {
                    return await auto.driver.executeScript(() => {
                        try {
                            // @ts-ignore
                            return document.querySelector("body > w3m-modal").shadowRoot.querySelector("wui-flex");
                        }
                        catch (e) {
                            return false;
                        }
                    });
                }, 10000);
            }
            catch (e) {
                await auto.get("https://storagescan-newton.0g.ai/tool");
                await auto.sleep(1000);
                await auto.actionsClickElement(By.xpath("//w3m-button"));
                await auto.driver.wait(async () => {
                    return await auto.driver.executeScript(() => {
                        try {
                            // @ts-ignore
                            return document.querySelector("body > w3m-modal").shadowRoot.querySelector("wui-flex");
                        }
                        catch (e) {
                            return false;
                        }
                    });
                });
            }
            await auto.sleep(1000);
            await auto.driver.executeScript(() => {
                // @ts-ignore
                document
                    .querySelector("body > w3m-modal")
                    .shadowRoot.querySelector("wui-flex > wui-card > w3m-router")
                    .shadowRoot.querySelector("div > w3m-connect-view")
                    .shadowRoot.querySelector("wui-flex > wui-list-wallet:nth-child(4)") // @ts-ignore
                    .click();
            });
            await auto.sleep(1000);
            await this.metamaskServcie.confirmAny();
            await auto.waitForElement(By.xpath('//p[text()="Browse File"]'));
        }
        else {
            this.logger.info("Metamask already connected");
        }
        await auto.sleep(3000);
        await auto.sleep(1000);
        const randomName = Math.random().toString(36).slice(2);
        const path_ = path.resolve(`./temp/zerog/${randomName}.txt`);
        fs.mkdirSync(path.dirname(path_), { recursive: true });
        fs.writeFileSync(path_, Math.random().toString(32).slice(2));
        await (await auto.waitForElement(By.css('[name="file"]'))).sendKeys(path_);
        this.logger.info("Uploading file");
        await auto.waitForElement(By.xpath('//*[text()="Upload prepared"]'));
        await auto.sleep(1000);
        await auto.clickElement(By.xpath('//button[text()="Upload" and not(disabled)]'));
        await auto.sleep(1000);
        await this.metamaskServcie.confirmAny();
        await auto.sleep(5000);
        this.logger.info("Uploaded file");
        await auto.waitForElement(By.xpath('//*[text()="Upload completed"]'));
        await auto.sleep(2000);
    }
}
