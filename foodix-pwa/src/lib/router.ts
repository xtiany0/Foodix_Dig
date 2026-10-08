/**
 * Navigation par le hash de l'adresse (#/, #/panier…) : pas de règle serveur
 * à prévoir et fonctionne hors connexion.
 *
 * Bouton retour Android : chaque écran et chaque fenêtre (fiche, confirmation…)
 * occupe une entrée de l'historique. Le retour ferme la fenêtre ouverte ou revient
 * à l'écran précédent ; il ne quitte jamais l'app d'un coup.
 */

import { useEffect, useRef, useSyncExternalStore } from 'react';

export type Route = 'menu' | 'panier';

const PATHS: Record<Route, string> = {
  menu: '#/',
  panier: '#/panier',
};

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').split('?')[0];
  const found = (Object.keys(PATHS) as Route[]).find((r) => PATHS[r] === '#' + path);
  return found ?? 'menu';
}

export const href = (route: Route) => PATHS[route];

/**
 * Au démarrage : si l'app s'ouvre directement sur un écran autre que le menu,
 * on glisse le menu dessous, pour que « retour » y mène au lieu de quitter l'app.
 * Les paramètres de l'adresse (ex. ?src=truck) sont conservés.
 */
export function initHistory(): void {
  const route = parseHash(location.hash);
  const base = location.pathname + location.search;
  if (route !== 'menu') {
    history.replaceState(null, '', base + PATHS.menu);
    history.pushState(null, '', base + PATHS[route]);
  } else if (location.hash !== PATHS.menu) {
    history.replaceState(null, '', base + PATHS.menu);
  }
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
  history.back();
}

/** Va à un écran ; replace = remplace l'écran courant dans l'historique. */
export function navigate(route: Route, replace = false): void {
  if (replace) {
    history.replaceState(null, '', PATHS[route]);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = PATHS[route];
  }
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
    history.pushState({ fxOverlay: true }, '');
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
