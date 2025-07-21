const fs = require("node:fs");

/**
 *
 * @param {string} path
 * @param {string | NodeJS.ArrayBufferView} data
 * @param {{ encoding:NodeJS.BufferEncoding }} opts
 * @returns
 */
window.writeFile = (path, data, opts) => {
  const { encoding } = Object.assign(
    // default options
    { encoding: "utf8" },
    opts,
  );
  // check data if ArrayBufferView
  if (data instanceof ArrayBuffer) {
    data = Buffer.from(data);
  } else if (ArrayBuffer.isView(data)) {
    data = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, encoding, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
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
      scenes.value.map((scene) => ({ _id: `scene/${scene.id}`, value: scene })),
    );
    utools.db.remove(KEY_SCENES);
  }
})();

(function fixup() {
  const SETTINGS_KEY = "settings";
  const DEFAULT_WIDTH = 300;
  const MIN_WIDTH = 90;
  const settings = utools.dbStorage.getItem(SETTINGS_KEY);
  if (!settings) {
    return;
  }
  utools.dbStorage.setItem(SETTINGS_KEY, {
    ...settings,
    asideWidth:
      settings.asideWidth < MIN_WIDTH ? DEFAULT_WIDTH : settings.asideWidth,
  });
})();

utools.onMainPush(
  ({ payload }) => {
    const scenes = utools.db.allDocs("scene/");
    return scenes
      .filter(
        ({ value: { name, deleted } }) => !deleted && name.includes(payload),
      )
      .map((scene) => ({
        text: scene.value.name ?? scene._id,
        sceneId: scene.value.id,
      }));
  },
  () => {
    return true;
  },
);
