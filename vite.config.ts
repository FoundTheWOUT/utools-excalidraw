import { defineConfig } from "vite";
const path = require("path");
import react from "@vitejs/plugin-react";

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
  plugins: [react()],
});
