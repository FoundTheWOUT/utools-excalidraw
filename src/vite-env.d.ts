/// <reference types="vite/client" />
import * as fs from "fs";

declare global {
  interface Window {
    utools: any;
    writeFile: (
      path: string,
      data: string | ArrayBuffer,
      opts?: {
        encoding?: BufferEncoding;
        isArrayBuffer?: boolean;
      }
    ) => Promise<>;
  }

  const __PLUGIN_ID__: string;
}
export {};
