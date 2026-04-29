import { unzipSync } from "zlib";
import fs from "fs";
import asar from "@electron/asar";

async function unpack() {
  const file = fs.readFileSync();
  const unzip = unzipSync(file);
  fs.writeFileSync("unzip.asar", unzip);
  await asar.extractAll("unzip.asar", "tmp/unzip");
}
unpack();
