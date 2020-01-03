const puppeteer = require('puppeteer');
const readline = require('readline');

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

(async () => {
  const browser = await puppeteer.launch({headless:false,defaultViewport:{width:1024, height:768}});
  const page = await browser.newPage();
  await page.goto('https://www.dkb.de/banking');
  await askQuestion(`Please log in`)
  await page.screenshot({path: 'login.png'});
  await page.goto('https://www.dkb.de/banking/postfach/ordner?$event=gotoFolder&folderNameOrId=archiv');
  await page.screenshot({path: 'archiv.png'});
  await browser.close();
})();