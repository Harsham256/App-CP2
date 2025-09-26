

// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default {
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    }
  }
}