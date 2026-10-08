/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

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

export default defineConfig({
  plugins: [react(), menuJson()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
