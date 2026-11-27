import { createPortal } from 'react-dom';
import { androidGuideKind } from '../lib/install';
import { useDialog } from '../lib/useDialog';
import { useStore } from '../state/store';
import styles from './IosInstallGuide.module.css';

/*
 * Guide Android, affiché par la bulle « Installer l'app » quand le navigateur n'a pas donné
 * sa fenêtre d'installation : Chrome qui ne l'a pas (encore) proposée ou après un refus,
 * Samsung Internet, Firefox, fenêtre intégrée de WhatsApp, Facebook ou Instagram.
 * Trois étapes dans le menu du navigateur, sur un seul écran.
 */
export default function AndroidInstallGuide({ onClose }: { onClose: () => void }) {
  const { t } = useStore();
  const g = t.androidGuide;
  const ref = useDialog<HTMLDivElement>(true, onClose);
  const kind = androidGuideKind();

  return createPortal(
    <div className={styles.overlay}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={t.androidAria} className={styles.sheet}>
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.head}>
          <span className={styles.headIcon}>
            <img src="/brand/foodix-toque.webp" width={240} height={132} alt="" />
          </span>
          <strong className={styles.title}>{t.iosTitle}</strong>
        </div>

        <ol className={styles.steps}>
          {g[kind].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {kind !== 'inapp' && <p className={styles.tip}>{g.fromWhatsapp}</p>}
        <p className={styles.tip}>{g.installed}</p>

        <div className={styles.nav}>
          <button type="button" className={styles.next} onClick={onClose} data-autofocus>
            {t.gotIt}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
