import { useEffect, useRef, useState } from 'react';
import ConfirmSheet from '../components/ConfirmSheet';
import { BackIcon, MinusIcon, PlusIcon, TrashIcon } from '../components/icons';
import { formatPrice } from '../lib/price';
import { href, useOverlayHistory } from '../lib/router';
import BackLink from '../components/BackLink';
import { useStore } from '../state/store';
import styles from './CartScreen.module.css';

export default function CartScreen() {
  const { t, lines, count, total, dispatch, canOrder } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useOverlayHistory(confirmEmpty, () => setConfirmEmpty(false));

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const doneNote = (key: string) => {
    dispatch({ type: 'commitNote', key });
    setEditing(null);
  };

  const hasLines = lines.length > 0;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <BackLink className={styles.back} label={t.backToMenu}>
          <BackIcon size={22} stroke={2.2} />
        </BackLink>
        <h1 className={styles.title}>{t.myCart}</h1>
        {hasLines && (
          <button type="button" className={styles.clear} onClick={() => setConfirmEmpty(true)}>
            {t.clear}
          </button>
        )}
      </header>

      {hasLines ? (
        <>
          <main className={styles.content}>
            {lines.map(({ line, name, unit, total: lineTotal }) => {
              const hasNote = line.note.trim() !== '';
              const isEditing = editing === line.key;
              return (
                <div key={line.key} className={styles.line}>
                  <div className={styles.lineTop}>
                    <div className={styles.lineText}>
                      <span className={styles.name}>{name}</span>
                      <span className={styles.unit}>
                        {formatPrice(unit)} {t.each}
                      </span>
                      <button
                        type="button"
                        className={`${styles.noteBtn} ${hasNote ? styles.noteSet : ''}`}
                        aria-expanded={isEditing}
                        onClick={() => setEditing(isEditing ? null : line.key)}
                      >
                        {hasNote ? `${t.notePrefix}${line.note.trim()} · ${t.edit}` : t.addNote}
                      </button>
                    </div>
                    <span className={styles.lineTotal}>{formatPrice(lineTotal)}</span>
                  </div>
                  <div className={styles.controls}>
                    <button
                      type="button"
                      className={styles.step}
                      aria-label={t.decLine(name)}
                      onClick={() => dispatch({ type: 'qty', key: line.key, delta: -1 })}
                    >
                      <span className={styles.stepDot}>
                        <MinusIcon size={14} stroke={3} />
                      </span>
                    </button>
                    <span className={styles.qty} aria-live="polite">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      className={styles.step}
                      aria-label={t.incLine(name)}
                      onClick={() => dispatch({ type: 'qty', key: line.key, delta: 1 })}
                    >
                      <span className={styles.stepDot}>
                        <PlusIcon size={14} stroke={3} />
                      </span>
                    </button>
                    <span className={styles.spacer} />
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={t.removeLine(name)}
                      onClick={() => dispatch({ type: 'remove', key: line.key })}
                    >
                      <TrashIcon size={17} stroke={1.9} />
                      {t.remove}
                    </button>
                  </div>
                  {isEditing && (
                    <form
                      className={styles.noteForm}
                      onSubmit={(e) => {
                        e.preventDefault();
                        doneNote(line.key);
                      }}
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        className={styles.noteInput}
                        aria-label={`${t.note} : ${name}`}
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
                </div>
              );
            })}

            <BackLink className={styles.addMore}>
              <PlusIcon size={18} stroke={2.6} color="var(--fx-orange-text)" />
              {t.addMore}
            </BackLink>

            <div className={styles.summary}>
              <div className={styles.sumRow}>
                <span>{t.subtotal}</span>
                <span className={styles.num}>{formatPrice(total)}</span>
              </div>
              <div className={styles.sumRow}>
                <span>{t.delivery}</span>
                <span className={styles.right}>{t.tbc}</span>
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>
                  {t.total} <span className={styles.exDelivery}>{t.exDelivery}</span>
                </span>
                <span className={styles.totalValue}>{formatPrice(total)}</span>
              </div>
            </div>
          </main>

          <div className={styles.bar}>
            {canOrder ? (
              <a href={href('commande')} className={styles.validate}>
                <span>{t.validate}</span>
                <span className={styles.num}>{formatPrice(total)}</span>
              </a>
            ) : (
              <div className={styles.blocked}>{t.blockedClosed}</div>
            )}
          </div>
        </>
      ) : (
        <main className={styles.empty}>
          <img src="/brand/foodix-toque.png" width={240} height={132} alt="" className={styles.toque} />
          <h2 className={styles.emptyTitle}>{t.cartEmptyTitle}</h2>
          <p className={styles.emptyText}>{t.cartEmptyText}</p>
          <BackLink className={styles.seeMenu}>{t.seeMenu}</BackLink>
          <a href={href('commandes')} className={styles.reorder}>
            {t.reorderPast}
          </a>
        </main>
      )}

      {confirmEmpty && (
        <ConfirmSheet
          title={t.emptyQ}
          text={t.emptyText(count)}
          cancelLabel={t.cancel}
          confirmLabel={t.clear}
          onCancel={() => setConfirmEmpty(false)}
          onConfirm={() => {
            dispatch({ type: 'clear' });
            setConfirmEmpty(false);
          }}
        />
      )}
    </div>
  );
}
