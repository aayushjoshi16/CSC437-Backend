import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward all requests from localhost:5173/api/* to localhost:3000/api/*
      "/api": "http://localhost:3000",
    },
  },
});
