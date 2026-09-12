import path from "path";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  return {
    base: "./",
    define: {
      __PLUGIN_ID__: `"zejxtgx5"`,
      "process.env.IS_PREACT": JSON.stringify("false"),
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
    build: {
      outDir: "dist/web",
      rolldownOptions: {
        external: [/.*subset-worker\.chunk$/, /.*subset-shared\.chunk$/],
      },
    },
    plugins: [react(), visualizer()],
    test: {
      environment: "jsdom",
      setupFiles: ["./setup-test.ts"],
      // @excalidraw/excalidraw 的产物里有 `roughjs/bin/rough` 这类省略扩展名的导入，
      // 打包器（vite build）能解析，Node 原生 ESM 不能。而 vitest 默认会把 node_modules
      // 里的包"外部化"、直接交给 Node 加载，于是报 "Did you mean roughjs/bin/rough.js?"。
      // 内联后交给 Vite 处理，即可用 Vite 的解析器。
      server: {
        deps: {
          inline: ["@excalidraw/excalidraw"],
        },
      },
    },
  };
});
