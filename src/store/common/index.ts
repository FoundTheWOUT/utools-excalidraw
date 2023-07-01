import { DB_KEY, Scene, Store } from "@/types";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { StoreSystem, initStore } from "..";

const DBOpenReq = indexedDB.open("u2-excalidraw", 4);
let db: IDBDatabase | undefined;

export class StoreSystemCommon implements StoreSystem {
  async getStore() {
    const settings = localStorage.getItem(DB_KEY.SETTINGS);
    return new Promise<Store>((resolve, reject) => {
      DBOpenReq.onerror = () => {
        reject(new Error("DB connect fail."));
      };
      DBOpenReq.onsuccess = () => {
        db = DBOpenReq.result;

        const scenesStore = db.transaction("scenes").objectStore("scenes");
        scenesStore.getAll().onsuccess = (evt) => {
          // @ts-ignore
          const scenes = evt.target?.result as Scene[];
          const store = initStore({
            settings: settings ? JSON.parse(settings) : {},
            scenes,
          });
          console.log(store);
          resolve(store);
        };
      };
      DBOpenReq.onupgradeneeded = (evt) => {
        // @ts-ignore
        db = evt.target?.result as IDBDatabase;
        db.createObjectStore("scenes", { keyPath: "id" });
      };
    });
  }
  getFile(key: string): Uint8Array | null {
    return null;
  }
  storeScene(key: string | null | undefined, data: Scene) {
    if (key) {
      const sceneStore = db
        ?.transaction("scenes", "readwrite")
        .objectStore("scenes");
      const sceneReq = sceneStore!.get(key);
      sceneReq!.onsuccess = () => {
        const sceneItem = sceneReq?.result;
        if (sceneItem) {
          sceneStore?.put(data);
        } else {
          sceneStore?.add(data);
        }
      };
    }
  }
  dropDeletedFiles(scenes: Scene[]): void {}
  storeFile(excalidrawRef?: ExcalidrawImperativeAPI | null): void {}
  storeSetItem<T extends DB_KEY>(key: string, value: Store[T]) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  handleLibraryChange(item: any): void {}
  removeScene(id: string): void {
    localStorage.removeItem(id);
  }
}
