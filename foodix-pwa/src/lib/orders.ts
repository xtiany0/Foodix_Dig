/**
 * Historique des commandes (« Mes commandes ») et Recommander.
 * L'historique reste sur le téléphone : aucun compte, aucun serveur.
 */

import { resolveLine, type NewLine } from './cart';
import type { ItemRef } from './menu';
import type { OrderMode } from './whatsapp';

export type PaymentId = 'cash' | 'mtn' | 'moov';

export const PAYMENTS: { id: PaymentId; fr: string; en: string }[] = [
  { id: 'cash', fr: 'Espèces', en: 'Cash' },
  { id: 'mtn', fr: 'MTN Mobile Money', en: 'MTN Mobile Money' },
  { id: 'moov', fr: 'Moov Money', en: 'Moov Money' },
];

/** Ligne telle qu'elle a été commandée (nom et prix de l'époque). */
export interface OrderLine {
  itemId: string;
  variant: string | null;
  note: string;
  qty: number;
  name: string;
  unit: number;
}

export interface Order {
  /** Numéro avec son #, ex. « #A7K2 ». */
  id: string;
  /** Date d'envoi, ISO 8601. */
  at: string;
  mode: OrderMode;
  payment: PaymentId;
  total: number;
  lines: OrderLine[];
}

/** Ajoute une commande en tête de l'historique, en gardant les `limit` plus récentes. */
export function addOrder(history: Order[], order: Order, limit: number): Order[] {
  return [order, ...history.filter((o) => o.id !== order.id)].slice(0, limit);
}

/* ---------- Recommander ---------- */

export type ReorderStatus = 'ok' | 'out' | 'price';

export interface ReorderLine {
  line: OrderLine;
  status: ReorderStatus;
  /** Prix unitaire actuel (absent si l'article est épuisé ou retiré). */
  unit?: number;
}

export interface ReorderPlan {
  lines: ReorderLine[];
  /** Articles à remettre dans le panier, aux prix actuels. */
  add: NewLine[];
  /** Total au prix actuel des articles qui seront ajoutés. */
  total: number;
  hasOut: boolean;
  hasPriceChange: boolean;
}

/**
 * Prépare Recommander : chaque article est remis au prix actuel.
 * Épuisé ou retiré du menu : signalé et non ajouté. Prix changé : signalé.
 */
export function planReorder(index: Map<string, ItemRef>, order: Order): ReorderPlan {
  const lines: ReorderLine[] = order.lines.map((line) => {
    const r = resolveLine(index, { key: '', seq: 0, ...line });
    if (!r || !r.item.available) return { line, status: 'out' };
    return { line, status: r.unit === line.unit ? 'ok' : 'price', unit: r.unit };
  });
  const kept = lines.filter((l) => l.status !== 'out');
  return {
    lines,
    add: kept.map(({ line }) => ({ itemId: line.itemId, variant: line.variant, note: line.note, qty: line.qty })),
    total: kept.reduce((sum, l) => sum + (l.unit ?? 0) * l.line.qty, 0),
    hasOut: kept.length < lines.length,
    hasPriceChange: lines.some((l) => l.status === 'price'),
  };
}

/* ---------- Lecture protégée de l'historique ---------- */

const isStr = (x: unknown): x is string => typeof x === 'string';
const isInt = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0;

function parseLine(x: unknown): OrderLine | null {
  if (typeof x !== 'object' || x === null) return null;
  const l = x as Record<string, unknown>;
  if (!isStr(l.itemId) || !(l.variant === null || isStr(l.variant)) || !isStr(l.note) || !isStr(l.name)) return null;
  if (!isInt(l.qty) || l.qty < 1 || !isInt(l.unit)) return null;
  return { itemId: l.itemId, variant: l.variant, note: l.note, qty: l.qty, name: l.name, unit: l.unit };
}

function parseOrder(x: unknown): Order | null {
  if (typeof x !== 'object' || x === null) return null;
  const o = x as Record<string, unknown>;
  if (!isStr(o.id) || !isStr(o.at) || Number.isNaN(Date.parse(o.at))) return null;
  if (o.mode !== 'livraison' && o.mode !== 'emporter') return null;
  if (!PAYMENTS.some((p) => p.id === o.payment) || !isInt(o.total) || !Array.isArray(o.lines)) return null;
  const lines = o.lines.map(parseLine);
  if (lines.some((l) => l === null)) return null;
  return { id: o.id, at: o.at, mode: o.mode, payment: o.payment as PaymentId, total: o.total, lines: lines as OrderLine[] };
}

/** Valide un historique enregistré. Une commande abîmée est ignorée, les autres sont gardées. */
export function parseHistory(data: unknown): Order[] | null {
  if (!Array.isArray(data)) return null;
  return data.map(parseOrder).filter((o): o is Order => o !== null);
}
