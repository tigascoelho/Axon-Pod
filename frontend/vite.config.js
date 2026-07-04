import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    // Allow the ngrok host used for testing in Bluefy (explicit whitelist).
    allowedHosts: ['stoppage-karate-oasis.ngrok-free.dev'],
  },
  plugins: [
    react(),
    legacy({
      // Keep support broad for in-app iOS browsers (e.g. Bluefy WebView).
      targets: ['defaults', 'ios >= 12'],
      renderModernChunks: false,
    }),
    viteSingleFile(),
  ],
})
