/**
 * Fin de l'écran de lancement (#launch dans index.html).
 *
 * Durée minimale comptée depuis l'ouverture de la page : un chargement plus
 * lent (3G) n'est jamais rallongé. Une seule fois par visite, et jamais quand
 * l'app s'ouvre directement sur un autre écran que le menu (retour de WhatsApp,
 * lien vers le panier). La barre se remplit, puis l'écran s'efface en fondu.
 */

import { config } from '../config';

const SEEN_KEY = 'foodix.launchSeen';
const FILL_MS = 150;
const FADE_MS = 200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function alreadySeen(): boolean {
  try {
    const seen = sessionStorage.getItem(SEEN_KEY) === '1';
    sessionStorage.setItem(SEEN_KEY, '1');
    return seen;
  } catch {
    return false;
  }
}

/** À appeler une fois l'app affichée sous l'écran de lancement. */
export async function finishLaunch(): Promise<void> {
  const el = document.getElementById('launch');
  if (!el) return;
  const deepLink = !['', '#', '#/'].includes(location.hash);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (alreadySeen() || deepLink) {
    el.remove();
    return;
  }

  const wait = config.launchMinMs - performance.now();
  if (wait > 0) await sleep(wait);

  if (!reduced) {
    // La barre part de sa position animée et se remplit jusqu'au bout.
    const bar = el.querySelector<HTMLElement>('.fx-launch__bar');
    if (bar) {
      bar.style.transform = getComputedStyle(bar).transform;
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.transition = `transform ${FILL_MS}ms ease-out`;
      bar.style.transform = 'none';
      await sleep(FILL_MS);
    }
    el.classList.add('fx-launch--out');
    await sleep(FADE_MS);
  }
  el.remove();
}

/** Retire l'écran de lancement tout de suite (erreur de chargement). */
export function dropLaunch(): void {
  document.getElementById('launch')?.remove();
}
