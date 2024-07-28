import { useContext, useState } from "react";
import cn from "clsx";
import { AppContext } from "@/App";
import SceneList from "./SceneList";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/solid";
import SideBarHeader from "./SideBarHeader";

function SideBar() {
  const { appSettings, setAndStoreAppSettings, setResizing } =
    useContext(AppContext) ?? {};

  const handleAsideControllerClick = () => {
    setAndStoreAppSettings?.({
      asideClosed: !appSettings?.asideClosed,
    });
  };
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
          <SideBarHeader />
          <SceneList />
        </div>

        {/* aside hide controller */}
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

        {/* aside width controller */}
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
    </>
  );
}

export default SideBar;
