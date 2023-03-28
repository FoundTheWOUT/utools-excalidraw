import { AppContext } from "@/App";
import { Dialog } from "@headlessui/react";
import React, { useContext } from "react";
import dayjs from "dayjs";
import { XCircleIcon } from "@heroicons/react/outline";
import { Scene } from "@/types";
import { SideBarContext } from "./SideBar";
import { removeScene, storeScene } from "@/store/scene";

function TrashcanDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (value: boolean) => void;
}) {
  const { trashcan, setTrashcan, setAndStoreAppSettings } =
    useContext(AppContext) ?? {};
  const { setScenes } = useContext(SideBarContext) ?? {};

  const dropSceneInTrashcan = (id: string) =>
    setTrashcan?.((scenes) => scenes.filter((s) => s.id !== id));

  const handleRestoreScene = (scene: Scene) => {
    dropSceneInTrashcan(scene.id);
    setScenes?.((scenes) => {
      const restoreScene = { ...scene, deleted: false, deletedAt: null };
      const nextScenes = [...scenes, restoreScene];
      storeScene(scene.id, restoreScene);
      setAndStoreAppSettings?.({
        scenesId: nextScenes.filter((s) => !s.deleted).map((s) => s.id),
      });
      return nextScenes;
    });
  };

  const handlePermanentRemove = (scene: Scene) => {
    dropSceneInTrashcan(scene.id);
    removeScene(scene.id);
  };

  return (
    <Dialog className="relative z-50" open={open} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white max-w-2xl p-4 rounded-lg shadow-lg">
          <Dialog.Title className="font-bold text-xl flex">
            <span>回收站</span>
            <XCircleIcon
              className="ml-auto h-7 cursor-pointer"
              onClick={() => onClose(false)}
            />
          </Dialog.Title>
          <Dialog.Description className="text-xs text-gray-400">
            移入回收站30天后的画布将被自动永久删除
          </Dialog.Description>

          {/* Body */}
          <div className="flex flex-col gap-2 mt-4">
            {trashcan?.length === 0 ? (
              <p className="mx-auto mt-6">暂无已删除画布</p>
            ) : (
              trashcan?.map((scene) => (
                <div key={scene.id} className="flex gap-4">
                  <img
                    className="object-contain w-48 border-2 rounded-lg aspect-video"
                    src={scene.img}
                  />
                  {/* content */}
                  <div className="flex flex-col flex-1 w-48">
                    <div className="font-bold">ID: {scene.id}</div>
                    <div className="font-bold">别名: {scene.name}</div>
                    {scene.deletedAt && (
                      <div>
                        <span className="text-sm">删除时间: </span>
                        <time className="italic text-sm">
                          {dayjs
                            .unix(scene.deletedAt)
                            .format("YYYY MM-DD HH:mm")}
                        </time>
                      </div>
                    )}
                    <div className="mt-auto flex gap-2">
                      <button
                        className="btn-safe px-2 py-1 flex-1"
                        onClick={() => handleRestoreScene(scene)}
                      >
                        恢复
                      </button>
                      <button
                        className="btn-danger px-2 py-1 flex-1"
                        onClick={() => handlePermanentRemove(scene)}
                      >
                        永久删除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default TrashcanDialog;
