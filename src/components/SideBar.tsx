import React, { createContext, memo, useContext, useState } from "react";
import cn from "clsx";
import { AppContext } from "@/App";
import SceneList from "./SceneList";
import SS from "@/store";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  CogIcon,
} from "@heroicons/react/solid";
import { Scene } from "@/types";
import TrashcanDialog from "./TrashcanDialog";
import SettingDialog from "@/components/SettingDialog.tsx";
import { uniqBy } from "lodash-es";
import dayjs from "dayjs";

type DelSceneArgs = { id: string; permanent: boolean };
export const SideBarContext = createContext<{
  scenes: Scene[];
  delScene: (params: DelSceneArgs) => void;
} | null>(null);

function SideBar({
  scenesCollection,
}: {
  scenesCollection: Map<string, Scene>;
}) {
  const { appSettings, setAndStoreAppSettings, setResizing, setTrashcan } =
    useContext(AppContext) ?? {};

  const scenes =
    appSettings?.scenesId.map((id) => scenesCollection.get(id)!) ?? [];

  const moveToTrashcan = (id: string) => {
    const scene = scenes.find((scene) => scene.id === id)!;
    setTrashcan?.((scenes) => uniqBy([...scenes, scene], "id"));
    SS.storeScene(id, {
      ...scene,
      deleted: true,
      deletedAt: dayjs().unix(),
    });
  };

  const delScene = ({ id, permanent }: DelSceneArgs) => {
    const idx = scenes.findIndex((scene) => scene.id === id);
    if (permanent) {
      SS.removeScene(id);
    } else {
      moveToTrashcan(id);
    }
    const newScenes = scenes.filter((scene) => scene.id !== id);
    const updateScenesIndex = idx == newScenes.length ? idx - 1 : idx;
    setAndStoreAppSettings?.({
      ...(appSettings?.lastActiveDraw === id
        ? {
            lastActiveDraw: newScenes[updateScenesIndex].id,
          }
        : {}),
      scenesId: newScenes.map((scene) => scene.id),
    });
  };

  const handleAsideControllerClick = () => {
    setAndStoreAppSettings?.({
      asideClosed: !appSettings?.asideClosed,
    });
  };
  const [trashcanDialogOpen, setTrashcanDialogOpen] = useState(false);
  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const [openSideBarTemp, setOpenSideBarTemp] = useState(false);

  if (!appSettings) {
    return null;
  }

  return (
    <SideBarContext.Provider
      value={{
        scenes,
        delScene,
      }}
    >
      <aside
        className={cn(
          appSettings.asideClosed ? "fixed" : "relative",
          "z-10 h-full bg-gray-100 transition-transform dark:bg-zinc-800",
        )}
        style={{
          transform:
            !appSettings.asideClosed || openSideBarTemp
              ? ""
              : `translateX(-${appSettings?.asideWidth}px)`,
          width: appSettings?.asideWidth,
        }}
        onMouseLeave={() => {
          setOpenSideBarTemp(false);
        }}
      >
        <div className="h-full overflow-y-auto">
          {appSettings?.asideWidth && appSettings.asideWidth > 150 && (
            <div className="flex items-center justify-between gap-2 p-3 pb-0">
              <button
                className="btn-base flex items-center p-2"
                onClick={() => {
                  setTrashcanDialogOpen(true);
                }}
                title="垃圾桶"
              >
                <TrashIcon className="w-5 text-red-500" />
              </button>

              <button
                className="btn-base flex items-center p-2"
                onClick={() => {
                  setSettingDialogOpen(true);
                }}
                title="设置"
              >
                <CogIcon className="w-5 text-gray-500 dark:text-gray-300" />
              </button>
            </div>
          )}
          <SceneList />
        </div>
        {/* controller */}
        <button
          className={cn(
            "absolute -right-3 bottom-12 rounded-full bg-white shadow transition-transform dark:bg-zinc-600 dark:text-white",
            appSettings?.asideClosed && "translate-x-4",
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
            "absolute -right-2 top-1/2 h-8 w-1.5 cursor-ew-resize rounded-full bg-slate-500/60",
            appSettings?.asideClosed && "hidden",
          )}
          onMouseDown={() => {
            setResizing?.(true);
          }}
        ></div>
      </aside>

      {/* auto open mask */}
      {appSettings.asideCloseAutomatically && (
        <div
          className="fixed left-0 z-10 h-5/6 w-6"
          onMouseEnter={() => {
            setOpenSideBarTemp(true);
          }}
        ></div>
      )}

      <TrashcanDialog
        open={trashcanDialogOpen}
        onClose={(close) => setTrashcanDialogOpen(close)}
      />

      <SettingDialog
        open={settingDialogOpen}
        onClose={(close) => setSettingDialogOpen(close)}
      />
    </SideBarContext.Provider>
  );
}

export default memo(SideBar);
