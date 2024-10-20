import { newAScene, six_nanoid } from "./utils/utils";
import { DB_KEY, Payload, Store } from "./types";
import { ENTER_ACTION, SKIP_ENTER_ACTION } from "./const";

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

const enterAction = new Promise((resolve) => {
  if (SKIP_ENTER_ACTION) {
    resolve(null);
    return;
  }
  if (!window.utools) {
    resolve(null);
  } else {
    utools.onPluginEnter((action) => {
      resolve(action);
    });
  }
});

const resolveEnterAction = async <T extends KeyWord>(
  key: T,
): Promise<EnterAction<T> | null> => {
  const action = (await enterAction) as EnterAction<T> | null;
  return action?.code == key ? action : null;
};

// TODO: add test for this function
export async function handleFileLoadAction(store: Store) {
  const action = await resolveEnterAction(ENTER_ACTION.LOAD_FILE);
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

  for (const scene of scenes) {
    store[DB_KEY.SCENES].set(scene.id, scene);
  }
  store[DB_KEY.SETTINGS].scenesId.push(...scenes.map((s) => s.id));
  store[DB_KEY.SETTINGS].lastActiveDraw = firstSceneId;
}

export async function handleSearchSceneAction(store: Store) {
  const action = await resolveEnterAction(ENTER_ACTION.FOCUS_SCENE);
  if (!action) {
    return;
  }
  const { sceneId } = action.option;
  const scene = store[DB_KEY.SCENES].get(sceneId);
  if (scene?.id) {
    store[DB_KEY.SETTINGS].lastActiveDraw = scene.id;
  }
}
