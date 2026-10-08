import { useEffect, useRef } from 'react';
import { findOption, linesFor, type CartLine } from '../lib/cart';
import { listPriceLabel } from '../lib/price';
import { useStore } from '../state/store';
import type { MenuItem } from '../types/menu';
import { MinusIcon, PlusIcon } from './icons';
import styles from './MenuRow.module.css';

interface Props {
  item: MenuItem;
  /** Ligne du panier dont la précision est en cours de saisie (toutes lignes du menu confondues). */
  editingKey: string | null;
  onOpen: (id: string) => void;
  onToggleNote: (key: string | null) => void;
}

/**
 * Ligne « nom ........ prix » du menu.
 * Pas dans le panier : bouton « + ».
 * Dans le panier : une sous-ligne par ligne du panier (choix + précision), chacune avec son « − n + ».
 * Ex. 1 shawarma bœuf à 1.000 F et 2 à 1.500 F = deux sous-lignes.
 */
export default function MenuRow({ item, editingKey, onOpen, onToggleNote }: Props) {
  const { t, lang, cart, dispatch, canOrder } = useStore();
  const out = !item.available;
  const lines = canOrder ? linesFor(cart, item.id) : [];
  const price = listPriceLabel(item);
  // Choix affichés sous l'article (format, garniture…). Le bubble tea a une ligne de menu par parfum : pas besoin.
  const showChoice = !!item.variants && !item.variants.options.some((o) => o.itemId);
  // « + » toujours visible pour un article à choix : il ouvre la fiche pour ajouter un autre choix.
  const showAdd = canOrder && !out && (lines.length === 0 || showChoice);

  const add = () => {
    // Article à variantes : la fiche s'ouvre pour choisir.
    if (item.variants) onOpen(item.id);
    else dispatch({ type: 'add', line: { itemId: item.id, variant: null, note: '', qty: 1 } });
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
        {showAdd && (
          <button
            type="button"
            className={styles.add}
            aria-label={lines.length ? t.addChoiceAria(item.name) : t.addAria(item.name)}
            onClick={add}
          >
            <span className={styles.addDot}>
              <PlusIcon size={16} stroke={2.8} />
            </span>
          </button>
        )}
        {out && <span className={styles.outTag}>{t.out}</span>}
      </div>

      {lines.map((line) => (
        <CartSubRow
          key={line.key}
          item={item}
          line={line}
          showChoice={showChoice}
          editing={editingKey === line.key}
          onToggleNote={onToggleNote}
        />
      ))}
    </div>
  );
}

interface SubProps {
  item: MenuItem;
  line: CartLine;
  showChoice: boolean;
  editing: boolean;
  onToggleNote: (key: string | null) => void;
}

/** Une ligne du panier sous l'article : choix, précision, « − n + ». */
function CartSubRow({ item, line, showChoice, editing, onToggleNote }: SubProps) {
  const { t, dispatch } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const option = findOption(item, line.variant) ?? null;
  const cartName = option ? option.cartName : item.cartName || item.name;
  const note = line.note.trim();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const step = (delta: number) => {
    if (delta < 0 && line.qty + delta <= 0 && editing) onToggleNote(null);
    dispatch({ type: 'qty', key: line.key, delta });
  };

  const doneNote = () => {
    dispatch({ type: 'commitNote', key: line.key });
    onToggleNote(null);
  };

  return (
    <>
      <div className={styles.cartRow}>
        <button
          type="button"
          className={`${styles.noteBtn} ${note ? styles.noteSet : ''}`}
          aria-expanded={editing}
          aria-label={`${note ? `${t.notePrefix}${note}, ${t.edit}` : t.addNote} : ${cartName}`}
          onClick={() => onToggleNote(editing ? null : line.key)}
        >
          {showChoice && option ? (
            // Choix affiché devant : texte court pour tenir sur un petit téléphone.
            <>
              <span className={styles.choice}>{option.label} · </span>
              {note ? `${note} · ${t.edit}` : t.addNoteShort}
            </>
          ) : note ? (
            `${t.notePrefix}${note} · ${t.edit}`
          ) : (
            t.addNote
          )}
        </button>
        <div className={styles.stepper}>
          <button type="button" className={styles.stepBtn} aria-label={t.decLine(cartName)} onClick={() => step(-1)}>
            <MinusIcon size={15} stroke={3} />
          </button>
          <span className={styles.qty} aria-live="polite">
            {line.qty}
          </span>
          <button type="button" className={styles.stepBtn} aria-label={t.incLine(cartName)} onClick={() => step(1)}>
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
            aria-label={`${t.note} : ${cartName}`}
            placeholder={t.notePh}
            value={line.note}
            maxLength={120}
            enterKeyHint="done"
            onChange={(e) => dispatch({ type: 'note', key: line.key, note: e.target.value })}
          />
          <button type="submit" className={styles.noteOk}>
            {t.ok}
          </button>
        </form>
      )}
    </>
  );
}
