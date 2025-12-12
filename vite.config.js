import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  content: ["node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}"],
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0", // Listen on all network interfaces
    port: 5173,
  },
});
