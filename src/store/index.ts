import { DB_KEY, Scene, Store } from "@/types";
import { newAScene } from "@/utils/utils";
import {
  ExcalidrawImperativeAPI,
  LibraryItems,
} from "@excalidraw/excalidraw/types/types";
import { StoreSystemCommon } from "./common";
import { StoreSystemUtools } from "./utools";
import { restoreScenesArray } from "./utools/scene";

export interface StoreSystem {
  getStore(): Promise<Store>;

  getFile(key: string): Promise<Uint8Array | null>;

  storeScene(key: string, data: Scene): void;

  storeSetItem<T extends DB_KEY>(key: string, value: Store[T]): void;

  storeFile(excalidrawRef?: ExcalidrawImperativeAPI | null): void;

  removeScene(key: string): void;

  handleLibraryChange(item: LibraryItems): void;

  dropDeletedFiles(scenes: Scene[]): void;
}

const DefaultStore = (): Store => {
  const blank = newAScene({ name: "画布一" });
  return {
    settings: {
      asideWidth: 300,
      asideClosed: false,
      lastActiveDraw: blank.id,
      closePreview: false,
      scenesId: [blank.id],
      asideCloseAutomatically: false,
      deleteSceneDirectly: false
    },
    scenes: [blank],
    scenes_map: new Map(),
  };
};

export const initStore = (store?: Partial<Store>): Store => {
  const defaultStore = DefaultStore();
  const mergeStore = store
    ? {
        ...defaultStore,
        ...store,
        scenes: store.scenes?.length ? store.scenes : defaultStore.scenes,
        settings: {
          ...defaultStore.settings,
          ...store?.[DB_KEY.SETTINGS],
        },
      }
    : defaultStore;
  const { scenes, scenesMap, idArray } = restoreScenesArray(
    mergeStore.scenes,
    mergeStore[DB_KEY.SETTINGS].scenesId
  );

  // 自动修复 lastActiveDraw
  // if can't find lastActiveDraw(id) in scenes, set the first scene id as lastActiveDraw.
  let lastActiveDraw = mergeStore[DB_KEY.SETTINGS].lastActiveDraw;
  if (
    lastActiveDraw &&
    !scenes.map((scene) => scene.id).includes(lastActiveDraw)
  ) {
    lastActiveDraw = scenes[0].id;
  }

  return {
    settings: {
      ...mergeStore[DB_KEY.SETTINGS],
      lastActiveDraw,
      scenesId: idArray,
    },
    scenes,
    scenes_map: scenesMap,
  };
};

export default window.utools
  ? new StoreSystemUtools()
  : new StoreSystemCommon();
