import { AppContext } from "@/App";
import { Dialog } from "@/ui/Dialog";
import React, { useContext, useState } from "react";
import dayjs from "dayjs";
import { Scene } from "@/types";
import { SideBarContext } from "./SideBar";
import SS from "@/store";
import cn from "classnames";

const PAGE_SIZE = 6;

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

  const pages = new Array(Math.ceil((trashcan?.length ?? 0) / PAGE_SIZE));
  for (let i = 0; i < pages.length; i++) {
    pages[i] = i + 1;
  }
  const [curPage, setCurPage] = useState(1);

  const dropSceneInTrashcan = (id: string) =>
    setTrashcan?.((scenes) => scenes.filter((s) => s.id !== id));

  const handleRestoreScene = (scene: Scene) => {
    dropSceneInTrashcan(scene.id);
    setScenes?.((scenes) => {
      const restoreScene = { ...scene, deleted: false, deletedAt: null };
      const nextScenes = [...scenes, restoreScene];
      SS.storeScene(scene.id, restoreScene);
      setAndStoreAppSettings?.({
        scenesId: nextScenes.filter((s) => !s.deleted).map((s) => s.id),
      });
      return nextScenes;
    });
  };

  const handlePermanentRemove = (scene: Scene) => {
    dropSceneInTrashcan(scene.id);
    SS.removeScene(scene.id);
  };

  const items = trashcan?.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
  const placeholder = [];
  for (let i = 0; i < PAGE_SIZE - (items?.length ?? 0); i++) {
    placeholder.push(
      <div className="flex gap-4" key={i}>
        <div className="object-contain w-48 border-2 border-dashed rounded-lg aspect-video" />
        <div className="flex flex-col flex-1 w-48">
          <div className="h-6 border-b-2 border-dashed"></div>
          <div className="h-6 border-b-2 border-dashed"></div>
          <div className="mt-auto flex gap-2">
            <div className="border-2 rounded-lg border-dashed h-7 px-2 py-1 flex-1"></div>
            <div className="border-2 rounded-lg border-dashed h-7 px-2 py-1 flex-1"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog title="回收站" open={open} onClose={onClose}>
      <Dialog.Description>
        移入回收站30天后的画布将被自动永久删除
      </Dialog.Description>

      {/* Body */}
      <div className="flex flex-col gap-2 my-4">
        {trashcan?.length === 0 ? (
          <p className="mx-auto mt-6">暂无已删除画布</p>
        ) : (
          <>
            {items?.map((scene) => (
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
                        {dayjs.unix(scene.deletedAt).format("YYYY MM-DD HH:mm")}
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
            ))}
            {placeholder}
          </>
        )}
      </div>

      <div className="flex items-center justify-center">
        {pages.map((page) => (
          <button
            className={cn(
              "h-8 w-8",
              curPage === page && "btn-preset btn-primary"
            )}
            key={page}
            onClick={() => setCurPage(page)}
          >
            {page}
          </button>
        ))}
      </div>
    </Dialog>
  );
}

export default TrashcanDialog;
