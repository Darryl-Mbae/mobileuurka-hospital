import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,         // listen on all addresses (0.0.0.0)
    port: 5173,         // make sure it's the port you use
    allowedHosts: true, // allow all hosts (ngrok, local IP, etc.)
    hmr: {
      overlay: false    // keep your current setting
    }
  }
})
