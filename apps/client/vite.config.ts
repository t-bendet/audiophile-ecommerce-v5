import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
dotenv.config();

export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
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
        target: `http://localhost:${process.env.VITE_APP_API_PROXY_PORT || 8000}`,
        changeOrigin: true,
      },
    },
    port: parseInt(process.env.VITE_APP_PORT || "5173"),
    host: true,
    strictPort: true,
  },
  preview: {
    port: parseInt(process.env.VITE_APP_PORT || "5173"),
    host: true,
    strictPort: true,
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.VITE_APP_API_PROXY_PORT || 8000}`,
        changeOrigin: true,
      },
    },
  },
});
