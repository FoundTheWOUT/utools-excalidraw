import React, { Fragment, useContext, useEffect, useState } from "react";
import cn from "classnames";
import { AppContext, updateScene } from "@/App";
import { generatePreviewImage } from "@/utils/utils";
import SS from "@/store";
import { XIcon } from "@heroicons/react/solid";
import { ArrowsExpandIcon } from "@heroicons/react/outline";
import { SideBarContext } from "./SideBar";
import { Scene } from "@/types";
import dayjs from "dayjs";
import { uniqBy } from "lodash";
import { Popover, Transition } from "@headlessui/react";
import { useFloating, offset } from "@floating-ui/react-dom";

interface Props {
  scene: Scene;
  idx: number;
  dragProvided?: any;
}

const SceneItem = ({ scene, idx, dragProvided }: Props) => {
  const appContext = useContext(AppContext);
  const { scenes, setScenes } = useContext(SideBarContext) ?? {};
  const {
    appSettings,
    updatingScene,
    excalidrawRef,
    handleSetActiveDraw,
    setSceneName,
    setTrashcan,
    setAndStoreAppSettings,
  } = appContext ?? {};

  const [bgColor, setBgColor] = useState("");

  const { img, id, name } = scene;

  useEffect(() => {
    const unsubscribe = updateScene.subscribe(({ target, value }) => {
      if (target === id) {
        const appState = excalidrawRef?.current?.getAppState();
        img && URL.revokeObjectURL(img);
        SS.storeScene(id, { ...scene, ...value });
        appState?.viewBackgroundColor &&
          setBgColor(appState?.viewBackgroundColor);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const moveToTrashcan = () => {
    setTrashcan?.((scenes) => uniqBy([...scenes, scene], "id"));
    SS.storeScene(scene.id, {
      ...scene,
      deleted: true,
      deletedAt: dayjs().unix(),
    });
  };

  const handleDeleteScene = (permanent = false) => {
    if (permanent) {
      SS.removeScene(scene.id);
    } else {
      moveToTrashcan();
    }
    setScenes?.((scenes) => {
      const newScenes = scenes.filter((s) => s.id !== id);
      // 只有当当前选中画布为删除画布时，才需要重新修改当前激活画布
      if (appSettings?.lastActiveDraw === id) {
        //if delete the last scenes, reselect it fore scene
        let updateScenesIndex = idx == newScenes.length ? idx - 1 : idx;
        handleSetActiveDraw?.(newScenes[updateScenesIndex].id, {
          scene: newScenes[updateScenesIndex],
          appSettings: {
            scenesId: newScenes.map((scene) => scene.id),
          },
        });
      } else {
        // handleSetActiveDraw 会使用该方法
        // 而存 db 操作是经过debounce的，连续调用的话之前的存储操作可能会被丢弃
        // 因此需要保证一个操作只调用一次这个方法
        // 优化~
        setAndStoreAppSettings?.({
          scenesId: newScenes
            .filter((s) => !s.deleted)
            .map((scene) => scene.id),
        });
      }
      return newScenes;
    });
  };

  const handleActiveAction = () => {
    handleSetActiveDraw?.(id, { scene }, () => {
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
  };
  const { refs, floatingStyles } = useFloating({
    placement: "top",
    middleware: [offset(10)],
  });

  return (
    <div key={id} id={id} className="border-b border-gray-300 p-3">
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
          style={{
            background: bgColor,
          }}
          disabled={updatingScene}
          onClick={handleActiveAction}
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
        {appSettings?.closePreview ? (
          <button
            className="btn-preset bg-gray-200 hover:text-black font-normal text-left px-3 flex-1 truncate transition"
            title={name}
            onClick={handleActiveAction}
          >
            {name}
          </button>
        ) : (
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
                scenes?.[idx] && SS.storeScene(id, scenes[idx]);
              }
            }}
            onBlur={() => {
              setSceneName?.(name);
              scenes?.[idx] && SS.storeScene(id, scenes?.[idx]);
            }}
          />
        )}

        {appSettings?.deleteSceneDirectly ? (
          <Popover className="relative">
            {({ close }) => (
              <>
                <Transition
                  as={Fragment}
                  enter="transition-opacity ease-out duration-70"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition-opacity ease-in duration-150"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Popover.Panel
                    ref={refs.setFloating}
                    style={floatingStyles}
                    className="bg-white rounded-lg p-4 w-36 shadow-lg"
                  >
                    <div className="mb-2">确定删除画布吗</div>
                    <div className="flex justify-around">
                      <button
                        className="btn-layout text-sm btn-danger"
                        onClick={() => handleDeleteScene(true)}
                      >
                        确定
                      </button>

                      <button
                        className="btn-layout text-sm btn-safe"
                        onClick={close}
                      >
                        取消
                      </button>
                    </div>
                  </Popover.Panel>
                </Transition>
                <Popover.Button
                  className={cn(
                    "bg-gray-200 p-2 rounded-lg flex",
                    scenes?.length === 1
                      ? "cursor-not-allowed text-red-300"
                      : "text-red-500 hover-shadow"
                  )}
                  title="删除"
                  disabled={scenes?.length === 1}
                  ref={refs.setReference}
                >
                  <XIcon className="w-5" />
                </Popover.Button>
              </>
            )}
          </Popover>
        ) : (
          <button
            className={cn(
              "bg-gray-200 p-2 rounded-lg flex",
              scenes?.length === 1
                ? "cursor-not-allowed text-red-300"
                : "text-red-500 hover-shadow"
            )}
            onClick={() => handleDeleteScene()}
            title="删除"
            disabled={scenes?.length === 1}
          >
            <XIcon className="w-5" />
          </button>
        )}

        <button
          className="bg-gray-200 p-2 rounded-lg hover-shadow flex"
          title="移动"
          {...dragProvided.dragHandleProps}
        >
          <ArrowsExpandIcon className="w-5" />
        </button>
      </div>
    </div>
  );
};

export default SceneItem;
