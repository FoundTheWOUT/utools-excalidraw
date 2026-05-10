export type Scene = {
  id: string;
  name: string;
  sticky: boolean; // 置顶
  deleted: boolean;
  deletedAt: number | null;

  data?: string;
};

export type Store = {
  settings: {
    lastActiveDraw: string | null;
    asideWidth: number;
    asideClosed: boolean;
    closePreview: boolean;
    scenesId: string[];
    asideCloseAutomatically: boolean;
    deleteSceneDirectly: boolean;
    darkMode: boolean;
    theme: Theme;
    dev: boolean;
    selectedModel: string;
  };
  scenes: Map<string, Scene>;
};


export type DBItem = {
  _id: string;
  value: Array<unknown> | object | string | number;
};

export const Theme = {
  Light: "LIGHT",
  Dark: "DARK",
  App: "APP",
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export type Payload = Partial<{
  isFile: boolean;
  name: string;
  path: string;
}>;
