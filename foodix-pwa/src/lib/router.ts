/**
 * Navigation par le hash de l'adresse (#/, #/panier…) : pas de règle serveur
 * à prévoir et fonctionne hors connexion.
 *
 * Bouton retour Android : chaque écran et chaque fenêtre (fiche, confirmation…)
 * occupe une entrée de l'historique. Le retour ferme la fenêtre ouverte ou revient
 * à l'écran précédent ; il ne quitte jamais l'app d'un coup.
 * Chaque entrée garde sa profondeur (d) : le menu est à 0.
 */

import { useEffect, useRef, useSyncExternalStore } from 'react';

export type Route = 'menu' | 'panier' | 'commande' | 'envoi' | 'confirmation' | 'commandes';

const PATHS: Record<Route, string> = {
  menu: '#/',
  panier: '#/panier',
  commande: '#/commande',
  envoi: '#/envoi',
  confirmation: '#/confirmation',
  commandes: '#/commandes',
};

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').split('?')[0];
  const found = (Object.keys(PATHS) as Route[]).find((r) => PATHS[r] === '#' + path);
  return found ?? 'menu';
}

export const href = (route: Route) => PATHS[route];

let depth = 0;

/** Note la profondeur de l'entrée courante ; une entrée créée par un lien reçoit celle d'avant + 1. */
function syncDepth() {
  const s = history.state as { d?: number } | null;
  if (s && typeof s.d === 'number') {
    depth = s.d;
  } else {
    depth = parseHash(location.hash) === 'menu' ? 0 : depth + 1;
    history.replaceState({ ...(s ?? {}), d: depth }, '');
  }
}

/**
 * Scan du QR code du food truck (?src=truck) : Cloudflare Web Analytics n'enregistre pas
 * les paramètres d'adresse. L'adresse devient donc /truck (même page : Cloudflare Pages sert l'app
 * pour toute adresse inconnue, et le service worker hors connexion),
 * avant le chargement du script de statistiques : les scans sont comptés sous le chemin /truck.
 */
export function analyticsPath(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  if (params.get('src') !== 'truck') return pathname + search;
  params.delete('src');
  const rest = params.toString();
  return '/truck' + (rest ? '?' + rest : '');
}

/**
 * Au démarrage : si l'app s'ouvre directement sur un écran autre que le menu,
 * on glisse le menu dessous, pour que « retour » y mène au lieu de quitter l'app.
 */
export function initHistory(): void {
  const route = parseHash(location.hash);
  const base = analyticsPath(location.pathname, location.search);
  history.replaceState({ d: 0 }, '', base + PATHS.menu);
  depth = 0;
  if (route !== 'menu') {
    history.pushState({ d: 1 }, '', base + PATHS[route]);
    depth = 1;
  }
  window.addEventListener('popstate', syncDepth);
  window.addEventListener('hashchange', syncDepth);
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  window.addEventListener('popstate', cb);
  return () => {
    window.removeEventListener('hashchange', cb);
    window.removeEventListener('popstate', cb);
  };
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, () => parseHash(location.hash));
}

/** Retour à l'écran précédent (le menu est toujours dessous, voir initHistory). */
export function goBack(): void {
  if (depth > 0) history.back();
  else navigate('menu', true);
}

/** Va à un écran ; replace = remplace l'écran courant dans l'historique. */
export function navigate(route: Route, replace = false): void {
  if (replace) {
    history.replaceState({ d: route === 'menu' ? 0 : depth }, '', PATHS[route]);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = PATHS[route];
  }
}

/**
 * Revient au menu dans l'historique puis ouvre `route` par-dessus.
 * Après l'envoi : « retour » depuis la confirmation mène au menu, pas au panier vidé.
 */
export function restartAt(route: Route): void {
  if (depth <= 0) {
    navigate(route);
    return;
  }
  const onPop = () => {
    window.removeEventListener('popstate', onPop);
    navigate(route);
  };
  window.addEventListener('popstate', onPop);
  history.go(-depth);
}

/**
 * Donne une entrée d'historique à une fenêtre (fiche, confirmation…) tant qu'elle est ouverte.
 * Retour Android : ferme la fenêtre. Fermeture par un bouton : l'entrée est retirée.
 */
export function useOverlayHistory(open: boolean, onClose: () => void): void {
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    history.pushState({ fxOverlay: true, d: depth + 1 }, '');
    depth += 1;
    let popped = false;
    const onPop = () => {
      popped = true;
      close.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!popped) history.back();
    };
  }, [open]);
}
