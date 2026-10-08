/**
 * Proposition d'installation de l'app sur l'écran d'accueil.
 *
 * Android (Chrome) : le navigateur envoie « beforeinstallprompt » ; on garde l'événement
 * et on affiche notre bannière (Plus tard / Installer).
 * iPhone (Safari) : pas d'installation automatique, on affiche un petit guide.
 * Après « Plus tard » ou un refus : rien pendant config.installSnoozeDays jours.
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

function currentOffer(): InstallOffer {
  if (installed || isStandalone() || !canOffer(readSnooze(), Date.now())) return null;
  if (deferred) return 'android';
  if (isIosSafari()) return 'ios';
  return null;
}

let cached: InstallOffer = null;
function snapshot(): InstallOffer {
  cached = currentOffer();
  return cached;
}

export function useInstallOffer(): InstallOffer {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => cached,
    () => null,
  );
}

// Calcul initial (lecture du stockage une fois, puis à chaque changement).
if (typeof window !== 'undefined') {
  snapshot();
  listeners.add(snapshot);
}

/** « Plus tard » ou « J'ai compris » : rien pendant quelques jours. */
export function dismissInstall(): void {
  snooze();
}

/** « Installer » (Android) : ouvre la fenêtre d'installation du navigateur. */
export async function acceptInstall(): Promise<void> {
  const e = deferred;
  if (!e) return;
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === 'dismissed') snooze();
  else emit();
}
