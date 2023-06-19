import { DB_KEY, Scene, Store } from "@/types";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { StoreSystem } from "..";

// TODO: finish ssc
export class StoreSystemCommon implements StoreSystem {
  getStore(): Promise<Store> {
    return new Promise<Store>();
  }
  getFile(key: string): Uint8Array | null {
    return null;
  }
  storeScene(key: string | null | undefined, data: Scene): void {}
  dropDeletedFiles(scenes: Scene[]): void {}
  storeFile(excalidrawRef?: ExcalidrawImperativeAPI | null): void {}
  storeSetItem<T extends DB_KEY>(key: string, value: Store[T]): void {}
  handleLibraryChange(item: any): void {}
  removeScene(id: string): void {}
}
