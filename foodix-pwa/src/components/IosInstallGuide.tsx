import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { config } from '../config';
import { iosGuideKind, isIpad } from '../lib/install';
import { useDialog } from '../lib/useDialog';
import { useStore } from '../state/store';
import styles from './IosInstallGuide.module.css';

/*
 * Guide d'installation iPhone, une étape par écran, avec un dessin simplifié de ce que
 * le client voit et le bouton à toucher entouré en orange. Trois parcours :
 * - Safari d'iOS 18 et avant : Partager > Sur l'écran d'accueil > Ajouter ;
 * - Safari d'iOS 26 : ••• > Partager > En voir plus > Sur l'écran d'accueil > Ajouter ;
 * - autre navigateur (Chrome, Instagram, Facebook…) : copier le lien et l'ouvrir dans Safari.
 * Les dessins sont décoratifs (aria-hidden) : le texte de chaque étape dit la même chose.
 */

type Pic = 'safariBar' | 'safariCompact' | 'menu' | 'shareMore' | 'shareHome' | 'add' | 'home' | 'copy' | 'safariApp' | 'paste';

/* ---------- Petits dessins ---------- */

const ShareGlyph = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12M8 7l4-4 4 4M7 11H5v10h14V11h-2" />
  </svg>
);

const Compass = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9.5" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor" />
  </svg>
);

/** Adresse dessinée dans la barre de Safari : celle que le client voit vraiment. */
const host = typeof location === 'undefined' ? 'foodix' : location.host;

const Toque = () => <img src="/brand/foodix-toque.webp" width={240} height={132} alt="" />;

/** Entoure le bouton à toucher, avec un halo qui pulse. */
const Hit = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span className={`${styles.hit} ${className}`}>{children}</span>
);

const Bars = ({ n }: { n: number }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <span key={i} className={styles.row}>
        <span className={styles.rowIcon} />
        <span className={styles.rowBar} style={{ width: `${55 - i * 8}%` }} />
      </span>
    ))}
  </>
);

function Picture({ pic, t }: { pic: Pic; t: ReturnType<typeof useStore>['t'] }) {
  const g = t.iosGuide;
  switch (pic) {
    case 'safariBar':
      // Safari d'iOS 18 : barre d'adresse puis barre d'outils en bas.
      return (
        <div className={`${styles.screen} ${styles.bottom}`}>
          <span className={styles.page} />
          <span className={styles.address}>{host}</span>
          <span className={styles.toolbar}>
            <span className={styles.tool}>‹</span>
            <span className={styles.tool}>›</span>
            <Hit>
              <ShareGlyph />
            </Hit>
            <span className={styles.tool}>▢</span>
            <span className={styles.tool}>⧉</span>
          </span>
        </div>
      );
    case 'safariCompact':
      // Safari d'iOS 26 : une seule barre. Selon le réglage, le menu est sous ••• à droite,
      // ou sous ☰ dans la barre d'adresse (le bouton des onglets prend alors la droite).
      return (
        <div className={`${styles.screen} ${styles.bottom}`}>
          <span className={styles.page} />
          <span className={styles.compact}>
            <span className={styles.tool}>‹</span>
            <span className={styles.address}>{host}</span>
            <Hit>•••</Hit>
          </span>
          <span className={styles.or}>{g.or}</span>
          <span className={styles.compact}>
            <span className={styles.tool}>‹</span>
            <span className={`${styles.address} ${styles.addressMenu}`}>
              <Hit className={styles.hitSmall}>☰</Hit>
              <span className={styles.addressText}>{host}</span>
              <span className={styles.reload}>↻</span>
            </span>
            <span className={styles.tool}>⧉</span>
          </span>
        </div>
      );
    case 'menu':
      return (
        <div className={`${styles.screen} ${styles.bottom}`}>
          <span className={styles.page} />
          <span className={styles.menu}>
            <Hit className={styles.hitRow}>
              <ShareGlyph />
              {g.share}
            </Hit>
            <Bars n={3} />
          </span>
        </div>
      );
    case 'shareMore':
    case 'shareHome':
      // Feuille de partage : en-tête Foodix, applications, puis la liste des actions.
      return (
        <div className={`${styles.screen} ${styles.sheetPic}`}>
          <span className={styles.sheetHead}>
            <span className={styles.miniIcon}>
              <Toque />
            </span>
            <span className={styles.rowBar} style={{ width: '40%' }} />
          </span>
          <span className={styles.apps}>
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className={styles.list}>
            <Bars n={pic === 'shareMore' ? 2 : 1} />
            {pic === 'shareMore' ? (
              <Hit className={styles.hitRow}>
                <span className={styles.chev}>⌄</span>
                {g.more}
              </Hit>
            ) : (
              <Hit className={styles.hitRow}>
                <span className={styles.plus}>+</span>
                {g.homeScreen}
              </Hit>
            )}
          </span>
        </div>
      );
    case 'add':
      return (
        <div className={`${styles.screen} ${styles.sheetPic}`}>
          <span className={styles.addBar}>
            <span className={styles.blue}>{g.cancel}</span>
            <span className={styles.rowBar} style={{ width: '30%' }} />
            <Hit className={styles.hitBlue}>{g.add}</Hit>
          </span>
          <span className={styles.addCard}>
            <span className={styles.miniIcon}>
              <Toque />
            </span>
            <span className={styles.addName}>Foodix</span>
          </span>
        </div>
      );
    case 'home':
    case 'safariApp':
      // Écran d'accueil : l'icône Foodix (ou Safari) entourée parmi les autres apps.
      return (
        <div className={`${styles.screen} ${styles.homePic}`}>
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={styles.app} />
          ))}
          <span className={styles.appCell}>
            <Hit className={styles.hitApp}>
              {pic === 'home' ? (
                <span className={styles.foodixApp}>
                  <Toque />
                </span>
              ) : (
                <span className={styles.safariApp}>
                  <Compass size={30} />
                </span>
              )}
            </Hit>
            <span className={styles.appLabel}>{pic === 'home' ? 'Foodix' : 'Safari'}</span>
          </span>
        </div>
      );
    case 'paste':
      return (
        <div className={`${styles.screen} ${styles.bottom}`}>
          <span className={styles.page} />
          <span className={styles.bubble}>
            <Hit className={styles.hitDark}>{g.paste}</Hit>
          </span>
          <span className={`${styles.address} ${styles.addressFocus}`}>|</span>
        </div>
      );
    case 'copy':
      return null;
  }
}

