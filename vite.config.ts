import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const ANY_SIZES = [48, 72, 96, 128, 144, 192, 256, 384, 512]

export default defineConfig({
  define: {
    // shown on the parents' screen so a parent can see which version the tablet runs
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a new version downloads in the background and waits; src/pwa.ts decides
      // when to switch (home page, or the next time the app opens / comes back).
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: '/',
        name: 'Ella',
        short_name: 'Ella',
        description: 'גזעי כלבים: תמונות ועובדות בעברית',
        lang: 'he',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // both portrait and landscape
        orientation: 'any',
        background_color: '#fff8ee',
        theme_color: '#f28c28',
        categories: ['education', 'kids'],
        icons: [
          ...ANY_SIZES.map((s) => ({ src: `icons/icon-${s}.png`, sizes: `${s}x${s}`, type: 'image/png', purpose: 'any' })),
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        // Precache the app shell, the fonts, the icons and EVERY breed photo and
        // thumbnail, so the whole app works offline after the first open.
        // scripts/check-precache.mjs fails the build if any photo is missing.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,txt,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
