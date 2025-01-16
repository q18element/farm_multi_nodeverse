const { By, until } = require('selenium-webdriver');

class TokenPlugin {

    async login_openloop(driver, username, password="Rtn@2024", proxyUrl, isFirstLogin) {
        try {
            const url = 'chrome-extension://effapmdildnpkiaeghlkicpfflpiambm/dist/popup/index.html';

            if (isFirstLogin) {
                console.log(`Account: ${username}, Proxy: ${proxyUrl}, it is first run, login URL will be opened automatically.`);
                await driver.get(url);
                await driver.wait(until.titleIs('OpenLoop'), 60000); // 30s timeout
                console.log(`Account: ${username}, Proxy: ${proxyUrl}, Page title: ${await driver.getTitle()}`);

                const continueButton = await driver.wait(until.elementLocated(By.xpath('//*[@id="app"]/div/div/div[1]/div/div/a/button')), 60000);
                await continueButton.click();

            } else {
                await driver.get(url);
                await driver.wait(until.titleIs('OpenLoop'), 60000); // 30s timeout
                console.log(`Account: ${username}, Proxy: ${proxyUrl}, Page title: ${await driver.getTitle()}`);
            }

            await driver.sleep(10000);  // Sleep to ensure the login process is complete

            // Wait for username and password input fields and the login button
            const usernameField = await driver.wait(until.elementLocated(By.css('.el-input-wrapper[type="email"] > .relative > input.el-input')), 60000);
            const passwordField = await driver.wait(until.elementLocated(By.css('.el-input-wrapper[type="password"] > .relative > input.el-input')), 60000);
            const loginButton = await driver.wait(until.elementLocated(By.css('.btn.btn-white.mt-3')), 60000);

            // Enter credentials and login
            await usernameField.sendKeys(username);
            await passwordField.sendKeys(password);
            await loginButton.click();
            await driver.wait(until.elementLocated(By.xpath('//*[@id="app"]/div/div/div[1]/header')), 60000);
            await driver.sleep(10000);
            return true; // Success
        } catch (error) {
            console.log(`Error in login_openloop for ${username}: ${error}`);
            return false; // Error occurred
        }
    }

