import { DB_KEY, Store } from "../types";
import {
  extend,
  generatePreviewImageFromSceneData,
  log,
  newAScene,
} from "../utils/utils";
import { removeFile, dropDeletedFiles, getFile, storeFile } from "@/store/file";
import {
  getScenes,
  removeScene,
  restoreScenesArray,
  storeScene,
} from "@/store/scene";

export const initStore = (): Store => ({
  settings: {
    asideWidth: 300,
    asideClosed: false,
    lastActiveDraw: null,
    closePreview: false,
    scenesId: [],
  },
  scenes: [newAScene({ name: "画布一" })],
  scenes_map: new Map(),
});

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

  const settings = extend(
    defaultStore[DB_KEY.SETTINGS],
    settingsFromDB ? settingsFromDB.value : null
  );

  const { scenes, scenesMap, idArray } = restoreScenesArray(
    getScenes(),
    settings.scenesId
  );

  // 自动修复 lastActiveDraw
  // if can't find lastActiveDraw(id) in scenes, set the first scene id as lastActiveDraw.
  let lastActiveDraw = settings.lastActiveDraw;
  if (
    lastActiveDraw &&
    !scenes.map((scene) => scene.id).includes(lastActiveDraw)
  ) {
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
      scenes.map(async (scene) => {
        const img = await generatePreviewImageFromSceneData(scene.data);
        return {
          ...scene,
          img,
        };
      })
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
