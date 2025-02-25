import { By } from "selenium-webdriver";
import BaseService, { BaseServiceOptions } from "./baseService.js";

export default class HahaWallet extends BaseService {
  bizSelectors: any;
  waitMailDelay: number;

  async daily(): Promise<void> {
    await this.load();
  }
  veerSelectors: any;
  constructor(ops: BaseServiceOptions) {
    super(ops);
    this.veerSelectors = {
      emailInput: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[1]/input'),
      passwordInput: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[2]/input'),
      loginButton: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[3]/button'),
      loginConfirmElement: By.xpath('//*[@id="mail-box-toggle"]/div[3]'),
      inboxElement: By.xpath('//*[@id="mail-box-toggle"]/div[3]'),
      firstMail: By.xpath('//*[@id="mail-item-0"]/div'),
      refreshButton: By.xpath('//*[@id="mail-box-toggle"]/div[3]/div/div/div[1]/div[1]/div[3]/a'),
    };
    this.bizSelectors = {
      emailInput: By.xpath(
        '//*[@id="app"]/div/div/main/div/div/div/div[1]/div/div/div/div/div[1]/form/div[1]/div/div/input'
      ),
      passwordInput: By.xpath(
        '//*[@id="app"]/div/div/main/div/div/div/div/div/div/div/div/div[2]/form/div/div/div/input'
      ),
      nextButton: By.xpath(
        '//*[@id="app"]/div/div/main/div/div/div/div[1]/div/div/div/div/div[1]/form/div[1]/div/button'
      ),
      loginButton: By.xpath(
        '//*[@id="app"]/div/div/main/div/div/div/div/div/div/div/div/div[2]/form/div/div/div/div/button'
      ),
      loginConfirmElement: By.xpath('//*[@id="app"]/div/div/div[3]/div[1]/div[2]/div'),
      inboxElement: By.xpath('//*[@id="app"]/div/div/div[3]/div[1]/div[2]/div'),
      firstMail: By.xpath('//*[@id="threads_list"]/div[1]/div[3]/div[1]'),
      refreshButton: By.xpath('//*[@id="refresh-threads-btn"]'),
    };
    this.waitMailDelay = 3 * 60 * 1000;
  }

