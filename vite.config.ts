import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa';

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
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'Sistema de Gestión',
          short_name: 'Sistema',
          description: 'Aplicación de gestión de cajas, facturas y clientes',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 300
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true
        }
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
