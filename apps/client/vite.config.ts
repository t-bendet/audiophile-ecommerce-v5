import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_APP_");
  const clientPort = parseInt(env.VITE_APP_PORT || "5173");
  const apiProxyTarget =
    env.VITE_APP_API_PROXY_TARGET || "http://localhost:8000";

  return {
    plugins: [react(), tsconfigPaths(), svgr(), tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          // `test` matches resolved module paths, not package specifiers.
          codeSplitting: {
            groups: [
              {
                name: "react",
                test: /node_modules\/(react|react-dom|react-router)\//,
              },
              {
                name: "query",
                test: /node_modules\/@tanstack\/react-query\//,
              },
              {
                name: "radix",
                test: /node_modules\/@radix-ui\/react-(dialog|navigation-menu|tooltip|toast)\//,
              },
              {
                name: "icons",
                test: /node_modules\/lucide-react\//,
              },
              {
                name: "util",
                test: /node_modules\/(axios|zod|clsx|class-variance-authority|tailwind-merge)\//,
              },
            ],
          },
        },
      },
    },
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
      port: clientPort,
      host: true,
      strictPort: true,
    },
    preview: {
      port: clientPort,
      host: true,
      strictPort: true,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
