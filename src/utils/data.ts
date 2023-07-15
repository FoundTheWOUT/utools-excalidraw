import { ImportedDataState } from "@excalidraw/excalidraw/types/data/types";
import {
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types/types";
import { keyBy } from "lodash";
import { merge } from "lodash/fp";
import { Scene } from "../types";
import SS from "../store";
import { decoder, log } from "./utils";
import { FONT_FAMILY, restoreLibraryItems } from "@excalidraw/excalidraw";
import {
  ExcalidrawImageElement,
  FileId,
} from "@excalidraw/excalidraw/types/element/types";

export const defaultStatue = {
  appState: {
    fileHandle: {},
    currentItemFontFamily: FONT_FAMILY.Helvetica,
  },
} as ExcalidrawInitialDataState;

export const loadInitialData = async (
  scenes: Scene[],
  target: string //scene id
): Promise<ExcalidrawInitialDataState | null> => {
  let data = keyBy(
    scenes.filter((scene) => !scene.deleted),
    "id"
  )[target]?.data;

  // if can't found data return default config
  if (typeof data !== "string") return defaultStatue;

  const parsedData = JSON.parse(data);
  restoreLibrary(parsedData);
  await restoreFiles(parsedData);
  const config = merge(defaultStatue)(parsedData);

  log("load config", config);
  return config;
};

/**
 * 从数据库中读取数据对应 id 的文件
 * 如果 db 中存在该文件，则返回该文件
 * 否则从自带的 files 中尝试读取文件
 *  如果成功读取，则把文件存入数据库
 *  否则什么也不做（文件丢失）
 * @param data Excalidraw 数据
 * @returns
 */
export const restoreFiles = async (
  data: ImportedDataState
): ExcalidrawInitialDataState => {
  data.files = (
    await Promise.all(
      (data.elements ?? [])
        .filter((el) => el.type === "image" && el.fileId)
        .map(async (el) => {
          const ele = el as ExcalidrawImageElement & { fileId: FileId };
          return {
            id: ele.fileId,
            file: await SS.getFile(ele.fileId),
          };
        })
    )
  )
    .filter((item) => item.file)
    .reduce<BinaryFiles>(
      (acc, item) => ({
        ...acc,
        [item.id]: JSON.parse(decoder.decode(item.file!)),
      }),
      {}
    );
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
