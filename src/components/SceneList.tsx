import { AppContext, loadScene, updateScene } from "@/App";
import { EXCALIDRAW_EXTENSION } from "@/const";
import { dropDeletedFiles, storeScene } from "@/store/store";
import { Scene } from "@/types";
import { newAScene, reorder, six_nanoid } from "@/utils/utils";
import { loadFromBlob, serializeAsJSON } from "@excalidraw/excalidraw";
import { PlusIcon } from "@heroicons/react/solid";
import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import SceneItem from "./SceneItem";

type Payload = Partial<{
  isFile: boolean;
  name: string;
  path: string;
}>;

export const SideBarContext = createContext<{
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
} | null>(null);

function SceneList({
  initScenes,
  scenesMap: scenes_map, // 注意，现在这个 scenesMap 只有在初始化时有效
}: {
  initScenes: Scene[];
  scenesMap: any;
}) {
  const appContext = useContext(AppContext);

  const {
    excalidrawRef,
    setAndStoreAppSettings,
    appSettings,
    handleSetActiveDraw,
  } = appContext ?? {};

  /**
   * 把状态放在子组件中，通过事件进行 setState 避免 App.tsx 在 onSceneUpdate 时直接 setState。
   * 若在 App.tsx 中直接 setState 会触发 excalidraw 更新(onChange)，进而导致无限的循环。
   */
  const [scenes, setScenes] = useState<Scene[]>(initScenes);

  useEffect(() => {
    const unsubscribe = updateScene.subscribe(({ target, value }) => {
      setScenes((scenes) => {
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

  // listen loadScene event, and update SceneList.
  useEffect(() => {
    const unsubscribe = loadScene.subscribe(async () => {
      const [fileHandle] = await window.showOpenFilePicker();
      const fileData = await fileHandle.getFile();
      if (!fileData.name.endsWith(EXCALIDRAW_EXTENSION)) {
        excalidrawRef?.current?.setToast({ message: "导入文件错误" });
        return;
      }
      const { elements, appState, files } = await loadFromBlob(
        fileData,
        null,
        null
      );
      const name = fileData.name.slice(
        0,
        fileData.name.length - EXCALIDRAW_EXTENSION.length
      );
      const data = serializeAsJSON(elements, appState, files, "database");
      const newScene = newAScene({ name, data });
      setScenes((oldScene) => [...oldScene, newScene]);
      handleSetActiveDraw?.(newScene.id, { scene: newScene });
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
      result.destination.index
    );
    setScenes(reorderScenes);
    setAndStoreAppSettings?.({
      scenesId: reorderScenes.map((scene) => scene.id),
    });
  };

  window.utools &&
    utools.onPluginOut(() => {
      scenes.forEach((scene) => {
        // drop image
        scene.img && URL.revokeObjectURL(scene.img);
        scene.img = undefined;
        storeScene(scene.id, scene);
      });
      // drop deleted files
      dropDeletedFiles(scenes);
    });

  window.utools &&
    utools.onPluginEnter(({ code, payload }) => {
      const pl = payload as Payload[];
      if (code === "load-excalidraw-file" && pl.length) {
        const firstAppendScenesId = six_nanoid();
        const appendScenes = pl
          .map(({ isFile, path, name }, idx) => {
            if (isFile && path && name) {
              const [fileName] = name.split(".");
              const excalidrawFile = window.readFileSync(path, {
                encoding: "utf-8",
              });
              try {
                JSON.parse(excalidrawFile);
              } catch (error) {
                excalidrawRef?.current?.setToast({
                  message: `${name} 解析错误`,
                });
                return undefined;
              }
              return newAScene({
                id: idx === 0 ? firstAppendScenesId : six_nanoid(),
                name: fileName,
                data: excalidrawFile,
              });
            }
            return undefined;
          })
          .filter((item) => {
            if (item === undefined) return false;
            if (scenes_map.has(item.id)) return false;
            return true;
          }) as Scene[];
        setScenes([...scenes, ...appendScenes]);
        appendScenes.length &&
          handleSetActiveDraw?.(firstAppendScenesId, {
            scene: appendScenes[0],
          });
      }
    });

  return (
    <SideBarContext.Provider
      value={{
        scenes,
        setScenes,
      }}
    >
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
                          //   key={id}
                          //   id={id}
                          //   img={img}
                          //   name={name}
                          //   data={data}
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
          className="w-full aspect-video bg-white cursor-pointer rounded flex items-center justify-center hover-shadow"
          onClick={() => {
            const newScene = newAScene({ name: `画布${scenes.length}` });
            setScenes([...scenes, newScene]);
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
    </SideBarContext.Provider>
  );
}

export default memo(SceneList);
