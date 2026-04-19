import { StoreSystemCommon } from "./common";
import { StoreSystemUtools } from "./utools";
import { restoreScenesArray } from "./utools/scene";
import { newAScene } from "@/utils/utils";
import { DB_KEY, type Store, Theme } from "@/types";

const DefaultStore = (store?: Partial<Store>): Store => {
  const blank = newAScene({ name: "画布一" });
  return {
    settings: {
      asideWidth: 300,
      asideClosed: false,
      lastActiveDraw: blank.id,
      closePreview: false,
      scenesId: [blank.id],
      asideCloseAutomatically: false,
      deleteSceneDirectly: false,
      darkMode: false,
      theme: Theme.App,
      dev: false,
      selectedModel: "", // 空时使用 deepseek-v3
      ...store?.[DB_KEY.SETTINGS],
    },
    scenes: store?.[DB_KEY.SCENES] ?? new Map([[blank.id, blank]]),
  };
};

export const initStore = (store?: Partial<Store>): Store => {
  const _store = DefaultStore(store);
  const { idArray } = restoreScenesArray(
    _store.scenes,
    _store[DB_KEY.SETTINGS].scenesId,
  );

  // 自动修复 lastActiveDraw
  // if can't find lastActiveDraw(id) in scenes, set the first scene id as lastActiveDraw.
  let lastActiveDraw = _store[DB_KEY.SETTINGS].lastActiveDraw;
  if (lastActiveDraw && !idArray.includes(lastActiveDraw)) {
    lastActiveDraw = idArray[0];
  }

  return {
    settings: {
      ..._store[DB_KEY.SETTINGS],
      lastActiveDraw,
      scenesId: idArray,
    },
    scenes: _store[DB_KEY.SCENES],
  };
};

export default window.utools
  ? new StoreSystemUtools()
  : new StoreSystemCommon();
