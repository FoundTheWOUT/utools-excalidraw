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

export const extend = Object.assign;

export const encoder = new TextEncoder();
export const decoder = new TextDecoder();
