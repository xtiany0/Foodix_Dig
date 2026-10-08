import { useState } from 'react';
import { formatPrice } from '../lib/price';
import { useDialog } from '../lib/useDialog';
import { useStore } from '../state/store';
import { CloseIcon, MinusIcon, PlusIcon } from './icons';
import styles from './ItemSheet.module.css';

const MAX_SHEET_QTY = 20;

interface Props {
  itemId: string;
  onClose: () => void;
  onAdded: (label: string) => void;
}

/** Fiche article : feuille qui monte du bas (téléphone, tablette), fenêtre centrée (ordinateur). */
export default function ItemSheet({ itemId, onClose, onAdded }: Props) {
  const { index, lang, t, dispatch, canOrder } = useStore();
  const ref = index.get(itemId)!;
  const { item, category, group } = ref;
  const options = item.variants?.options ?? [];

  const [v, setV] = useState(item.defaultVariant ?? 0);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);

  const option = options[v] ?? null;
  const unit = option ? option.price : item.price;
  const title = item.sheetTitle || item.cartName || item.name;
  const canAdd = canOrder && item.available;

  const confirm = () => {
    dispatch({
      type: 'add',
      line: { itemId: option?.itemId ?? item.id, variant: option?.key ?? null, note, qty },
    });
    onAdded((qty > 1 ? `${qty}x ` : '') + (option ? option.cartName : item.cartName || item.name));
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <button type="button" className={styles.backdrop} aria-label={t.close} tabIndex={-1} onClick={onClose} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} className={styles.sheet}>
        <div className={styles.body}>
          <div className={styles.handle} aria-hidden="true" />
          <div className={styles.head}>
            <div className={styles.headText}>
              <span className={styles.category}>{category.title[lang]}</span>
              <h2 className={styles.title}>{title}</h2>
              <span className={styles.price}>{formatPrice(unit)}</span>
              {group.adultsOnly && <span className={styles.adult}>{t.adult}</span>}
            </div>
            <button type="button" className={styles.close} aria-label={t.close} onClick={onClose}>
              <span className={styles.closeDot}>
                <CloseIcon size={16} stroke={2.6} />
              </span>
            </button>
          </div>
          <div className={styles.divider} aria-hidden="true" />

          {item.variants && (
            <fieldset className={styles.variants}>
              <legend className={styles.legend}>{item.variants.label[lang]}</legend>
              <div className={styles.options}>
                {options.map((o, i) => (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={i === v}
                    className={`${styles.option} ${i === v ? styles.optionOn : ''}`}
                    onClick={() => setV(i)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className={styles.qtyRow}>
            <span className={styles.label} id="sheet-qty">
              {t.qty}
            </span>
            <div className={styles.stepper} role="group" aria-labelledby="sheet-qty">
              <button type="button" className={styles.stepBtn} aria-label={t.dec} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <MinusIcon size={18} stroke={2.6} />
              </button>
              <span className={styles.qty} aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                className={styles.stepBtn}
                aria-label={t.inc}
                onClick={() => setQty((q) => Math.min(MAX_SHEET_QTY, q + 1))}
              >
                <PlusIcon size={18} stroke={2.6} />
              </button>
            </div>
          </div>

          <div className={styles.noteField}>
            <label htmlFor="precision-article" className={styles.label}>
              {t.note} <span className={styles.optional}>{t.optional}</span>
            </label>
            <input
              id="precision-article"
              type="text"
              className={styles.noteInput}
              value={note}
              maxLength={120}
              placeholder={t.notePh}
              enterKeyHint="done"
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
            />
          </div>
        </div>

        <div className={styles.foot}>
          {canAdd ? (
            <button type="button" className={styles.addBtn} onClick={confirm}>
              {t.add + formatPrice(unit * qty)}
            </button>
          ) : (
            <div className={styles.blocked}>{canOrder ? t.sheetOut : t.sheetClosed}</div>
          )}
        </div>
      </div>
    </div>
  );
}
