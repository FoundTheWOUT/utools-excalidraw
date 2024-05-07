import { Fragment, useContext, useEffect, useState } from "react";
import cn from "clsx";
import { AppContext } from "@/App";
import {
  generatePreviewImage,
  generatePreviewImageFromSceneData,
} from "@/utils/utils";
import SS from "@/store";
import { XIcon } from "@heroicons/react/solid";
import { ArrowsExpandIcon } from "@heroicons/react/outline";
import { SideBarContext } from "./SideBar";
import { Scene } from "@/types";
import { Popover, Transition } from "@headlessui/react";
import { useFloating, offset } from "@floating-ui/react-dom";
import { endUpdateScene, startUpdateScene, updateScene } from "@/event";
import dayjs from "dayjs";
import { DraggableProvided } from "react-beautiful-dnd";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { AppState, BinaryFiles } from "@excalidraw/excalidraw/types/types";

interface Props {
  scene: Scene;
  idx: number;
  dragProvided: DraggableProvided;
}

const SceneItem = ({ scene, idx, dragProvided }: Props) => {
  const appContext = useContext(AppContext);
  const { scenes } = useContext(SideBarContext) ?? {};
  const {
    appSettings,
    scenes: sceneCollection,
    excalidrawRef,
    handleSetActiveDraw,
    setSceneName,
  } = appContext ?? {};
  const appState = excalidrawRef?.current?.getAppState();

  const [bgColor, setBgColor] = useState("");
  const [previewImg, setPreviewImg] = useState("");
  const [lock, setLock] = useState(false);

  useEffect(() => {
    const unsubscribe = startUpdateScene.subscribe(() => {
      setLock(true);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = endUpdateScene.subscribe(() => {
      setLock(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // generate preview image on mounted
    generatePreviewImageFromSceneData(scene.data).then((path) => {
      setPreviewImg(path ?? "");
    });
  }, []);

  const generateCurrentPreviewImage = (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => {
    if (previewImg) {
      URL.revokeObjectURL(previewImg);
    }
    // re gen preview image
    generatePreviewImage(elements, appState, files).then((path) => {
      setPreviewImg(path ?? "");
      appState?.viewBackgroundColor &&
        setBgColor(appState?.viewBackgroundColor);
    });
  };

  const { id, name } = scene;

  useEffect(() => {
    const unsubscribe = updateScene.subscribe(
      ({ target, elements, state, file }) => {
        if (target === id) {
          generateCurrentPreviewImage(elements, state, file);
        }
      },
    );
    return () => {
      unsubscribe();
    };
  }, []);

  const handleDeleteScene = (permanent = false) => {
    const scenesId = appSettings?.scenesId;
    if (!scenesId) {
      return;
    }
    const nextScenesId = scenesId.filter((sceneId) => sceneId !== id);
    const updateScenesIndex = idx == scenesId.length ? idx - 1 : idx;
    if (permanent) {
      sceneCollection?.delete(id);
      SS.removeScene(id);
    } else {
      const newScene = {
        ...scene,
        deleted: true,
        deletedAt: dayjs().unix(),
      };
      sceneCollection?.set(id, newScene);
      SS.storeScene(id, newScene);
    }
    handleSetActiveDraw?.(nextScenesId[updateScenesIndex], {
      scene: sceneCollection?.get(nextScenesId[updateScenesIndex]),
      appSettings: {
        scenesId: nextScenesId,
      },
    });
  };

  const handleActiveAction = () => {
    handleSetActiveDraw?.(id, { scene });
  };
  const { refs, floatingStyles } = useFloating({
    placement: "top",
    middleware: [offset(10)],
  });

  const deleteBtnClass = cn(
    "flex rounded-lg bg-gray-200 p-2 dark:bg-zinc-600",
    scenes?.length === 1
      ? "cursor-not-allowed text-red-300"
      : "hover-shadow text-red-500",
  );

  const handleSceneNameBlur = () => {
    setSceneName?.(name);
    const newScene = { ...scene, name };
    sceneCollection?.set(id, newScene);
    SS.storeScene(id, newScene);
  };

  return (
    <div key={id} id={id} className="p-3">
      {appSettings?.dev && id}
      {!appSettings?.closePreview && (
        <button
          className={cn(
            "aspect-video w-full cursor-pointer select-none overflow-hidden rounded border bg-white",
            lock ? "cursor-wait" : "hover-shadow",
            {
              "ring ring-[#6965db] ring-offset-2":
                appSettings?.lastActiveDraw === id,
            },
          )}
          style={{
            filter:
              appState?.theme === "dark"
                ? "invert(93%) hue-rotate(180deg)"
                : undefined,
            background: bgColor,
          }}
          disabled={lock}
          onClick={handleActiveAction}
        >
          {previewImg ? (
            <img
              className="h-full w-full object-contain"
              src={previewImg}
              alt={name}
            />
          ) : (
            <div>点击查看预览</div>
          )}
        </button>
      )}
      <div
        className={cn("mt-1.5 flex gap-2", {
          hidden: appSettings?.asideWidth && appSettings.asideWidth <= 150,
        })}
      >
        {appSettings?.closePreview ? (
          <button
            className="btn-preset flex-1 truncate bg-gray-200 px-3 text-left font-normal transition hover:text-black"
            title={name}
            onClick={handleActiveAction}
          >
            {name}
          </button>
        ) : (
          <input
            type="text"
            className="h-9 flex-1 truncate rounded-lg bg-gray-200 px-3 outline-none ring-[#6965db] ring-offset-2 focus:ring dark:bg-zinc-600 dark:text-white dark:ring-offset-zinc-800"
            defaultValue={name}
            onKeyDown={(e) => {
              if (e.key == "Enter") {
                scenes?.[idx] && SS.storeScene(id, scenes[idx]);
              }
            }}
            onBlur={handleSceneNameBlur}
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
                    className="w-36 rounded-lg bg-white p-4 shadow-lg"
                  >
                    <div className="mb-2">确定删除画布吗</div>
                    <div className="flex justify-around">
                      <button
                        className="btn-layout btn-danger text-sm"
                        onClick={() => handleDeleteScene(true)}
                      >
                        确定
                      </button>

                      <button
                        className="btn-layout btn-safe text-sm"
                        onClick={close}
                      >
                        取消
                      </button>
                    </div>
                  </Popover.Panel>
                </Transition>
                <Popover.Button
                  className={deleteBtnClass}
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
            className={deleteBtnClass}
            onClick={() => handleDeleteScene()}
            title="删除"
            disabled={scenes?.length === 1}
          >
            <XIcon className="w-5" />
          </button>
        )}

        <button
          className="hover-shadow flex rounded-lg bg-gray-200 p-2 dark:bg-zinc-600 dark:text-white"
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
