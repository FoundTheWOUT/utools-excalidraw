import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  define: {
    __PLUGIN_ID__: `"zejxtgx5"`,
  },
  build: {
    outDir: "dist/web",
  },
  plugins: [react()],
});
