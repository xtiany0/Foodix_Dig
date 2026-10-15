/**
 * Proposition d'installation de l'app sur l'écran d'accueil.
 *
 * Android (Chrome) : le navigateur envoie « beforeinstallprompt » ; on garde l'événement
 * et on affiche notre bannière (Plus tard / Installer).
 * iPhone (Safari) : pas d'installation automatique, on affiche un petit guide.
 * Proposition d'office à l'arrivée sur le site, au plus une fois tous les config.installSnoozeDays
 * jours : la date est notée dès qu'elle s'affiche (même sans réponse) et à chaque refus.
 * Le bouton « Installer l'app » du pied de page et la carte après commande restent disponibles.
 * Déjà installée (ouverte depuis l'écran d'accueil) : rien.
 */

import { useSyncExternalStore } from 'react';
import { config } from '../config';
import { readStored, writeStored } from './storage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const SNOOZE_KEY = 'installSnooze';
const SNOOZE_VERSION = 1;
const DAY_MS = 86_400_000;

/** Proposition autorisée si aucun refus récent. */
export function canOffer(snoozedAt: number | null, now: number, days = config.installSnoozeDays): boolean {
  return snoozedAt === null || now - snoozedAt >= days * DAY_MS || now < snoozedAt;
}

export function isStandalone(): boolean {
  return matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

/** iPhone ou iPad sous Safari (seul navigateur iOS qui propose « Sur l'écran d'accueil » partout). */
export function isIosSafari(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints): boolean {
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram/.test(ua);
}

/** Version de Safari (« Version/18.6 » → 18), null si absente. */
export function safariVersion(ua = navigator.userAgent): number | null {
  const m = /Version\/(\d+)/.exec(ua);
  return m ? Number(m[1]) : null;
}

/**
 * Parcours d'installation de ce Safari :
 * - « share » (iOS 18 et avant) : bouton Partager toujours visible, puis « Sur l'écran d'accueil » ;
 * - « menu » (iOS 26 et après, ou version inconnue) : « ••• » > Partager > En voir plus > Sur l'écran d'accueil.
 */
export function iosGuideKind(ua = navigator.userAgent): 'share' | 'menu' {
  const v = safariVersion(ua);
  return v !== null && v < 26 ? 'share' : 'menu';
}

/** iPad (ou iPad qui se présente comme un Mac) : le bouton Partager est en haut à droite. */
export function isIpad(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints): boolean {
  return /iPad/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Écouté dès le chargement du module : l'événement peut arriver avant React.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    emit();
  });
}

const readSnooze = () =>
  readStored<number | null>(SNOOZE_KEY, SNOOZE_VERSION, (d) => (typeof d === 'number' && Number.isFinite(d) ? d : null), null);

function snooze() {
  writeStored(SNOOZE_KEY, SNOOZE_VERSION, Date.now());
  emit();
}

export type InstallOffer = 'android' | 'ios' | null;

/** Installation possible maintenant, sans tenir compte du délai après « Plus tard » (bouton permanent). */
function currentMethod(): InstallOffer {
  if (installed || isStandalone()) return null;
  if (deferred) return 'android';
  if (isIosSafari()) return 'ios';
  return null;
}

// Proposition déjà affichée pendant cette visite : elle reste jusqu'à une réponse,
// même si sa date vient d'être notée.
let shownThisVisit = false;

/** Proposition automatique (bannière, guide iPhone) : au plus une fois tous les N jours. */
function currentOffer(): InstallOffer {
  return shownThisVisit || canOffer(readSnooze(), Date.now()) ? currentMethod() : null;
}

let cached: InstallOffer = null;
let cachedMethod: InstallOffer = null;
function snapshot() {
  cached = currentOffer();
  cachedMethod = currentMethod();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** Bannière Android ou guide iPhone à proposer d'office (null pendant le délai après un refus). */
export function useInstallOffer(): InstallOffer {
  return useSyncExternalStore(subscribe, () => cached, () => null);
}

/** Installation possible (bouton « Installer l'app » toujours visible tant que l'app n'est pas installée). */
export function useInstallMethod(): InstallOffer {
  return useSyncExternalStore(subscribe, () => cachedMethod, () => null);
}

// Calcul initial (lecture du stockage une fois, puis à chaque changement).
if (typeof window !== 'undefined') {
  snapshot();
  listeners.add(snapshot);
}

/** La proposition vient de s'afficher : pas de nouvelle proposition d'office avant N jours. */
export function markOffered(): void {
  if (shownThisVisit) return;
  shownThisVisit = true;
  writeStored(SNOOZE_KEY, SNOOZE_VERSION, Date.now());
}

/** « Plus tard » ou « J'ai compris » : rien pendant quelques jours. */
export function dismissInstall(): void {
  shownThisVisit = false;
  snooze();
}

/** « Installer » (Android) : ouvre la fenêtre d'installation du navigateur. */
export async function acceptInstall(): Promise<void> {
  const e = deferred;
  if (!e) return;
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  shownThisVisit = false;
  if (outcome === 'dismissed') snooze();
  else emit();
}