/* ---------- Guide ---------- */

export default function IosInstallGuide({ onClose }: { onClose: () => void }) {
  const { t } = useStore();
  const g = t.iosGuide;
  const ref = useDialog<HTMLDivElement>(true, onClose);
  const kind = iosGuideKind();
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState(false);

  const steps: { pic: Pic; text: string }[] =
    kind === 'share'
      ? [
          { pic: 'safariBar', text: isIpad() ? g.shareTopRight : g.shareBottom },
          { pic: 'shareHome', text: g.tapHome },
          { pic: 'add', text: g.tapAdd },
          { pic: 'home', text: g.done },
        ]
      : kind === 'menu'
        ? [
            { pic: 'safariCompact', text: g.tapDots },
            { pic: 'menu', text: g.tapShare },
            { pic: 'shareMore', text: g.tapMore },
            { pic: 'shareHome', text: g.tapHome },
            { pic: 'add', text: g.tapAdd },
            { pic: 'home', text: g.done },
          ]
        : [
            { pic: 'copy', text: g.notSafari },
            { pic: 'safariApp', text: g.openSafari },
            { pic: 'paste', text: g.pasteLink },
          ];
  const step = steps[i];
  const last = i === steps.length - 1;
  const link = config.siteUrl;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Copie refusée : le lien reste affiché pour être recopié à la main.
    }
  };

  // Rendu à la racine de la page : ouvert depuis le pied de page bleu nuit, le guide
  // n'hérite pas de son texte blanc.
  return createPortal(
    <div className={styles.overlay}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={t.iosAria} className={styles.sheet}>
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.head}>
          <span className={styles.headIcon}>
            <Toque />
          </span>
          <div className={styles.headText}>
            <strong className={styles.title}>{t.iosTitle}</strong>
            <span className={styles.progress}>{g.stepOf(i + 1, steps.length)}</span>
          </div>
        </div>

        <div className={styles.dots} aria-hidden="true">
          {steps.map((_, k) => (
            <span key={k} className={k === i ? styles.dotOn : styles.dot} />
          ))}
        </div>

        <div className={styles.picWrap} aria-hidden="true">
          {step.pic === 'copy' ? (
            <div className={`${styles.screen} ${styles.copyPic}`}>
              <span className={styles.link}>{link.replace('https://', '')}</span>
            </div>
          ) : (
            <Picture pic={step.pic} t={t} />
          )}
        </div>

        <p className={styles.stepText} aria-live="polite">
          {step.text}
        </p>

        {step.pic === 'copy' && (
          <button type="button" className={styles.copyBtn} onClick={() => void copy()}>
            {copied ? g.copied : g.copy}
          </button>
        )}

        {/* WhatsApp ouvre les liens dans une fenêtre Safari intégrée, sans « Sur l'écran d'accueil ». */}
        {kind !== 'other' && i === 0 && (
          <p className={styles.tip}>
            <span className={styles.tipIcon} aria-hidden="true">
              <Compass />
            </span>
            {g.fromWhatsapp}
          </p>
        )}

        <div className={styles.nav}>
          {i > 0 && (
            <button type="button" className={styles.prev} onClick={() => setI(i - 1)}>
              {g.prev}
            </button>
          )}
          <button type="button" className={styles.next} onClick={() => (last ? onClose() : setI(i + 1))} data-autofocus>
            {last ? t.gotIt : g.next}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
