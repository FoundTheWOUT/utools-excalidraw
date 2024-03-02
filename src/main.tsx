import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App";
import StoreSystem from "./store";
import { loadInitialData } from "./utils/data";
import { ALLOW_HOSTS, REDIRECT_HOSTS } from "./const";
import { handleFileLoadAction, handleSearchSceneAction } from "./enterActions";

function registerALinkHandler() {
  const aLinkHandler = (e: MouseEvent) => {
    const target = e.target as HTMLLinkElement | null;
    if (target?.nodeName !== "A") {
      return;
    }
    const url = new URL(target.href);
    if (ALLOW_HOSTS.includes(url.origin)) {
      const targetHref = REDIRECT_HOSTS[target.href] ?? target.href;
      window.utools && window.utools.shellOpenExternal(targetHref);
      e.preventDefault();
      window.open(targetHref, "_blank", "noopener noreferrer");
    }
  };

  document.addEventListener("click", aLinkHandler);
}

async function main() {
  const store = await StoreSystem.getStore();
  await handleFileLoadAction(store);
  await handleSearchSceneAction(store);
  const {
    scenes,
    settings: { lastActiveDraw },
  } = store;

  const initialData = await loadInitialData(scenes, lastActiveDraw!);

  const container = document.getElementById("root");
  const root = createRoot(container!);
  registerALinkHandler();

  root.render(
    <StrictMode>
      <App store={store} initialData={initialData} />
    </StrictMode>,
  );
}

main();
