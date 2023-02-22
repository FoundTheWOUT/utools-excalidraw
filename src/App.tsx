import React, { useState, useRef, createContext } from "react";
import {
  Excalidraw,
  getSceneVersion,
  serializeAsJSON,
  MainMenu,
} from "@excalidraw/excalidraw";
import { useDebounceFn } from "ahooks";
import cn from "classnames";
import {
  BinaryFileData,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types/types";
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  PlusIcon,
} from "@heroicons/react/solid";
import {
  encoder,
  generatePreviewImage,
  log,
  numIsInRange,
  reorder,
  six_nanoid,
} from "./utils/utils";
import { Scene, DB_KEY, Store } from "./types";
import {
  dropDeletedFiles,
  storeFile,
  storeScene,
  storeSetItem,
} from "./store/store";
import { defaultStatue, loadInitialData, restoreFiles } from "./utils/data";
import { newAScene } from "@/utils/utils";
import { omit } from "lodash";
import { getSceneByID } from "./store/scene";
import SceneItem from "./components/SceneItem";
import ExportOps from "./components/ExportOps";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import useSWR from "swr";
import { FILE_DOC_PREFIX, TEN_MB } from "./const";

let sceneVersion = -1;

type Payload = Partial<{
  isFile: boolean;
  name: string;
  path: string;
}>;

export const AppContext = createContext<{
  excalidrawRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
  updatingScene: boolean;
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  appSettings: Store[DB_KEY.SETTINGS];
  setAndStoreAppSettings: (settings: Partial<Store[DB_KEY.SETTINGS]>) => void;
  handleSetActiveDraw: (
    id: string,
    data?: Scene["data"],
    afterActive?: () => void
  ) => void;
} | null>(null);

