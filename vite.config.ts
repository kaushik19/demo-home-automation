import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Use a custom base path (e.g. "/repo-name/") when deploying to GitHub Pages.
// Set VITE_BASE in CI; defaults to "/" for Vercel / Netlify / Cloudflare Pages.
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
});
