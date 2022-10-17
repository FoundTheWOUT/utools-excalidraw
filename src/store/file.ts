import { ImportedDataState } from "@excalidraw/excalidraw/types/data/types";
import { dropWhile } from "lodash";
import { Scene } from "@/types";
import { log } from "@/utils/utils";

export const storeFile = (
  key: string,
  data: Uint8Array,
  type?: string | undefined
) => {
  if (!type) type = "text/plain";
  if (data.length / 1024 / 1024 > 10) {
    // TODO: too large, notice user would not be save
    return;
  }
  log("store file to db.");
  try {
    window.utools && window.utools.db.postAttachment(`file/${key}`, data, type);
  } catch (err) {
    console.error(err);
  }
};

export const getFile = (key: string): Uint16Array | undefined => {
  log("get file from db.");
  return window.utools && window.utools.db.getAttachment(`file/${key}`);
};

export const removeFile = (key: string | null) => {
  if (!key) return;
  log("remove file from db.");
  return window.utools && window.utools.db.remove(`file/${key}`);
};

export const dropDeletedFiles = (scenes: Scene[]) => {
  if (!window.utools) return;
  const files = window.utools.db.allDocs("file");
  const noneDeletedFileId = new Set();
  scenes.map((scene) => {
    if (scene.data) {
      const data = JSON.parse(scene.data) as ImportedDataState;
      data.elements?.forEach((e) => {
        if (e.type == "image") {
          noneDeletedFileId.add(e.fileId);
        }
      });
    }
  });
  const needDeleteFile = dropWhile(files, (doc: any) => {
    const _path = doc._id.split("/");
    if (_path.length > 1) {
      return noneDeletedFileId.has(_path[1]);
    }
    return false;
  });
  needDeleteFile.map((file) => {
    window.utools && window.utools.db.remove(file._id);
  });
};
