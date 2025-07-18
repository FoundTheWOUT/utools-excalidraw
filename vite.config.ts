import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
import path from "path";

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
      rollupOptions: {
        external: [/.*subset-worker\.chunk$/, /.*subset-shared\.chunk$/],
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "es2022",
      },
    },
    plugins: [react(), visualizer()],
    test: {
      environment: "jsdom",
      setupFiles: ["./setup-test.ts"],
    },
  };
});
