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
import { loadScene } from "@/event";

function SceneList() {
  const {
    excalidrawAPI,
    setAndStoreAppSettings,
    appSettings,
    handleSetActiveDraw,
    scenes: sceneCollection,
  } = useContext(AppContext) ?? {};

  useEffect(() => {
    if (appSettings?.lastActiveDraw) {
      document.getElementById(appSettings?.lastActiveDraw)?.scrollIntoView();
    }
  }, []);

  // listen loadScene event, and update SceneList.
  useEffect(() => {
    const unsubscribe = loadScene.subscribe(async () => {
      try {
        const [fileHandle] = await window.showOpenFilePicker();
        const fileData = await fileHandle.getFile();
        if (!fileData.name.endsWith(EXCALIDRAW_EXTENSION)) {
          excalidrawAPI?.setToast({ message: "导入文件错误" });
          return;
        }
        await loadFromBlob(fileData, null, null); // 尝试加载一下
        const data = await fileData.text();
        const name = fileData.name.slice(
          0,
          fileData.name.length - EXCALIDRAW_EXTENSION.length,
        );
        const newScene = newAScene({ name, data });
        sceneCollection?.set(newScene.id, newScene);
        handleSetActiveDraw?.(newScene.id, {
          appSettings: {
            scenesId: appSettings?.scenesId.concat(newScene.id),
          },
        });
      } catch (error) {
        log(error);
        excalidrawAPI?.setToast({ message: (error as Error).message });
      }
    });
    return () => {
      unsubscribe();
    };
  }, [
    appSettings?.scenesId,
    excalidrawAPI,
    handleSetActiveDraw,
    sceneCollection,
  ]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    if (result.destination.index === result.source.index) {
      return;
    }
    const reorderScenesId = reorder(
      appSettings!.scenesId,
      result.source.index,
      result.destination.index,
    );
    setAndStoreAppSettings?.({
      scenesId: reorderScenesId,
    });
  };

  // TODO: refactor this can merge with load scene
  const handleAddScene = () => {
    const newScene = newAScene({ name: `画布${appSettings?.scenesId.length}` });
    excalidrawAPI?.resetScene();
    sceneCollection?.set(newScene.id, newScene);
    handleSetActiveDraw?.(newScene.id, {
      appSettings: {
        scenesId: appSettings?.scenesId.concat(newScene.id),
      },
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="list">
          {(provided) => (
            <div ref={provided.innerRef}>
              {appSettings?.scenesId.map((id, idx) => (
                <Draggable key={id} draggableId={id} index={idx}>
                  {(dragProvided) => {
                    return (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                      >
                        <SceneItem
                          id={id}
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
          onClick={handleAddScene}
        >
          <PlusIcon className="h-10 text-gray-500 dark:text-white" />
        </div>
      </div>
    </div>
  );
}

export default memo(SceneList);
