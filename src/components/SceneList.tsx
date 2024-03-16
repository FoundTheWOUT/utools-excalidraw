import { AppContext } from "@/App";
import { EXCALIDRAW_EXTENSION } from "@/const";
import { log, newAScene, reorder } from "@/utils/utils";
import { loadFromBlob } from "@excalidraw/excalidraw";
import { PlusIcon } from "@heroicons/react/solid";
import { memo, useContext, useEffect } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import SceneItem from "./SceneItem";
import { SideBarContext } from "./SideBar";
import { loadScene, updateScene } from "@/event";

function SceneList() {
  const {
    excalidrawRef,
    setAndStoreAppSettings,
    appSettings,
    handleSetActiveDraw,
  } = useContext(AppContext) ?? {};
  const { scenes = [], setScenes } = useContext(SideBarContext) ?? {};

  useEffect(() => {
    const unsubscribe = updateScene.subscribe(({ target, value }) => {
      setScenes?.((scenes) => {
        return scenes.map((scene) => {
          if (scene.id !== target) return scene;
          return {
            ...scene,
            ...value,
          };
        });
      });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    appSettings?.lastActiveDraw &&
      document.getElementById(appSettings?.lastActiveDraw)?.scrollIntoView();
  }, []);

  // listen loadScene event, and update SceneList.
  useEffect(() => {
    const unsubscribe = loadScene.subscribe(async () => {
      try {
        const [fileHandle] = await window.showOpenFilePicker();
        const fileData = await fileHandle.getFile();
        if (!fileData.name.endsWith(EXCALIDRAW_EXTENSION)) {
          excalidrawRef?.current?.setToast({ message: "导入文件错误" });
          return;
        }
        await loadFromBlob(fileData, null, null); // 尝试加载一下
        const data = await fileData.text();
        const name = fileData.name.slice(
          0,
          fileData.name.length - EXCALIDRAW_EXTENSION.length,
        );
        // const data = serializeAsJSON(elements, appState, files, "database");
        const newScene = newAScene({ name, data });
        setScenes?.((oldScene) => [...oldScene, newScene]);
        handleSetActiveDraw?.(newScene.id, { scene: newScene });
      } catch (error) {
        log(error);
        excalidrawRef?.current?.setToast({ message: (error as Error).message });
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

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
      result.destination.index,
    );
    setScenes?.(reorderScenes);
    setAndStoreAppSettings?.({
      scenesId: reorderScenes.map((scene) => scene.id),
    });
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="list">
          {(provided) => (
            <div ref={provided.innerRef}>
              {scenes.map((scene, idx) => (
                <Draggable key={scene.id} draggableId={scene.id} index={idx}>
                  {(dragProvided) => {
                    return (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                      >
                        <SceneItem
                          scene={scene}
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
          className="hover-shadow flex aspect-video w-full cursor-pointer items-center justify-center rounded bg-white dark:bg-zinc-600 dark:shadow-zinc-950"
          onClick={() => {
            const newScene = newAScene({ name: `画布${scenes.length}` });
            setScenes?.([...scenes, newScene]);
            excalidrawRef?.current && excalidrawRef.current.resetScene();
            handleSetActiveDraw?.(newScene.id, {
              appSettings: {
                lastActiveDraw: newScene.id,
                scenesId: appSettings?.scenesId.concat(newScene.id),
              },
            });
          }}
        >
          <PlusIcon className="h-10 text-gray-500 dark:text-white" />
        </div>
      </div>
    </>
  );
}

export default memo(SceneList);
