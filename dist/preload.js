const fs = require("node:fs");
window.utools = utools;

window.writeFile = (path, data, opts) => {
  const { encoding, isArrayBuffer } = Object.assign(
    // default options
    { encoding: "utf8", isArrayBuffer: false },
    opts
  );
  if (isArrayBuffer) data = Buffer.from(data);
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, encoding, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

window.readFileSync = fs.readFileSync;

// migration scenes -> scene/id
(function migrateSceneData() {
  const KEY_SCENES = "scenes";
  const scenes = utools.db.get(KEY_SCENES);
  if (scenes) {
    if (!Array.isArray(scenes.value)) return;
    utools.db.bulkDocs(
      scenes.value.map((scene) => ({ _id: `scene/${scene.id}`, value: scene }))
    );
    utools.db.remove(KEY_SCENES);
  }
})();
