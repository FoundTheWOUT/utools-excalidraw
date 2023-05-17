import { DB_KEY, Scene, Store } from "@/types";
import { extend, generatePreviewImageFromSceneData, log } from "@/utils/utils";
import { removeFile, dropDeletedFiles, getFile, storeFile } from "./file";
import { getScenes, removeScene, restoreScenesArray, storeScene } from "./scene";
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
  log("get store...");
  const defaultStore = initStore();
  const settingsFromDB = window.utools && window.utools.db.get(DB_KEY.SETTINGS);

  const settings = extend(defaultStore[DB_KEY.SETTINGS], settingsFromDB ? settingsFromDB.value : null);

  const { scenes, scenesMap, idArray } = restoreScenesArray(getScenes(), settings.scenesId);

  // 自动修复 lastActiveDraw
  // if can't find lastActiveDraw(id) in scenes, set the first scene id as lastActiveDraw.
  let lastActiveDraw = settings.lastActiveDraw;
  if (lastActiveDraw && !scenes.map((scene) => scene.id).includes(lastActiveDraw)) {
    lastActiveDraw = scenes[0].id;
  }

  // if (
  //   store[DB_KEY.SETTINGS].lastActiveDraw >= store[DB_KEY.SCENES].length ||
  //   store[DB_KEY.SETTINGS].lastActiveDraw < 0
  // ) {
  //   store[DB_KEY.SETTINGS].lastActiveDraw = store[DB_KEY.SCENES].length - 1;
  //   storeSetItem(DB_KEY.SETTINGS, store[DB_KEY.SETTINGS]);
  // }

  const store: Store = {
    settings: {
      ...settings,
      lastActiveDraw,
      scenesId: idArray,
    },
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
    scenes_map: scenesMap,
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
