import { AppContext } from "@/App";
import { EXCALIDRAW_EXTENSION } from "@/const";
import { extend } from "@/utils/utils";
import { exportToBlob, serializeAsJSON } from "@excalidraw/excalidraw";
import cn from "clsx";
import { useState, useContext } from "react";
import StyledCheckBox from "../ui/CheckBox";

const ToDiskIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    role="img"
    viewBox="0 0 512 512"
    className="h-[2.6rem] w-[2.6rem]"
  >
    <path
      fill="currentColor"
      d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"
    ></path>
  </svg>
);

const ToImageIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    role="img"
    viewBox="0 0 576 512"
    className="h-[2.6rem] w-[2.6rem]"
  >
    <path
      fill="currentColor"
      d="M571 308l-95.7-96.4c-10.1-10.1-27.4-3-27.4 11.3V288h-64v64h64v65.2c0 14.3 17.3 21.4 27.4 11.3L571 332c6.6-6.6 6.6-17.4 0-24zm-187 44v-64 64z"
    ></path>
    <path
      fill="currentColor"
      d="M384 121.941V128H256V0h6.059c6.362 0 12.471 2.53 16.97 7.029l97.941 97.941a24.01 24.01 0 017.03 16.971zM248 160c-13.2 0-24-10.8-24-24V0H24C10.745 0 0 10.745 0 24v464c0 13.255 10.745 24 24 24h336c13.255 0 24-10.745 24-24V160H248zm-135.455 16c26.51 0 48 21.49 48 48s-21.49 48-48 48-48-21.49-48-48 21.491-48 48-48zm208 240h-256l.485-48.485L104.545 328c4.686-4.686 11.799-4.201 16.485.485L160.545 368 264.06 264.485c4.686-4.686 12.284-4.686 16.971 0L320.545 304v112z"
    ></path>
  </svg>
);

const ExportOps = () => {
  const appContext = useContext(AppContext);

  const [exportImageOptions, setExportImageOptions] = useState({
    exportBackground: true,
    exportWithDarkMode: false,
    exportEmbedScene: false,
    exportImageScale: 1,
  });

  if (!appContext) return null;
  const { sceneName, excalidrawAPI } = appContext;
  const exportToFile = (name: string) => {
    if (!excalidrawAPI) return;
    const text = serializeAsJSON(
      excalidrawAPI.getSceneElementsIncludingDeleted(),
      excalidrawAPI.getAppState(),
      excalidrawAPI.getFiles(),
      "local",
    );
    if (name.includes(".")) {
      name += EXCALIDRAW_EXTENSION;
    }
    const savePath =
      window.utools &&
      window.utools.showSaveDialog({
        defaultPath: name,
        buttonLabel: "保存",
        filters: [{ name: "Excalidraw file", extensions: ["excalidraw"] }],
      });
    savePath &&
      window.writeFile &&
      window.writeFile(savePath, text).then(() => {
        window.utools && window.utools.shellShowItemInFolder(savePath);
      });
  };

  const exportToPng = (name: string, scale: number) => {
    if (!excalidrawAPI) return;
    const { exportImageScale, ...rest } = exportImageOptions;
    exportToBlob({
      elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
      appState: extend({}, excalidrawAPI.getAppState(), rest),
      files: excalidrawAPI.getFiles(),
      getDimensions: (w, h) => ({ width: w * scale, height: h * scale, scale }),
    })
      .then((blob) => blob?.arrayBuffer())
      .then((arrayBuffer) => {
        if (!arrayBuffer) return;
        const savePath =
          window.utools &&
          window.utools.showSaveDialog({
            defaultPath: name,
            buttonLabel: "保存",
            filters: [{ name: "PNG", extensions: ["png"] }],
          });
        savePath &&
          window.writeFile &&
          window
            .writeFile(savePath, arrayBuffer, { isArrayBuffer: true })
            .then(() => {
              window.utools && window.utools.shellShowItemInFolder(savePath);
            });
      });
  };

  return (
    <div className="flex w-full justify-around py-2">
      {/* 保存到本地 */}
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="flex rounded-full bg-green-500 p-6 text-[2.6em] ">
          <ToDiskIcon />
        </div>
        <p className="mt-4 text-black">将画布数据导出为文件，以便以后导入</p>
        <div
          className="mt-auto cursor-pointer select-none rounded bg-green-500 p-2 text-center hover:bg-green-700"
          onClick={() => {
            if (sceneName) exportToFile(sceneName);
          }}
        >
          保存到本地
        </div>
      </div>
      {/* 保存为图片 */}
      <div className="flex flex-col items-center gap-4 ">
        <div className="flex rounded-full bg-[#6965db] p-6 text-[2.6em] text-white">
          <ToImageIcon />
        </div>
        <div className="flex flex-col gap-2">
          <StyledCheckBox
            checked={exportImageOptions.exportBackground}
            onChange={(event) => {
              setExportImageOptions({
                ...exportImageOptions,
                exportBackground: event.currentTarget.checked,
              });
            }}
          >
            背景
          </StyledCheckBox>
          <StyledCheckBox
            checked={exportImageOptions.exportWithDarkMode}
            onChange={(event) => {
              setExportImageOptions({
                ...exportImageOptions,
                exportWithDarkMode: event.currentTarget.checked,
              });
            }}
          >
            黑暗模式
          </StyledCheckBox>
          <StyledCheckBox
            checked={exportImageOptions.exportEmbedScene}
            onChange={(event) => {
              setExportImageOptions({
                ...exportImageOptions,
                exportEmbedScene: event.currentTarget.checked,
              });
            }}
          >
            包含画布数据
          </StyledCheckBox>
          <div className="flex items-center gap-1">
            <span>缩放</span>
            <div className="flex gap-2 text-white">
              {[1, 2, 3].map((scale) => (
                <div
                  key={scale}
                  className={cn(
                    "flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded-md bg-[#6965db]",
                    scale === exportImageOptions.exportImageScale
                      ? "bg-[#6965db]"
                      : "bg-[#6965db]/50",
                  )}
                  onClick={() => {
                    setExportImageOptions({
                      ...exportImageOptions,
                      exportImageScale: scale,
                    });
                  }}
                >
                  {scale}x
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="cursor-pointer select-none rounded bg-[#6965db] p-2 text-center text-white hover:bg-[#4e4ba3]"
          onClick={() => {
            if (sceneName)
              exportToPng(sceneName, exportImageOptions.exportImageScale);
          }}
        >
          导出图片
        </div>
      </div>
    </div>
  );
};
export default ExportOps;
