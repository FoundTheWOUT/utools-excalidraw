import React, { useContext } from "react";
import cn from "classnames";
import { AppContext } from "@/App";
import SceneList from "./SceneList";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/solid";

function SideBar() {
  const { appSettings, setAndStoreAppSettings, setResizing } =
    useContext(AppContext) ?? {};

  const handleAsideControllerClick = () => {
    setAndStoreAppSettings?.({
      asideClosed: !appSettings?.asideClosed,
    });
  };

  return (
    <aside
      className="relative h-full bg-gray-100 z-10"
      style={{
        width: appSettings?.asideClosed ? 0 : appSettings?.asideWidth,
      }}
    >
      <div className="h-full overflow-y-auto">
        {appSettings?.asideWidth && appSettings.asideWidth > 150 && (
          <div className="p-3 pb-0 flex justify-end gap-2">
            <span className="select-none">预览</span>
            <div
              className={cn(
                "w-10 rounded-full flex items-center cursor-pointer relative",
                appSettings?.closePreview ? "bg-gray-300" : "bg-[#6965db]"
              )}
              onClick={() =>
                setAndStoreAppSettings?.({
                  closePreview: !appSettings?.closePreview,
                })
              }
            >
              <div
                className={cn(
                  "rounded-full h-5 w-5 transition-transform bg-white absolute",
                  appSettings?.closePreview
                    ? "translate-x-[0.1rem]"
                    : "translate-x-[1.2rem]"
                )}
              ></div>
            </div>
          </div>
        )}
        <SceneList initScenes={initScenes.filter((scene) => !scene.deleted)} />
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
  );
}

export default SideBar;
