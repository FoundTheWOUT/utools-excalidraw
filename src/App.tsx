import { useState, useRef } from "react";
import Excalidraw, {
  exportToBlob,
  getSceneVersion,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import { useThrottleFn } from "ahooks";
import cn from "classnames";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { DownloadIcon, PlusIcon, TrashIcon } from "@heroicons/react/solid";
import Tippy from "@tippyjs/react";
import { six_nanoid, blobToBase64 } from "./utils";
import { Scene, DB_KEY } from "./types";
import { getStore, storeSetItem } from "./store";

// TODO: replace import to module
// https://github.com/excalidraw/excalidraw/issues/5035
const ExcalidrawComp = (Excalidraw as any).default
  ? (Excalidraw as any).default
  : Excalidraw;

let sceneVersion = -1;

function App() {
  const store = getStore();
  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [removeActionTippyActive, setRemoveActionTippyActive] = useState(-1);
  const [exportActionTippyActive, setExportActionTippyActive] = useState(-1);
  const [appSettings, setAppSettings] = useState(store.settings);
  const [resizing, setResizing] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>(store.scenes);

  const { run: onSceneUpdate } = useThrottleFn(
    (elements, state, files, target) => {
      const serializedJSON = serializeAsJSON(elements, state, files, "local");
      exportToBlob({
        elements,
        files,
      })
        .then((blob) => blobToBase64(blob))
        .then((base64) => {
          if (base64) {
            setScenes((old) => {
              const newScenes = [...old];
              Object.assign(newScenes[target], {
                img: base64,
                data: serializedJSON,
              } as Scene);
              window.utools &&
                window?.utools.dbStorage.setItem(DB_KEY.SCENES, newScenes);
              return newScenes;
            });
          }
        });
    },
    { wait: 800 }
  );

  const handleSetActiveDraw = (idx: number, data?: string) => {
    if (excalidrawRef.current) {
      excalidrawRef.current.resetScene();
      setAppSettings((s) => {
        const newSettings = {
          ...s,
          lastActiveDraw: idx,
        };
        storeSetItem(DB_KEY.SETTINGS, newSettings);
        return newSettings;
      });
      data && excalidrawRef.current.updateScene(JSON.parse(data));
    }
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
        setAppSettings((s) => ({
          ...s,
          asideWidth: width,
        }));
      }}
    >
      <aside
        className="relative h-full bg-gray-100 z-10"
        style={{ width: appSettings.asideWidth }}
      >
        <div className="h-full overflow-y-auto">
          {/* card loop */}
          {scenes.map(({ id, img, name, data }, idx) => {
            return (
              <div key={id} className="border-b border-gray-300 p-3">
                <div
                  className={cn(
                    "w-full aspect-video bg-white border rounded overflow-hidden cursor-pointer hover-shadow",
                    {
                      "ring ring-offset-2": appSettings.lastActiveDraw === idx,
                    }
                  )}
                  onClick={() => handleSetActiveDraw(idx, data)}
                >
                  {img && (
                    <img
                      className="object-contain w-full h-full"
                      src={img}
                      alt={name}
                    />
                  )}
                </div>
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
                setAppSettings((s) => ({
                  ...s,
                  lastActiveDraw: scenes.length,
                }));
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
          initialData={
            scenes[appSettings.lastActiveDraw].data
              ? JSON.parse(scenes[appSettings.lastActiveDraw].data!)
              : null
          }
          onChange={(elements: any, state: any, files: any) => {
            const version = getSceneVersion(elements);
            if (sceneVersion != version) {
              sceneVersion = version;
              onSceneUpdate(elements, state, files, appSettings.lastActiveDraw);
            }
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
