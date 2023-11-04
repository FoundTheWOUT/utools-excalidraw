const fetchAssets = require("./fetch-assets");
const c_p = require("child_process");
const fs = require("fs/promises");

async function main() {
  await fetchAssets();
  c_p.execSync("tsc && vite build", {
    stdio: "inherit",
  });
  // remove dev assets
  await fs.rm("dist/web/excalidraw-assets-dev", { recursive: true });
}

main();
