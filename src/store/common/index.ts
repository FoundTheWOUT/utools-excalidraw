import { DB_KEY, Store } from "@/types";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { StoreSystem } from "..";

// TODO: finish ssc
export class StoreSystemCommon implements StoreSystem {
  storeFile(excalidrawRef?: ExcalidrawImperativeAPI | null): void {}
  storeSetItem<T extends DB_KEY>(key: string, value: Store[T]): void {}
  handleLibraryChange(item: any): void {}
  removeScene(id: string): void {}
}
