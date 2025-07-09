import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Chore-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Chore App',
        short_name: 'ChoreApp',
        start_url: '/Chore-app/',
        display: 'standalone',
        background_color: '#1f2937', // Tailwind gray-800
        theme_color: '#4f46e5',       // Tailwind indigo-600
        icons: [
          {
            src: '/Chore-app/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/Chore-app/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
