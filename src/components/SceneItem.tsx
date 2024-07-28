import { useContext, useEffect, useState, forwardRef } from "react";
import cn from "clsx";
import { AppContext } from "@/App";
import {
  generatePreviewImage,
  generatePreviewImageFromSceneData,
  newAScene,
} from "@/utils/utils";
import SS from "@/store";
import { XIcon } from "@heroicons/react/solid";
import { ArrowsExpandIcon } from "@heroicons/react/outline";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { endUpdateScene, startUpdateScene, updateScene } from "@/event";
import dayjs from "dayjs";
import { DraggableProvided } from "react-beautiful-dnd";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { AppState, BinaryFiles } from "@excalidraw/excalidraw/types/types";

interface Props {
  id: string;
  idx: number;
  dragProvided: DraggableProvided;
}

const DeleteSceneButton = forwardRef<
  HTMLButtonElement,
  { onClick?: () => void }
>(function DeleteSceneButton(props, ref) {
  const appContext = useContext(AppContext);
  const { appSettings } = appContext ?? {};
  return (
    <button
      className={cn(
        "flex rounded-lg bg-gray-200 p-2 dark:bg-zinc-600",
        appSettings?.scenesId?.length === 1
          ? "cursor-not-allowed text-red-300"
          : "hover-shadow text-red-500",
      )}
      title="删除"
      disabled={appSettings?.scenesId?.length === 1}
      ref={ref}
      {...props}
    >
      <XIcon className="w-5" />
    </button>
  );
});

const SceneItem = ({ id, idx, dragProvided }: Props) => {
  const appContext = useContext(AppContext);
  const {
    appSettings,
    scenes,
    excalidrawAPI,
    handleSetActiveDraw,
    setSceneName,
  } = appContext ?? {};
  const appState = excalidrawAPI?.getAppState();
  const scene = scenes?.get(id);
  const name = scene?.name;

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
    generatePreviewImageFromSceneData(scene?.data).then((path) => {
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
    const updateScenesIndex = idx == scenesId.length - 1 ? idx - 1 : idx;
    if (permanent) {
      scenes?.delete(id);
      SS.removeScene(id);
    } else {
      const scene = scenes!.get(id)!;
      // TODO: we can implement delete method in scene class.
      const newScene = newAScene({
        ...scene,
        deleted: true,
        deletedAt: dayjs().unix(),
      });
      scenes?.set(id, newScene);
      SS.storeScene(id, newScene);
    }
    handleSetActiveDraw?.(nextScenesId[updateScenesIndex], {
      scene: scenes?.get(nextScenesId[updateScenesIndex]),
      appSettings: {
        scenesId: nextScenesId,
      },
    });
  };

  const handleActiveAction = () => {
    handleSetActiveDraw?.(id, { scene });
  };

  const handleSceneNameBlur: React.FocusEventHandler<HTMLInputElement> = (
    e,
  ) => {
    const newName = e.target.value;
    setSceneName?.(newName);
    const newScene = newAScene({ ...scene, name: newName });
    scenes?.set(id, newScene);
    SS.storeScene(id, newScene);
  };

  const getFromStore = () => {
    const scene = scenes?.get(id);
    console.log(scene);
  };

  return (
    <div key={id} id={id} className="p-3">
      {appSettings?.dev && (
        <>
          {id} <button onClick={getFromStore}>get from store</button>
        </>
      )}
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

      {/* name */}
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
            // flex-1 not work for input tag default, because it has default width, set min-w-0 to solve.
            className="h-9 min-w-0 flex-1 truncate rounded-lg bg-gray-200 px-3 outline-none ring-[#6965db] ring-offset-2 focus:ring dark:bg-zinc-600 dark:text-white dark:ring-offset-zinc-800"
            defaultValue={name}
            onBlur={handleSceneNameBlur}
          />
        )}

        {appSettings?.deleteSceneDirectly ? (
          <Popover className="relative">
            <PopoverPanel
              className="z-10 mb-10 w-36 origin-bottom rounded-lg bg-white p-4 shadow-lg transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-zinc-800"
              transition
              anchor={{
                to: "top",
                gap: "10px",
              }}
            >
              {({ close }) => (
                <>
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
                      onClick={() => close()}
                    >
                      取消
                    </button>
                  </div>
                </>
              )}
            </PopoverPanel>
            <PopoverButton as={DeleteSceneButton} />
          </Popover>
        ) : (
          <DeleteSceneButton onClick={() => handleDeleteScene()} />
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
