import { CheckIcon } from './icons';
import styles from './Toast.module.css';

/** Confirmation brève (« Ajouté au panier : … »), au-dessus du bouton panier. */
export default function Toast({ text }: { text: string }) {
  return (
    <div role="status" className={styles.wrap}>
      {text && (
        <span className={styles.toast}>
          <CheckIcon size={18} stroke={3} color="var(--fx-green-on-navy)" />
          {text}
        </span>
      )}
    </div>
  );
}
