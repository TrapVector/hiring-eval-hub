import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves project sites from /<repo-name>/. VITE_BASE is injected
// by the deploy workflow as /${{ github.event.repository.name }}/ so this
// stays correct even if the repo is renamed; falls back to the current name.
const base = process.env.VITE_BASE ?? '/hiring-eval-hub/'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? base : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Only precache the app shell. Sheets API responses must never be
      // cached by the service worker — data freshness comes from polling,
      // offline data comes from the IndexedDB snapshot (see CLAUDE.md §10).
      workbox: {
        navigateFallbackDenylist: [/^\/?api\//],
        runtimeCaching: [],
      },
      manifest: {
        name: 'Arcade Hiring Review',
        short_name: 'Hiring Review',
        description: 'Review and track job applicants through a hiring pipeline.',
        theme_color: '#16171d',
        background_color: '#16171d',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
}))
