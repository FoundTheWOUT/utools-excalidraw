import { AppContext, loadScene, updateScene } from "@/App";
import { EXCALIDRAW_EXTENSION } from "@/const";
import SS from "@/store";
import { Scene } from "@/types";
import { log, newAScene, reorder, six_nanoid } from "@/utils/utils";
import { loadFromBlob } from "@excalidraw/excalidraw";
import { PlusIcon } from "@heroicons/react/solid";
import { concat } from "lodash";
import { memo, useContext, useEffect } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import SceneItem from "./SceneItem";
import { SideBarContext } from "./SideBar";

type Payload = Partial<{
  isFile: boolean;
  name: string;
  path: string;
}>;

function SceneList() {
  const {
    excalidrawRef,
    setAndStoreAppSettings,
    appSettings,
    handleSetActiveDraw,
    trashcan = [],
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

  const cleanup = () => {
    SS.dropDeletedFiles(concat(scenes, trashcan));
  };

  useEffect(() => {
    cleanup();
  }, []);

  window.utools &&
    utools.onPluginOut(() => {
      scenes.forEach((scene) => {
        // drop image
        scene.img && URL.revokeObjectURL(scene.img);
        scene.img = undefined;
        SS.storeScene(scene.id, scene);
      });
    });

  window.utools &&
    utools.onPluginEnter(({ code, payload, option }) => {
      const pl = payload as Payload[];
      if (code === "search-scenes") {
        const { sceneId } = option;
        const scene = scenes.find((scene) => scene.id === sceneId);
        if (scene) {
          handleSetActiveDraw?.(sceneId, { scene });
        }
      }

      if (code === "load-excalidraw-file" && pl.length) {
        const firstAppendScenesId = six_nanoid();
        const appendScenes = pl.reduce(
          (scenes, { isFile, path, name }, idx) => {
            if (isFile && path && name) {
              const [fileName] = name.split(".");
              const excalidrawFile = window.readFileSync(path, {
                encoding: "utf-8",
              });
              try {
                JSON.parse(excalidrawFile);
                scenes.push(
                  newAScene({
                    id: idx === 0 ? firstAppendScenesId : six_nanoid(),
                    name: fileName,
                    data: excalidrawFile,
                  }),
                );
              } catch (error) {
                excalidrawRef?.current?.setToast({
                  message: `${name} 解析错误`,
                });
              }
            }
            return scenes;
          },
          [] as Scene[],
        );
        setScenes?.((scenes) => [...scenes, ...appendScenes]);
        appendScenes.length &&
          handleSetActiveDraw?.(firstAppendScenesId, {
            scene: appendScenes[0],
          });
      }
    });

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
          className="hover-shadow flex aspect-video w-full cursor-pointer items-center justify-center rounded bg-white"
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
          <PlusIcon className="h-10 text-gray-500" />
        </div>
      </div>
    </>
  );
}

export default memo(SceneList);
