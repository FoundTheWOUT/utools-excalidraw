import type { TTDPersistenceAdapter } from "@excalidraw/excalidraw/index";
import type { ExcalidrawImperativeAPI, LibraryItems } from "@excalidraw/excalidraw/types";
import type { Store, Scene, DB_KEY } from "@/types";


export interface StoreSystem {
  getStore(): Promise<Store>;

  getFile(key: string): Promise<Uint8Array | null>;

  // TODO: update scenesCollection after store
  storeScene(key: string, data: Scene): void;

  storeSetItem<T extends DB_KEY>(key: string, value: Store[T]): void;

  storeFile(excalidrawRef?: ExcalidrawImperativeAPI | null): void;

  removeScene(key: string): void;

  handleLibraryChange(item: LibraryItems): void;

  dropDeletedFiles(scenes: Map<string, Scene>): void;

  ttdDialogPersistenceAdapter: TTDPersistenceAdapter;
}
