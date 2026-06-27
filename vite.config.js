import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/pws-aggregator/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'PWS Aggregator',
        short_name: 'PWSAgg',
        description: 'Personal Weather Station data aggregator from multiple sources',
        theme_color: '#0ea5e9',
        background_color: '#020817',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open-meteo-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 300 }
            }
          },
          {
            urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'owm-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 300 }
            }
          },
          {
            urlPattern: /^https:\/\/api\.tomorrow\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tomorrow-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 300 }
            }
          }
        ]
      }
    })
  ]
})
