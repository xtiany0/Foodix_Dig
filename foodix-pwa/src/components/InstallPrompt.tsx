import { useEffect, useState } from 'react';
import { acceptInstall, dismissInstall, markOffered, useInstallMethod } from '../lib/install';
import { readStored, writeStored } from '../lib/storage';
import { DownloadIcon } from './icons';
import IosInstallGuide from './IosInstallGuide';
import { useOverlayHistory } from '../lib/router';
import { useStore } from '../state/store';
import styles from './InstallPrompt.module.css';

/**
 * Bannière Android « Installer Foodix » (Plus tard / Installer).
 * floating : carte posée en bas de l'écran (proposition arrivée après le lancement :
 * insérée dans la page, elle ferait sauter le menu sous le doigt).
 */
export function InstallBanner({ floating = false }: { floating?: boolean }) {
  const { t } = useStore();
  useEffect(markOffered, []);
  const banner = (
    <div className={`${styles.banner} ${floating ? styles.floatCard : ''}`} role={floating ? 'region' : undefined} aria-label={floating ? t.installTitle : undefined}>
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
  return floating ? <div className={styles.float}>{banner}</div> : banner;
}

const IOS_DELAY_MS = 3000;

/**
 * Guide d'installation iPhone, proposé quelques secondes après l'arrivée sur le menu,
 * jamais par-dessus une autre fenêtre.
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
    const id = window.setTimeout(() => {
      setOpen(true);
      markOffered();
    }, IOS_DELAY_MS);
    return () => clearTimeout(id);
  }, [blocked, open]);

  return open ? <IosInstallGuide onClose={close} /> : null;
}

/** Lance l'installation : fenêtre de Chrome (Android) ou guide (iPhone). */
function useInstallAction() {
  const method = useInstallMethod();
  const [guide, setGuide] = useState(false);
  useOverlayHistory(guide, () => setGuide(false));
  const run = () => (method === 'android' ? void acceptInstall() : setGuide(true));
  const sheet = guide ? <IosInstallGuide onClose={() => setGuide(false)} /> : null;
  return { method, run, sheet };
}

/**
 * Bulle « Installer l'app » posée en bas à gauche de l'écran du menu : visible sans descendre
 * jusqu'au pied de page. Au-dessus de la barre panier quand celle-ci prend toute la largeur.
 */
export function InstallBubble({ raised = false }: { raised?: boolean }) {
  const { t } = useStore();
  const { method, run, sheet } = useInstallAction();
  if (!method) return null;
  return (
    <>
      <button type="button" className={`${styles.bubble} ${raised ? styles.bubbleRaised : ''}`} onClick={run}>
        <span className={styles.bubbleIcon}>
          <DownloadIcon size={16} stroke={2.6} color="var(--fx-navy)" />
        </span>
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
