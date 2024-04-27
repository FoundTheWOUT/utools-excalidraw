import { Scene } from "@/types";
import { keyBy } from "lodash-es";
import { log, newAScene } from "@/utils/utils";

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
export const getScenes = (): Map<string, Scene> | undefined => {
  log("get scene from db.");
  const scenes_from_db = window.utools.db.allDocs("scene/");
  return Array.isArray(scenes_from_db) && scenes_from_db.length > 0
    ? new Map(
        scenes_from_db.map((scene) => {
          const normalizeScene = newAScene(scene.value);
          return [normalizeScene.id, normalizeScene];
        }),
      )
    : undefined;
};

export const removeScene = (key: string | null) => {
  if (!key) return;
  return window.utools && window.utools.dbStorage.removeItem(`scene/${key}`);
};

/**
 * 根据 idArray 恢复场景，选择 idArray 中每个 id 对应的场景，如果该 id 没有场景则跳过。
 * @param scenes 场景数组
 * @param idArray 场景 id 数组
 * @returns
 */
export const restoreScenesArray = (
  scenes: Map<string, Scene>,
  idArray: string[],
): { idArray: string[] } => {
  // if no id array is empty, return the raw scenes arrays.
  if (idArray.length == 0) return { idArray: [] };

  // restore the sceneId which owning by the map, but not exist in id array.
  for (const key of scenes.keys()) {
    if (!idArray.includes(key)) {
      idArray.push(key);
    }
  }

  // remove the sceneId that point to null scene.
  idArray = [
    ...new Set(
      idArray
        .filter((id) => scenes.has(id))
        .filter((id) => !scenes.get(id)?.deleted),
    ),
  ];

  return {
    idArray,
  };
};
