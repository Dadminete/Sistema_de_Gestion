import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
// Export a function config to access mode and load env
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Auto-detect backend target: use localhost:54116 (or whatever VITE_API_BASE_URL specifies)
  const RAW_API = env.VITE_API_BASE_URL || 'http://localhost:54116/api'
  const BACKEND_TARGET = RAW_API.replace(/\/$/, '').replace(/\/api$/i, '')

  return {
    base: '/', // Ensure the base public path is correctly set
    plugins: [
      react(),
      visualizer({
        open: true, // Opens the report in your browser
        filename: 'bundle-analyzer-report.html', // Name of the report file
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      middlewareMode: false,
      logLevel: 'warn', // Only show warnings and errors, not info messages
      proxy: {
        // Proxy API calls to backend
        '/api': {
          target: BACKEND_TARGET,
          changeOrigin: true,
          rewrite: (path) => path, // keep /api prefix
        },
        // Proxy uploads to backend to avoid cross-origin blocks on images
        '/uploads': {
          target: BACKEND_TARGET,
          changeOrigin: true,
        },
      },
    },
  }
})
