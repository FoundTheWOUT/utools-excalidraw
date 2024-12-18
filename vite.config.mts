import { defineConfig, type PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(({ command }) => {
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
    },
    plugins: [
      react(),
      visualizer() as PluginOption,
      command === "serve" &&
        viteStaticCopy({
          targets: [
            {
              src: "node_modules/@excalidraw/excalidraw/dist/dev/*",
              dest: "static",
            },
          ],
        }),
    ],
    test: {
      environment: "jsdom",
      setupFiles: ["./setup-test.ts"],
    },
  };
});
