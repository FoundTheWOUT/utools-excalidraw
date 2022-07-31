import React, { useContext } from "react";
import cn from "classnames";
import { AppContext } from "@/App";
import { generatePreviewImage } from "@/utils/utils";
import { removeScene, storeScene } from "@/store/scene";
import Tippy from "@tippyjs/react";
import { DownloadIcon, FlagIcon, TrashIcon } from "@heroicons/react/solid";
import { exportToBlob, serializeAsJSON } from "@excalidraw/excalidraw";
import { storeSetItem } from "@/store/store";
import { DB_KEY, Scene } from "@/types";
import { restoreFiles } from "@/utils/data";
import { BinaryFileData } from "@excalidraw/excalidraw/types/types";

interface Props {
  id: string;
  img: string | undefined;
  name: string;
  data: string | undefined;
  idx: number;
}

const SceneItem = ({ id, img, name, data, idx }: Props) => {
  const appContext = useContext(AppContext);
  console.log(appContext);
  if (!appContext) return null;
  const {
    appSettings,
    setAppSettings,
    scenes,
    setScenes,
    updatingScene,
    excalidrawRef,
    tippyAction: {
      exportTippyActive,
      setExportTippyActive,
      removeTippyActive,
      setRemoveTippyActive,
    },
  } = appContext;

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
        onClick={() => {
          handleSetActiveDraw(idx, data, () => {
            // re gen preview image
            if (excalidrawRef.current) {
              generatePreviewImage(
                excalidrawRef.current.getSceneElementsIncludingDeleted(),
                excalidrawRef.current.getAppState(),
                excalidrawRef.current.getFiles()
              ).then((path) => {
                setScenes(
                  scenes.map((scene, index) => {
                    if (index != idx) return scene;
                    scene.img && URL.revokeObjectURL(scene.img);
                    return {
                      ...scene,
                      img: appSettings.closePreview ? undefined : path,
                    };
                  })
                );
              });
            }
          });
        }}
      >
        {appSettings.closePreview ? (
          <div>预览已关闭</div>
        ) : img ? (
          <img className="object-contain w-full h-full" src={img} alt={name} />
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
          className="h-9 px-3 focus:ring ring-[#6965db] outline-none bg-gray-200 rounded-lg truncate"
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
              storeScene(id, scenes[idx]);
            }
          }}
          onBlur={() => {
            storeScene(id, scenes[idx]);
          }}
        />
        {/* export */}
        <Tippy
          visible={exportTippyActive === idx}
          onClickOutside={() => setExportTippyActive(-1)}
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
            onClick={() => setExportTippyActive(idx)}
            title="导出"
          >
            <DownloadIcon className="w-5" />
          </button>
        </Tippy>

        <Tippy
          visible={removeTippyActive === idx}
          interactive
          duration={0}
          onClickOutside={() => setRemoveTippyActive(-1)}
          content={
            <div className="flex flex-col justify-center bg-gray-200 p-3 rounded">
              <div className="pb-2">确定删除该画布吗</div>
              <div className="flex justify-around text-sm">
                <button
                  className="px-3 py-1 bg-gray-300 rounded hover-shadow"
                  onClick={() => {
                    setRemoveTippyActive(-1);
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
                        removeScene(id);
                        handleSetActiveDraw(
                          updateScenesIndex,
                          newScenes[updateScenesIndex].data
                        );
                        return newScenes;
                      });
                    } else {
                      window.utools &&
                        window.utools.showNotification("禁止删除最后一页");
                    }
                    setRemoveTippyActive(-1);
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
            onClick={() => setRemoveTippyActive(idx)}
            title="删除"
          >
            <TrashIcon className="w-5 text-red-500" />
          </div>
        </Tippy>
        {/* <div
          className="bg-gray-200 cursor-pointer p-2 rounded-lg hover-shadow flex"
          onClick={() => {
            setScenes(
              scenes.map((scene, scene_idx) => {
                if (scene_idx !== idx) return scene;
                return {
                  ...scene,
                  sticky: !scene.sticky,
                };
              })
            );
          }}
        >
          <FlagIcon className="w-5" />
        </div> */}
      </div>
    </div>
  );
};

export default SceneItem;
