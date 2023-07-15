import { DB_KEY, Scene, Store } from "@/types";
import { generatePreviewImageFromSceneData, log } from "@/utils/utils";
import { removeFile, dropDeletedFiles, getFile, storeFile } from "./file";
import { getScenes, removeScene, storeScene } from "./scene";
import { initStore } from "..";

/**
 *
 * Doc
 * 'settings' -> data: {
 *   asideWidth: 300,
 *   lastActiveDraw: 0,
 *   closePreview: false
 *  }
 *
 * 'scenes' -> data: Scene[]
 * 'scene/id' -> {value:'json'}
 */

export const getStore = async (): Promise<Store> => {
  const settingsFromDB = window.utools && window.utools.db.get(DB_KEY.SETTINGS);

  const { scenes, ...rest } = initStore({
    scenes: getScenes(),
    settings: settingsFromDB ? settingsFromDB.value : {},
  });

  const store: Store = {
    ...rest,
    scenes: await Promise.all(
      // 恢复图片
      scenes.map(
        (scene) =>
          new Promise<Scene>(async (res, rej) => {
            try {
              const img = await generatePreviewImageFromSceneData(scene.data);
              res({
                ...scene,
                img,
              });
            } catch (error) {
              rej(error);
            }
          })
      )
    ),
  };

  storeSetItem(DB_KEY.SETTINGS, store[DB_KEY.SETTINGS]);

  return store;
};

export const storeSetItem = <T extends DB_KEY>(key: T, value: Store[T]) => {
  log(`store to ${key}, data:`, value);
  window.utools && window.utools.dbStorage.setItem(key, value);
};

// scene store api
export { getScenes, storeScene, removeScene };
// file store api
export { getFile, storeFile, removeFile, dropDeletedFiles };
