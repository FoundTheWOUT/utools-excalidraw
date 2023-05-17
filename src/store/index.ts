import { DB_KEY, Store } from "@/types";
import { newAScene } from "@/utils/utils";
import { ExcalidrawImperativeAPI, LibraryItems } from "@excalidraw/excalidraw/types/types";
import { StoreSystemCommon } from "./common";
import { StoreSystemUtools } from "./utools";

export interface StoreSystem {
  storeSetItem<T extends DB_KEY>(key: string, value: Store[T]): void;

  storeFile(excalidrawRef?: ExcalidrawImperativeAPI | null): void;

  removeScene(id: string): void;

  handleLibraryChange(item: LibraryItems): void;
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

export default window.utools ? new StoreSystemUtools() : new StoreSystemCommon();
