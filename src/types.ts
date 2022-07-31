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
    lastActiveDraw: number;
    asideWidth: number;
    closePreview: boolean;
  };
  [DB_KEY.SCENES]: Scene[];
};

export enum DB_KEY {
  SETTINGS = "settings",
  SCENES = "scenes",
}
