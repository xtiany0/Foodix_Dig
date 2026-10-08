import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseMenu } from '../src/lib/menu';
import type { Menu } from '../src/types/menu';

const MENU_PATH = fileURLToPath(new URL('../data/menu.json', import.meta.url));

/** Contenu brut de data/menu.json (copie neuve à chaque appel). */
export function rawMenu(): Record<string, unknown> {
  return JSON.parse(readFileSync(MENU_PATH, 'utf8'));
}

/** Le vrai menu, vérifié par parseMenu. */
export function realMenu(): Menu {
  return parseMenu(rawMenu());
}
