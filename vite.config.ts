import { defineConfig, type PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
const path = require("path");

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  define: {
    __PLUGIN_ID__: `"zejxtgx5"`,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    outDir: "dist/web",
  },
  plugins: [react(), visualizer() as PluginOption],
});
