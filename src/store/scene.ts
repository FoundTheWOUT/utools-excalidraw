import { DB_KEY, Scene } from "@/types";
import { initStore } from "@/store/store";
import { has, keyBy } from "lodash";
import { log } from "@/utils/utils";

export const storeScene = (key: string | undefined | null, data: Scene) => {
  if (!key) {
    console.warn("key is undefined or null");
    return;
  }
  // console.log(`store key :${key}`);
  // console.log(`store value:`);
  // console.log(data);
  log("store scene to db.");
  try {
    window.utools && window.utools.dbStorage.setItem(`scene/${key}`, data);
  } catch (error) {
    console.error(error);
  }
};

export const getSceneByID = (scenes: Scene[], id: string | null) =>
  id ? keyBy(scenes, "id")[id] : null;

// 获取 Scene 数组
export const getScenes = (): Scene[] => {
  const _initStore = initStore();
  if (!window.utools) return _initStore[DB_KEY.SCENES];
  log("get scene from db.");
  const scenes_from_db = window.utools.db.allDocs("scene/");
  return Array.isArray(scenes_from_db) && scenes_from_db.length > 0
    ? scenes_from_db.map((scene: any) => scene.value)
    : _initStore[DB_KEY.SCENES];
};

export const removeScene = (key: string | null) => {
  if (!key) return;
  return window.utools && window.utools.dbStorage.removeItem(`scene/${key}`);
};

export const restoreScenesArray = (
  scenes: Scene[],
  idArray: string[]
): Scene[] => {
  // if no id array is empty, return the raw scenes arrays.
  if (idArray.length == 0) return scenes;

  // [scene,scene] -> {"id":scene,"id":scene}
  const scenesMap = keyBy(scenes, "id");

  // fix the scene which owning by the map, but not exist in id array.
  Object.keys(scenesMap).forEach((key) => {
    if (!idArray.includes(key)) {
      idArray.push(key);
    }
  });

  return idArray.filter((id) => has(scenesMap, id)).map((id) => scenesMap[id]);
};
