import { DB_KEY, Scene, Store } from "@/types";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { StoreSystem, initStore } from "..";
import { encoder } from "@/utils/utils";
import { collectAllFileId } from "@/utils/data";

const DBOpenReq = indexedDB.open("u2-excalidraw", 4);
let db: IDBDatabase | undefined;

const createObjectStoreIfNotExist = (
  key: string,
  options?: IDBObjectStoreParameters,
) => {
  if (!db?.objectStoreNames.contains(key)) {
    db?.createObjectStore(key, options);
  }
};

export class StoreSystemCommon implements StoreSystem {
  async getStore() {
    const settings = localStorage.getItem(DB_KEY.SETTINGS);
    return new Promise<Store>((resolve, reject) => {
      DBOpenReq.onerror = (err) => {
        reject(err);
      };
      DBOpenReq.onsuccess = () => {
        db = DBOpenReq.result;

        const scenesReq = db
          .transaction("scenes")
          .objectStore("scenes")
          .getAll();
        scenesReq.onsuccess = () => {
          const scenes = scenesReq.result as Scene[];
          const store = initStore({
            settings: settings ? JSON.parse(settings) : {},
            scenes,
          });
          resolve(store);
        };
      };
      DBOpenReq.onupgradeneeded = () => {
        db = DBOpenReq.result;
        createObjectStoreIfNotExist("scenes", { keyPath: "id" });
        createObjectStoreIfNotExist("files");
      };
    });
  }
  async getFile(key: string) {
    if (!db) {
      return null;
    }
    const filesStore = db.transaction("files").objectStore("files");
    const file = filesStore.get(key);
    return new Promise<Uint8Array>((resolve, reject) => {
      file.onsuccess = () => {
        resolve(file.result);
      };
      file.onerror = () => {
        reject(new Error("get file error."));
      };
    });
  }
  storeScene(key: string, data: Scene) {
    if (!db) {
      return;
    }
    const sceneStore = db
      .transaction("scenes", "readwrite")
      .objectStore("scenes");
    const sceneReq = sceneStore.get(key);
    sceneReq.onsuccess = () => {
      sceneStore.put(data);
    };
  }
  dropDeletedFiles(scenes: Scene[]): void {
    if (!db) {
      return;
    }
    const fileStore = db.transaction("files", "readwrite").objectStore("files");
    const fileKeys = fileStore.getAllKeys();

    const existFileId = collectAllFileId(scenes);
    fileKeys.onsuccess = () => {
      const keys = fileKeys.result;
      keys.forEach((key) => {
        if (!existFileId.has(key)) {
          fileStore.delete(key);
        }
      });
    };
  }
  storeFile(excalidrawRef?: ExcalidrawImperativeAPI | null): void {
    if (!db || !excalidrawRef) {
      return;
    }

    const files = excalidrawRef.getFiles();
    const fileStore = db.transaction("files", "readwrite").objectStore("files");
    for (const fileKey in files) {
      const fileReq = fileStore.get(fileKey);
      fileReq.onsuccess = () => {
        fileStore.put(encoder.encode(JSON.stringify(files[fileKey])), fileKey);
      };
    }
  }
  storeSetItem<T extends DB_KEY>(key: string, value: Store[T]) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  handleLibraryChange() {}
  removeScene(key: string): void {
    if (!db) {
      return;
    }
    const sceneStore = db
      .transaction("scenes", "readwrite")
      .objectStore("scenes");

    sceneStore.delete(key);
  }
}
