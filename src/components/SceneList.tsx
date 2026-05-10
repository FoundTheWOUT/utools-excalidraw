import { loadFromBlob } from "@excalidraw/excalidraw";
import { PlusIcon } from "@heroicons/react/solid";
import { memo, useContext, useEffect } from "react";
import {
  DragDropProvider,
  DragOverlay,
  type DragEndEvent,
} from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { arrayMove } from "@dnd-kit/helpers";
import SceneItem from "./SceneItem";
import { log, newAScene } from "@/utils/utils";
import { EXCALIDRAW_EXTENSION } from "@/const";
import { AppContext } from "@/App";
import { loadScene } from "@/event";

function SortableSceneItem({ id, idx }: { id: string; idx: number }) {
  const sortable = useSortable({ id, index: idx });

  return (
    <div
      ref={sortable.ref}
      style={{
        opacity: sortable.isDragging || sortable.isDropping ? 0.1 : undefined,
      }}
    >
      <SceneItem id={id} idx={idx} handleRef={sortable.handleRef} />
    </div>
  );
}

function SceneList({ search = "" }: { search?: string }) {
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
          scene: newScene,
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { source, target } = event.operation;
    if (!source || !target || source.id === target.id) return;
    const reordered = arrayMove(
      appSettings!.scenesId,
      appSettings!.scenesId.indexOf(source.id as string),
      appSettings!.scenesId.indexOf(target.id as string),
    );
    setAndStoreAppSettings?.({ scenesId: reordered });
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

  // Filter scenes by name
  const filteredSceneIds =
    appSettings?.scenesId.filter((id) => {
      const scene = sceneCollection?.get(id);
      if (!scene) return false;
      return scene.name?.toLowerCase().includes(search.toLowerCase());
    }) ?? [];

  return (
    <div>
      <DragDropProvider onDragEnd={handleDragEnd}>
        {filteredSceneIds.map((id, idx) => (
          <SortableSceneItem key={id} id={id} idx={idx} />
        ))}
        <DragOverlay>
          {(source) => (
            <SceneItem
              id={source.id as string}
              idx={filteredSceneIds.indexOf(source.id as string)}
            />
          )}
        </DragOverlay>
      </DragDropProvider>
      <div className="p-3">
        <div
          className="hover-shadow flex aspect-video w-full cursor-pointer items-center justify-center rounded-sm bg-white dark:bg-zinc-600 dark:shadow-zinc-950"
          onClick={handleAddScene}
        >
          <PlusIcon className="h-10 text-gray-500 dark:text-white" />
        </div>
      </div>
    </div>
  );
}

export default memo(SceneList);