    async login_gradient(driver, username, password="Rtn@2024", proxyUrl) {
        try {
            const url = 'https://app.gradient.network/';
            await driver.get(url);
            await driver.wait(until.titleIs('Gradient Network Dashboard'), 60000); // 30s timeout
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Page title: ${await driver.getTitle()}`);

            // Wait for username and password input fields and the login button
            const usernameField = await driver.wait(until.elementLocated(By.xpath('/html/body/div[1]/div[2]/div/div/div/div[2]/div[1]/input')), 60000);
            const passwordField = await driver.wait(until.elementLocated(By.xpath('/html/body/div[1]/div[2]/div/div/div/div[2]/div[2]/span/input')), 60000);
            const loginButton = await driver.wait(until.elementLocated(By.xpath('/html/body/div[1]/div[2]/div/div/div/div[4]/button[1]')), 60000);

            // Enter credentials and login
            await usernameField.sendKeys(username);
            await passwordField.sendKeys(password);
            await loginButton.click();
            await driver.wait(until.elementLocated(By.xpath('/html/body/div[3]/div/div[2]/div')), 60000);
            await driver.sleep(10000);
            return true; // Success
        } catch (error) {
            console.log(`Error in login_gradient for ${username}: ${error}`);
            return false; // Error occurred
        }
    }

    async login_toggle(driver, username, password="Rtn@2024", proxyUrl) {
        try {
            const url = 'https://toggle.pro/sign-in';
            await driver.get(url);
            await driver.wait(until.titleIs('Toggle Pro - Revolutionary AI that transforms digital workforce'), 60000); // 60s timeout
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Page title: ${await driver.getTitle()}`);

            // Wait for username and password input fields and the login button
            const usernameField = await driver.wait(until.elementLocated(By.xpath('/html/body/div/div[1]/div/div/div/div[5]/form/div[1]/div/input')), 60000);
            const passwordField = await driver.wait(until.elementLocated(By.xpath('/html/body/div/div[1]/div/div/div/div[5]/form/div[2]/div/input')), 60000);
            const loginButton = await driver.wait(until.elementLocated(By.xpath('/html/body/div/div[1]/div/div/div/div[5]/form/button/div')), 60000);

            // Enter credentials and login
            await usernameField.sendKeys(username);
            await passwordField.sendKeys(password);
            await loginButton.click();
            await driver.wait(until.elementLocated(By.xpath('/html/body/div/div[1]/div[2]/div[1]/div[1]/h1')), 60000);
            await driver.sleep(10000);
            return true; // Success
        } catch (error) {
            console.log(`Error in login_toggle for ${username}: ${error}`);
            return false; // Error occurred
        }
    }

    async navigateToExtension(driver, token_extension_url) {
        try {
            await driver.get(token_extension_url);
            await driver.sleep(3000);  // Wait for the extension to load
            return true; // Success
        } catch (error) {
            console.log(`Error in navigateToExtension: ${error}`);
            return false; // Error occurred
        }
    }

    async check_openloop(driver, username, password="Rtn@2024", proxyUrl) {
        try {
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Refresh completed`);
            await driver.sleep(3000);

            // Wait for the necessary elements
            const statusValue = await driver.wait(until.elementLocated(By.xpath('//*[@id="app"]/div/div/div[1]/div/div/div[1]/span')), 60000);
            const cntQualityValue = await driver.wait(until.elementLocated(By.xpath('//*[@id="app"]/div/div/div[1]/div/div/div[2]/div[1]/span')), 60000);
            const earningValue = await driver.wait(until.elementLocated(By.xpath('//*[@id="app"]/div/div/div[1]/div/div/div[2]/div[2]/div[2]/span')), 60000);

            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Status: ${await statusValue.getText()}`);
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Conection quality: ${await cntQualityValue.getText()}`);
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Earning value: ${await earningValue.getText()}`);

            await driver.sleep(20000);
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Slept for 2 mins, starting new check.`);

            return true; // Success
        } catch (error) {
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Error fetching elements or token expired. Re-logging in...`);
            // Token expired or elements not found, so login again
            await this.login_openloop(driver, username, password, proxyUrl, false);  // Adjust the login call with required params
            await this.navigateToExtension(driver);  // Navigate to extension after re-login
            await this.farm(driver, username, proxyUrl);  // Retry the process after logging in again
            return false; // Error occurred
        }
    }

    async check_gradient(driver, username, proxyUrl, isFirstLogin, last2minValueGradient) {
        try {
            if (isFirstLogin) { 
                const closeButton = await driver.wait(until.elementLocated(By.xpath('/html/body/div[3]/div/div[2]/div/div[1]/div/div/div/button')), 60000);
                await closeButton.click();
                const yesButton = await driver.wait(until.elementLocated(By.xpath('/html/body/div[2]/div/div[2]/div/div[1]/div/div/div/button')), 60000);
                await yesButton.click();
            }

            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Refresh completed`);
            await driver.sleep(3000);

            // Wait for the necessary elements
            const statusValue = await driver.wait(until.elementLocated(By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[1]/div[2]/div[3]/div[2]/div/div[2]/div')), 60000);
            const tapTodayValue = await driver.wait(until.elementLocated(By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[1]/div[1]')), 60000);
            const upTimeValue = await driver.wait(until.elementLocated(By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[2]/div[1]')), 60000);

            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Status: ${await statusValue.getText()}`);
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Tap today: ${await tapTodayValue.getText()}`);
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Up time value: ${await upTimeValue.getText()}`);

            const rewardButton = await driver.wait(until.elementLocated(By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[3]/div/div[3]')), 60000);
            await rewardButton.click();

            const todayRewardValue = await driver.wait(until.elementLocated(By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[1]/div[1]')), 60000);
            const sessionRewardValue = await driver.wait(until.elementLocated(By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[2]/div[1]')), 60000);

            console.log(`Account: ${username}, Proxy: ${proxyUrl}, today Reward: ${await todayRewardValue.getText()}`);
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, session Reward: ${await sessionRewardValue.getText()}`);

            if (last2minValueGradient !== 0) {
                console.log(`Account: ${username}, Proxy: ${proxyUrl}, Increase after 2 mins: ${parseFloat(await tapTodayValue.getText()) - last2minValueGradient}`);
            }

            last2minValueGradient = parseFloat(await tapTodayValue.getText());
            return true; // Success
        } catch (error) {
            console.log(`Error in check_gradient for ${username}: ${error}`);
            return false; // Error occurred
        }
    }

    async check_toggle(driver, username, proxyUrl, last2minValueToggle) {
        try {
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Refresh completed`);
            await driver.sleep(3000);
            
            // Wait for the necessary elements
            const elementValue = await driver.wait(until.elementLocated(By.xpath('//*[@id="root"]/div/div/div[4]/div[1]/p')), 60000);
            const percentValue = await driver.wait(until.elementLocated(By.xpath('//*[@id="root"]/div/div/div[2]/div/div/div/p')), 60000);
            const upTimeValue = await driver.wait(until.elementLocated(By.xpath('//*[@id="root"]/div/div/div[4]/div[2]/p')), 60000);

            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Connection quality: ${await percentValue.getText()}`);
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Epoch value after 2 mins: ${await elementValue.getText()}`);
            console.log(`Account: ${username}, Proxy: ${proxyUrl}, Up time value: ${await upTimeValue.getText()}`);

            if (last2minValueToggle !== 0) {
                console.log(`Account: ${username}, Proxy: ${proxyUrl}, Increase after 2 mins: ${parseFloat(await elementValue.getText()) - last2minValueToggle}`);
            }

            last2minValueToggle = parseFloat(await elementValue.getText());
            return true; // Success
        } catch (error) {
            console.log(`Error in check_toggle for ${username}: ${error}`);
            return false; // Error occurred
        }
    }

}

module.exports = TokenPlugin;
