import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { EventChanel } from "./utils/event";
import { AppState, BinaryFiles } from "@excalidraw/excalidraw/types/types";

export const loadScene = new EventChanel();
export const updateScene = new EventChanel<{
  target: string;
  elements: readonly ExcalidrawElement[];
  state: AppState;
  file: BinaryFiles;
}>();
export const startUpdateScene = new EventChanel();
export const endUpdateScene = new EventChanel();
