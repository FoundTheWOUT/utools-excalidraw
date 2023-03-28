import React, { createContext, memo, useContext, useState } from "react";
import cn from "classnames";
import { AppContext } from "@/App";
import SceneList from "./SceneList";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@heroicons/react/solid";
import { Scene } from "@/types";
import { Switch } from "@headlessui/react";
import SwitchBtn from "@/ui/Switch";
import TrashcanDialog from "./TrashcanDialog";

export const SideBarContext = createContext<{
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
} | null>(null);

function SideBar({ initScenes }: { initScenes: Scene[] }) {
  const { appSettings, setAndStoreAppSettings, setResizing } =
    useContext(AppContext) ?? {};

  /**
   * 把状态放在子组件中，通过事件进行 setState 避免 App.tsx 在 onSceneUpdate 时直接 setState。
   * 若在 App.tsx 中直接 setState 会触发 excalidraw 更新(onChange)，进而导致无限的循环。
   */
  const [scenes, setScenes] = useState<Scene[]>(
    initScenes.filter((scene) => !scene.deleted)
  );

  const handleAsideControllerClick = () => {
    setAndStoreAppSettings?.({
      asideClosed: !appSettings?.asideClosed,
    });
  };
  const [trashcanDialogOpen, setTrashcanDialogOpen] = useState(false);

  return (
    <SideBarContext.Provider
      value={{
        scenes,
        setScenes,
      }}
    >
      <aside
        className="relative h-full bg-gray-100 z-10"
        style={{
          width: appSettings?.asideClosed ? 0 : appSettings?.asideWidth,
        }}
      >
        <div className="h-full overflow-y-auto">
          {appSettings?.asideWidth && appSettings.asideWidth > 150 && (
            <div className="p-3 pb-0 flex justify-between items-center gap-2">
              {/* trashcan dialog */}
              <button
                className="btn-base flex items-center p-2"
                onClick={() => {
                  setTrashcanDialogOpen(true);
                }}
                title="垃圾桶"
              >
                <TrashIcon className="w-5 text-red-500" />
              </button>
              <TrashcanDialog
                open={trashcanDialogOpen}
                onClose={(close) => setTrashcanDialogOpen(close)}
              />

              <Switch.Group>
                <div className="flex items-center gap-2">
                  <Switch.Label>预览</Switch.Label>
                  <SwitchBtn
                    checked={appSettings.closePreview}
                    onClick={() =>
                      setAndStoreAppSettings?.({
                        closePreview: !appSettings?.closePreview,
                      })
                    }
                  />
                </div>
              </Switch.Group>
            </div>
          )}
          <SceneList />
        </div>
        {/* controller */}
        <button
          className={cn(
            "absolute bottom-12 -right-3 bg-white rounded-full shadow transition-transform",
            appSettings?.asideClosed && "translate-x-4"
          )}
          onClick={handleAsideControllerClick}
        >
          {appSettings?.asideClosed ? (
            <ChevronRightIcon className="h-6" />
          ) : (
            <ChevronLeftIcon className="h-6" />
          )}
        </button>

        <div
          className={cn(
            "absolute top-1/2 h-8 w-1.5 bg-slate-500/60 rounded-full cursor-ew-resize -right-2",
            appSettings?.asideClosed && "hidden"
          )}
          onMouseDown={() => {
            setResizing?.(true);
          }}
        ></div>
      </aside>
    </SideBarContext.Provider>
  );
}

export default memo(SideBar);
