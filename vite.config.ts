import { defineConfig, type PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
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
  plugins: [react(), visualizer() as PluginOption],
  test: {
    environment: "jsdom",
    setupFiles: ["./setup-test.ts"],
  },
});
