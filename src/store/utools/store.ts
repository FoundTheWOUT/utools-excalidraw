import { DB_KEY, Store } from "@/types";
import { log } from "@/utils/utils";
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
  const settings = window.utools && window.utools.db.get(DB_KEY.SETTINGS);

  const store = initStore({
    scenes: getScenes(),
    settings: settings ? settings.value : {},
  });

  return store;
};

export const storeSetItem = <T extends DB_KEY>(key: T, value: Store[T]) => {
  log(`store to ${key}, data:`, value);
  window.utools?.dbStorage.setItem(key, value);
};

// scene store api
export { getScenes, storeScene, removeScene };
// file store api
export { getFile, storeFile, removeFile, dropDeletedFiles };
