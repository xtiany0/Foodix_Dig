import { useEffect, useState } from 'react';
import { acceptInstall, dismissInstall, useInstallMethod } from '../lib/install';
import { readStored, writeStored } from '../lib/storage';
import { DownloadIcon } from './icons';
import { useOverlayHistory } from '../lib/router';
import { useDialog } from '../lib/useDialog';
import { useStore } from '../state/store';
import styles from './InstallPrompt.module.css';

/** Bannière Android « Installer Foodix » (Plus tard / Installer). */
export function InstallBanner() {
  const { t } = useStore();
  return (
    <div className={styles.banner}>
      <div className={styles.bannerRow}>
        <span className={styles.appIcon}>
          <img src="/brand/foodix-toque.webp" width={240} height={132} alt="" />
        </span>
        <div className={styles.bannerText}>
          <strong className={styles.title}>{t.installTitle}</strong>
          <span className={styles.text}>{t.installText}</span>
        </div>
      </div>
      <div className={styles.bannerActions}>
        <button type="button" className={styles.later} onClick={dismissInstall}>
          {t.later}
        </button>
        <button type="button" className={styles.install} onClick={() => void acceptInstall()}>
          {t.install}
        </button>
      </div>
    </div>
  );
}

const IOS_DELAY_MS = 3000;

function ShareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12M8 7l4-4 4 4M7 11H5v10h14V11h-2" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function IosSheet({ onClose }: { onClose: () => void }) {
  const { t } = useStore();
  const ref = useDialog<HTMLDivElement>(true, onClose);
  return (
    <div className={styles.overlay}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={t.iosAria} className={styles.sheet}>
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.iosHead}>
          <span className={`${styles.appIcon} ${styles.appIconLarge}`}>
            <img src="/brand/foodix-toque.webp" width={240} height={132} alt="" />
          </span>
          <div className={styles.bannerText}>
            <strong className={styles.iosTitle}>{t.iosTitle}</strong>
            <span className={styles.text}>{t.iosText}</span>
          </div>
        </div>
        <ol className={styles.steps}>
          <li className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepText}>
              {t.ios1a} <strong>{t.ios1b}</strong>
            </span>
            <ShareIcon />
          </li>
          <li className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepText}>
              {t.ios2a} <strong>{t.ios2b}</strong>
            </span>
            <AddIcon />
          </li>
          <li className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span className={styles.stepText}>
              {t.ios3a} <strong>{t.ios3b}</strong>
              {t.ios3c}
            </span>
          </li>
        </ol>
        <button type="button" className={styles.gotIt} onClick={onClose} data-autofocus>
          {t.gotIt}
        </button>
      </div>
    </div>
  );
}

/**
 * Guide iPhone « Partager > Sur l'écran d'accueil », proposé quelques secondes
 * après l'arrivée sur le menu, jamais par-dessus une autre fenêtre.
 */
export function IosGuide({ blocked }: { blocked: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
    dismissInstall();
  };
  useOverlayHistory(open, close);

  useEffect(() => {
    if (blocked || open) return;
    const id = window.setTimeout(() => setOpen(true), IOS_DELAY_MS);
    return () => clearTimeout(id);
  }, [blocked, open]);

  return open ? <IosSheet onClose={close} /> : null;
}

/** Lance l'installation : fenêtre de Chrome (Android) ou guide (iPhone). */
function useInstallAction() {
  const method = useInstallMethod();
  const [guide, setGuide] = useState(false);
  useOverlayHistory(guide, () => setGuide(false));
  const run = () => (method === 'android' ? void acceptInstall() : setGuide(true));
  const sheet = guide ? <IosSheet onClose={() => setGuide(false)} /> : null;
  return { method, run, sheet };
}

/**
 * Bouton « Installer l'app » du pied de page : toujours là tant que l'app n'est pas installée
 * et que le navigateur le permet, même après « Plus tard ».
 */
export function InstallButton({ onNavy = false }: { onNavy?: boolean }) {
  const { t } = useStore();
  const { method, run, sheet } = useInstallAction();
  if (!method) return null;
  return (
    <>
      <button type="button" className={`${styles.footerBtn} ${onNavy ? styles.footerBtnNavy : ''}`} onClick={run}>
        <DownloadIcon size={18} stroke={2.2} color={onNavy ? 'var(--fx-orange-on-navy)' : 'var(--fx-price)'} />
        {t.installApp}
      </button>
      {sheet}
    </>
  );
}

const ORDER_CARD_KEY = 'installOrderCard';

/** Après la première commande envoyée : une seule proposition d'installation, sur la confirmation. */
export function OrderInstallCard() {
  const { t } = useStore();
  const { method, run, sheet } = useInstallAction();
  const [firstTime] = useState(() => !readStored(ORDER_CARD_KEY, 1, (d) => (d === true ? true : null), false));
  useEffect(() => {
    if (firstTime && method) writeStored(ORDER_CARD_KEY, 1, true);
  }, [firstTime, method]);
  if (!firstTime || !method) return null;
  return (
    <div className={styles.banner}>
      <div className={styles.bannerRow}>
        <span className={styles.appIcon}>
          <img src="/brand/foodix-toque.webp" width={240} height={132} alt="" />
        </span>
        <div className={styles.bannerText}>
          <strong className={styles.title}>{t.orderInstallTitle}</strong>
          <span className={styles.text}>{t.orderInstallText}</span>
        </div>
      </div>
      <div className={styles.bannerActions}>
        <button type="button" className={styles.install} onClick={run}>
          {t.install}
        </button>
      </div>
      {sheet}
    </div>
  );
}
