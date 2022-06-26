import { DB_KEY, Store } from "./types";
import { six_nanoid, extend } from "./utils";

const initStore: Store = {
  settings: {
    asideWidth: 300,
    lastActiveDraw: 0,
    closePreview: false,
  },
  scenes: [{ id: six_nanoid(), name: "画布0" }],
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
 */

export const getStore = (): Store => {
  const allDocs = window.utools && window?.utools.db.allDocs();
  if (allDocs) {
    // 自动与最新 store 的初始化进行合并
    return allDocs.reduce(
      (acc: any, cur: { _id: DB_KEY; value: any }) => ({
        ...acc,
        [cur._id]: extend(initStore[cur._id], cur.value),
      }),
      initStore
    );
  }
  return initStore;
};

export const storeSetItem = <T extends DB_KEY>(key: T, value: Store[T]) => {
  window.utools && window.utools.dbStorage.setItem(key, value);
};
