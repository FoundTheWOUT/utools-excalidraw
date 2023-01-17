export type Scene = {
  id: string;
  name: string;
  sticky: boolean; // 置顶
} & Partial<{
  img: string; //preview img base64
  data: string;
}>;

export type Store = {
  [DB_KEY.SETTINGS]: {
    lastActiveDraw: string | null;
    asideWidth: number;
    asideClosed: boolean;
    closePreview: boolean;
    scenesId: string[];
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
  value: Array<any> | Object | string | number;
};
