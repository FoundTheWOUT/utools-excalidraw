const asar = require("@electron/asar");
const { gzipSync } = require("zlib");
const fs = require("fs");

async function pack() {
  await asar.createPackage("dist", "utools-excalidraw.asar");
  const compressed = gzipSync(fs.readFileSync("utools-excalidraw.asar"));
  fs.writeFileSync("utools-excalidraw.upx", compressed);
}
pack();
