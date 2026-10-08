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
import { draftMessage, draftOrder, emptyDraft, type Draft } from '../lib/checkout';
import { dictionaries, type Dict } from '../lib/i18n';
import { indexMenu, type ItemRef } from '../lib/menu';
import { addOrder, parseHistory, PAYMENTS, type Order } from '../lib/orders';
import { readStored, removeStored, writeStored } from '../lib/storage';
import { orderNumber, whatsappLink } from '../lib/whatsapp';
import { config } from '../config';
import { useLayout, useNow, useOnline, type Layout } from '../lib/env';
import { isOpenAt } from '../lib/hours';
import type { Lang, Menu } from '../types/menu';

const CART_KEY = 'cart';
const CART_VERSION = 1;
const LANG_KEY = 'lang';
const LANG_VERSION = 1;
const PROFILE_KEY = 'profile';
const PROFILE_VERSION = 1;
const HISTORY_KEY = 'history';
const HISTORY_VERSION = 1;

/** Infos gardées pour la prochaine commande : nom, téléphone, dernière adresse, mode et paiement. */
type Profile = Pick<Draft, 'mode' | 'name' | 'phone' | 'quartier' | 'adresse' | 'payment'>;

function parseProfile(d: unknown): Profile | null {
  if (typeof d !== 'object' || d === null) return null;
  const p = d as Record<string, unknown>;
  const str = (k: string) => (typeof p[k] === 'string' ? (p[k] as string) : '');
  return {
    mode: p.mode === 'emporter' ? 'emporter' : 'livraison',
    name: str('name'),
    phone: str('phone'),
    quartier: str('quartier'),
    adresse: str('adresse'),
    payment: PAYMENTS.some((x) => x.id === p.payment) ? (p.payment as Profile['payment']) : 'cash',
  };
}

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
  /** Formulaire de commande en cours (livraison / à emporter, paiement). */
  draft: Draft;
  updateDraft: (patch: Partial<Draft>) => void;
  /** Mémorise nom, téléphone, adresse, mode et paiement pour la prochaine fois. */
  saveProfile: () => void;
  /** Numéro de la commande en préparation (stable pendant l'aperçu). */
  pendingNumber: string;
  /** Message WhatsApp et lien wa.me de la commande en préparation. */
  pending: { message: string; link: string };
  /** Enregistre la commande dans l'historique et vide le panier. */
  confirmSend: () => Order;
  history: Order[];
  removeOrder: (id: string) => void;
  clearHistory: () => void;
  /** Foodix ouvert (horaires de config.ts, à l'heure du Bénin). */
  isOpen: boolean;
  /** Ajout au panier et envoi possibles (Foodix ouvert). */
  canOrder: boolean;
  /** Connexion disponible : sans réseau, le menu reste consultable mais l'envoi est bloqué. */
  online: boolean;
  layout: Layout;
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

  const [history, setHistory] = useState<Order[]>(() => readStored(HISTORY_KEY, HISTORY_VERSION, parseHistory, []));
  useEffect(() => {
    if (history.length) writeStored(HISTORY_KEY, HISTORY_VERSION, history);
    else removeStored(HISTORY_KEY);
  }, [history]);

  const [draft, setDraft] = useState<Draft>(() => ({
    ...emptyDraft,
    ...readStored(PROFILE_KEY, PROFILE_VERSION, parseProfile, emptyDraft),
  }));
  const updateDraft = useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const saveProfile = useCallback(() => {
    const { mode, name, phone, quartier, adresse, payment } = draft;
    writeStored(PROFILE_KEY, PROFILE_VERSION, { mode, name: name.trim(), phone: phone.trim(), quartier: quartier.trim(), adresse: adresse.trim(), payment });
  }, [draft]);

  const [pendingNumber, setPendingNumber] = useState(() => orderNumber(history.map((o) => o.id)));
  const message = useMemo(() => draftMessage(pendingNumber, draft, lines, total), [pendingNumber, draft, lines, total]);
  const pending = { message, link: whatsappLink(config.whatsappNumber, message) };

  const confirmSend = () => {
    const order = draftOrder(pendingNumber, draft, lines, total);
    setHistory((h) => addOrder(h, order, config.historyLimit));
    dispatch({ type: 'clear' });
    saveProfile();
    // Nouvelle commande : nouveau numéro, mêmes coordonnées ; note, heure et position repartent à zéro.
    setPendingNumber(orderNumber([order.id, ...history.map((o) => o.id)]));
    setDraft((d) => ({ ...d, note: '', pickup: 'asap', time: '', geo: null, geoLink: '' }));
    return order;
  };

  const now = useNow();
  const isOpen = isOpenAt(now, config.openingHours, config.timeZone);
  const canOrder = isOpen;
  const online = useOnline();
  const layout = useLayout();

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
    draft,
    updateDraft,
    saveProfile,
    pendingNumber,
    pending,
    confirmSend,
    history,
    removeOrder: (id) => setHistory((h) => h.filter((o) => o.id !== id)),
    clearHistory: () => setHistory([]),
    isOpen,
    canOrder,
    online,
    layout,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore hors de StoreProvider');
  return s;
}
