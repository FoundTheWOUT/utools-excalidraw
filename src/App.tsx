import { useState, useRef } from "react";
import {
  Excalidraw as ExcalidrawComp,
  exportToBlob,
  getSceneVersion,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import { useDebounceFn } from "ahooks";
import cn from "classnames";
import {
  BinaryFileData,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types/types";
import { DownloadIcon, PlusIcon, TrashIcon } from "@heroicons/react/solid";
import Tippy from "@tippyjs/react";
import { decoder, encoder, six_nanoid } from "./utils";
import { Scene, DB_KEY, Store } from "./types";
import {
  dropDeletedFiles,
  getFile,
  getStore,
  storeFile,
  storeSetItem,
} from "./store";
import { ClipboardData } from "@excalidraw/excalidraw/types/clipboard";
import { ImportedDataState } from "@excalidraw/excalidraw/types/data/types";

let sceneVersion = -1;

const generatePreviewImage = async (
  elements: any,
  appState: any,
  files: any
): Promise<string | undefined> => {
  const blob = await exportToBlob({
    elements,
    appState,
    files,
    mimeType: "image/jpeg",
    quality: 0.51,
  });
  if (blob) {
    return URL.createObjectURL(blob);
  }
};

// 恢复文件到运行时配置
const restoreFiles = (data: ImportedDataState): ExcalidrawInitialDataState => {
  data.elements?.forEach((el) => {
    if (el.type == "image" && window.utools && el.fileId) {
      const unit8arr = getFile(el.fileId);
      if (unit8arr && unit8arr instanceof Uint8Array) {
        const text = decoder.decode(unit8arr);
        // restore file to json
        data.files && (data.files[el.fileId] = JSON.parse(text));
      }
    }
  });
  return data;
};

const loadInitialData = (
  scenes: Scene[],
  target: number
): ExcalidrawInitialDataState | null => {
  let data = scenes[target]?.data;
  if (typeof data !== "string") return {};
  data && (data = restoreFiles(JSON.parse(data)));
  return data ? data : null;
};

function App() {
  const store = getStore();
  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [removeActionTippyActive, setRemoveActionTippyActive] = useState(-1);
  const [exportActionTippyActive, setExportActionTippyActive] = useState(-1);
  const [appSettings, setAppSettings] = useState(store.settings);
  const setAndStoreAppSettings = (
    settings: Partial<Store[DB_KEY.SETTINGS]>
  ) => {
    const newSettings = {
      ...appSettings,
      ...settings,
    };
    setAppSettings(newSettings);
    storeSetItem(DB_KEY.SETTINGS, newSettings);
  };

  const [resizing, setResizing] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>(store.scenes);
  const setAndStoreScenes = (scenes: Scene[]) => {
    setScenes(scenes);
    if (excalidrawRef.current) {
      const files = excalidrawRef.current.getFiles();
      for (let fileKey in files) {
        const fileObjectStr = JSON.stringify(files[fileKey]);
        storeFile(fileKey, encoder.encode(fileObjectStr));
      }
    }

    // window.utools && window.utools.
    storeSetItem(DB_KEY.SCENES, scenes);
  };

  const [updatingScene, setUpdatingScene] = useState(false);

  const { run: onSceneUpdate } = useDebounceFn(
    async (elements, state, files, target) => {
      // lock scene.
      setUpdatingScene(true);
      let imagePath: string | undefined = undefined;
      if (!appSettings.closePreview) {
        imagePath = await generatePreviewImage(elements, state, files);
      }
      setAndStoreScenes(
        scenes.map((scene, idx) => {
          if (idx != target) return scene;
          scene.img && URL.revokeObjectURL(scene.img);
          const data = serializeAsJSON(elements, state, {}, "database");
          return {
            ...scene,
            img: imagePath,
            data,
          };
        })
      );
      setUpdatingScene(false);
    },
    { wait: 300 }
  );

  const handleSetActiveDraw = (
    idx: number,
    data?: Scene["data"],
    afterActive?: () => void
  ) => {
    if (!excalidrawRef.current) return;

    setAppSettings((s) => {
      const newSettings = {
        ...s,
        lastActiveDraw: idx,
      };
      storeSetItem(DB_KEY.SETTINGS, newSettings);
      return newSettings;
    });

    // restore scene
    if (data) {
      const _data = restoreFiles(JSON.parse(data));
      excalidrawRef.current.updateScene(_data);
      excalidrawRef.current.history.clear();
      if (_data.files) {
        const _files = Object.values(_data.files) as BinaryFileData[];
        _files.length > 0 && excalidrawRef.current.addFiles(_files);
      }
    }

    afterActive && afterActive();
  };

  // 导出函数
  const exportToFile = (name: string) => {
    if (!excalidrawRef.current) return;
    const text = serializeAsJSON(
      excalidrawRef.current.getSceneElementsIncludingDeleted(),
      excalidrawRef.current.getAppState(),
      excalidrawRef.current.getFiles(),
      "local"
    );
    const savePath =
      window.utools &&
      window.utools.showSaveDialog({
        defaultPath: name,
        buttonLabel: "保存",
        filters: [{ name: "Excalidraw file", extensions: ["excalidraw"] }],
      });
    savePath && window.writeFile && window.writeFile(savePath, text);
  };

  const exportToPng = (name: string) => {
    if (!excalidrawRef.current) return;
    exportToBlob({
      elements: excalidrawRef.current.getSceneElementsIncludingDeleted(),
      appState: excalidrawRef.current.getAppState(),
      files: excalidrawRef.current.getFiles(),
    })
      .then((blob) => blob?.arrayBuffer())
      .then((arrayBuffer) => {
        if (!arrayBuffer) return;
        const savePath =
          window.utools &&
          window.utools.showSaveDialog({
            defaultPath: name,
            buttonLabel: "保存",
            filters: [{ name: "PNG", extensions: ["png"] }],
          });
        savePath &&
          window.writeFile &&
          window.writeFile(savePath, arrayBuffer, { isArrayBuffer: true });
      });
  };

  window.utools &&
    window.utools.onPluginOut(() => {
      setAndStoreScenes(
        scenes.map((scene) => {
          // drop image
          scene.img && URL.revokeObjectURL(scene.img);
          // drop deleted files
          return {
            ...scene,
            img: undefined,
          };
        })
      );
      dropDeletedFiles(scenes);
    });

  return (
    <div
      className="h-screen flex"
      onMouseUp={() => setResizing(false)}
      onMouseLeave={() => setResizing(false)}
      onMouseMove={(e) => {
        if (!resizing) return;
        let width = e.pageX;
        if (width < 90) width = 90;
        else if (width > 300) width = 300;
        setAndStoreAppSettings({
          asideWidth: width,
        });
      }}
    >
      <aside
        className="relative h-full bg-gray-100 z-10"
        style={{ width: appSettings.asideWidth }}
      >
        <div className="h-full overflow-y-auto">
          {appSettings.asideWidth > 150 && (
            <div className="p-3 pb-0 flex justify-end gap-2">
              <span>{appSettings.closePreview ? "打开预览" : "关闭预览"}</span>
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
          {/* card loop */}
          {scenes.map(({ id, img, name, data }, idx) => {
            return (
              <div key={id} className="border-b border-gray-300 p-3">
                <button
                  className={cn(
                    "w-full aspect-video bg-white border rounded overflow-hidden cursor-pointer",
                    updatingScene ? "cursor-wait" : "hover-shadow",
                    {
                      "ring ring-offset-2 ring-[#6965db]":
                        appSettings.lastActiveDraw === idx,
                    }
                  )}
                  disabled={updatingScene}
                  onClick={() =>
                    handleSetActiveDraw(idx, data, () => {
                      // re gen preview image
                      if (excalidrawRef.current) {
                        generatePreviewImage(
                          excalidrawRef.current.getSceneElementsIncludingDeleted(),
                          excalidrawRef.current.getAppState(),
                          excalidrawRef.current.getFiles()
                        ).then((path) => {
                          setAndStoreScenes(
                            scenes.map((scene, index) => {
                              if (index != idx) return scene;
                              scene.img && URL.revokeObjectURL(scene.img);
                              return {
                                ...scene,
                                img: appSettings.closePreview
                                  ? undefined
                                  : path,
                              };
                            })
                          );
                        });
                      }
                    })
                  }
                >
                  {appSettings.closePreview ? (
                    <div>预览已关闭</div>
                  ) : img ? (
                    <img
                      className="object-contain w-full h-full"
                      src={img}
                      alt={name}
                    />
                  ) : (
                    <div>点击查看预览</div>
                  )}
                </button>
                <div
                  className={cn("mt-2 flex gap-1", {
                    hidden: appSettings.asideWidth <= 150,
                  })}
                >
                  <input
                    type="text"
                    className="h-9 px-3 focus:ring-1 outline-none bg-gray-200 rounded-lg truncate"
                    value={name}
                    onChange={(e) => {
                      setScenes((old) => {
                        const newScenes = [...old];
                        newScenes[idx].name = e.target.value;
                        return newScenes;
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key == "Enter") {
                        storeSetItem(DB_KEY.SCENES, scenes);
                      }
                    }}
                    onBlur={() => {
                      storeSetItem(DB_KEY.SCENES, scenes);
                    }}
                  />
                  {/* export */}
                  <Tippy
                    visible={exportActionTippyActive === idx}
                    onClickOutside={() => setExportActionTippyActive(-1)}
                    interactive
                    duration={0}
                    content={
                      <div className="bg-gray-200 rounded p-3 flex flex-col gap-1 text-sm">
                        <div
                          className="bg-gray-300 cursor-pointer px-2 p-1 rounded hover-shadow"
                          onClick={() => exportToPng(name)}
                        >
                          保存图片
                        </div>
                        <div
                          className="bg-gray-300 cursor-pointer px-2 p-1 rounded hover-shadow"
                          onClick={() => exportToFile(name)}
                        >
                          导出文件
                        </div>
                      </div>
                    }
                  >
                    <button
                      className={cn(
                        "p-2 rounded-lg flex",
                        appSettings.lastActiveDraw === idx
                          ? "bg-gray-200 cursor-pointer hover-shadow"
                          : "bg-gray-200/50 cursor-not-allowed text-gray-300"
                      )}
                      disabled={appSettings.lastActiveDraw !== idx}
                      onClick={() => setExportActionTippyActive(idx)}
                    >
                      <DownloadIcon className="w-5" />
                    </button>
                  </Tippy>

                  <Tippy
                    visible={removeActionTippyActive === idx}
                    interactive
                    duration={0}
                    onClickOutside={() => setRemoveActionTippyActive(-1)}
                    content={
                      <div className="flex flex-col justify-center bg-gray-200 p-3 rounded">
                        <div className="pb-2">确定删除该画布吗</div>
                        <div className="flex justify-around text-sm">
                          <button
                            className="px-3 py-1 bg-gray-300 rounded hover-shadow"
                            onClick={() => {
                              setRemoveActionTippyActive(-1);
                            }}
                          >
                            取消
                          </button>
                          <button
                            className="px-3 py-1 bg-red-500 hover-shadow text-white rounded"
                            onClick={() => {
                              if (scenes.length > 1) {
                                setScenes((scenes) => {
                                  const newScenes = [...scenes];
                                  newScenes.splice(idx, 1);
                                  // delete the last scenes use the last scenes
                                  let updateScenesIndex =
                                    idx == newScenes.length ? idx - 1 : idx;
                                  storeSetItem(DB_KEY.SCENES, newScenes);
                                  handleSetActiveDraw(
                                    updateScenesIndex,
                                    newScenes[updateScenesIndex].data
                                  );
                                  return newScenes;
                                });
                              } else {
                                window.utools &&
                                  window.utools.showNotification(
                                    "禁止删除最后一页"
                                  );
                              }
                              setRemoveActionTippyActive(-1);
                            }}
                          >
                            确定
                          </button>
                        </div>
                      </div>
                    }
                  >
                    <div
                      className="bg-gray-200 cursor-pointer p-2 rounded-lg hover-shadow flex"
                      onClick={() => setRemoveActionTippyActive(idx)}
                    >
                      <TrashIcon className="w-5 text-red-500" />
                    </div>
                  </Tippy>
                </div>
              </div>
            );
          })}
          <div className="p-3">
            <div
              className="w-full aspect-video bg-white cursor-pointer rounded flex items-center justify-center hover-shadow"
              onClick={() => {
                const name = `画布${scenes.length}`;
                setScenes([...scenes, { id: six_nanoid(), name }]);
                excalidrawRef.current && excalidrawRef.current.resetScene();
                setAndStoreAppSettings({
                  lastActiveDraw: scenes.length,
                });
              }}
            >
              <PlusIcon className="h-10 text-gray-500" />
            </div>
          </div>
        </div>

        {/* controller */}
        <div
          className="absolute top-1/2 -right-2 h-8 w-1.5 bg-slate-500/60 rounded-full cursor-ew-resize"
          onMouseDown={() => setResizing(true)}
        ></div>
      </aside>

      {/* white board */}
      <main className="flex-1">
        <ExcalidrawComp
          ref={excalidrawRef}
          initialData={loadInitialData(scenes, appSettings.lastActiveDraw)}
          onChange={(elements: any, state: any, files: any) => {
            const version = getSceneVersion(elements);
            if (sceneVersion != version) {
              sceneVersion = version;
              onSceneUpdate(elements, state, files, appSettings.lastActiveDraw);
            }
          }}
          onPaste={(data: ClipboardData, event: any) => {
            if (data.files && Object.keys(data.files).length > 0) {
              for (let fileID in data.files) {
                const blob = new Blob([data.files[fileID].dataURL]);
                if (blob.size / 1024 / 1024 > 1) {
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
          name={scenes[appSettings.lastActiveDraw].name}
          UIOptions={{
            canvasActions: {
              export: false,
              saveAsImage: false,
            },
          }}
        />
      </main>
    </div>
  );
}

export default App;
