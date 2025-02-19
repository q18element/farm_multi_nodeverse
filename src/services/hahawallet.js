const BaseService = require("./baseService");
const { By, WebElement } = require("selenium-webdriver");
const log4js = require("log4js");
const { AutomationAcions } = require("../utils");
const config = require("../config/config");
class HahaWallet extends BaseService {
  constructor(driver) {
    super("Hahawallet", {});
    this.logger = log4js.getLogger("HahaWallet");
    this.veerSelectors = config.services.veer.selectors;
    this.bizSelectors = config.services.bizflycloud.selectors;
    this.waitMailDelay = 3 * 60 * 1000;
    this.auto = new AutomationAcions(driver);
  }

  /** @param {WebDriver} driver  */
  async getOtpBiz(email, password, emailFilter) {
    const driver = this.auto.driver;
    const baseWindow = await driver.getWindowHandle();
    await driver.switchTo().newWindow("tab");
    await driver.get(config.services.bizflycloud.loginUrl);
    try {
      console.log(await driver.getCurrentUrl());

      const isLogin = await this.auto.checkElementExists(this.bizSelectors.inboxElement, 5000);

      if (!isLogin) {
        await this.auto.enterText(this.bizSelectors.emailInput, email);
        await driver.sleep(500);
        await this.auto.clickElement(this.bizSelectors.nextButton);
        await driver.sleep(5000);
        await this.auto.enterText(this.bizSelectors.passwordInput, password);
        await driver.sleep(500);
        await this.auto.clickElement(this.bizSelectors.loginButton);
        await this.auto.waitForElement(this.bizSelectors.inboxElement, 45000);
      }

      // logged in
      await driver.sleep(1000);
      await this.auto.clickElement(this.bizSelectors.refreshButton);
      await driver.sleep(3000);

      /** @type {EmailThread[]} */
      const emails = await driver.executeAsyncScript(() => {
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
          (!emailFilter.subject || email.subject.includes(emailFilter.subject)) &&
          (!emailFilter.senderName || email.participants[0].name.includes(emailFilter.senderName)) &&
          (!emailFilter.senderEmail || email.participants[0].email.includes(emailFilter.senderEmail)) &&
          (!emailFilter.fromTime || email.last_message_timestamp > emailFilter.fromTime) &&
          (!emailFilter.unread || email.unread)
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

  /** @param {WebDriver} driver  */
  async getOtpVeer(email, password, filter) {
    const driver = this.auto.driver;
    const baseWindow = await driver.getWindowHandle();
    await driver.switchTo().newWindow("tab");
    await driver.get("https://mail.veer.vn");
    try {
      console.log(await driver.getCurrentUrl());
      const isLogin = await this.auto.checkElementExists(this.veerSelectors.inboxElement, 5000);
      if (!isLogin) {
        // Wait for and enter the email
        await this.auto.enterText(this.veerSelectors.emailInput, email);
        await this.auto.enterText(this.veerSelectors.passwordInput, password);
        await driver.sleep(500);
        await this.auto.clickElement(this.veerSelectors.loginButton);
        await driver.sleep(500);
        await this.auto.waitForElement(this.veerSelectors.inboxElement);

        const emails = await driver.executeAsyncScript(() => {
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
      await this.auto.clickElement(this.veerSelectors.refreshButton);
      await driver.sleep(3000);
    } catch (error) {
      console.error("Error extracting OTP:", error);
    } finally {
      await driver.close();
      await driver.switchTo().window(baseWindow);
    }
  }

  async getVerifyCode(username, password, fromTime) {
    const driver = this.auto.driver;
    let domain = username.split("@").pop(),
      otp = null;
    var filter = {
      senderEmail: "accounts@haha.me",
      subject: "Your HaHa verification code",
      unread: false,
      fromTime: 0,
    };
    const startAt = Date.now();
    while (Date.now() - startAt < this.waitMailDelay) {
      if (domain === "veer.vn") {
        otp = await this.getOtpVeer(username, password, filter);
      } else if (domain === "tourzy.us" || domain === "dealhot.vn") {
        otp = await this.getOtpBiz(username, password, filter);
      } else {
        throw new Error("Unsupported email domain");
      }

      if (otp) {
        console.log("OTP: " + otp);
        return otp;
      }

      await driver.sleep(5000);
    }
    if (otp == null) {
      throw new Error("GET OTP TIMEOUR ERR");
    }
  }

  async check(creds) {
    await this.login(creds);
    return await driver.executeAsyncScript(() => {
      chrome.storage.local.get("data", (data) => {
        arguments[arguments.length - 1](data.data.KarmaController.karma.point);
      });
    });
  }

  /** @param {WebDriver} driver  */
  async login(creds) {
    const { username, password, seedPhrase } = creds;
    const driver = this.auto.driver;

    let refcode = "ANONYMOUS-ROU5K5";
    let pincode = "12345678";

    const self = this;
    const passPincode = async () => {
      await this.auto.enterText(By.css('input[placeholder="Your Pin Code"]'), pincode);
      await this.auto.enterText(By.css('input[placeholder="Confirm Pin Code"]'), pincode);
      await this.auto.clickElement(By.xpath('//button[text()="Continue" and not(@disabled)]'));
    };
    let fromTime = Date.now();
    const enterAccount = async () => {
      await this.auto.enterText(By.css('input[type="email"]'), username);
      await this.auto.enterText(By.css('input[type="password"]'), password);
      let fromTime = Date.now();
    };
    const isLoggedIn = async () => {
      const e = await this.auto.waitForElement(
        By.xpath('(//p[text()="Legacy Wallet"] | //button[text()="GET STARTED"] | //button[text()="Unlock"])[1]')
      );
      return (await e.getText()) !== "GET STARTED";
    };

    const isUnlockPage = async () => {
      const e = await this.auto.waitForElement(
        By.xpath('(//p[text()="Legacy Wallet"] | //button[text()="GET STARTED"] | //button[text()="Unlock"])[1]')
      );
      return (await e.getText()) === "Unlock";
    };

    const processVerify = async () => {
      await driver.sleep(5000);
      // let code = await self.getVerifyCode( username, password, fromTime);
      let code = await self.getVerifyCode(username, password, 0);

      for (let i = 0; i < 6; i++) {
        /** @type {WebElement} */
        let inp = await this.auto.waitForElement(By.css("#otp-input-" + i));
        inp.sendKeys(code[i]);
      }

      await this.auto.clickElement(By.xpath('//button[text()="VERIFY"]'));
    };

    await driver.get("chrome-extension://andhndehpcjpmneneealacgnmealilal/home.html");
    await driver.sleep(2000);
    if (!(await isLoggedIn())) {
      await this.auto.clickElement(By.xpath('//button[text()="GET STARTED"]'));

      await enterAccount();

      await driver.executeScript(() => {
        document.querySelector('input[placeholder="Referral Code"]')
          ? null
          : document
              .querySelector(
                "#app-content > div > div.w-\\[450px\\].max-h-\\[600px\\].bg-white.text-black.dark\\:bg-dark.dark\\:text-white.rounded-lg.overflow-hidden.relative > div.flex.flex-col.p-10 > div.flex.flex-row.items-center.gap-2.cursor-pointer"
              )
              .click();
      });
      await driver.sleep(500);
      await this.auto.enterText(By.css('input[placeholder="Referral Code"]'), refcode);
      await this.auto.clickElement(By.xpath('//button[text()="CONTINUE" and not(@disabled)]'));

      let e = await this.auto.waitForElement(
        By.xpath('(//div[text()="User already exists"] | //*[@id="otp-input-0"])[1]')
      );

      if ((await e.getText()).includes("User already exists")) {
        await this.auto.clickElement(By.xpath('//button[span="Login"]'));

        await enterAccount();

        await this.auto.clickElement(By.xpath('//button[text()="CONTINUE" and not(@disabled)]'));
      } else {
        await processVerify();
        try {
          await this.auto.clickElement(By.xpath('//button[text()="Skip"]'));
        } catch (e) {}
      }

      let verfifychecke = await (
        await this.auto.waitForElement(
          By.xpath(
            '(//button[text()="VERIFY"] | //input[@placeholder="Your Pin Code"] | //button[text()="Skip" and not(@disabled)] )[1]'
          )
        )
      ).getText();

      if (verfifychecke.includes("VERIFY")) {
        await processVerify();
        await this.auto.clickElement(By.xpath('//button[text()="Skip"]'), 5000);
      } else if (verfifychecke.includes("Skip")) {
        await this.auto.actionsClickElement(By.xpath('//button[text()="Skip"]'), 5000);
      }

      await passPincode();

      await this.auto.clickElement(By.xpath('//label[contains(text(),"I agree to HaHa")]//input'));
      // await this.auto.clickElement( By.xpath('//button[text()="Create a New Wallet" and not(@disabled)]'));
      await this.auto.clickElement(By.xpath('//button[text()="Import Existing Wallet" and not(@disabled)]'));
      let inputs = await driver.findElements(
        By.xpath('//input[@class="w-full bg-transparent border-none outline-none"]')
      );
      let sps = seedPhrase.trim().split(" ");
      for (let i = 0; i < 12; i++) {
        await this.auto.enterText(
          By.xpath(`(//input[@class="w-full bg-transparent border-none outline-none"])[${i + 1}]`),
          sps[i]
        );
      }

      await this.auto.clickElement(By.xpath('//button[text()="Continue" and not(@disabled)]'));
      await this.auto.clickElement(By.xpath('//button[text()="Start Using Wallet" and not(@disabled)]'));
      await driver.sleep(2000);
      await this.auto.safeClick(By.xpath('//button[text()="Skip for now" and not(@disabled)]'));
    } else {
      if (await isUnlockPage()) {
        await this.auto.enterText(By.css('input[type="password"]'), pincode);
        await this.auto.clickElement(By.xpath('//button[text()="Unlock" and not(@disabled)]'));
      }
    }
    await this.auto.waitForElement(By.xpath('//p[text()="Legacy Wallet"]'));
    // on wallet logged in
    if (
      await this.auto.checkElementExists(By.xpath('//div[contains(text(),"Click here to claim your daily karma!")]'))
    ) {
      await this.auto.clickElement(By.xpath('//div[contains(text(),"Click here to claim your daily karma!")]'));

      await this.auto.safeClick(By.xpath('//button[text()="Claim"]'), 5000);
    }
  }
}

module.exports = HahaWallet;
