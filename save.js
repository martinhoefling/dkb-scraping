import { mkdirSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
const BASEDIR = "./data";

const parseDataUrl = dataUrl => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches.length !== 3) {
    throw new Error("Could not parse data URL.");
  }
  return { buffer: Buffer.from(matches[2], "base64") };
};

export async function saveContent(content, filename, folder) {
  const { buffer } = parseDataUrl(content);
  mkdirSync(join(BASEDIR, getTargetFolder(filename, folder)), {
    recursive: true
  });

  writeFileSync(
    join(BASEDIR, getTargetFolder(filename, folder), filename),
    buffer,
    "base64"
  );
}

export function fileExists(filename, folder) {
  return existsSync(join(BASEDIR, getTargetFolder(filename, folder), filename));
}

function getTargetFolder(filename, folder) {
  let match, depot;
  switch (folder) {
    case "Kontoauszüge":
      match = filename.match(/Kontoauszug Nr\. \d+_(\d+) zu Konto (\d+)\.pdf/);
      if (!match) throw new Error("Did not match " + filename);
      return join(folder, match[2], match[1]);
    case "Kreditkartenabrechnungen":
      match = filename.match(
        /Kreditkartenabrechnung (\d+_+\d+) per \d\d\.\d\d\.(\d+)\.pdf/
      );
      if (!match) throw new Error("Did not match " + filename);
      return join(folder, match[1], match[2]);
    case "Wertpapierdokumente":
      match = filename.match(/vom \d\d\.\d\d\.(\d\d\d\d)/);
      depot = filename.match(/zu Depot (\d+)/);
      if (!match) {
        match = filename.match(/Kosteninformation für das Jahr (\d+) zu Depot/);
      }
      if (!match || !depot) throw new Error("Did not match " + filename);
      return join(folder, depot[1], match[1]);
    default:
      return folder;
  }
}
