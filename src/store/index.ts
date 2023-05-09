import { FILE_DOC_PREFIX } from "@/const";
import { DB_KEY, Store } from "@/types";
import { encoder } from "@/utils/utils";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { storeFile } from "./file";

interface StoreSystem {
  storeSetItem<T extends DB_KEY>(key: string, value: Store[T]): void;
  storeFile(excalidrawRef?: ExcalidrawImperativeAPI): void;
}

class StoreSystemUtools implements StoreSystem {
  storeSetItem<T extends DB_KEY>(key: string, value: Store[T]): void {}
  storeFile(excalidrawRef?: ExcalidrawImperativeAPI) {
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
          excalidrawRef
        );
      }
    }
  }
}

export default new StoreSystemUtools();
