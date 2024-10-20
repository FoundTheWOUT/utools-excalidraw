export const TEN_MB = 10485760;
export const FILE_DOC_PREFIX = "file";
export const EXCALIDRAW_EXTENSION = ".excalidraw";

export const ALLOW_HOSTS = [
  "https://blog.excalidraw.com/",
  "https://github.com/excalidraw/excalidraw#documentation",
  "https://github.com/excalidraw/excalidraw/issues",
  "https://docs.excalidraw.com/",
  "https://libraries.excalidraw.com",
];

export const REDIRECT_HOSTS = {
  "https://github.com/excalidraw/excalidraw/issues":
    "https://github.com/FoundTheWOUT/utools-excalidraw/issues",
} as Record<string, string>;

export const ENTER_ACTION = {
  LOAD_FILE: "load-excalidraw-file",
  FOCUS_SCENE: "search-scenes",
} as const;

export const SKIP_ENTER_ACTION = import.meta.env.PROD ? false : true;
