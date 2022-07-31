import { DB_KEY, Store } from "../types";
import { extend } from "../utils/utils";
import { removeFile, dropDeletedFiles, getFile, storeFile } from "@/store/file";
import { getScenes, newAScene, removeScene, storeScene } from "@/store/scene";

export const initStore: Store = {
  settings: {
    asideWidth: 300,
    lastActiveDraw: null,
    closePreview: false,
  },
  scenes: [newAScene({ name: "画布0" })],
};

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

export const getStore = (): Store => {
  const settings = window.utools && window.utools.db.get(DB_KEY.SETTINGS);
  const store = {
    settings: extend(
      initStore[DB_KEY.SETTINGS],
      settings ? settings.value : null
    ),
    scenes: getScenes(),
  };

  // 自动修复 lastActiveDraw
  if (
    !store.scenes
      .map((scene) => scene.id)
      .includes(store[DB_KEY.SETTINGS].lastActiveDraw)
  ) {
    store[DB_KEY.SETTINGS].lastActiveDraw = store[DB_KEY.SCENES][0].id;
    storeSetItem(DB_KEY.SETTINGS, store[DB_KEY.SETTINGS]);
  }
  // if (
  //   store[DB_KEY.SETTINGS].lastActiveDraw >= store[DB_KEY.SCENES].length ||
  //   store[DB_KEY.SETTINGS].lastActiveDraw < 0
  // ) {
  //   store[DB_KEY.SETTINGS].lastActiveDraw = store[DB_KEY.SCENES].length - 1;
  //   storeSetItem(DB_KEY.SETTINGS, store[DB_KEY.SETTINGS]);
  // }

  return store;
};

export const storeSetItem = <T extends DB_KEY>(key: T, value: Store[T]) => {
  window.utools && window.utools.dbStorage.setItem(key, value);
};

// scene store api
export { getScenes, storeScene, removeScene };
// file store api
export { getFile, storeFile, removeFile, dropDeletedFiles };
