import { By } from "selenium-webdriver";
import BaseService from "./baseService.js";
import MetamaskService from "./metamask.js";
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
        await this.metamaskServcie.setupOldWallet(seedphrase);
        await auto.get("https://storagescan-newton.0g.ai/tool");
        await auto.sleep(2000);
        let e = await auto.waitForElement(By.xpath('(//div[text()="Please connect your wallet first."]  | //p[text()="Browse File"])[1]'));
        if (!(await e.getText()).includes("Please connect your wallet first.")) {
            await auto.clickElement(By.xpath("//w3m-button"));
            await auto.driver.executeScript(() => {
                // @ts-ignore
                document
                    .querySelector("body > w3m-modal")
                    .shadowRoot.querySelector("wui-flex > wui-card > w3m-router")
                    .shadowRoot.querySelector("div > w3m-connect-view")
                    .shadowRoot.querySelector("wui-flex > wui-list-wallet:nth-child(4)");
            });
            await auto.sleep(1000);
            await this.metamaskServcie.confirmAny();
            await auto.waitForElement(By.xpath('//p[text()="Browse File"])[1]'));
        }
        await auto.sleep(2000);
        if (await auto.driver.executeScript(() => {
            try {
                if (
                // @ts-ignore
                document
                    .querySelector("body > div > div.px-\\[35px\\].sm\\:px-\\[40px\\].min-h-\\[calc\\(100vh-224px\\)\\] > div.pt-\\[56px\\].sm\\:pt-\\[23px\\].flex.flex-col.items-center.justify-center.z-10.relative > div.flex.w-full.justify-between > div.flex.gap-\\[16px\\] > w3m-button")
                    .shadowRoot.querySelector("w3m-account-button")
                    .shadowRoot.querySelector("wui-account-button")
                    .shadowRoot.querySelector("button > wui-text").textContent == " Switch Network") {
                    // @ts-ignore
                    document
                        .querySelector("body > w3m-modal")
                        .shadowRoot.querySelector("wui-flex > wui-card > w3m-router")
                        .shadowRoot.querySelector("div > w3m-unsupported-chain-view")
                        .shadowRoot.querySelector("wui-flex > wui-flex:nth-child(2) > wui-list-network") // @ts-ignore
                        .click();
                    return true;
                }
            }
            catch (e) {
                return false;
            }
        })) {
            await this.metamaskServcie.confirmAny();
            auto.sleep(2000);
        }
        auto.sleep(1000);
        await auto.driver.executeScript(() => {
            // @ts-ignore
            function createRandomFileAndSetToInput(inputElement, minSize = 10, maxSize = 1024) {
                const fileSize = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
                let randomContent = "";
                const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                for (let i = 0; i < fileSize; i++) {
                    randomContent += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                const fileName = `randomfile_${Date.now()}.txt`;
                const file = new File([randomContent], fileName, { type: "text/plain" });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                inputElement.files = dataTransfer.files;
                inputElement.dispatchEvent(new Event("change"));
            }
        });
    }
}
