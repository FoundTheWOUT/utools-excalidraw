export type Scene = {
  id: string;
  name: string;
  sticky: boolean; // 置顶
  deleted: boolean;
  deletedAt: number | null;

  img?: string; //preview img base64
  data?: string;
};

export type Store = {
  [DB_KEY.SETTINGS]: {
    lastActiveDraw: string | null;
    asideWidth: number;
    asideClosed: boolean;
    closePreview: boolean;
    scenesId: string[];
    asideCloseAutomatically: boolean;
    deleteSceneDirectly: boolean;
    darkMode: boolean;
    theme: Theme;
  };
  [DB_KEY.SCENES]: Scene[];
  scenes_map: Map<string, Scene>;
};

export enum DB_KEY {
  SETTINGS = "settings",
  SCENES = "scenes",
}

export type DBItem = {
  _id: string;
  value: Array<unknown> | object | string | number;
};

export enum Theme {
  Light = "LIGHT",
  Dark = "DARK",
  App = "APP",
}

export type Payload = Partial<{
  isFile: boolean;
  name: string;
  path: string;
}>;
