import BaseService from "./baseService.js";

export default class CaptchaSolverService extends BaseService {
  load(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  check(): Promise<any> {
    throw new Error("Method not implemented.");
  }
  daily(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async activePopup(): Promise<void> {
    const { browser: auto } = this;
    const { driver } = auto;
    const current = await driver.getWindowHandle();
    await driver.switchTo().newWindow("tab");
    await auto.sleep(500);

    await auto.get("chrome-extension://hlifkpholllijblknnmbfagnkjneagid/popup/popup.html#/");
    await auto.sleep(2000);
    await driver.executeScript(() => {
      const switchElement = document.querySelector("div.el-switch");
      if (switchElement && switchElement.getAttribute("aria-checked") !== "true") {
        // @ts-ignore
        switchElement.click();
      }
    });
    await driver.close();
    await driver.switchTo().window(current);
  }
}