function App({ store }: { store: Store }) {
  // const { data: store } = useSWR("store", getStore);
  const {
    settings: { lastActiveDraw },
    scenes: initScenes,
    scenes_map,
  } = store;

  const { data: initialData } = useSWR("init sate", () =>
    loadInitialData(initScenes, lastActiveDraw!)
  );

  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [appSettings, setAppSettings] = useState(store.settings);

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
  const [scenes, setScenes] = useState<Scene[]>(initScenes);
  const [updatingScene, setUpdatingScene] = useState(false);

  const { run: onSceneUpdate } = useDebounceFn(
    async (elements, state, files, target) => {
      // lock scene.
      setUpdatingScene(true);
      try {
        let imagePath: string | undefined = undefined;
        if (!appSettings.closePreview) {
          imagePath = await generatePreviewImage(elements, state, files);
        }
        const scene = getSceneByID(scenes, target);
        if (!scene) return;
        const { id, img } = scene;
        img && URL.revokeObjectURL(img);
        let data = JSON.parse(serializeAsJSON(elements, state, {}, "database"));
        data.appState.zoom = state.zoom;
        data.appState.scrollX = state.scrollX;
        data.appState.scrollY = state.scrollY;
        const data_stringified = JSON.stringify(data);

        // 1. set state
        setScenes(
          scenes.map((scene) => {
            if (scene.id !== target) return scene;
            return {
              ...scene,
              img: imagePath,
              data: data_stringified,
            };
          })
        );

        // 2. update store
        // 2.1 store scene
        storeScene(id, { ...scene, data: data_stringified });

        // 2.2 store file
        if (excalidrawRef.current) {
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

      setUpdatingScene(false);
    },
    { wait: 300 }
  );

  const handleSetActiveDraw = (
    id: string,
    data?: Scene["data"],
    afterActive?: () => void
  ) => {
    if (!excalidrawRef.current) return;

    setAndStoreAppSettings({
      lastActiveDraw: id,
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

  window.utools &&
    utools.onPluginEnter(({ code, payload }) => {
      const pl = payload as Payload[];
      if (code === "load-excalidraw-file" && pl.length) {
        const firstAppendScenesId = six_nanoid();
        let data = "";
        const appendScenes = pl
          .map(({ isFile, path, name }, idx) => {
            if (isFile && path && name) {
              const [fileName] = name.split(".");
              const excalidrawFile = window.readFileSync(path, {
                encoding: "utf-8",
              });
              try {
                JSON.parse(excalidrawFile);
              } catch (error) {
                excalidrawRef.current?.setToast({
                  message: `${name} 解析错误`,
                });
                return undefined;
              }
              if (idx === 0) {
                data = excalidrawFile;
              }
              return newAScene({
                id: idx === 0 ? firstAppendScenesId : six_nanoid(),
                name: fileName,
                data: excalidrawFile,
              });
            }
            return undefined;
          })
          .filter((item) => {
            if (item === undefined) return false;
            if (scenes_map.has(item.id)) return false;
            return true;
          }) as Scene[];
        setScenes([...scenes, ...appendScenes]);
        appendScenes.length && handleSetActiveDraw(firstAppendScenesId, data);
      }
    });

  window.utools &&
    utools.onPluginOut(() => {
      scenes.forEach((scene) => {
        // drop image
        scene.img && URL.revokeObjectURL(scene.img);
        scene.img = undefined;
        storeScene(scene.id, scene);
      });
      // drop deleted files
      dropDeletedFiles(scenes);
    });

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

  const handleAsideControllerClick = () => {
    setAndStoreAppSettings({
      asideClosed: !appSettings.asideClosed,
    });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    if (result.destination.index === result.source.index) {
      return;
    }
    const reorderScenes = reorder(
      scenes,
      result.source.index,
      result.destination.index
    );
    setScenes(reorderScenes);
    setAndStoreAppSettings({
      scenesId: reorderScenes.map((scene) => scene.id),
    });
  };

  if (!initialData) return null;

  return (
    <AppContext.Provider
      value={{
        excalidrawRef,
        appSettings,
        setAndStoreAppSettings,
        updatingScene,
        scenes,
        setScenes,
        handleSetActiveDraw,
      }}
    >
      <div
        className="h-screen flex"
        onMouseUp={() => setResizing(false)}
        onMouseLeave={() => setResizing(false)}
        onMouseMove={handleScreenMouseMove}
      >
        <aside
          className="relative h-full bg-gray-100 z-10"
          style={{
            width: appSettings.asideClosed ? 0 : appSettings.asideWidth,
          }}
        >
          <div className="h-full overflow-y-auto">
            {appSettings.asideWidth > 150 && (
              <div className="p-3 pb-0 flex justify-end gap-2">
                <span className="select-none">预览</span>
                <div
                  className={cn(
                    "w-10 rounded-full flex items-center cursor-pointer relative",
                    appSettings.closePreview ? "bg-gray-300" : "bg-[#6965db]"
                  )}
                  onClick={() =>
                    setAndStoreAppSettings({
                      closePreview: !appSettings.closePreview,
                    })
                  }
                >
                  <div
                    className={cn(
                      "rounded-full h-5 w-5 transition-transform bg-white absolute",
                      appSettings.closePreview
                        ? "translate-x-[0.1rem]"
                        : "translate-x-[1.2rem]"
                    )}
                  ></div>
                </div>
              </div>
            )}
            {/* scene cards */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="list">
                {(provided) => (
                  <div ref={provided.innerRef}>
                    {scenes.map(({ id, img, name, data }, idx) => (
                      <Draggable key={id} draggableId={id} index={idx}>
                        {(dragProvided) => {
                          return (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                            >
                              <SceneItem
                                key={id}
                                id={id}
                                img={img}
                                name={name}
                                data={data}
                                idx={idx}
                                dragProvided={dragProvided}
                              />
                            </div>
                          );
                        }}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="p-3">
              <div
                className="w-full aspect-video bg-white cursor-pointer rounded flex items-center justify-center hover-shadow"
                onClick={() => {
                  const newScene = newAScene({ name: `画布${scenes.length}` });
                  setScenes([...scenes, newScene]);
                  excalidrawRef.current && excalidrawRef.current.resetScene();
                  setAndStoreAppSettings({
                    lastActiveDraw: newScene.id,
                    scenesId: appSettings.scenesId.concat(newScene.id),
                  });
                }}
              >
                <PlusIcon className="h-10 text-gray-500" />
              </div>
            </div>
          </div>
          {/* controller */}
          <button
            className={cn(
              "absolute bottom-12 -right-3 bg-white rounded-full shadow transition-transform",
              appSettings.asideClosed && "translate-x-4"
            )}
            onClick={handleAsideControllerClick}
          >
            {appSettings.asideClosed ? (
              <ChevronRightIcon className="h-6" />
            ) : (
              <ChevronLeftIcon className="h-6" />
            )}
          </button>

          <div
            className={cn(
              "absolute top-1/2 h-8 w-1.5 bg-slate-500/60 rounded-full cursor-ew-resize -right-2",
              appSettings.asideClosed && "hidden"
            )}
            onMouseDown={() => {
              setResizing(true);
            }}
          ></div>
        </aside>

        {/* white board */}
        <main className="flex-1 ml-2">
          <Excalidraw
            ref={excalidrawRef}
            initialData={initialData}
            onChange={(elements, state, files) => {
              const version = getSceneVersion(elements);
              if (sceneVersion != version) {
                sceneVersion = version;
                onSceneUpdate(
                  elements,
                  state,
                  files,
                  appSettings.lastActiveDraw
                );
              }
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
            name={getSceneByID(scenes, appSettings.lastActiveDraw)?.name}
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
          />
        </main>
      </div>
    </AppContext.Provider>
  );
}

export default App;
