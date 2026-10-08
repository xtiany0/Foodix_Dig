import { useDialog } from '../lib/useDialog';
import styles from './ConfirmSheet.module.css';

interface Props {
  title: string;
  text: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirmation avant une action irréversible (Vider le panier, Effacer l'historique). */
export default function ConfirmSheet({ title, text, cancelLabel, confirmLabel, onCancel, onConfirm }: Props) {
  const ref = useDialog<HTMLDivElement>(true, onCancel);
  return (
    <div className={styles.overlay}>
      <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-text" className={styles.box}>
        <strong id="confirm-title" className={styles.title}>
          {title}
        </strong>
        <span id="confirm-text" className={styles.text}>
          {text}
        </span>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} data-autofocus>
            {cancelLabel}
          </button>
          <button type="button" className={styles.confirm} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
