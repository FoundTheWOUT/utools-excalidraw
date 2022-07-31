import { ImportedDataState } from "@excalidraw/excalidraw/types/data/types";
import { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types/types";
import { keyBy, merge } from "lodash";
import { Scene } from "../types";
import { getFile } from "../store/store";
import { decoder } from "./utils";

const defaultStatue = {
  appState: {
    fileHandle: {},
  },
} as ExcalidrawInitialDataState;

export const loadInitialData = (
  scenes: Scene[],
  target: string //scene id
): ExcalidrawInitialDataState | null => {
  let data = keyBy(scenes, "id")[target]?.data;
  if (typeof data !== "string") return {};
  data && (data = restoreFiles(JSON.parse(data)));
  return merge(defaultStatue, data);
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
