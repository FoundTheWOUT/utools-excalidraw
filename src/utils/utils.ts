import { exportToBlob } from "@excalidraw/excalidraw";
import { nanoid } from "nanoid";

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
};

export const extend = Object.assign;

export const encoder = new TextEncoder();
export const decoder = new TextDecoder();
