import { DB_KEY, Scene, Store } from "@/types";
import { newAScene } from "@/utils/utils";
import {
  ExcalidrawImperativeAPI,
  LibraryItems,
} from "@excalidraw/excalidraw/types/types";
import { StoreSystemCommon } from "./common";
import { StoreSystemUtools } from "./utools";

export interface StoreSystem {
  getStore(): Promise<Store>;

  getFile(key: string): Uint8Array | null;

  storeScene(key: string | undefined | null, data: Scene): void;

  storeSetItem<T extends DB_KEY>(key: string, value: Store[T]): void;

  storeFile(excalidrawRef?: ExcalidrawImperativeAPI | null): void;

  removeScene(id: string): void;

  handleLibraryChange(item: LibraryItems): void;

  dropDeletedFiles(scenes: Scene[]): void;
}

export const initStore = (): Store => ({
  settings: {
    asideWidth: 300,
    asideClosed: false,
    lastActiveDraw: null,
    closePreview: false,
    scenesId: [],
  },
  scenes: [newAScene({ name: "画布一" })],
  scenes_map: new Map(),
});

export default window.utools
  ? new StoreSystemUtools()
  : new StoreSystemCommon();
