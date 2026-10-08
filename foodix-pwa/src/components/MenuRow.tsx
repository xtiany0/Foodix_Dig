import { useEffect, useRef } from 'react';
import { lastLineFor, qtyFor } from '../lib/cart';
import { listPriceLabel } from '../lib/price';
import { useStore } from '../state/store';
import type { MenuItem } from '../types/menu';
import { MinusIcon, PlusIcon } from './icons';
import styles from './MenuRow.module.css';

interface Props {
  item: MenuItem;
  /** Précision de cet article en cours de saisie. */
  editing: boolean;
  onOpen: (id: string) => void;
  onToggleNote: (id: string | null) => void;
}

/**
 * Ligne « nom ........ prix » du menu.
 * Pas dans le panier : bouton « + ». Dans le panier : « − n + » et la précision du dernier choix.
 */
export default function MenuRow({ item, editing, onOpen, onToggleNote }: Props) {
  const { t, lang, cart, dispatch, canOrder } = useStore();
  const out = !item.available;
  const qty = qtyFor(cart, item.id);
  const last = lastLineFor(cart, item.id);
  const inCart = canOrder && qty > 0 && !!last;
  const note = last?.note ?? '';
  const hasNote = note.trim() !== '';
  const inputRef = useRef<HTMLInputElement>(null);
  const price = listPriceLabel(item);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const add = () => {
    // Article à variantes : la fiche s'ouvre pour choisir.
    if (item.variants) onOpen(item.id);
    else dispatch({ type: 'add', line: { itemId: item.id, variant: null, note: '', qty: 1 } });
  };

  const step = (delta: number) => {
    if (last) dispatch({ type: 'qty', key: last.key, delta });
    if (last && delta < 0 && last.qty + delta <= 0 && editing) onToggleNote(null);
  };

  const doneNote = () => {
    if (last) dispatch({ type: 'commitNote', key: last.key });
    onToggleNote(null);
  };

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <button type="button" className={styles.open} onClick={() => onOpen(item.id)}>
          <span className={`${styles.line} ${price.includes('/') ? styles.multi : ''}`}>
            <span className={`${styles.name} ${out ? styles.out : ''}`}>{item.name}</span>
            <span className={styles.leader} aria-hidden="true" />
            <span className={`${styles.price} ${out ? styles.out : ''}`}>{price}</span>
          </span>
          {item.subtitle && <span className={styles.sub}>{item.subtitle[lang]}</span>}
        </button>
        {canOrder && !out && qty === 0 && (
          <button type="button" className={styles.add} aria-label={t.addAria(item.name)} onClick={add}>
            <span className={styles.addDot}>
              <PlusIcon size={16} stroke={2.8} />
            </span>
          </button>
        )}
        {out && <span className={styles.outTag}>{t.out}</span>}
      </div>

      {inCart && (
        <>
          <div className={styles.cartRow}>
            <button
              type="button"
              className={`${styles.noteBtn} ${hasNote ? styles.noteSet : ''}`}
              aria-expanded={editing}
              onClick={() => onToggleNote(editing ? null : item.id)}
            >
              {hasNote ? `${t.notePrefix}${note.trim()} · ${t.edit}` : t.addNote}
            </button>
            <div className={styles.stepper}>
              <button type="button" className={styles.stepBtn} aria-label={t.decLine(item.name)} onClick={() => step(-1)}>
                <MinusIcon size={15} stroke={3} />
              </button>
              <span className={styles.qty} aria-live="polite">
                {qty}
              </span>
              <button type="button" className={styles.stepBtn} aria-label={t.incLine(item.name)} onClick={() => step(1)}>
                <PlusIcon size={15} stroke={3} />
              </button>
            </div>
          </div>
          {editing && (
            <form
              className={styles.noteForm}
              onSubmit={(e) => {
                e.preventDefault();
                doneNote();
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className={styles.noteInput}
                aria-label={`${t.note} : ${item.name}`}
                placeholder={t.notePh}
                value={note}
                maxLength={120}
                enterKeyHint="done"
                onChange={(e) => last && dispatch({ type: 'note', key: last.key, note: e.target.value })}
              />
              <button type="submit" className={styles.noteOk}>
                {t.ok}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
