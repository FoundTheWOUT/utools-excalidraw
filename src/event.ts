import { Scene } from "./types";
import { EventChanel } from "./utils/event";

export const loadScene = new EventChanel();
export const updateScene = new EventChanel<{
  target: string;
  value: Partial<Scene>;
}>();
export const startUpdateScene = new EventChanel();
export const endUpdateScene = new EventChanel();
