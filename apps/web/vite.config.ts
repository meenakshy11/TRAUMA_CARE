import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    watch: {
      usePolling: true,   // needed for Docker on Windows (inotify doesn't work across volume mounts)
      interval: 1000,
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
})
