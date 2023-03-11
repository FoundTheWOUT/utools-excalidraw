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

/**
 * 从 utools 数据库中读取数据对应 id 的文件
 * 如果 db 中存在该文件，则返回该文件
 * 否则从自带的 files 中尝试读取文件
 *  如果成功读取，则把文件存入数据库
 *  否则什么也不做（文件丢失）
 * @param data Excalidraw 数据
 * @returns
 */
export const restoreFiles = (
  data: ImportedDataState
): ExcalidrawInitialDataState => {
  for (const el of data.elements ?? [])
    if (el.type == "image" && window.utools && el.fileId) {
      const unit8arr = getFile(el.fileId);
      if (!data.files) data.files = {};

      if (unit8arr && unit8arr instanceof Uint8Array) {
        const text = decoder.decode(unit8arr);
        // restore file to json
        data.files[el.fileId] = JSON.parse(text);
      }
    }
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
