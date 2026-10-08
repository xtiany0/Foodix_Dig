/**
 * Panier : fonctions pures, sans React, testées dans tests/cart.test.ts.
 *
 * Une ligne = article + variante + précision. Deux shawarmas, l'un avec piment,
 * l'autre sans, forment deux lignes. Le prix n'est jamais stocké : il est lu
 * dans le menu à l'affichage, donc toujours à jour.
 */

import type { ItemRef } from './menu';
import type { MenuItem, VariantOption } from '../types/menu';

export const MAX_QTY = 99;

export interface CartLine {
  /** Identifiant de la ligne (clé React, cible des + / −). */
  key: string;
  /** Article d'origine ; pour le bubble tea, l'itemId de l'option choisie. */
  itemId: string;
  /** Clé stable de l'option choisie (VariantOption.key), ou null. */
  variant: string | null;
  note: string;
  qty: number;
  /** Ordre du dernier ajout (sert aussi à créer des identifiants de ligne uniques). */
  seq: number;
}

export interface NewLine {
  itemId: string;
  variant: string | null;
  note: string;
  qty: number;
}

const clampQty = (n: number) => Math.max(0, Math.min(MAX_QTY, Math.floor(n)));
const cleanNote = (s: string) => s.trim().replace(/\s+/g, ' ');

function sameLine(a: Pick<CartLine, 'itemId' | 'variant' | 'note'>, b: Pick<CartLine, 'itemId' | 'variant' | 'note'>) {
  return a.itemId === b.itemId && a.variant === b.variant && cleanNote(a.note) === cleanNote(b.note);
}

const nextSeq = (lines: CartLine[]) => lines.reduce((m, l) => Math.max(m, l.seq), 0) + 1;

/** Ajoute un article ; s'il existe déjà avec la même variante et la même précision, augmente sa quantité. */
export function addLine(lines: CartLine[], n: NewLine): CartLine[] {
  const qty = clampQty(n.qty);
  if (qty === 0) return lines;
  const seq = nextSeq(lines);
  const note = cleanNote(n.note);
  const existing = lines.find((l) => sameLine(l, { ...n, note }));
  if (existing) {
    return lines.map((l) => (l === existing ? { ...l, qty: clampQty(l.qty + qty), seq } : l));
  }
  return [...lines, { key: 'l' + seq, itemId: n.itemId, variant: n.variant, note, qty, seq }];
}

/** + / − sur une ligne précise. À 0, la ligne sort du panier. */
export function changeQty(lines: CartLine[], key: string, delta: number): CartLine[] {
  return lines.map((l) => (l.key === key ? { ...l, qty: clampQty(l.qty + delta) } : l)).filter((l) => l.qty > 0);
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((l) => l.key !== key);
}

/** Modifie la précision pendant la saisie (sans fusion, pour ne pas déplacer le champ). */
export function setNote(lines: CartLine[], key: string, note: string): CartLine[] {
  return lines.map((l) => (l.key === key ? { ...l, note } : l));
}

/**
 * Valide la précision (bouton OK) : nettoie le texte et, si une autre ligne a
 * désormais le même article, la même variante et la même précision, fusionne les deux.
 */
export function commitNote(lines: CartLine[], key: string): CartLine[] {
  const line = lines.find((l) => l.key === key);
  if (!line) return lines;
  const note = cleanNote(line.note);
  const twin = lines.find((l) => l.key !== key && sameLine(l, { ...line, note }));
  if (!twin) return lines.map((l) => (l.key === key ? { ...l, note } : l));
  return lines
    .filter((l) => l.key !== key)
    .map((l) => (l === twin ? { ...l, qty: clampQty(l.qty + line.qty), seq: Math.max(l.seq, line.seq) } : l));
}

/** Lignes d'un article de la liste du menu. */
export function linesFor(lines: CartLine[], itemId: string): CartLine[] {
  return lines.filter((l) => l.itemId === itemId);
}

export function qtyFor(lines: CartLine[], itemId: string): number {
  return linesFor(lines, itemId).reduce((n, l) => n + l.qty, 0);
}

/* ---------- Lien avec le menu ---------- */

export interface ResolvedLine {
  line: CartLine;
  item: MenuItem;
  option: VariantOption | null;
  /** Nom du panier et du message WhatsApp. */
  name: string;
  unit: number;
  total: number;
}

export function findOption(item: MenuItem, variant: string | null): VariantOption | null | undefined {
  if (variant === null) return item.variants ? undefined : null;
  return item.variants?.options.find((o) => o.key === variant);
}

/** Retrouve l'article et le prix actuel d'une ligne. null si l'article ou la variante n'existe plus. */
export function resolveLine(index: Map<string, ItemRef>, line: CartLine): ResolvedLine | null {
  const ref = index.get(line.itemId);
  if (!ref) return null;
  const option = findOption(ref.item, line.variant);
  if (option === undefined) return null;
  const unit = option ? option.price : ref.item.price;
  return {
    line,
    item: ref.item,
    option,
    name: option ? option.cartName : ref.item.cartName || ref.item.name,
    unit,
    total: unit * line.qty,
  };
}

export function resolveCart(index: Map<string, ItemRef>, lines: CartLine[]): ResolvedLine[] {
  return lines.map((l) => resolveLine(index, l)).filter((r): r is ResolvedLine => r !== null);
}

export function cartTotals(resolved: ResolvedLine[]): { count: number; total: number } {
  return resolved.reduce((acc, r) => ({ count: acc.count + r.line.qty, total: acc.total + r.total }), { count: 0, total: 0 });
}

/**
 * Nettoie un panier relu depuis le téléphone : retire les articles disparus
 * du menu ou épuisés depuis, et fusionne les doublons éventuels.
 */
export function sanitizeCart(index: Map<string, ItemRef>, lines: CartLine[]): CartLine[] {
  let out: CartLine[] = [];
  for (const l of lines) {
    const r = resolveLine(index, l);
    if (!r || !r.item.available) continue;
    const twin = out.find((o) => sameLine(o, l));
    if (twin) out = out.map((o) => (o === twin ? { ...o, qty: clampQty(o.qty + l.qty), seq: Math.max(o.seq, l.seq) } : o));
    else out.push({ ...l, note: cleanNote(l.note) });
  }
  return out;
}

/** Valide la forme d'un panier enregistré (voir lib/storage.ts). */
export function parseCart(data: unknown): CartLine[] | null {
  if (!Array.isArray(data)) return null;
  const keys = new Set<string>();
  for (const l of data) {
    if (
      typeof l !== 'object' ||
      l === null ||
      typeof l.key !== 'string' ||
      keys.has(l.key) ||
      typeof l.itemId !== 'string' ||
      !(l.variant === null || typeof l.variant === 'string') ||
      typeof l.note !== 'string' ||
      !Number.isInteger(l.qty) ||
      l.qty < 1 ||
      l.qty > MAX_QTY ||
      typeof l.seq !== 'number'
    ) {
      return null;
    }
    keys.add(l.key);
  }
  return data as CartLine[];
}
