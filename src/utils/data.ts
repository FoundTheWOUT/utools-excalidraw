import { ImportedDataState } from "@excalidraw/excalidraw/types/data/types";
import {
  BinaryFiles,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types/types";
import { keyBy, merge } from "lodash-es";
import { Scene } from "../types";
import SS from "../store";
import { decoder, log } from "./utils";
import { FONT_FAMILY, restoreLibraryItems } from "@excalidraw/excalidraw";
import {
  ExcalidrawImageElement,
  FileId,
} from "@excalidraw/excalidraw/types/element/types";
import { RestoredDataState } from "@excalidraw/excalidraw/types/data/restore";

export const defaultStatue = {
  appState: {
    fileHandle: {},
    currentItemFontFamily: FONT_FAMILY.Helvetica,
  },
} as ExcalidrawInitialDataState;

export const loadInitialData = async (
  scenes: Scene[],
  target: string, //scene id
): Promise<ExcalidrawInitialDataState | null> => {
  const data = keyBy(
    scenes.filter((scene) => !scene.deleted),
    "id",
  )[target]?.data;

  // if can't found data return default config
  if (typeof data !== "string") return defaultStatue;

  const parsedData = JSON.parse(data);
  restoreLibrary(parsedData);
  await restoreFiles(parsedData);
  const config = merge(defaultStatue, parsedData);

  log("load config", config);
  return config;
};

/**
 * 合并自身 files，以及数据库中 files
 * @param data Excalidraw 数据
 * @returns
 */
export const restoreFiles = async (
  data: ImportedDataState,
): Promise<RestoredDataState> => {
  data.files = {
    ...(data.files ? data.files : {}),
    ...(
      await Promise.all(
        (data.elements ?? [])
          .filter((el) => el.type === "image" && el.fileId)
          .map(async (el) => {
            const ele = el as ExcalidrawImageElement & { fileId: FileId };
            return {
              id: ele.fileId,
              file: await SS.getFile(ele.fileId),
            };
          }),
      )
    )
      .filter((item) => item.file)
      .reduce<BinaryFiles>(
        (acc, item) => ({
          ...acc,
          [item.id]: JSON.parse(decoder.decode(item.file!)),
        }),
        {},
      ),
  };
  return data as RestoredDataState;
};

// 恢复Libraries
const restoreLibrary = (
  data: ImportedDataState,
): ExcalidrawInitialDataState => {
  if (!window.utools) return data;
  log("get library from db.");
  const libraries = window.utools.db.allDocs("library");

  if (libraries.length > 0) {
    data.libraryItems = restoreLibraryItems(
      libraries.map((lib) => lib.value),
      "unpublished",
    );
  }
  return data;
};

export const collectAllFileId = (scenes: Scene[]) => {
  const existFileId = new Set();

  scenes.forEach((scene) => {
    if (scene.data) {
      const data = JSON.parse(scene.data) as ImportedDataState;
      data.elements?.forEach((e) => {
        if (e.type == "image") {
          existFileId.add(e.fileId);
        }
      });
    }
  });

  return existFileId;
};
