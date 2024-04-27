import React, { useState, createContext } from "react";
import {
  Excalidraw,
  MainMenu,
  THEME,
  restore,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types/types";
import { FolderIcon } from "@heroicons/react/outline";
import { generatePreviewImage, isDark, log, numIsInRange } from "./utils/utils";
import { Scene, DB_KEY, Store } from "./types";
import { restoreFiles } from "./utils/data";
import { debounce } from "lodash-es";
import ExportOps from "./components/ExportOps";
import { TEN_MB } from "./const";
import SideBar from "./components/SideBar";
import dayjs from "dayjs";
import StoreSystem from "./store";
import { loadScene, updateScene } from "./event";

export const AppContext = createContext<{
  excalidrawRef: { current: ExcalidrawImperativeAPI | null };
  updatingScene: boolean;
  sceneName: string;
  setSceneName: React.Dispatch<React.SetStateAction<string>>;
  appSettings: Store[DB_KEY.SETTINGS] & { [key: string]: unknown };
  setAndStoreAppSettings: (settings: Partial<Store[DB_KEY.SETTINGS]>) => void;
  handleSetActiveDraw: (
    id: string,
    payload?: {
      scene?: Scene;
      appSettings?: Partial<Store[DB_KEY.SETTINGS]>;
    },
    afterActive?: () => void,
  ) => Promise<void>;
  trashcan: Scene[];
  setTrashcan: React.Dispatch<React.SetStateAction<Scene[]>>;
  setResizing: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

const dropExpiredScene = (id: string) => {
  StoreSystem.removeScene(id);
  return true;
};

function App({
  initialData,
  store,
}: {
  initialData: ExcalidrawInitialDataState | null;
  store: Store;
}) {
  const {
    settings: { lastActiveDraw },
    scenes,
  } = store;

  // const deletedScene = scenes.filter((scene) =>
  //   scene.deleted && scene.deletedAt
  //     ? dayjs.unix(scene.deletedAt).diff(dayjs(), "d") >= 30
  //       ? // grater than 30 days, remove it
  //         !dropExpiredScene(scene.id)
  //       : // should put it in trashcan
  //         true
  //     : // not a deleted scene
  //       false,
  // );
  const [trashcan, setTrashcan] = useState([] as Scene[]);

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [appSettings, setAppSettings] = useState(store[DB_KEY.SETTINGS]);
  const [name, setName] = useState(scenes.get(lastActiveDraw!)?.name ?? "");

  const debounceStoreItem = debounce(StoreSystem.storeSetItem);

  const setAndStoreAppSettings = (
    settings: Partial<Store[DB_KEY.SETTINGS]>,
  ) => {
    const {
      value = undefined,
      _id = undefined,
      _rev = undefined,
      ...rest
    } = { ...appSettings, ...settings };
    setAppSettings(rest);
    debounceStoreItem(DB_KEY.SETTINGS, rest);
  };

  const [resizing, setResizing] = useState(false);
  const [updatingScene] = useState(false);

  const closeAsideAutomatically = () => {
    if (appSettings.asideCloseAutomatically) {
      setAndStoreAppSettings({
        asideClosed: true,
      });
    }
  };

  const onSceneUpdate = debounce(async (elements, state, files, target) => {
    // lock scene.
    // setUpdatingScene(true);

    try {
      let imagePath: string | undefined = undefined;
      if (!appSettings.closePreview) {
        imagePath = await generatePreviewImage(elements, state, files);
      }

      const data = JSON.parse(serializeAsJSON(elements, state, {}, "database"));
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
      StoreSystem.storeFile(excalidrawAPI);
    } catch (error) {
      console.warn(error);
    }

    // setUpdatingScene(false);
  }, 300);

  const handleSetActiveScene = async (
    sceneId: string,
    payload?: {
      scene?: Scene;
      appSettings?: Partial<Store[DB_KEY.SETTINGS]>;
    },
    afterActive?: () => void,
  ) => {
    if (!excalidrawAPI) return;
    payload = payload ?? {};

    const { data } = payload.scene ?? {};

    payload.scene?.name && setName(payload.scene?.name);
    setAndStoreAppSettings({
      ...(payload.appSettings ?? {}),
      lastActiveDraw: sceneId,
    });

    // restore scene
    if (!data) {
      return;
    }
    try {
      const _data = await restoreFiles(JSON.parse(data));
      const theme = isDark(appSettings.theme) ? THEME.DARK : THEME.LIGHT;
      excalidrawAPI.history.clear();
      excalidrawAPI.updateScene(
        restore(
          {
            appState: {
              ..._data.appState,
              theme,
            },
            elements: _data.elements,
            files: _data.files,
          },
          null,
          null,
        ),
      );
      const files = Object.values(_data.files);
      files.length && excalidrawAPI.addFiles(files);
    } catch (error) {
      console.error(error);
      excalidrawAPI.setToast({ message: "解析错误" });
    }

    afterActive && afterActive();
  };

  const handleScreenMouseMove = (e: React.MouseEvent) => {
    if (!resizing) return;
    let width = e.pageX;
    let closed = appSettings.asideClosed;

    // mouse position in (-∞,70)
    // 1. remember current width(90)
    // 2. close the panel
    if (width < 30) {
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

  return (
    <AppContext.Provider
      value={{
        excalidrawRef: { current: excalidrawAPI },
        appSettings,
        setAndStoreAppSettings,
        updatingScene,
        handleSetActiveDraw: handleSetActiveScene,
        setSceneName: setName,
        sceneName: name,
        trashcan,
        setResizing,
        setTrashcan,
      }}
    >
      {import.meta.env.DEV && (
        <div className="flex gap-4">
          <button
            onClick={() => {
              log(excalidrawAPI?.getAppState());
            }}
          >
            Get AppState
          </button>
          <button
            onClick={() => {
              log(excalidrawAPI?.getSceneElements());
            }}
          >
            Get Elements
          </button>
        </div>
      )}
      <div
        className="flex h-screen dark:bg-[#121212]"
        onMouseUp={() => setResizing(false)}
        onMouseLeave={() => setResizing(false)}
        onMouseMove={handleScreenMouseMove}
      >
        <SideBar scenesCollection={scenes} />

        {/* white board */}
        <main
          className="ml-2 flex-1"
          onClick={() => {
            closeAsideAutomatically();
          }}
        >
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            initialData={initialData}
            onChange={(elements, state, files) => {
              onSceneUpdate(elements, state, files, appSettings.lastActiveDraw);
            }}
            theme={isDark(appSettings.theme) ? THEME.DARK : THEME.LIGHT}
            onPaste={(data) => {
              if (data.files && Object.keys(data.files).length > 0) {
                for (const fileID in data.files) {
                  const blob = new Blob([data.files[fileID].dataURL]);
                  if (blob.size > TEN_MB) {
                    excalidrawAPI?.setToast({ message: "hi" });
                    console.log("图片不能大于10MB");
                    return false;
                  }
                }
              }
              return true;
            }}
            langCode="zh-CN"
            autoFocus
            name={name}
            UIOptions={{
              canvasActions: {
                export: {
                  saveFileToDisk: false,
                  renderCustomUI: () => <ExportOps />,
                },
                saveAsImage: false,
              },
            }}
            onLibraryChange={(items) => {
              log("library change.");
              StoreSystem.handleLibraryChange(items);
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
              <MainMenu.Separator />
            </MainMenu>
          </Excalidraw>
        </main>
      </div>
    </AppContext.Provider>
  );
}

export default App;
