/// <reference types="vite/client" />
import * as fs from "fs";
import { Payload } from "./types";
import { ENTER_ACTION } from "./const";

type EntryAction = typeof ENTER_ACTION;
type Values<T> = T[keyof T];
type KeyWord = Values<EntryAction>;
type EnterAction<T extends KeyWord> = T extends "load-excalidraw-file"
  ? {
      code: T;
      payload: Payload[];
    }
  : T extends "search-scenes"
  ? {
      code: T;
      option: {
        sceneId: string;
      };
    }
  : never;

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

    resolveEnterAction: <T extends KeyWord>(
      key: T,
    ) => Promise<EnterAction<T> | null>;
  }

  const __PLUGIN_ID__: string;
}
export {};
