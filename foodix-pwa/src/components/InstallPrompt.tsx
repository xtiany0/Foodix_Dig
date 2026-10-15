import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { acceptInstall, dismissInstall, iosGuideKind, isIpad, markOffered, useInstallMethod } from '../lib/install';
import { readStored, writeStored } from '../lib/storage';
import { DownloadIcon } from './icons';
import { useOverlayHistory } from '../lib/router';
import { useDialog } from '../lib/useDialog';
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

/* Dessins des boutons tels qu'ils apparaissent sur l'iPhone (décoratifs : le texte dit la même chose). */

function KeyDots() {
  return (
    <span className={styles.key} aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="19" cy="12" r="2" />
      </svg>
    </span>
  );
}

function KeyShare({ small = false }: { small?: boolean }) {
  return (
    <span className={`${styles.key} ${small ? styles.keySmall : ''}`} aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12M8 7l4-4 4 4M7 11H5v10h14V11h-2" />
      </svg>
    </span>
  );
}

function KeyMore() {
  return (
    <span className={styles.key} aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

function KeyHome() {
  return (
    <span className={styles.key} aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    </span>
  );
}

function KeyAdd({ label }: { label: string }) {
  return (
    <span className={styles.keyAdd} aria-hidden="true">
      {label}
    </span>
  );
}

function IosSheet({ onClose }: { onClose: () => void }) {
  const { t } = useStore();
  const ref = useDialog<HTMLDivElement>(true, onClose);
  // Safari d'iOS 18 et avant : Partager est toujours visible. iOS 26 : il passe par « ••• ».
  const kind = iosGuideKind();
  const add = { lead: t.ios4, key: t.ios4Key, end: t.ios4End, icon: <KeyAdd label={t.iosButtonAdd} /> };
  const steps =
    kind === 'share'
      ? [
          { lead: t.iosShare, key: t.iosShareKey, end: t.iosShareEnd(isIpad() ? t.iosTopRight : t.iosBottom), icon: <KeyShare /> },
          { lead: t.iosHome, key: t.ios3Key, end: '', icon: <KeyHome /> },
          add,
        ]
      : [
          { lead: t.ios1, key: t.ios1Key, end: t.ios1End, icon: <KeyDots /> },
          { lead: t.ios2, key: t.ios2Key, end: t.ios2End, icon: <KeyMore /> },
          { lead: t.ios3, key: t.ios3Key, end: t.ios3End, icon: <KeyHome /> },
          add,
        ];
  // Rendu à la racine de la page : ouvert depuis le pied de page bleu nuit, le guide
  // n'hérite pas de son texte blanc (sinon titre et étapes blancs sur fond blanc).
  return createPortal(
    <div className={styles.overlay}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={t.iosAria} className={styles.sheet}>
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.iosHead}>
          <span className={`${styles.appIcon} ${styles.appIconLarge}`}>
            <img src="/brand/foodix-toque.webp" width={240} height={132} alt="" />
          </span>
          <div className={styles.bannerText}>
            <strong className={styles.iosTitle}>{t.iosTitle}</strong>
            <span className={styles.text}>{t.iosText(steps.length)}</span>
          </div>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={i} className={styles.step}>
              <span className={styles.stepNum}>{i + 1}</span>
              <span className={styles.stepText}>
                {step.lead} <strong>{step.key}</strong> {step.end}
                {i === 0 && kind === 'menu' && (
                  <span className={styles.stepAlt}>
                    <KeyShare small /> {t.ios1Alt}
                  </span>
                )}
              </span>
              {step.icon}
            </li>
          ))}
        </ol>
        <p className={styles.iosDone}>{t.iosDone}</p>
        <button type="button" className={styles.gotIt} onClick={onClose} data-autofocus>
          {t.gotIt}
        </button>
      </div>
    </div>,
    document.body,
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
    const id = window.setTimeout(() => {
      setOpen(true);
      markOffered();
    }, IOS_DELAY_MS);
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
