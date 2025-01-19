/* eslint-disable no-var */
/// <reference types="vite/client" />
import * as fs from "fs";

declare global {
  function writeFile(
    path: string,
    data: string | ArrayBuffer,
    opts?: {
      encoding?: BufferEncoding;
      isArrayBuffer?: boolean;
    },
  ): Promise<unknown>;

  var readFileSync: typeof fs.readFileSync;
  var EXCALIDRAW_ASSET_PATH: string;
  var __PLUGIN_ID__: string;
}
