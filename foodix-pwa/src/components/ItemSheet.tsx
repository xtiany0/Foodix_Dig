import { useState } from 'react';
import { formatAmount, formatPrice, listPriceLabel } from '../lib/price';
import { useDialog } from '../lib/useDialog';
import { useStore } from '../state/store';
import type { VariantOption } from '../types/menu';
import { CloseIcon, MinusIcon, PlusIcon } from './icons';
import styles from './ItemSheet.module.css';

const MAX_SHEET_QTY = 20;

interface Props {
  itemId: string;
  onClose: () => void;
  onAdded: (label: string) => void;
}

interface Stepper {
  label: string;
  qty: number;
  onChange: (qty: number) => void;
  disabled?: boolean;
}

function QtyStepper({ label, qty, onChange, disabled }: Stepper) {
  const { t } = useStore();
  return (
    <div className={styles.stepper} role="group" aria-label={`${t.qty} : ${label}`}>
      <button
        type="button"
        className={styles.stepBtn}
        aria-label={t.decLine(label)}
        disabled={disabled || qty === 0}
        onClick={() => onChange(Math.max(0, qty - 1))}
      >
        <MinusIcon size={18} stroke={2.6} />
      </button>
      <span className={styles.qty} aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        className={styles.stepBtn}
        aria-label={t.incLine(label)}
        disabled={disabled || qty >= MAX_SHEET_QTY}
        onClick={() => onChange(Math.min(MAX_SHEET_QTY, qty + 1))}
      >
        <PlusIcon size={18} stroke={2.6} />
      </button>
    </div>
  );
}

/**
 * Fiche article : feuille qui monte du bas (téléphone, tablette), fenêtre centrée (ordinateur).
 * Article à choix : une ligne par choix, chacune avec sa quantité et sa précision,
 * pour prendre par exemple 1 shawarma bœuf à 1.000 F et 2 à 1.500 F en une fois.
 * Quantités à 0 par défaut.
 */
export default function ItemSheet({ itemId, onClose, onAdded }: Props) {
  const { index, lang, t, dispatch, canOrder } = useStore();
  const { item, category, group } = index.get(itemId)!;
  const options: (VariantOption | null)[] = item.variants?.options ?? [null];

  const [qtys, setQtys] = useState<number[]>(() => options.map(() => 0));
  const [notes, setNotes] = useState<string[]>(() => options.map(() => ''));
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);

  const title = item.sheetTitle || item.cartName || item.name;
  const canAdd = canOrder && item.available;
  const unitOf = (o: VariantOption | null) => (o ? o.price : item.price);
  const nameOf = (o: VariantOption | null) => (o ? o.cartName : item.cartName || item.name);
  const total = options.reduce((sum, o, i) => sum + unitOf(o) * qtys[i], 0);
  const count = qtys.reduce((a, b) => a + b, 0);

  const setAt = <T,>(list: T[], i: number, value: T) => list.map((x, j) => (j === i ? value : x));

  const confirm = () => {
    const added: string[] = [];
    options.forEach((o, i) => {
      if (!qtys[i]) return;
      dispatch({ type: 'add', line: { itemId: o?.itemId ?? item.id, variant: o?.key ?? null, note: notes[i], qty: qtys[i] } });
      added.push(`${qtys[i]}x ${nameOf(o)}`);
    });
    onAdded(added.length === 1 ? added[0] : t.item(count));
    onClose();
  };

  const noteInput = (i: number, label: string, id: string) => (
    <input
      id={id}
      type="text"
      className={styles.noteInput}
      aria-label={`${t.note} : ${label}`}
      value={notes[i]}
      maxLength={120}
      placeholder={t.notePh}
      enterKeyHint="done"
      onChange={(e) => setNotes(setAt(notes, i, e.target.value))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );

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
              <span className={styles.price}>{listPriceLabel(item)}</span>
              {group.adultsOnly && <span className={styles.adult}>{t.adult}</span>}
            </div>
            <button type="button" className={styles.close} aria-label={t.close} onClick={onClose}>
              <span className={styles.closeDot}>
                <CloseIcon size={16} stroke={2.6} />
              </span>
            </button>
          </div>
          <div className={styles.divider} aria-hidden="true" />

          {item.variants ? (
            <fieldset className={styles.variants}>
              <legend className={styles.legend}>{item.variants.label[lang]}</legend>
              <div className={styles.choices}>
                {item.variants.options.map((o, i) => {
                  // Le prix n'est répété que s'il n'est pas déjà dans le libellé (« Format à 1.000 F »).
                  const showPrice = !o.label.includes(formatAmount(o.price));
                  return (
                    <div key={o.key} className={`${styles.choice} ${qtys[i] ? styles.choiceOn : ''}`}>
                      <div className={styles.choiceRow}>
                        <div className={styles.choiceText}>
                          <span className={styles.choiceLabel}>{o.label}</span>
                          {(showPrice || qtys[i] > 0) && (
                            <span className={styles.choicePrice}>
                              {qtys[i] > 0 ? `${qtys[i]} × ${formatPrice(o.price)} = ${formatPrice(o.price * qtys[i])}` : formatPrice(o.price)}
                            </span>
                          )}
                        </div>
                        {canAdd && <QtyStepper label={o.label} qty={qtys[i]} onChange={(q) => setQtys(setAt(qtys, i, q))} />}
                      </div>
                      {canAdd && qtys[i] > 0 && noteInput(i, o.cartName, `precision-${i}`)}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            canAdd && (
              <>
                <div className={styles.qtyRow}>
                  <span className={styles.label}>{t.qty}</span>
                  <QtyStepper label={nameOf(null)} qty={qtys[0]} onChange={(q) => setQtys([q])} />
                </div>
                <div className={styles.noteField}>
                  <label htmlFor="precision-article" className={styles.label}>
                    {t.note} <span className={styles.optional}>{t.optional}</span>
                  </label>
                  {noteInput(0, nameOf(null), 'precision-article')}
                </div>
              </>
            )
          )}
        </div>

        <div className={styles.foot}>
          {canAdd ? (
            <button type="button" className={styles.addBtn} onClick={confirm} disabled={count === 0}>
              {count === 0 ? t.chooseQty : t.add + formatPrice(total)}
            </button>
          ) : (
            <div className={styles.blocked}>{canOrder ? t.sheetOut : t.sheetClosed}</div>
          )}
        </div>
      </div>
    </div>
  );
}
