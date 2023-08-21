import React, { useState, useRef, createContext, useEffect } from "react";
import { Excalidraw, MainMenu, serializeAsJSON } from "@excalidraw/excalidraw";
import {
  BinaryFileData,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types/types";
import { FolderIcon } from "@heroicons/react/outline";
import { generatePreviewImage, log, numIsInRange } from "./utils/utils";
import { Scene, DB_KEY, Store } from "./types";
import { loadInitialData, restoreFiles } from "./utils/data";
import { omit, debounce } from "lodash-es";
import ExportOps from "./components/ExportOps";
import useSWR from "swr";
import { ALLOW_HOSTS, REDIRECT_HOSTS, TEN_MB } from "./const";
import { EventChanel } from "./utils/event";
import SideBar from "./components/SideBar";
import dayjs from "dayjs";
import StoreSystem from "./store";

export const AppContext = createContext<{
  excalidrawRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
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

export const loadScene = new EventChanel();
export const updateScene = new EventChanel<{
  target: string;
  value: Partial<Scene>;
}>();

const dropExpiredScene = (id: string) => {
  StoreSystem.removeScene(id);
  return true;
};

function App({ store }: { store: Store }) {
  const {
    settings: { lastActiveDraw },
    scenes: initScenes,
    scenes_map,
  } = store;
  const { data: initialData, error } = useSWR("init sate", () =>
    loadInitialData(initScenes, lastActiveDraw!),
  );

  const deletedScene = initScenes.filter((scene) =>
    scene.deleted && scene.deletedAt
      ? dayjs.unix(scene.deletedAt).diff(dayjs(), "d") >= 30
        ? // grater than 30 days, remove it
          !dropExpiredScene(scene.id)
        : // should put it in trashcan
          true
      : // not a deleted scene
        false,
  );
  const [trashcan, setTrashcan] = useState(deletedScene);

  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [appSettings, setAppSettings] = useState(store[DB_KEY.SETTINGS]);
  const [name, setName] = useState(scenes_map.get(lastActiveDraw!)?.name ?? "");

  const debounceStoreItem = debounce((key: DB_KEY, value: Store[DB_KEY]) =>
    StoreSystem.storeSetItem(key, value),
  );

  const setAndStoreAppSettings = (
    settings: Partial<Store[DB_KEY.SETTINGS]>,
  ) => {
    const nextSettings = omit(
      {
        ...appSettings,
        ...settings,
      },
      ["value", "_id", "_rev"],
    ) as Store[DB_KEY.SETTINGS];
    setAppSettings(nextSettings);
    debounceStoreItem(DB_KEY.SETTINGS, nextSettings);
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
      StoreSystem.storeFile(excalidrawRef.current);
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
        const _data = await restoreFiles(JSON.parse(data));
        excalidrawRef.current.updateScene(_data);
        excalidrawRef.current.history.clear();
        if (_data.files) {
          const _files = Object.values(_data.files) as BinaryFileData[];
          _files.length > 0 && excalidrawRef.current.addFiles(_files);
        }
      } catch (error) {
        console.error(error);
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

  const aLinkHandler = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLLinkElement;
    if (!target) {
      return;
    }
    if (target.nodeName !== "A") {
      return;
    }
    if (ALLOW_HOSTS.includes(target.href)) {
      const targetHref = REDIRECT_HOSTS[target.href] ?? target.href;
      window.utools && window.utools.shellOpenExternal(targetHref);
      e.preventDefault();
      window.open(targetHref, "_blank", "noopener noreferrer");
    }
  };

  useEffect(() => {
    document.addEventListener("click", aLinkHandler);
    return () => {
      document.removeEventListener("click", aLinkHandler);
    };
  }, []);

  if (!initialData) {
    error && console.error(error);
    return <div>init data...</div>;
  }

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
        setTrashcan,
      }}
    >
      <div
        className="flex h-screen"
        onMouseUp={() => setResizing(false)}
        onMouseLeave={() => setResizing(false)}
        onMouseMove={handleScreenMouseMove}
      >
        <SideBar initScenes={initScenes} />

        {/* white board */}
        <main
          className="ml-2 flex-1"
          onClick={() => {
            closeAsideAutomatically();
          }}
        >
          <Excalidraw
            ref={excalidrawRef}
            initialData={initialData}
            onChange={(elements, state, files) => {
              onSceneUpdate(elements, state, files, appSettings.lastActiveDraw);
            }}
            onPaste={(data) => {
              if (data.files && Object.keys(data.files).length > 0) {
                for (const fileID in data.files) {
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
