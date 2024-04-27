import { Fragment, useContext, useEffect, useState } from "react";
import cn from "clsx";
import { AppContext } from "@/App";
import { generatePreviewImage } from "@/utils/utils";
import SS from "@/store";
import { XIcon } from "@heroicons/react/solid";
import { ArrowsExpandIcon } from "@heroicons/react/outline";
import { SideBarContext } from "./SideBar";
import { Scene } from "@/types";
import { Popover, Transition } from "@headlessui/react";
import { useFloating, offset } from "@floating-ui/react-dom";
import { updateScene } from "@/event";

interface Props {
  scene: Scene;
  idx: number;
  dragProvided?: any;
}

const SceneItem = ({ scene, idx, dragProvided }: Props) => {
  const appContext = useContext(AppContext);
  const { scenes, delScene } = useContext(SideBarContext) ?? {};
  const {
    appSettings,
    updatingScene,
    excalidrawRef,
    handleSetActiveDraw,
    setSceneName,
  } = appContext ?? {};
  const appState = excalidrawRef?.current?.getAppState();

  const [bgColor, setBgColor] = useState("");
  const [previewImg, setPreviewImg] = useState("");

  const generateCurrentPreviewImage = () => {
    if (previewImg) {
      URL.revokeObjectURL(previewImg);
    }
    // re gen preview image
    if (excalidrawRef?.current) {
      generatePreviewImage(
        excalidrawRef.current.getSceneElementsIncludingDeleted(),
        excalidrawRef.current.getAppState(),
        excalidrawRef.current.getFiles(),
      ).then((path) => {
        setPreviewImg(path ?? "");
      });
    }
  };

  const { id, name } = scene;

  useEffect(() => {
    const unsubscribe = updateScene.subscribe(({ target, value }) => {
      if (target === id) {
        console.log("update");
        const appState = excalidrawRef?.current?.getAppState();
        generateCurrentPreviewImage();
        SS.storeScene(id, { ...scene, ...value });
        appState?.viewBackgroundColor &&
          setBgColor(appState?.viewBackgroundColor);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleDeleteScene = (permanent = false) => {
    delScene?.({
      id,
      permanent,
    });
  };

  const handleActiveAction = () => {
    handleSetActiveDraw?.(id, { scene }, () => {
      generateCurrentPreviewImage();
    });
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

  return (
    <div key={id} id={id} className="p-3">
      {!appSettings?.closePreview && (
        <button
          className={cn(
            "aspect-video w-full cursor-pointer select-none overflow-hidden rounded border bg-white",
            updatingScene ? "cursor-wait" : "hover-shadow",
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
          disabled={updatingScene}
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
            value={name}
            onChange={(e) => {
              // setScenes?.((old) => {
              //   const newScenes = [...old];
              //   newScenes[idx].name = e.target.value;
              //   return newScenes;
              // });
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
