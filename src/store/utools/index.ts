import type {
  ExcalidrawImperativeAPI,
  LibraryItems,
} from "@excalidraw/excalidraw/types";
import type { SavedChats } from "@excalidraw/excalidraw/index";
import { type StoreSystem } from "../StoreSystem";
import { storeFile } from "./file";
import { removeScene } from "./scene";
import {
  storeSetItem,
  getStore,
  getFile,
  storeScene,
  dropDeletedFiles,
} from "./store";
import { FILE_DOC_PREFIX } from "@/const";
import type { DB_KEY, Store } from "@/types";
import { encoder } from "@/utils/utils";
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
      for (const fileKey in files) {
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
      libraries.map((lib) => lib._id.split("/")[1]),
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

  ttdDialogPersistenceAdapter = {
    async loadChats() {
      const chats = utools.dbStorage.getItem("tchat_chats");
      console.log(chats);
      return chats || [];
    },
    async saveChats(chats: SavedChats) {
      utools.dbStorage.setItem("tchat_chats", chats);
    },
  };
}
