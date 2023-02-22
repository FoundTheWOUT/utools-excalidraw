import React, { useContext, useState } from "react";
import cn from "classnames";
import { AppContext } from "@/App";
import { generatePreviewImage } from "@/utils/utils";
import { removeScene, storeScene } from "@/store/scene";
import { TrashIcon, MenuIcon } from "@heroicons/react/solid";
import Tippy from "@tippyjs/react";
import "tippy.js/animations/scale-subtle.css";

interface Props {
  id: string;
  img: string | undefined;
  name: string;
  data: string | undefined;
  idx: number;
  dragProvided?: any;
}

const SceneItem = ({ id, img, name, data, idx, dragProvided }: Props) => {
  const appContext = useContext(AppContext);
  const [tippyActive, setTippyActive] = useState(false);
  const {
    appSettings,
    setAndStoreAppSettings,
    scenes,
    setScenes,
    updatingScene,
    excalidrawRef,
    handleSetActiveDraw,
  } = appContext ?? {};

  return (
    <div key={id} className="border-b border-gray-300 p-3">
      {!appSettings?.closePreview && (
        <button
          className={cn(
            "w-full aspect-video bg-white border rounded overflow-hidden cursor-pointer select-none",
            updatingScene ? "cursor-wait" : "hover-shadow",
            {
              "ring ring-offset-2 ring-[#6965db]":
                appSettings?.lastActiveDraw === id,
            }
          )}
          disabled={updatingScene}
          onClick={() => {
            handleSetActiveDraw?.(id, data, () => {
              // re gen preview image
              if (excalidrawRef?.current) {
                generatePreviewImage(
                  excalidrawRef.current.getSceneElementsIncludingDeleted(),
                  excalidrawRef.current.getAppState(),
                  excalidrawRef.current.getFiles()
                ).then((path) => {
                  const newScenes = scenes?.map((scene, index) => {
                    if (index != idx) return scene;
                    scene.img && URL.revokeObjectURL(scene.img);
                    return {
                      ...scene,
                      img: appSettings?.closePreview ? undefined : path,
                    };
                  });
                  newScenes && setScenes?.(newScenes);
                });
              }
            });
          }}
        >
          {img ? (
            <img
              className="object-contain w-full h-full"
              src={img}
              alt={name}
            />
          ) : (
            <div>点击查看预览</div>
          )}
        </button>
      )}
      <div
        className={cn("mt-2 flex gap-2", {
          hidden: appSettings?.asideWidth && appSettings.asideWidth <= 150,
        })}
      >
        <input
          type="text"
          className="flex-1 h-9 px-3 focus:ring ring-[#6965db] outline-none bg-gray-200 rounded-lg truncate"
          value={name}
          onChange={(e) => {
            setScenes?.((old) => {
              const newScenes = [...old];
              newScenes[idx].name = e.target.value;
              return newScenes;
            });
          }}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              scenes?.[idx] && storeScene(id, scenes[idx]);
            }
          }}
          onBlur={() => {
            scenes?.[idx] && storeScene(id, scenes?.[idx]);
          }}
        />

        <Tippy
          visible={tippyActive}
          interactive
          animation="scale-subtle"
          duration={125}
          onClickOutside={() => setTippyActive(false)}
          content={
            <div className="flex flex-col justify-center bg-gray-200 p-3 rounded">
              <div className="pb-2">确定删除该画布吗</div>
              <div className="flex justify-around text-sm">
                <button
                  className="px-3 py-1 bg-gray-300 rounded hover-shadow"
                  onClick={() => {
                    setTippyActive(false);
                  }}
                >
                  取消
                </button>
                <button
                  className="px-3 py-1 bg-red-500 hover-shadow text-white rounded"
                  onClick={() => {
                    setScenes?.((scenes) => {
                      const newScenes = [...scenes];
                      newScenes.splice(idx, 1);
                      removeScene(id);
                      // 只有当当前选中画布为删除画布时，才需要重新修改当前激活画布
                      if (appSettings?.lastActiveDraw === id) {
                        //if delete the last scenes, reselect it fore scene
                        let updateScenesIndex =
                          idx == newScenes.length ? idx - 1 : idx;
                        handleSetActiveDraw?.(
                          newScenes[updateScenesIndex].id,
                          newScenes[updateScenesIndex].data
                        );
                      }
                      return newScenes;
                    });
                  }}
                >
                  确定
                </button>
              </div>
            </div>
          }
        >
          <button
            className={cn(
              "bg-gray-200 p-2 rounded-lg flex",
              scenes?.length === 1
                ? "cursor-not-allowed text-red-300"
                : "text-red-500 hover-shadow"
            )}
            onClick={() => setTippyActive(true)}
            title="删除"
            disabled={scenes?.length === 1}
          >
            <TrashIcon className="w-5" />
          </button>
        </Tippy>

        <button
          className="bg-gray-200 p-2 rounded-lg hover-shadow flex"
          title="移动"
          {...dragProvided.dragHandleProps}
        >
          <MenuIcon className="w-5" />
        </button>
      </div>
    </div>
  );
};

export default SceneItem;
