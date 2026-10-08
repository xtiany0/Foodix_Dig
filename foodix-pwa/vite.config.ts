/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const MENU_PATH = fileURLToPath(new URL('./data/menu.json', import.meta.url));

/**
 * data/menu.json reste la source de vérité du menu.
 * Ce plugin le sert à l'adresse /menu.json en développement
 * et le copie tel quel dans dist/ au build : il est chargé au démarrage,
 * pas intégré au JavaScript, donc une mise à jour du menu ne change pas le bundle.
 */
function menuJson(): Plugin {
  return {
    name: 'foodix-menu-json',
    configureServer(server) {
      server.watcher.add(MENU_PATH);
      server.middlewares.use('/menu.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(readFileSync(MENU_PATH));
      });
    },
    generateBundle() {
      const source = readFileSync(MENU_PATH, 'utf8');
      JSON.parse(source); // un menu.json invalide fait échouer le build
      this.emitFile({ type: 'asset', fileName: 'menu.json', source });
    },
  };
}

const NIGHT = '#15132D';

export default defineConfig({
  plugins: [
    react(),
    menuJson(),
    VitePWA({
      // Nouvelle version : le service worker se met à jour seul, sans bouton.
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      includeAssets: ['icons/favicon-32.png', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Foodix · Menu et commande',
        short_name: 'Foodix',
        description: 'Menu Foodix, food truck à Cotonou. Commandez en livraison ou à emporter sur WhatsApp.',
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: NIGHT,
        theme_color: NIGHT,
        categories: ['food', 'shopping'],
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Coquille de l'app, polices et logos WebP (+ icônes du manifest) : disponibles hors connexion.
        globPatterns: ['**/*.{js,css,html,woff2}', 'brand/*.webp'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Menu : réseau d'abord (ruptures et prix à jour), copie enregistrée si le réseau
            // est absent ou trop lent (3 s), pour consulter le menu hors connexion.
            urlPattern: ({ url }) => url.pathname === '/menu.json',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'foodix-menu',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
