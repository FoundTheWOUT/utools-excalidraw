import { ImportedDataState } from "@excalidraw/excalidraw/types/data/types";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { Scene } from "@/types";
import { log } from "@/utils/utils";
import { FILE_DOC_PREFIX, TEN_MB } from "@/const";

export const storeFile = (
  key: string,
  data: Uint8Array,
  type?: string | undefined,
  excalidrawRef?: ExcalidrawImperativeAPI
) => {
  if (!type) type = "text/plain";
  if (data.byteLength > TEN_MB) {
    excalidrawRef &&
      excalidrawRef.setToast({ message: "插入图片大于10MB，退出后图片将丢失" });
    return;
  }
  log("store file to db.");
  try {
    window.utools && window.utools.db.postAttachment(`file/${key}`, data, type);
  } catch (err) {
    console.error(err);
  }
};

export const getFile = (key: string): Uint8Array | null => {
  log("get file from db.");
  return window.utools && window.utools.db.getAttachment(`file/${key}`);
};

export const removeFile = (key: string | null) => {
  if (!key) return;
  log("remove file from db.");
  return window.utools && window.utools.db.remove(`${FILE_DOC_PREFIX}/${key}`);
};

export const dropDeletedFiles = (scenes: Scene[]) => {
  if (!window.utools) return;

  // 1. get all file in db.
  const files = window.utools.db.allDocs(FILE_DOC_PREFIX);
  const noneDeletedFileId = new Set();

  // 2. find all file in all scenes, set file id to 'none deleted' Set.
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

  // 3. iter files, and remove it if it's not contain in the 'none deleted' Set.
  files.forEach((doc) => {
    const _path = doc._id.split("/");
    if (_path.length < 1 || !noneDeletedFileId.has(_path[1])) {
      window.utools && window.utools.db.remove(doc._id);
    }
  });
};
