import { AppContext, updateScene } from "@/App";
import { dropDeletedFiles, storeScene } from "@/store/store";
import { Scene } from "@/types";
import { newAScene, reorder, six_nanoid } from "@/utils/utils";
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
        let data = "";
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
              if (idx === 0) {
                data = excalidrawFile;
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
        appendScenes.length && handleSetActiveDraw?.(firstAppendScenesId, data);
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
            setAndStoreAppSettings?.({
              lastActiveDraw: newScene.id,
              scenesId: appSettings?.scenesId.concat(newScene.id),
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
