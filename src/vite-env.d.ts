/// <reference types="vite/client" />
import * as fs from "fs";
import { Payload } from "./types";
import { ENTER_ACTION } from "./const";

declare global {
  interface Window {
    writeFile: (
      path: string,
      data: string | ArrayBuffer,
      opts?: {
        encoding?: BufferEncoding;
        isArrayBuffer?: boolean;
      },
    ) => Promise<unknown>;

    readFileSync: typeof fs.readFileSync;
    EXCALIDRAW_ASSET_PATH: string;
  }

  const __PLUGIN_ID__: string;
}
export {};
