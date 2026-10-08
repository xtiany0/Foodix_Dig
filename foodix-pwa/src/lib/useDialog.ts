import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * Comportement commun des fenêtres (fiche, confirmations, guide iPhone) :
 * focus à l'ouverture, Tab reste dans la fenêtre, Échap ferme,
 * page du dessous bloquée, focus rendu à la fermeture.
 */
export function useDialog<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const first = root?.querySelector<HTMLElement>('[data-autofocus]') ?? root?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus({ preventScroll: true });

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
      } else if (e.key === 'Tab' && root) {
        const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!items.length) return;
        const [a, z] = [items[0], items[items.length - 1]];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [open]);

  return ref;
}
