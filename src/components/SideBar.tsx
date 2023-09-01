import React, { createContext, memo, useContext, useState } from "react";
import cn from "clsx";
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
import { setDocumentDarkMode } from "@/utils/utils";

export const SideBarContext = createContext<{
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
} | null>(null);

type MayBeSettingKey =
  | keyof Store[DB_KEY.SETTINGS]
  | (string & NonNullable<unknown>);
function AppSettingsSwitchItem({
  prop,
  reverse = false,
  ...rest
}: {
  prop: MayBeSettingKey;
  reverse?: boolean;
  onChange?: (value: boolean) => void;
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
            <div className="mt-1 text-sm">{t(`${prop}.Description`)}</div>
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
          onClick={() => {
            setAndStoreAppSettings?.({
              [prop]: !appSettings[prop],
            });
            rest.onChange?.(!appSettings[prop]);
          }}
        />
        <Switch.Label className="flex-1">
          <div className="font-semibold dark:text-white">{t(prop)}</div>
          <div className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
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
    initScenes.filter((scene) => !scene.deleted),
  );

  const handleAsideControllerClick = () => {
    setAndStoreAppSettings?.({
      asideClosed: !appSettings?.asideClosed,
    });
  };
  const [trashcanDialogOpen, setTrashcanDialogOpen] = useState(false);
  const [settingDialogOpen, setSettingDialogOpen] = useState(true);
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

        <Dialog
          onClose={() => setSettingDialogOpen(false)}
          open={settingDialogOpen}
          title="设置"
        >
          <div className="mt-4 flex flex-col gap-4 p-2">
            <AppSettingsSwitchItem prop="closePreview" />
            <AppSettingsSwitchItem prop="asideClosed" />
            <AppSettingsSwitchItem prop="asideCloseAutomatically" reverse />
            <AppSettingsSwitchItem prop="deleteSceneDirectly" reverse />

            <AppSettingsSwitchItem
              prop="darkMode"
              reverse
              onChange={(dark) => {
                setDocumentDarkMode(dark);
              }}
            />
          </div>
        </Dialog>
      </>
    </SideBarContext.Provider>
  );
}

export default memo(SideBar);
