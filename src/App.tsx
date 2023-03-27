import React, { useState, useRef, createContext } from "react";
import { Excalidraw, MainMenu, serializeAsJSON } from "@excalidraw/excalidraw";
import { useDebounceFn } from "ahooks";
import {
  BinaryFileData,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types/types";
import { FolderIcon } from "@heroicons/react/outline";
import {
  encoder,
  generatePreviewImage,
  log,
  numIsInRange,
} from "./utils/utils";
import { Scene, DB_KEY, Store } from "./types";
import { storeFile, storeSetItem } from "./store/store";
import { loadInitialData, restoreFiles } from "./utils/data";
import { omit } from "lodash";
import ExportOps from "./components/ExportOps";
import useSWR from "swr";
import { FILE_DOC_PREFIX, TEN_MB } from "./const";
import { EventChanel } from "./utils/event";
import SideBar from "./components/SideBar";

export const AppContext = createContext<{
  excalidrawRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
  updatingScene: boolean;
  sceneName: string;
  setSceneName: React.Dispatch<React.SetStateAction<string>>;
  appSettings: Store[DB_KEY.SETTINGS];
  setAndStoreAppSettings: (settings: Partial<Store[DB_KEY.SETTINGS]>) => void;
  handleSetActiveDraw: (
    id: string,
    payload?: {
      scene?: Scene;
      appSettings?: Partial<Store[DB_KEY.SETTINGS]>;
    },
    afterActive?: () => void
  ) => void;
  trashcan: Scene[];
  setResizing: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

export const loadScene = new EventChanel();
export const updateScene = new EventChanel<{
  target: string;
  value: Partial<Scene>;
}>();

function App({ store }: { store: Store }) {
  const {
    settings: { lastActiveDraw },
    scenes: initScenes,
    scenes_map,
  } = store;

  const { data: initialData } = useSWR("init sate", () =>
    loadInitialData(initScenes, lastActiveDraw!)
  );

  const [trashcan, setTrashcan] = useState(
    initScenes.filter((scene) => scene.deleted)
  );

  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [appSettings, setAppSettings] = useState(store.settings);
  const [name, setName] = useState(scenes_map.get(lastActiveDraw!)?.name ?? "");

  const { run: debounceStoreItem } = useDebounceFn(
    (key: DB_KEY, value: Store[DB_KEY]) => storeSetItem(key, value)
  );

  const setAndStoreAppSettings = (
    settings: Partial<Store[DB_KEY.SETTINGS]>
  ) => {
    const newSettings = omit(
      {
        ...appSettings,
        ...settings,
      },
      ["value", "_id", "_rev"]
    ) as any;
    setAppSettings(newSettings);
    debounceStoreItem(DB_KEY.SETTINGS, newSettings);
  };

  const [resizing, setResizing] = useState(false);
  const [updatingScene, setUpdatingScene] = useState(false);

  const { run: onSceneUpdate } = useDebounceFn(
    async (elements, state, files, target) => {
      // lock scene.
      // setUpdatingScene(true);

      try {
        let imagePath: string | undefined = undefined;
        if (!appSettings.closePreview) {
          imagePath = await generatePreviewImage(elements, state, files);
        }

        let data = JSON.parse(serializeAsJSON(elements, state, {}, "database"));
        data.appState.zoom = state.zoom;
        data.appState.scrollX = state.scrollX;
        data.appState.scrollY = state.scrollY;
        const data_stringified = JSON.stringify(data);

        // emit update event
        updateScene.emit({
          target,
          value: {
            img: imagePath,
            data: data_stringified,
          },
        });

        // store file
        if (excalidrawRef.current && window.utools) {
          const storedFiles = utools.db
            .allDocs(FILE_DOC_PREFIX)
            .map((doc) => doc._id.split("/")[1]);
          const files = excalidrawRef.current.getFiles();
          for (let fileKey in files) {
            if (storedFiles.includes(fileKey)) continue;
            const fileObjectStr = JSON.stringify(files[fileKey]);
            storeFile(
              fileKey,
              encoder.encode(fileObjectStr),
              undefined,
              excalidrawRef.current
            );
          }
        }
      } catch (error) {
        console.warn(error);
      }

      // setUpdatingScene(false);
    },
    { wait: 300 }
  );

  const handleSetActiveScene = (
    sceneId: string,
    payload?: {
      scene?: Scene;
      appSettings?: Partial<Store[DB_KEY.SETTINGS]>;
    },
    afterActive?: () => void
  ) => {
    if (!excalidrawRef.current) return;
    payload = payload ?? {};

    const { data } = payload.scene ?? {};

    payload.scene?.name && setName(payload.scene?.name);
    setAndStoreAppSettings({
      ...(payload.appSettings ?? {}),
      lastActiveDraw: sceneId,
    });

    // restore scene
    if (data) {
      try {
        const _data = restoreFiles(JSON.parse(data));
        excalidrawRef.current.updateScene(_data);
        excalidrawRef.current.history.clear();
        if (_data.files) {
          const _files = Object.values(_data.files) as BinaryFileData[];
          _files.length > 0 && excalidrawRef.current.addFiles(_files);
        }
      } catch (error) {
        excalidrawRef.current.setToast({ message: "解析错误" });
      }
    }

    afterActive && afterActive();
  };

  const handleScreenMouseMove = (e: React.MouseEvent) => {
    if (!resizing) return;
    let width = e.pageX;
    let closed = appSettings.asideClosed;

    // mouse position in [0,70)
    // 1. remember current width(90)
    // 2. close the panel
    if (numIsInRange(width, 0, 30)) {
      width = 90;
      closed = true;
    } else {
      closed = false;
    }

    // mouse position in [70,90)
    // fix panel with to 90
    if (numIsInRange(width, 30, 90)) width = 90;

    //  panel width adjust by mouse position

    // mouse position is grater than 300 in x axis.
    // fix panel with to 300
    if (width > 300) width = 300;

    setAndStoreAppSettings({
      asideWidth: width,
      asideClosed: closed,
    });
  };

  const handleSceneLoad = () => {
    loadScene.emit();
  };

  if (!initialData) return null;

  return (
    <AppContext.Provider
      value={{
        excalidrawRef,
        appSettings,
        setAndStoreAppSettings,
        updatingScene,
        handleSetActiveDraw: handleSetActiveScene,
        setSceneName: setName,
        sceneName: name,
        trashcan,
        setResizing,
      }}
    >
      <div
        className="h-screen flex"
        onMouseUp={() => setResizing(false)}
        onMouseLeave={() => setResizing(false)}
        onMouseMove={handleScreenMouseMove}
      >
        <SideBar initScenes={initScenes}/>

        {/* white board */}
        <main className="flex-1 ml-2">
          <Excalidraw
            ref={excalidrawRef}
            initialData={initialData}
            onChange={(elements, state, files) => {
              onSceneUpdate(elements, state, files, appSettings.lastActiveDraw);
            }}
            onPaste={(data, event) => {
              if (data.files && Object.keys(data.files).length > 0) {
                for (let fileID in data.files) {
                  const blob = new Blob([data.files[fileID].dataURL]);
                  console.log(blob.size);
                  if (blob.size > TEN_MB) {
                    excalidrawRef.current &&
                      excalidrawRef.current.setToast({ message: "hi" });
                    console.log("图片不能大于10MB");
                    return false;
                  }
                }
              }
              // console.log("图片不能大于10MB");
              return true;
            }}
            langCode="zh-CN"
            autoFocus
            name={name}
            UIOptions={{
              canvasActions: {
                // export: false,
                export: {
                  saveFileToDisk: false,
                  renderCustomUI: () => <ExportOps />,
                },
                saveAsImage: false,
              },
            }}
            onLibraryChange={(items) => {
              log("library change.");
              if (!window.utools) return;
              const libraries = window.utools.db.allDocs("library");
              const stored_lib_ids_set = new Set(
                libraries.map((lib: any) => lib._id.split("/")[1])
              );
              items.forEach((item) => {
                const { id } = item;
                window.utools.dbStorage.setItem(`library/${id}`, item);
                stored_lib_ids_set.delete(id);
              });

              stored_lib_ids_set.forEach((id) => {
                window.utools.dbStorage.removeItem(`library/${id}`);
              });
            }}
          >
            <MainMenu>
              <MainMenu.Item onSelect={handleSceneLoad} icon={<FolderIcon />}>
                载入画布
              </MainMenu.Item>
              <MainMenu.DefaultItems.Export />
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.DefaultItems.ToggleTheme />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
          </Excalidraw>
        </main>
      </div>
    </AppContext.Provider>
  );
}

export default App;
