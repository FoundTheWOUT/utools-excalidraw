import { ImportedDataState } from "@excalidraw/excalidraw/types/data/types";
import { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types/types";
import { keyBy, merge } from "lodash";
import { Scene } from "../types";
import { getFile } from "../store/store";
import { decoder, log } from "./utils";
import { FONT_FAMILY, restoreLibraryItems } from "@excalidraw/excalidraw";

export const defaultStatue = {
  appState: {
    fileHandle: {},
    currentItemFontFamily: FONT_FAMILY.Helvetica,
  },
} as ExcalidrawInitialDataState;

export const loadInitialData = (
  scenes: Scene[],
  target: string //scene id
): ExcalidrawInitialDataState | null => {
  let data = keyBy(scenes, "id")[target]?.data;

  // if can't found data return default config
  if (typeof data !== "string") return defaultStatue;

  const config = merge(
    defaultStatue,
    restoreFiles(restoreLibrary(JSON.parse(data)))
  );
  log("load config", config);
  return config;
};

// 恢复文件到运行时配置
export const restoreFiles = (
  data: ImportedDataState
): ExcalidrawInitialDataState => {
  data.elements?.forEach((el) => {
    if (el.type == "image" && window.utools && el.fileId) {
      const unit8arr = getFile(el.fileId);
      if (unit8arr && unit8arr instanceof Uint8Array) {
        const text = decoder.decode(unit8arr);
        // restore file to json
        if (!data.files) data.files = {};
        data.files[el.fileId] = JSON.parse(text);
      }
    }
  });
  return data;
};

// 恢复Libraries
const restoreLibrary = (
  data: ImportedDataState
): ExcalidrawInitialDataState => {
  if (!window.utools) return data;
  log("get library from db.");
  const libraries = window.utools.db.allDocs("library");

  if (libraries.length > 0) {
    data.libraryItems = restoreLibraryItems(
      libraries.map((lib: any) => lib.value),
      "unpublished"
    );
  }
  return data;
};
