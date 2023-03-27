import React, { useContext, useState } from "react";
import cn from "classnames";
import { AppContext } from "@/App";
import SceneList from "./SceneList";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@heroicons/react/solid";
import { Scene } from "@/types";
import { Dialog, Switch } from "@headlessui/react";
import SwitchBtn from "@/ui/Switch";

function SideBar({ initScenes }: { initScenes: Scene[] }) {
  const { appSettings, setAndStoreAppSettings, setResizing } =
    useContext(AppContext) ?? {};

  const handleAsideControllerClick = () => {
    setAndStoreAppSettings?.({
      asideClosed: !appSettings?.asideClosed,
    });
  };
  const [trashcanDialogOpen, setTrashcanDialogOpen] = useState(false);

  return (
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
            <Dialog
              className="relative z-50"
              open={trashcanDialogOpen}
              onClose={() => setTrashcanDialogOpen(false)}
            >
              <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white max-w-2xl p-4 rounded-lg shadow-lg">
                  <Dialog.Title className="font-bold text-xl">
                    垃圾桶
                  </Dialog.Title>
                  <Dialog.Description>
                    This will permanently deactivate your account
                  </Dialog.Description>

                  <p>
                    Are you sure you want to deactivate your account? All of
                    your data will be permanently removed. This action cannot be
                    undone.
                  </p>

                  <div className="flex">
                    <button
                      className="ml-auto btn-base p-2"
                      onClick={() => setTrashcanDialogOpen(false)}
                    >
                      取消
                    </button>
                  </div>
                </Dialog.Panel>
              </div>
            </Dialog>

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
