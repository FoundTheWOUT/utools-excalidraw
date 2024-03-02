import { newAScene, six_nanoid } from "./utils/utils";
import { DB_KEY, Store } from "./types";
import { ENTER_ACTION } from "./const";

// TODO: add test for this function
export async function handleFileLoadAction(store: Store) {
  const action = await window.resolveEnterAction(ENTER_ACTION.LOAD_FILE);
  if (!action) {
    return;
  }

  const firstSceneId = six_nanoid();
  const scenes = action.payload
    .filter((pl) => pl.isFile && pl.name && pl.path)
    .map(({ name, path }, idx) => {
      const [fileName] = name!.split(".");
      const excalidrawFile = window.readFileSync(path!, {
        encoding: "utf-8",
      });
      return newAScene({
        id: idx === 0 ? firstSceneId : six_nanoid(),
        name: fileName,
        data: excalidrawFile,
      });
    })
    .filter((scene) => {
      try {
        JSON.parse(scene.data!);
        return true;
      } catch {
        return false;
      }
    });

  store[DB_KEY.SCENES] = store[DB_KEY.SCENES].concat(scenes);
  store[DB_KEY.SETTINGS].lastActiveDraw = firstSceneId;
}

export async function handleSearchSceneAction(store: Store) {
  const action = await window.resolveEnterAction(ENTER_ACTION.FOCUS_SCENE);
  if (!action) {
    return;
  }
  const { sceneId } = action.option;
  const scene = store[DB_KEY.SCENES].find((scene) => scene.id === sceneId);
  if (scene?.id) {
    store[DB_KEY.SETTINGS].lastActiveDraw = scene.id;
  }
}
