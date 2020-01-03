import puppeteer from "puppeteer";
import { login, logout } from "./login.js";
import { download } from "./download.js";

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1024, height: 768 }
  });
  const page = await browser.newPage();
  await login(page);
  await download(page);
  await logout(page);
  await browser.close();
})();
