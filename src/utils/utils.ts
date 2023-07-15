import { Scene } from "@/types";
import { nanoid } from "nanoid";
import { restoreFiles } from "./data";

export const six_nanoid = () => nanoid(6);

export function blobToBase64(
  blob: Blob | null
): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, _) => {
    if (!blob) return resolve(null);
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export const generatePreviewImage = async (
  elements: any,
  appState: any,
  files: any
): Promise<string | undefined> => {
  try {
    const { exportToBlob } = await import("@excalidraw/excalidraw");
    const blob = await exportToBlob({
      elements,
      appState,
      files,
      mimeType: "image/jpeg",
      quality: 0.51,
    });
    if (blob) {
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.error(e);
    return Promise.resolve(undefined);
  }
};

export const generatePreviewImageFromSceneData = async (
  data: Scene["data"]
) => {
  if (!data) return undefined;
  const { elements, appState, files } = await restoreFiles(JSON.parse(data));
  return generatePreviewImage(elements, appState, files);
};

// [start, end) -> true
export const numIsInRange = (target: number, start: number, end: number) =>
  target >= start && target < end ? true : false;

export const extend = Object.assign;

export const encoder = new TextEncoder();
export const decoder = new TextDecoder();

export const newAScene = ({
  id,
  ...rest
}: Partial<Scene> & { name: string }): Scene => {
  return {
    id: id ? id : six_nanoid(),
    sticky: false,
    deleted: false,
    deletedAt: null,
    ...rest,
  };
};

const inner_log = function () {
  if (import.meta.env.MODE === "development") {
    return console.log.bind(
      window.console,
      "%c utools-exca ",
      "background-color:#6965db;color:white;padding: 2px 4px; border-radius: 4px;"
    );
  }
  return () => {};
};

export const log = inner_log() as (msg?: any, ...args: any[]) => void;

export const reorder = <T>(
  list: T[],
  startIndex: number,
  endIndex: number
): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};
