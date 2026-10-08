import { useState } from 'react';
import { formatPrice } from '../lib/price';
import { href, useOverlayHistory } from '../lib/router';
import { useDialog } from '../lib/useDialog';
import { useStore } from '../state/store';
import { MinusIcon, PlusIcon, TrashIcon } from './icons';
import styles from './CartPanel.module.css';

function EmptyDialog({ count, onCancel, onConfirm }: { count: number; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useStore();
  const ref = useDialog<HTMLDivElement>(true, onCancel);
  return (
    <div className={styles.overlay}>
      <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby="panel-empty-q" aria-describedby="panel-empty-text" className={styles.dialog}>
        <strong id="panel-empty-q" className={styles.dialogTitle}>
          {t.emptyQ}
        </strong>
        <span id="panel-empty-text" className={styles.dialogText}>
          {t.emptyText(count)}
        </span>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.cancel} onClick={onCancel} data-autofocus>
            {t.cancel}
          </button>
          <button type="button" className={styles.confirm} onClick={onConfirm}>
            {t.clear}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Panier en panneau fixe à droite (tablette 290 px, ordinateur 340 px). */
export default function CartPanel() {
  const { t, lines, count, total, dispatch, canOrder } = useStore();
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  useOverlayHistory(confirmEmpty, () => setConfirmEmpty(false));

  return (
    <aside aria-label={t.myCart} className={styles.panel}>
      <div className={styles.head}>
        <div className={styles.headTitle}>
          <h2 className={styles.title}>{t.myCart}</h2>
          <span className={styles.count}>{t.item(count)}</span>
        </div>
        {lines.length > 0 && (
          <button type="button" className={styles.clear} onClick={() => setConfirmEmpty(true)}>
            {t.clear}
          </button>
        )}
      </div>

      <div className={styles.list}>
        {lines.map(({ line, name, total: lineTotal }) => (
          <div key={line.key} className={styles.line}>
            <div className={styles.lineTop}>
              <div className={styles.lineText}>
                <span className={styles.name}>
                  {line.qty}x {name}
                </span>
                {line.note.trim() && <span className={styles.note}>{line.note.trim()}</span>}
              </div>
              <span className={styles.lineTotal}>{formatPrice(lineTotal)}</span>
            </div>
            <div className={styles.controls}>
              <button type="button" className={styles.step} aria-label={t.decLine(name)} onClick={() => dispatch({ type: 'qty', key: line.key, delta: -1 })}>
                <span className={styles.stepDot}>
                  <MinusIcon size={14} stroke={3} />
                </span>
              </button>
              <span className={styles.qty}>{line.qty}</span>
              <button type="button" className={styles.step} aria-label={t.incLine(name)} onClick={() => dispatch({ type: 'qty', key: line.key, delta: 1 })}>
                <span className={styles.stepDot}>
                  <PlusIcon size={14} stroke={3} />
                </span>
              </button>
              <span className={styles.spacer} />
              <button type="button" className={styles.remove} aria-label={t.removeLine(name)} onClick={() => dispatch({ type: 'remove', key: line.key })}>
                <TrashIcon size={19} stroke={1.9} />
              </button>
            </div>
          </div>
        ))}
        {lines.length === 0 && (
          <div className={styles.empty}>
            <img src="/brand/foodix-toque.webp" width={240} height={132} alt="" className={styles.toque} />
            <strong className={styles.emptyTitle}>{t.cartEmptyTitle}</strong>
            <span className={styles.emptyText}>{t.cartEmptyPanel}</span>
          </div>
        )}
      </div>

      <div className={styles.foot}>
        <div className={styles.delivery}>
          <span>{t.delivery}</span>
          <span>{t.tbc}</span>
        </div>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>{t.total}</span>
          <span className={styles.totalValue}>{formatPrice(total)}</span>
        </div>
        {canOrder && lines.length > 0 ? (
          <a href={href('commande')} className={styles.validate}>
            {t.validatePanel}
          </a>
        ) : (
          <div className={styles.blocked}>{canOrder ? t.blockedEmpty : t.blockedClosed}</div>
        )}
      </div>

      {confirmEmpty && (
        <EmptyDialog
          count={count}
          onCancel={() => setConfirmEmpty(false)}
          onConfirm={() => {
            dispatch({ type: 'clear' });
            setConfirmEmpty(false);
          }}
        />
      )}
    </aside>
  );
}
