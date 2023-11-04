import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App";
import StoreSystem from "./store";
import { loadInitialData } from "./utils/data";

async function main() {
  const store = await StoreSystem.getStore();
  const {
    scenes,
    settings: { lastActiveDraw },
  } = store;
  const initialData = await loadInitialData(scenes, lastActiveDraw!);

  const container = document.getElementById("root");
  const root = createRoot(container!);

  root.render(
    <StrictMode>
      <App store={store} initialData={initialData} />
    </StrictMode>,
  );
}

main();
