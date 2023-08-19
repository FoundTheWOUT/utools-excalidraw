import { FILE_DOC_PREFIX } from "@/const";
import { DB_KEY, Store } from "@/types";
import { encoder } from "@/utils/utils";
import {
  ExcalidrawImperativeAPI,
  LibraryItems,
} from "@excalidraw/excalidraw/types/types";
import { StoreSystem } from "..";
import { storeFile } from "./file";
import { removeScene } from "./scene";
import {
  storeSetItem,
  getStore,
  getFile,
  storeScene,
  dropDeletedFiles,
} from "./store";
export class StoreSystemUtools implements StoreSystem {
  getStore = getStore;
  getFile = getFile;
  removeScene = removeScene;
  storeScene = storeScene;
  dropDeletedFiles = dropDeletedFiles;

  storeSetItem<T extends DB_KEY>(key: DB_KEY, value: Store[T]): void {
    storeSetItem(key, value);
  }
  storeFile(excalidrawRef?: ExcalidrawImperativeAPI | null) {
    if (excalidrawRef && window.utools) {
      const storedFiles = utools.db
        .allDocs(FILE_DOC_PREFIX)
        .map((doc) => doc._id.split("/")[1]);
      const files = excalidrawRef.getFiles();
      for (let fileKey in files) {
        if (storedFiles.includes(fileKey)) continue;
        const fileObjectStr = JSON.stringify(files[fileKey]);
        storeFile(
          fileKey,
          encoder.encode(fileObjectStr),
          undefined,
          excalidrawRef,
        );
      }
    }
  }

  /**
   *
   * @param items
   * @returns
   */
  handleLibraryChange(items: LibraryItems): void {
    if (!window.utools) return;
    const libraries = window.utools.db.allDocs("library");
    const stored_lib_ids_set = new Set(
      libraries.map((lib: any) => lib._id.split("/")[1]),
    );
    items.forEach((item) => {
      const { id } = item;
      window.utools.dbStorage.setItem(`library/${id}`, item);
      stored_lib_ids_set.delete(id);
    });

    stored_lib_ids_set.forEach((id) => {
      window.utools.dbStorage.removeItem(`library/${id}`);
    });
  }
}
