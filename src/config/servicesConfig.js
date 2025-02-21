const { By } = require('selenium-webdriver');

// ─── SERVICES CONFIGURATION ──────────────────────────────────────────────
const services = {
    openloop: {
      loginUrl: "chrome-extension://effapmdildnpkiaeghlkicpfflpiambm/dist/popup/index.html",
      extensionUrl: "chrome-extension://effapmdildnpkiaeghlkicpfflpiambm/dist/popup/index.html",
      loginCheckUrl: "chrome-extension://effapmdildnpkiaeghlkicpfflpiambm/dist/popup/index.html",
      selectors: {
        continueButton: By.xpath('//*[@id="app"]/div/div/div[1]/div/div/a/button'),
        usernameInput: By.css('.el-input-wrapper[type="email"] > .relative > input.el-input'),
        passwordInput: By.css('.el-input-wrapper[type="password"] > .relative > input.el-input'),
        loginButton: By.css('.btn.btn-white.mt-3'),
        loginCheckElement: By.xpath('//*[@id="app"]/div/div/div[1]/div/div/div[3]/div/div/div/div[1]/a/img'),
        status: By.xpath('//*[@id="app"]/div/div/div[1]/div/div/div[1]/span'),
        quality: By.xpath('//*[@id="app"]/div/div/div[1]/div/div/div[2]/div[1]/span'),
        earnings: By.xpath('//*[@id="app"]/div/div/div[1]/div/div/div[2]/div[2]/div[2]/span')
      }
    },
    gradient: {
      loginUrl: "https://app.gradient.network/",
      extensionUrl: "chrome-extension://caacbgbklghmpodbdafajbgdnegacfmo/popup.html",
      loginCheckUrl: "chrome-extension://caacbgbklghmpodbdafajbgdnegacfmo/popup.html",
      selectors: {
        usernameInput: By.xpath('/html/body/div[1]/div[2]/div/div/div/div[2]/div[1]/input'),
        passwordInput: By.xpath('/html/body/div[1]/div[2]/div/div/div/div[2]/div[2]/span/input'),
        loginButton: By.xpath('/html/body/div[1]/div[2]/div/div/div/div[4]/button[1]'),
        xButton: By.xpath('/html/body/div[3]/div/div[2]/div/div[2]/div/div/div/div[1]/div'),
        loginSuccess: By.xpath('/html/body/div[1]/div[1]/div[2]/main/div/div/div[1]'),
        loginCheckElement: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[3]/div/div[2]'),
        dashboardElement: By.xpath('/html/body/div[1]/div[1]/div[2]/main/div/div/div[1]'),
        gotItButton: By.xpath('/html/body/div[3]/div/div[2]/div/div[1]/div/div/div/button'),
        yesButton: By.xpath('/html/body/div[2]/div/div[2]/div/div[1]/div/div/div/button'),
        rewardSwitchButton: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[3]/div/div[3]'),
        status: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[1]/div[2]/div[3]/div[2]/div/div[2]/div'),
        tapToday: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[1]/div[1]'),
        uptime: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[2]/div[1]'),
        todayReward: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[1]/div[1]'),
        sessionReward: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[2]/div[1]')
      }
    },
    toggle: {
      loginUrl: "https://toggle.pro/sign-in",
      extensionUrl: "chrome-extension://bnkekngmddejlfdeefjilpfdhomeomgb/index.html",
      loginCheckUrl: "chrome-extension://bnkekngmddejlfdeefjilpfdhomeomgb/index.html",
      selectors: {
        usernameInput: By.xpath('/html/body/div/div[1]/div/div/div/div[5]/form/div[1]/div/input'),
        passwordInput: By.xpath('/html/body/div/div[1]/div/div/div/div[5]/form/div[2]/div/input'),
        loginButton: By.xpath('/html/body/div/div[1]/div/div/div/div[5]/form/button/div'),
        loginCheckElement: By.xpath('//*[@id="root"]/div/div/div[4]/p'),
        dashboardElement: By.xpath('/html/body/div/div[1]/div[2]/div[1]/div[1]/h1'),
        quality: By.xpath('//*[@id="root"]/div/div/div[2]/div/div/div/p'),
        epoch: By.xpath('//*[@id="root"]/div/div/div[4]/div[1]/p'),
        uptime: By.xpath('//*[@id="root"]/div/div/div[4]/div[2]/p')
      }
    },
    bless: {
      loginUrl: "https://bless.network/dashboard?ref=Y06FN1",
      extensionUrl: "https://bless.network/dashboard",
      loginCheckUrl: "https://bless.network/dashboard",
      selectors: {
        emailInput: By.xpath('//*[@id="email"]'),
        loginButton: By.xpath('/html/body/div/main/div/div/div[2]/div[3]/button'),
        loginCheckElement: By.xpath('/html/body/div/main/div/div[1]/h1'),
        dashboardElement: By.xpath('/html/body/div/main/div/div[1]/h1'),
        otpInput: By.xpath('//*[@id="app"]/div/div/div/div/div[3]/div/form/input[1]'),
      }
    },
    blockmesh: {
      loginUrl: "chrome-extension://obfhoiefijlolgdmphcekifedagnkfjp/js/popup.html",
      extensionUrl: "chrome-extension://obfhoiefijlolgdmphcekifedagnkfjp/js/popup.html",
      loginCheckUrl: "chrome-extension://obfhoiefijlolgdmphcekifedagnkfjp/js/popup.html",
      selectors: {
        usernameInput: By.xpath('//*[@id="mount_to"]/div[2]/div[2]/form/div[1]/input'),
        passwordInput: By.xpath('//*[@id="mount_to"]/div[2]/div[2]/form/div[2]/input'),
        loginButton: By.xpath('//*[@id="mount_to"]/div[2]/div[2]/form/button'),
        dashboardButton: By.xpath('//*[@id="mount_to"]/div[2]/div[3]/button[1]/a'),
        emailDashboardInput: By.xpath('//*[@id="email"]'),
        passwordDashboardInput: By.xpath('//*[@id="password"]'),
        loginDashboardButton: By.xpath('//*[@id="content"]/form/div/div/div[4]/button'),
        pointValue: By.xpath('/html/body/div[2]/main/div/div/div[4]/div[5]/div/div[2]/div/span'),
        loginCheckElement: By.xpath('//*[@id="mount_to"]/div[2]/div[3]/button[1]/a'),
      }
    },
    despeed: {
      loginUrl: "https://app.despeed.net/login",
      extensionUrl: "chrome-extension://ofpfdpleloialedjbfpocglfggbdpiem/popup.html",
      loginCheckUrl: "chrome-extension://ofpfdpleloialedjbfpocglfggbdpiem/popup.html",
      selectors: {
        usernameInput: By.xpath('//*[@id="root"]/section/div/div/div/div[2]/form/div[1]/div/input'),
        passwordInput: By.xpath('//*[@id="root"]/section/div/div/div/div[2]/form/div[2]/div/input'),
        hcapchaIframe: By.xpath('//*[@id="root"]/section/div/div/div/div[2]/form/div[4]/div/iframe'),
        hcapchaCheckbox: By.css('div#checkbox[role="checkbox"]'),
        hcapchaChecked: By.xpath('//iframe[contains(@data-hcaptcha-response, "ey")]'),
        loginButton: By.xpath('//*[@id="root"]/section/div/div/div/div[2]/form/div[5]/button'),
        loginCheckElement: By.xpath('//*[@id="app-container"]/div/div[4]/div/div[1]/div[2]'),
        loginConfirmDashboard: By.xpath('//*[@id="root"]/div[1]/div/div/div[1]/div[2]/div/div/div/main/div/div[1]/div/div[1]/div/div[1]/h3'),
        pointValue: By.xpath('//*[@id="app-container"]/div/div[4]/div/div[1]/div[2]/h3'),
      }
    },
    depined: {
      loginUrl: "https://app.depined.org/onboarding",
      extensionUrl: "chrome-extension://pjlappmodaidbdjhmhifbnnmmkkicjoc/popup.html",
      loginCheckUrl: "chrome-extension://pjlappmodaidbdjhmhifbnnmmkkicjoc/popup.html",
      selectors: {
        usernameInput: By.xpath('//*[@id="email"]'),
        passwordInput: By.xpath('//*[@id="password"]'),
        loginButton: By.xpath('//*[@id="modal"]/div/div[2]/div/div[3]/div[1]/div[1]/div/div[2]/div/div[3]/div[4]/div/div'),
        connectButton: By.xpath('//*[@id="connect-button"]'),
        loginCheckElement: By.xpath('//*[@id="connect-button"]/span[normalize-space(text()) = "Connected"]'),
        loginConfirmDashboard: By.xpath('//*[@id="root"]/div[3]/div[3]/div[1]/div[4]/div[1]/div[1]'),
        pointValue: By.xpath('//*[@id="container"]/div[3]/div[1]/div[2]/span'),
      }
    },
    hahawallet: {
      loginUrl: "https://hahawallet.com/",
      loginCheckUrl: "chrome-extension://andhndehpcjpmneneealacgnmealilal/home.html",
      selectors: {
        loginCheckElement: By.xpath('//p[text()="Legacy Wallet"]'),
      }
    },
    hcapcha: {
      accessSignupUrl: "https://www.hcaptcha.com/accessibility",
      setCookieUrl: "",
      h_selectors: {
        emailInput: By.xpath('//*[@id="email"]'),
        congratsText: By.xpath('//*[@id="root"]/div/div[1]/div/div[2]/p[1]'),
        setCookieButton: By.xpath('//*[@id="root"]/div[2]/div/div/div[3]/button'),
        setCookieConfirm: By.xpath('//*[@id="root"]/div[2]/div/div/div[3]/span'),
      }
    },
    hcapchaSolver: {
      extensionUrl: "chrome-extension://hlifkpholllijblknnmbfagnkjneagid/popup/popup.html",
      selectors: {
        capchaSolved: By.xpath('//*[@id="anchor-state"]/div[3]/img'),
      }
    },
    veer: {
      loginUrl: "https://mail.veer.vn",
      selectors: {
        emailInput: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[1]/input'),
        passwordInput: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[2]/input'),
        loginButton: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[3]/button'),
        loginCheckElement: By.xpath('//*[@id="mail-box-toggle"]/div[3]'),
        inboxElement: By.xpath('//*[@id="mail-box-toggle"]/div[3]'),
        latestMail: By.xpath('//*[@id="mail-item-0"]/div'),
        refreshButton: By.xpath('//*[@id="mail-box-toggle"]/div[3]/div/div/div[1]/div[1]/div[3]/a'),
        otpText: By.xpath('//*[@id="mail-box-toggle"]/div[3]/div/div[2]/div/div[1]/h2')
      }
    },
    bizflycloud: {
      loginUrl: 'https://id.bizflycloud.vn/login?service=https%3A%2F%2Fmail.bizflycloud.vn%2F&_t=webmail',
      selectors: {
        emailInput: By.xpath('//*[@id="app"]/div/div/main/div/div/div/div[1]/div/div/div/div/div[1]/form/div[1]/div/div/input'),
        passwordInput: By.xpath('//*[@id="app"]/div/div/main/div/div/div/div/div/div/div/div/div[2]/form/div/div/div/input'),
        nextButton: By.xpath('//*[@id="app"]/div/div/main/div/div/div/div[1]/div/div/div/div/div[1]/form/div[1]/div/button'),
        loginButton: By.xpath('//*[@id="app"]/div/div/main/div/div/div/div/div/div/div/div/div[2]/form/div/div/div/div/button'),
        loginCheckElement: By.xpath('//*[@id="app"]/div/div/div[3]/div[1]/div[2]/div'),
        inboxElement: By.xpath('//*[@id="app"]/div/div/div[3]/div[1]/div[2]/div'),
        firstMail: By.xpath('//*[@id="threads_list"]/div[1]/div[3]/div[1]'),
        refreshButton: By.xpath('//*[@id="refresh-threads-btn"]'),
        // otpText: By.xpath('//*[@id="threads_list"]/div[1]/div[3]/div[1
      }
    },
    mtm: {
      loginUrl: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#onboarding/welcome',
      selectors: {
        agreeCheckbox: By.xpath('//*[@id="onboarding__terms-checkbox"]'),
        createWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/ul/li[2]/button'),
        importWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/ul/li[3]/button'),
        agreeCheckbox2: By.xpath('//*[@id="metametrics-opt-in"]'),
        iagreeButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button[2]'),
        passwordInput: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[1]/label/input'),
        passwordRepeatInput: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[2]/label/input'),
        iunderstandCheckbox: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[3]/label/span[1]/input'),
        createNewWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/button'),
        secureMyWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button[2]'),
        revealMySecretButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[6]/button'),
        nextButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[6]/div/button'),
        confirmButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[5]/button'),
        doneButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[3]/button'),
        nextButton2: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button'),
        doneButton2: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button'),
        mainetText: By.xpath('//*[@id="app-content"]/div/div[2]/div/div[1]/button/p'),
        confirmSecretInputButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[4]/div/button')
      }
    }
};

module.exports = { services };
