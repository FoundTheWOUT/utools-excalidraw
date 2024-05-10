import { useContext, useState } from "react";
import cn from "clsx";
import { AppContext } from "@/App";
import SceneList from "./SceneList";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  CogIcon,
} from "@heroicons/react/solid";
import TrashcanDialog from "./TrashcanDialog";
import SettingDialog from "@/components/SettingDialog.tsx";

function SideBar() {
  const { appSettings, setAndStoreAppSettings, setResizing } =
    useContext(AppContext) ?? {};

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

      <SettingDialog
        open={settingDialogOpen}
        onClose={(close) => setSettingDialogOpen(close)}
      />
    </>
  );
}

export default SideBar;
