import { useStore } from '../state/store';
import { ClockIcon, OfflineIcon } from './icons';
import styles from './StatusBanner.module.css';

/** Bandeau d'état de l'accueil : food truck fermé ou pas de connexion. */
export default function StatusBanner({ kind }: { kind: 'closed' | 'offline' }) {
  const { t } = useStore();
  const closed = kind === 'closed';
  return (
    <div role="status" className={styles.banner}>
      {closed ? <ClockIcon size={22} color="var(--fx-red)" /> : <OfflineIcon size={22} color="var(--fx-orange-text)" />}
      <div className={styles.text}>
        <strong className={styles.title}>{closed ? t.closedTitle : t.offlineTitle}</strong>
        <span className={styles.body}>{closed ? t.closedText : t.offlineText}</span>
      </div>
    </div>
  );
}