  /** @paramDridriver  */
  async getOtpBiz(filter: any) {
    const { username, password } = this.account;
    const auto = this.auto;
    const driver = auto.driver;
    const baseWindow = await driver.getWindowHandle();
    await driver.switchTo().newWindow("tab");
    await driver.get("https://id.bizflycloud.vn/login?service=https%3A%2F%2Fmail.bizflycloud.vn%2F&_t=webmail");
    try {
      console.log(await driver.getCurrentUrl());

      const isLogin = await auto.checkElementExists(this.bizSelectors.inboxElement, 5000);

      if (!isLogin) {
        await auto.enterText(this.bizSelectors.emailInput, username);
        await driver.sleep(500);
        await auto.clickElement(this.bizSelectors.nextButton);
        await driver.sleep(5000);
        await auto.enterText(this.bizSelectors.passwordInput, password);
        await driver.sleep(500);
        await auto.clickElement(this.bizSelectors.loginButton);
        await auto.waitForElement(this.bizSelectors.inboxElement, 45000);
      }

      // logged in
      await driver.sleep(1000);
      await auto.clickElement(this.bizSelectors.refreshButton);
      await driver.sleep(3000);

      const emails: any = await driver.executeAsyncScript(() => {
        fetch("https://mail.bizflycloud.vn/api/threads?in=INBOX&limit=50&offset=0", {
          headers: {
            "x-auth-token": localStorage.webmailToken,
          },
          mode: "cors",
        })
          .then((res) => res.json())
          .then((data) => {
            arguments[arguments.length - 1](data);
          });
      });

      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        if (
          (!filter.subject || email.subject.includes(filter.subject)) &&
          (!filter.senderName || email.participants[0].name.includes(filter.senderName)) &&
          (!filter.senderEmail || email.participants[0].email.includes(filter.senderEmail)) &&
          (!filter.fromTime || email.last_message_timestamp > filter.fromTime) &&
          (!filter.unread || email.unread)
        ) {
          return email.snippets.match(/\b\d{6}\b/)[0];
        }
      }

      throw new Error("not find otp");
    } catch (error) {
      this.logger.error("Error extracting OTP:", error);
    } finally {
      await driver.close();

      await driver.switchTo().window(baseWindow);
    }
  }

  async getOtpVeer(filter: any) {
    const { username, password } = this.account;
    const auto = this.auto;
    const driver = auto.driver;
    const baseWindow = await driver.getWindowHandle();
    await driver.switchTo().newWindow("tab");
    await driver.get("https://mail.veer.vn");
    try {
      console.log(await driver.getCurrentUrl());
      const isLogin = await auto.checkElementExists(this.veerSelectors.inboxElement, 5000);
      if (!isLogin) {
        // Wait for and enter the email
        await auto.enterText(this.veerSelectors.emailInput, username);
        await auto.enterText(this.veerSelectors.passwordInput, password);
        await driver.sleep(500);
        await auto.clickElement(this.veerSelectors.loginButton);
        await driver.sleep(500);
        await auto.waitForElement(this.veerSelectors.inboxElement);

        const emails: any = await driver.executeAsyncScript(() => {
          fetch("https://mail.veer.vn/api/search", {
            headers: {
              "content-type": "application/json",
              Cookie: document.cookie,
            },
            body: '{"fullConversation":1,"sortBy":"dateDesc","offset":0,"limit":50,"query":"inid:\\"2\\"","types":"conversation","recip":"0","needExp":1}',
            method: "POST",
            mode: "cors",
          })
            .then((res) => res.json())
            .then((data) => arguments[arguments.length - 1](data.values.c));
        });

        for (const email of emails) {
          if (
            (!filter.subject || email.su.includes(filter.subject)) &&
            (!filter.senderName || email.e[0].d.includes(filter.senderName)) &&
            (!filter.senderEmail || email.e[0].a.includes(filter.senderEmail)) &&
            (!filter.fromTime || email.d >= filter.fromTime) &&
            (!filter.unread || email.u)
          ) {
            return email.fr.match(/\b\d{6}\b/)[0];
          }
        }
      }
      await driver.sleep(3000);
      await auto.clickElement(this.veerSelectors.refreshButton);
      await driver.sleep(3000);
    } catch (error) {
      console.error("Error extracting OTP:", error);
    } finally {
      await driver.close();
      await driver.switchTo().window(baseWindow);
    }
  }

  async getVerifyCode(fromTime = 0) {
    const { username } = this.account;
    let domain = username.split("@").pop(),
      otp = null;

    var filter = {
      senderEmail: "accounts@haha.me",
      subject: "Your HaHa verification code",
      unread: false,
      fromTime: fromTime - (fromTime % 1000) * 60 * 60 * 24,
    };
    const startAt = Date.now();
    while (Date.now() - startAt < this.waitMailDelay) {
      if (domain === "veer.vn") {
        otp = await this.getOtpVeer(filter);
      } else if (domain === "tourzy.us" || domain === "dealhot.vn") {
        otp = await this.getOtpBiz(filter);
      } else {
        throw new Error("Unsupported email domain");
      }

      if (otp) {
        console.log("OTP: " + otp);
        return otp;
      }

      await this.driver.sleep(5000);
    }
    if (otp == null) {
      throw new Error("GET OTP TIMEOUR ERR");
    }
  }

  async check() {
    await this.load();
    return await this.driver.executeAsyncScript(() => {
      // @ts-ignore
      chrome.storage.local.get("data", (data) => {
        arguments[arguments.length - 1](data.data.KarmaController.karma.point);
      });
    });
  }
  async load(): Promise<void> {
    await this.fullTask();
    await this.auto.resetTabs();
  }
  async fullTask() {
    const { username, password, seedphrase } = this.account;
    const auto = this.auto;
    const driver = auto.driver;
    let refcode = "ANONYMOUS-ROU5K5";
    let pincode = "12345678";

    const self = this;
    const passPincode = async () => {
      await auto.enterText(By.css('input[placeholder="Your Pin Code"]'), pincode);
      await auto.enterText(By.css('input[placeholder="Confirm Pin Code"]'), pincode);
      await auto.clickElement(By.xpath('//button[text()="Continue" and not(@disabled)]'));
    };
    let fromTime = Date.now();
    const enterAccount = async () => {
      await auto.enterText(By.css('input[type="email"]'), username);
      await auto.enterText(By.css('input[type="password"]'), password);
      let fromTime = Date.now();
    };
    const isLoggedIn = async () => {
      const e = await auto.waitForElement(
        By.xpath('(//p[text()="Legacy Wallet"] | //button[text()="GET STARTED"] | //button[text()="Unlock"])[1]')
      );
      return (await e.getText()) !== "GET STARTED";
    };

    const isUnlockPage = async () => {
      const e = await auto.waitForElement(
        By.xpath('(//p[text()="Legacy Wallet"] | //button[text()="GET STARTED"] | //button[text()="Unlock"])[1]')
      );
      return (await e.getText()) === "Unlock";
    };

    const processVerify = async () => {
      await driver.sleep(5000);
      // let code = await self.getVerifyCode( username, password, fromTime);
      let code = await self.getVerifyCode(fromTime);

      for (let i = 0; i < 6; i++) {
        let inp = await auto.waitForElement(By.css("#otp-input-" + i));
        inp.sendKeys(code[i]);
      }

      await auto.clickElement(By.xpath('//button[text()="VERIFY"]'));
    };

    await auto.get("chrome-extension://andhndehpcjpmneneealacgnmealilal/home.html");
    await driver.sleep(2000);
    if (!(await isLoggedIn())) {
      await auto.clickElement(By.xpath('//button[text()="GET STARTED"]'));

      await enterAccount();

      await driver.executeScript(() => {
        document.querySelector('input[placeholder="Referral Code"]')
          ? null // @ts-ignore
          : document
              .querySelector(
                "#app-content > div > div.w-\\[450px\\].max-h-\\[600px\\].bg-white.text-black.dark\\:bg-dark.dark\\:text-white.rounded-lg.overflow-hidden.relative > div.flex.flex-col.p-10 > div.flex.flex-row.items-center.gap-2.cursor-pointer"
              ) // @ts-ignore
              .click();
      });
      await driver.sleep(500);
      await auto.enterText(By.css('input[placeholder="Referral Code"]'), refcode);
      await auto.clickElement(By.xpath('//button[text()="CONTINUE" and not(@disabled)]'));

      let e = await auto.waitForElement(By.xpath('(//div[text()="User already exists"] | //*[@id="otp-input-0"])[1]'));

      if ((await e.getText()).includes("User already exists")) {
        await auto.clickElement(By.xpath('//button[span="Login"]'));

        await enterAccount();

        await auto.clickElement(By.xpath('//button[text()="CONTINUE" and not(@disabled)]'));
      } else {
        await processVerify();
        try {
          await auto.clickElement(By.xpath('//button[text()="Skip"]'));
        } catch (e) {}
      }

      let verfifychecke = await (
        await auto.waitForElement(
          By.xpath(
            '(//button[text()="VERIFY"] | //input[@placeholder="Your Pin Code"] | //button[text()="Skip" and not(@disabled)] )[1]'
          )
        )
      ).getText();

      if (verfifychecke.includes("VERIFY")) {
        await processVerify();
        await auto.clickElement(By.xpath('//button[text()="Skip"]'), 5000);
      } else if (verfifychecke.includes("Skip")) {
        await auto.actionsClickElement(By.xpath('//button[text()="Skip"]'), 5000);
      }

      await passPincode();

      await auto.clickElement(By.xpath('//label[contains(text(),"I agree to HaHa")]//input'));
      // await
      // auto.clickElement( By.xpath('//button[text()="Create a New Wallet" and not(@disabled)]'));
      await auto.clickElement(By.xpath('//button[text()="Import Existing Wallet" and not(@disabled)]'));
      let inputs = await driver.findElements(
        By.xpath('//input[@class="w-full bg-transparent border-none outline-none"]')
      );
      let sps = seedphrase.trim().split(" ");
      for (let i = 0; i < 12; i++) {
        await auto.enterText(
          By.xpath(`(//input[@class="w-full bg-transparent border-none outline-none"])[${i + 1}]`),
          sps[i]
        );
      }

      await auto.clickElement(By.xpath('//button[text()="Continue" and not(@disabled)]'));
      await auto.clickElement(By.xpath('//button[text()="Start Using Wallet" and not(@disabled)]'));
      await driver.sleep(2000);
      await auto.safeClick(By.xpath('//button[text()="Skip for now" and not(@disabled)]'));
    } else {
      if (await isUnlockPage()) {
        await auto.enterText(By.css('input[type="password"]'), pincode);
        await auto.clickElement(By.xpath('//button[text()="Unlock" and not(@disabled)]'));
      }
    }
    await auto.waitForElement(By.xpath('//p[text()="Legacy Wallet"]'));
    // on wallet logged in
    if (await auto.checkElementExists(By.xpath('//div[contains(text(),"Click here to claim your daily karma!")]'))) {
      await auto.clickElement(By.xpath('//div[contains(text(),"Click here to claim your daily karma!")]'));

      await auto.safeClick(By.xpath('//button[text()="Claim"]'), 5000);
    }
  }
}
