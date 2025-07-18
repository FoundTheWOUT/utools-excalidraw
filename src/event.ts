import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { EventChanel } from "./utils/event";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

export const loadScene = new EventChanel();
export const updateScene = new EventChanel<{
  target: string;
  elements: readonly ExcalidrawElement[];
  state: AppState;
  file: BinaryFiles;
}>();
export const startUpdateScene = new EventChanel();
export const endUpdateScene = new EventChanel();
