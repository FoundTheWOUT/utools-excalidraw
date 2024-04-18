const asar = require("@electron/asar");
const { gzipSync } = require("zlib");
const fs = require("fs");
const { execSync } = require("child_process");

async function pack() {
  // write version to plugin.json
  const tags = execSync("git describe --tags", { encoding: "utf-8" });
  const [latestTag] = tags.split("\n");
  const pluginConfig = JSON.parse(
    fs.readFileSync("dist/plugin.json", {
      encoding: "utf-8",
    }),
  );
  pluginConfig.version = latestTag.split("v")[1];
  fs.writeFileSync("dist/plugin.json", JSON.stringify(pluginConfig));

  await asar.createPackage("dist", "utools-excalidraw.asar");
  const compressed = gzipSync(fs.readFileSync("utools-excalidraw.asar"));
  fs.writeFileSync("utools-excalidraw.upx", compressed);
}
pack();
