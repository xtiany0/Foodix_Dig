/**
 * Actualisation au retour dans l'app.
 *
 * Sur iPhone (et souvent sur Android), l'app installée reste en mémoire : sans rien faire,
 * le client verrait le menu et la version du jour où il l'a ouverte. Au retour après
 * config.refreshAfterMinutes minutes ailleurs :
 * - le menu est rechargé sans bruit (ruptures, prix) ; le panier est gardé ;
 * - le service worker cherche une nouvelle version du site ; si elle arrive, la page est
 *   rechargée au premier moment sûr : sur le menu, sans fiche ni fenêtre ouverte.
 */

import { useEffect, useRef, useState } from 'react';
import { config } from '../config';
import type { Menu } from '../types/menu';
import { loadMenu } from './menu';

/** Faut-il actualiser au retour ? (absence assez longue) */
export function shouldRefresh(hiddenAt: number | null, now: number, minutes = config.refreshAfterMinutes): boolean {
  return hiddenAt !== null && now - hiddenAt >= minutes * 60_000;
}

/** Recharge le menu au retour ; appelle onMenu seulement s'il a changé. */
export function useResumeRefresh(current: Menu, onMenu: (menu: Menu) => void): void {
  const latest = useRef({ current, onMenu });
  latest.current = { current, onMenu };

  useEffect(() => {
    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      if (!shouldRefresh(hiddenAt, Date.now())) return;
      hiddenAt = null;
      loadMenu()
        .then((menu) => {
          if (JSON.stringify(menu) !== JSON.stringify(latest.current.current)) latest.current.onMenu(menu);
        })
        .catch(() => {}); // Hors connexion : on garde le menu affiché.
      void navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
}

/** Nouvelle version du site installée par le service worker pendant que l'app était ouverte. */
export function useUpdateReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sw = navigator.serviceWorker;
    // Première visite : le premier service worker prend la main, ce n'est pas une mise à jour.
    if (!sw?.controller) return;
    const onChange = () => setReady(true);
    sw.addEventListener('controllerchange', onChange);
    return () => sw.removeEventListener('controllerchange', onChange);
  }, []);
  return ready;
}
