const asar = require("@electron/asar");
const { unzipSync } = require("zlib");
const fs = require("fs");

async function unpack() {
  const file = fs.readFileSync();
  const unzip = unzipSync(file);
  fs.writeFileSync("unzip.asar", unzip);
  await asar.extractAll("unzip.asar", "tmp/unzip");
}
unpack();
