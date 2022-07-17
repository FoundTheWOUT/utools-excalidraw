import { ImportedDataState } from "@excalidraw/excalidraw/types/data/types";
import { DB_KEY, Scene, Store } from "./types";
import { six_nanoid, extend } from "./utils";
import { dropWhile } from "lodash";

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
    const store = allDocs
      .filter(
        (doc: any) => doc._id === DB_KEY.SCENES || doc._id === DB_KEY.SETTINGS
      )
      .reduce(
        (acc: any, cur: { _id: DB_KEY; value: any }) => ({
          ...acc,
          [cur._id]: extend(initStore[cur._id], cur.value),
        }),
        initStore
      ) as Store;
    // 自动修复 lastActiveDraw
    if (store[DB_KEY.SETTINGS].lastActiveDraw >= store[DB_KEY.SCENES].length) {
      store[DB_KEY.SETTINGS].lastActiveDraw = store[DB_KEY.SCENES].length - 1;
      storeSetItem(DB_KEY.SETTINGS, store[DB_KEY.SETTINGS]);
    }
    return store;
  }
  return initStore;
};

export const storeSetItem = <T extends DB_KEY>(key: T, value: Store[T]) => {
  window.utools && window.utools.dbStorage.setItem(key, value);
};

export const storeFile = (
  key: string,
  data: Uint8Array,
  type?: string | undefined
) => {
  if (!type) type = "text/plain";
  if (data.length / 1024 / 1024 > 10) {
    // TODO: too large, notice user would not be save
    return;
  }
  try {
    window.utools && window.utools.db.postAttachment(`file/${key}`, data, type);
  } catch (err) {
    console.error(err);
  }
};

export const getFile = (key: string): Uint16Array | undefined => {
  return window.utools && window.utools.db.getAttachment(`file/${key}`);
};

export const removeFile = (key: string | null) => {
  if (!key) return;
  return window.utools && window.utools.db.remove(`file/${key}`);
};

export const dropDeletedFiles = (scenes: Scene[]) => {
  if (!window.utools) return;
  const files = window.utools.db.allDocs("file");
  const noneDeletedFileId = new Set();
  scenes.map((scene) => {
    if (scene.data) {
      const data = JSON.parse(scene.data) as ImportedDataState;
      data.elements?.forEach((e) => {
        if (e.type == "image") {
          noneDeletedFileId.add(e.fileId);
        }
      });
    }
  });
  const needDeleteFile = dropWhile(files, (doc: any) => {
    const _path = doc._id.split("/");
    if (_path.length > 1) {
      return noneDeletedFileId.has(_path[1]);
    }
    return false;
  });
  needDeleteFile.map((file) => {
    window.utools && window.utools.db.remove(file._id);
  });
};
