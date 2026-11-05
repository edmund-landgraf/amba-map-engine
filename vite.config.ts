import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  preview: { port: 5192 },
  define: { "process.env": {} },
  server: {
    port: 5192,
    proxy: { "/api": "http://localhost:3112" }
  },
  build: { outDir: "dist/web" }
});
