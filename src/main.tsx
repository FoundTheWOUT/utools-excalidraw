import React from "react";
import * as ReactDOM from "react-dom";
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
  
  ReactDOM.render(
    <React.StrictMode>
      <App store={store} initialData={initialData} />
    </React.StrictMode>,
    document.getElementById("root"),
  );
}

main();
