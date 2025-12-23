import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
dotenv.config();

const API_PROXY_PORT = process.env.VITE_APP_API_PROXY_PORT || "8000";
const CLIENT_PORT = parseInt(process.env.VITE_APP_PORT || "5173");
const COMBINED_API_URL = `${process.env.VITE_APP_API_BASE_URL}${API_PROXY_PORT}`;

export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router"],
          query: ["@tanstack/react-query"],
          radix: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-toast",
          ],
          icons: ["lucide-react"],
          util: [
            "axios",
            "zod",
            "clsx",
            "class-variance-authority",
            "tailwind-merge",
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: COMBINED_API_URL,
        changeOrigin: true,
      },
    },
    port: CLIENT_PORT,
    host: true,
    strictPort: true,
  },
  preview: {
    port: CLIENT_PORT,
    host: true,
    strictPort: true,
    proxy: {
      "/api": {
        target: COMBINED_API_URL,
        changeOrigin: true,
      },
    },
  },
});
