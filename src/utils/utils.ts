import { Scene, Theme } from "@/types";
import { restoreFiles } from "./data";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

export function blobToBase64(
  blob: Blob | null,
): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve) => {
    if (!blob) return resolve(null);
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export const generatePreviewImage = async (
  elements: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
): Promise<string | undefined> => {
  try {
    const { exportToBlob } = await import("@excalidraw/excalidraw");
    const blob = await exportToBlob({
      elements: elements.filter((el) => !el.isDeleted),
      appState: {
        ...appState,
        exportBackground: true,
      },
      files,
      mimeType: "image/jpeg",
      quality: 0.51,
    });
    if (blob) {
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

export const generatePreviewImageFromSceneData = async (
  data: Scene["data"],
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

export const noop = () => {};
export const log = (function () {
  if (import.meta.env.MODE === "development") {
    return console.log.bind(
      window.console,
      "%c utools-exca ",
      "background-color:#6965db;color:white;padding: 2px 4px; border-radius: 4px;",
    );
  }
  return noop;
})();

export const reorder = <T>(
  list: T[],
  startIndex: number,
  endIndex: number,
): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export const isDark = (theme: Theme) => {
  const appDark = window.utools ? utools.isDarkColors() : null;

  return appDark !== null && theme === Theme.App
    ? appDark
    : theme === Theme.Dark;
};

export const setTheme = (theme: Theme) => {
  document.documentElement.classList[isDark(theme) ? "add" : "remove"]("dark");
};

export const omit = <T extends Record<string, unknown>>(
  obj: T,
  keys: (keyof T)[],
): Omit<T, keyof T> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};

export * from "./scene";
