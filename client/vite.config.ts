import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    host: "localhost",
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:5243",
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
