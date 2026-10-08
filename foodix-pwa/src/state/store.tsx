/**
 * État partagé de l'application : menu, panier, langue.
 * Un seul contexte React, sans bibliothèque. Le panier et la langue
 * sont enregistrés sur le téléphone (lib/storage.ts).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import {
  addLine,
  cartTotals,
  changeQty,
  commitNote,
  parseCart,
  removeLine,
  resolveCart,
  sanitizeCart,
  setNote,
  type CartLine,
  type NewLine,
  type ResolvedLine,
} from '../lib/cart';
import { dictionaries, type Dict } from '../lib/i18n';
import { indexMenu, type ItemRef } from '../lib/menu';
import { readStored, writeStored } from '../lib/storage';
import type { Lang, Menu } from '../types/menu';

const CART_KEY = 'cart';
const CART_VERSION = 1;
const LANG_KEY = 'lang';
const LANG_VERSION = 1;

export type CartAction =
  | { type: 'add'; line: NewLine }
  | { type: 'qty'; key: string; delta: number }
  | { type: 'note'; key: string; note: string }
  | { type: 'commitNote'; key: string }
  | { type: 'remove'; key: string }
  | { type: 'clear' };

function cartReducer(lines: CartLine[], a: CartAction): CartLine[] {
  switch (a.type) {
    case 'add':
      return addLine(lines, a.line);
    case 'qty':
      return changeQty(lines, a.key, a.delta);
    case 'note':
      return setNote(lines, a.key, a.note);
    case 'commitNote':
      return commitNote(lines, a.key);
    case 'remove':
      return removeLine(lines, a.key);
    case 'clear':
      return [];
  }
}

interface Store {
  menu: Menu;
  index: Map<string, ItemRef>;
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
  cart: CartLine[];
  lines: ResolvedLine[];
  count: number;
  total: number;
  dispatch: (a: CartAction) => void;
  /** Foodix ouvert (horaires, à l'heure du Bénin). Branché à l'étape 4. */
  isOpen: boolean;
  /** Ajout au panier et envoi possibles. */
  canOrder: boolean;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ menu, children }: { menu: Menu; children: ReactNode }) {
  const index = useMemo(() => indexMenu(menu), [menu]);

  const [cart, dispatch] = useReducer(cartReducer, undefined, () =>
    sanitizeCart(index, readStored(CART_KEY, CART_VERSION, parseCart, [])),
  );
  useEffect(() => writeStored(CART_KEY, CART_VERSION, cart), [cart]);

  const [lang, setLangState] = useState<Lang>(() =>
    readStored<Lang>(LANG_KEY, LANG_VERSION, (d) => (d === 'fr' || d === 'en' ? d : null), 'fr'),
  );
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    writeStored(LANG_KEY, LANG_VERSION, l);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const lines = useMemo(() => resolveCart(index, cart), [index, cart]);
  const { count, total } = cartTotals(lines);

  const isOpen = true;
  const canOrder = isOpen;

  const value: Store = {
    menu,
    index,
    lang,
    setLang,
    t: dictionaries[lang],
    cart,
    lines,
    count,
    total,
    dispatch,
    isOpen,
    canOrder,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore hors de StoreProvider');
  return s;
}
