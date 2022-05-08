import { saveContent, fileExists } from "./save.js";

export async function download(page) {
  const folders = await getFolders(page);
  console.log("Archive Folders: ", folders);
  let folder;
  for (folder of folders) {
    await downloadFolder(page, folder);
  }
}

async function getLinks(page, selector) {
  return await page.$$eval(selector, anchors =>
    [].map.call(anchors, a => {
      return { label: a.text, link: a.href };
    })
  );
}

async function getFolders(page) {
  await page.goto(
    "https://www.dkb.de/banking/postfach/ordner?$event=gotoFolder&folderNameOrId=archiv"
  );
  await page.waitFor("a.evt-gotoFolder");
  const links = await getLinks(page, "a.evt-gotoFolder");
  return links.filter(elem => !!elem.label && elem.label != "Archiv");
}

async function downloadFolder(page, folder) {
  console.log("Downloading folder", folder.label);
  await page.goto(folder.link);
  let next = null;
  let count = 1;
  do {
    console.log(`Downloading ${folder.label} links on page ${count}`);
    count += 1;
    next = await getLinks(page, "span.pager-navigator-next > a");
    await downloadFolderPageLinks(page, folder.label);
    if (next.length) {
      await page.goto(next[0].link);
    }
  } while (next.length);
}

async function downloadFolderPageLinks(page, folder) {
  const oldstyleLink =
    "https://www.dkb.de/DkbTransactionBanking/content/mailbox/Dialogs/ESafe/Details.xhtml?$event=downloadMessage";
  let newstyleLinks = await getLinks(page, "a.evt-getMailboxAttachment");
  let oldstyleLinks = await getLinks(page, "a.evt-showMessage");
  let link;
  console.log(`${newstyleLinks.length} newstyle links to download`);
  for (link of newstyleLinks.filter(elem => !!elem.label)) {
    await downloadLink(page, link, folder);
  }
  console.log(`${oldstyleLinks.length} oldstyle links to download`);
  for (link of oldstyleLinks.filter(elem => !!elem.label)) {
    await page.goto(link.link);
    const pdfLinks = await getLinks(page, "a.dkbblue");
    if (pdfLinks.length) {
      const pdfs = pdfLinks.map(pdflink => {
        const spl = pdflink.link.split("/");
        const splt = spl[spl.length - 1];
        const link = splt.substring(0, splt.length - 4);
        return {
          link: pdflink.link,
          label: link
        };
      });
      for (link of pdfs) {
        console.log("Cannot download", link.label, "due to cors issues");
        //await downloadLink(page, link, folder);
      }
    } else {
      await downloadLink(
        page,
        { label: link.label, link: oldstyleLink },
        folder
      );
    }
  }
}

async function downloadLink(page, link, folder) {
  if (!(link.label && link.link)) {
    throw new Error(`link has only label ${link.label} and ${link.link}`);
  }
  const filename = `${link.label}.pdf`.replaceAll("*", "_").replaceAll("/", "_").replaceAll('"', "_").replaceAll(':', "_");
  if (fileExists(filename, folder)) {
    console.log("File", filename, "url");
    return;
  }
  console.log("Downloading file", filename);
  const result = await page.evaluate(async link => {
    const response = await fetch(link, {
      method: "GET",
      credentials: "include"
    });
    if (!response.ok) {
      throw new Error(`Could not download file, (status ${response.status}`);
    }
    const data = await response.blob();
    const reader = new FileReader();
    return new Promise(resolve => {
      reader.addEventListener("loadend", () => resolve(reader.result));
      reader.readAsDataURL(data);
    });
  }, link.link);
  console.log("Saving file", filename);
  await saveContent(result, filename, folder);
}
