export async function login(page) {
  await page.goto("https://www.ib.dkb.de/banking");
  console.log("Waiting for financialstatus header");
  await page.waitFor(".financialstatus-header", { timeout: 0 });
  console.log("login complete");
}

export async function logout(page) {
  await page.goto(
    "https://www.dkb.de/DkbTransactionBanking/banner.xhtml?$event=logout"
  );
  console.log("logout complete");
}
