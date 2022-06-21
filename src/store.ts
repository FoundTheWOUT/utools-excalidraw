import { exportToBlob } from "@excalidraw/excalidraw";
import { DB_KEY, Store } from "./types";
import { six_nanoid } from "./utils";

const initStore: Store = {
  settings: {
    asideWidth: 300,
    lastActiveDraw: 0,
  },
  scenes: [{ id: six_nanoid(), name: "画布0" }],
};

/**
 *
 * Doc
 * 'settings' -> data: {
 *   asideWidth: 300,
 *   lastActiveDraw: 0,
 *  }
 *
 * 'scenes' -> data: Scene[]
 */

export const getStore = (): Store => {
  const allDocs = window.utools && window?.utools.db.allDocs();
  if (allDocs) {
    return allDocs.reduce(
      (acc: any, cur: any) => ({ ...acc, [cur._id]: cur.value }),
      initStore
    );
  }
  return initStore;
};

export const storeSetItem = <T extends DB_KEY>(key: T, value: Store[T]) => {
  window.utools && window.utools.dbStorage.setItem(key, value);
};
