import { DB_KEY, Scene } from "@/types";
import { initStore } from "@/store/store";
import { six_nanoid } from "@/utils/utils";

export const newAScene = ({ name }: { name: string }): Scene => {
  return { id: six_nanoid(), name, sticky: false };
};

export const storeScene = (key: string | undefined | null, data: Scene) => {
  if (!key) {
    console.warn("key is undefined or null");
    return;
  }
  // console.log(`store key :${key}`);
  // console.log(`store value:`);
  // console.log(data);
  try {
    window.utools && window.utools.dbStorage.setItem(`scene/${key}`, data);
  } catch (error) {
    console.error(error);
  }
};

// 获取 Scene 数组
export const getScenes = (): Scene[] => {
  if (!window.utools) return initStore[DB_KEY.SCENES];
  const scenes_from_db = window.utools.db.allDocs("scene/");
  return Array.isArray(scenes_from_db) && scenes_from_db.length > 0
    ? scenes_from_db.map((scene: any) => scene.value)
    : initStore[DB_KEY.SCENES];
};

export const removeScene = (key: string | null) => {
  if (!key) return;
  return window.utools && window.utools.dbStorage.removeItem(`scene/${key}`);
};
