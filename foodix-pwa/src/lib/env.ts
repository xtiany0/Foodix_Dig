import { useEffect, useState, useSyncExternalStore } from 'react';

export type Layout = 'phone' | 'tablet' | 'desktop';

/** Points de rupture, les mêmes que dans les feuilles de style. */
export const TABLET_MIN = 768;
export const DESKTOP_MIN = 1180;

const tabletQuery = `(min-width: ${TABLET_MIN}px)`;
const desktopQuery = `(min-width: ${DESKTOP_MIN}px)`;

function subscribeMedia(cb: () => void) {
  const lists = [matchMedia(tabletQuery), matchMedia(desktopQuery)];
  lists.forEach((l) => l.addEventListener('change', cb));
  return () => lists.forEach((l) => l.removeEventListener('change', cb));
}

/** Mise en page : téléphone, tablette (768 px et plus) ou ordinateur (1180 px et plus). */
export function useLayout(): Layout {
  return useSyncExternalStore(subscribeMedia, () =>
    matchMedia(desktopQuery).matches ? 'desktop' : matchMedia(tabletQuery).matches ? 'tablet' : 'phone',
  );
}

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

/** Connexion réseau disponible. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine);
}

/** Heure actuelle, rafraîchie toutes les 30 secondes (statut Ouvert / Fermé). */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
  return now;
}
