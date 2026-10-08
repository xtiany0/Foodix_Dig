import { href } from '../lib/router';
import { formatPrice } from '../lib/price';
import { useStore } from '../state/store';
import { BagIcon, ClockIcon } from './icons';
import styles from './CartPill.module.css';

/** Bouton panier flottant en bas de l'écran (téléphone). */
export default function CartPill() {
  const { t, count, total, canOrder } = useStore();

  if (!canOrder) {
    return (
      <div role="status" className={`${styles.pill} ${styles.closed}`}>
        <ClockIcon size={20} color="var(--fx-red)" />
        <span className={styles.closedText}>{t.closedPill}</span>
      </div>
    );
  }

  if (count === 0) {
    return (
      <a href={href('panier')} className={styles.empty} aria-label={t.emptyCart}>
        <BagIcon size={22} />
        <span className={styles.emptyText}>{t.cartZero}</span>
      </a>
    );
  }

  return (
    <a href={href('panier')} className={`${styles.pill} ${styles.full}`} aria-label={`${t.seeCart}, ${t.item(count)}, ${formatPrice(total)}`}>
      <span className={styles.count}>{count}</span>
      <span className={styles.label}>{t.seeCart}</span>
      <span className={styles.total}>{formatPrice(total)}</span>
    </a>
  );
}
