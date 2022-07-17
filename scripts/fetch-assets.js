const { promises: fs } = require("fs");
const path = require("path");

async function copyDir(src, dest, includeLang = ["zh-CN"]) {
  await fs.mkdir(dest, { recursive: true });
  let entries = await fs.readdir(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);
    if (src.match("locales")) {
      const isLangInclude = includeLang.reduce(
        (acc, lang) => acc && !!entry.name.match(lang),
        true
      );
      if (!isLangInclude) continue;
    }
    entry.isDirectory()
      ? await copyDir(srcPath, destPath, includeLang)
      : await fs.copyFile(srcPath, destPath);
  }
}

module.exports = async function main() {
  fs.access("public/excalidraw-assets")
    .then(async () => {
      await fs.rm("public/excalidraw-assets", {
        recursive: true,
      });
    })
    .catch(() => {});
  fs.access("public/excalidraw-assets-dev")
    .then(async () => {
      await fs.rm("public/excalidraw-assets", {
        recursive: true,
      });
    })
    .catch(() => {});
  copyDir(
    "node_modules/@excalidraw/excalidraw/dist/excalidraw-assets",
    "public/excalidraw-assets"
  );
  copyDir(
    "node_modules/@excalidraw/excalidraw/dist/excalidraw-assets-dev",
    "public/excalidraw-assets-dev"
  );
};
