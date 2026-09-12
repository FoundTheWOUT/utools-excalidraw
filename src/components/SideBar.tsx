import { useContext, useState } from "react";
import cn from "clsx";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/solid";
import SceneList from "./SceneList";
import { AppContext } from "@/App";
import Input from "@/ui/Input";
import { t } from "@/i18n";
import { formatHotkey } from "@/shortcuts/keys";
import { DEFAULT_SHORTCUTS } from "@/shortcuts/registry";

function SideBar() {
  const { appSettings, addScene, toggleAside, setResizing } =
    useContext(AppContext) ?? {};

  const [openSideBarTemp, setOpenSideBarTemp] = useState(false);
  const [sceneSearch, setSceneSearch] = useState(""); // search state

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
          {/* Search input + add scene */}
          <div className="sticky top-0 z-20 flex items-center gap-2 bg-gray-100 p-3 dark:bg-zinc-800">
            <Input
              value={sceneSearch}
              placeholder="Search scenes..."
              onChange={(e) => setSceneSearch(e.target.value)}
              className="min-w-0 flex-1"
            />
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 hover:text-gray-800 dark:bg-zinc-700 dark:text-white dark:hover:text-zinc-300"
              title={`${t("shortcuts.addScene")} (${formatHotkey(
                DEFAULT_SHORTCUTS.addScene.hotkey,
              )})`}
              aria-label={t("shortcuts.addScene")}
              onClick={() => addScene?.()}
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>

          <SceneList search={sceneSearch} />
        </div>

        {/* aside hide controller */}
        <button
          className={cn(
            "absolute -right-3 bottom-12 rounded-full bg-white shadow-sm transition-transform dark:bg-zinc-600 dark:text-white",
            appSettings?.asideClosed && "translate-x-4",
          )}
          title={`${
            appSettings.asideClosed ? t("asideClosed") : t("asideCollapse")
          } (${formatHotkey(DEFAULT_SHORTCUTS.toggleAside.hotkey)})`}
          onClick={() => toggleAside?.()}
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
