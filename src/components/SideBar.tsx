import React, { createContext, memo, useContext, useState } from "react";
import cn from "classnames";
import { AppContext } from "@/App";
import SceneList from "./SceneList";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  CogIcon,
} from "@heroicons/react/solid";
import { DB_KEY, Scene, Store } from "@/types";
import { Switch } from "@headlessui/react";
import SwitchBtn from "@/ui/Switch";
import TrashcanDialog from "./TrashcanDialog";
import { Dialog } from "@/ui/Dialog";
import { t } from "@/i18n";

export const SideBarContext = createContext<{
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
} | null>(null);

function AppSettingsSwitchItem({
  prop,
  reverse = false,
}: {
  prop: keyof Store[DB_KEY.SETTINGS] | (string & {});
  reverse?: boolean;
}) {
  const { appSettings, setAndStoreAppSettings } = useContext(AppContext) ?? {};

  if (!appSettings) {
    return null;
  }

  if (!Object.hasOwn(appSettings, prop)) {
    return (
      <Switch.Group>
        <div className="flex gap-2">
          <SwitchBtn checked={false} notAllow />
          <Switch.Label className="flex-1 text-gray-500">
            <div className="font-semibold">{t(prop)}</div>
            <div className="text-sm mt-1">{t(`${prop}.Description`)}</div>
          </Switch.Label>
        </div>
      </Switch.Group>
    );
  }

  return (
    <Switch.Group>
      <div className="flex gap-2">
        <SwitchBtn
          checked={reverse ? !!appSettings[prop] : !appSettings[prop]}
          onClick={() =>
            setAndStoreAppSettings?.({
              [prop]: !appSettings[prop],
            })
          }
        />
        <Switch.Label className="flex-1">
          <div className="font-semibold">{t(prop)}</div>
          <div className="text-sm text-gray-500 mt-1">
            {t(`${prop}.Description`)}
          </div>
        </Switch.Label>
      </div>
    </Switch.Group>
  );
}

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
  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const [openSideBarTemp, setOpenSideBarTemp] = useState(false);

  if (!appSettings) {
    return null;
  }

  return (
    <SideBarContext.Provider
      value={{
        scenes,
        setScenes,
      }}
    >
      <>
        <aside
          className={cn(
            appSettings.asideClosed ? "fixed" : "relative",
            "h-full bg-gray-100 z-10 transition-transform"
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
              <div className="p-3 pb-0 flex justify-between items-center gap-2">
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
                  <CogIcon className="w-5 text-gray-500" />
                </button>
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

        {/* auto open mask */}
        {appSettings.asideCloseAutomatically && (
          <div
            className="z-10 fixed h-5/6 left-0 w-6"
            onMouseEnter={() => {
              setOpenSideBarTemp(true);
            }}
          ></div>
        )}

        <TrashcanDialog
          open={trashcanDialogOpen}
          onClose={(close) => setTrashcanDialogOpen(close)}
        />

        <Dialog
          onClose={() => setSettingDialogOpen(false)}
          open={settingDialogOpen}
          title="设置"
        >
          <div className="flex flex-col gap-4 p-2 mt-4">
            <AppSettingsSwitchItem prop="closePreview" />
            <AppSettingsSwitchItem prop="asideClosed" />
            <AppSettingsSwitchItem prop="asideCloseAutomatically" reverse />

            <div className="relative my-2 select-none">
              <div className="w-full h-[1px] bg-gray-300"></div>
              <span className="px-2 text-sm text-gray-500 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white">
                敬请期待
              </span>
            </div>

            <AppSettingsSwitchItem prop="deleteSceneDirectly" />
          </div>
        </Dialog>
      </>
    </SideBarContext.Provider>
  );
}

export default memo(SideBar);
