/**
 * Message de commande envoyé sur WhatsApp.
 * Toujours en français, même si l'interface est en anglais : c'est Foodix qui le lit.
 */

import { formatPrice } from './price';

/** Largeur avant le prix : « 2x Shawarma poulet ........... 4.000 F ». */
export const LINE_WIDTH = 30;
const MIN_DOTS = 3;

export type OrderMode = 'livraison' | 'emporter';

export interface MessageLine {
  qty: number;
  name: string;
  /** Prix de la ligne (quantité × prix unitaire). */
  total: number;
  note?: string;
}

export interface MessageInput {
  /** Numéro de commande avec son #, ex. « #A7K2 ». */
  number: string;
  mode: OrderMode;
  lines: MessageLine[];
  total: number;
  /** Libellé français du paiement, ex. « MTN Mobile Money ». */
  payment: string;
  name?: string;
  phone?: string;
  /** Livraison : quartier et adresse ou repère. */
  address?: string;
  /** Livraison : lien Google Maps ou lien collé. */
  position?: string;
  /** À emporter : « Dès que possible » ou « 13:30 ». */
  pickup?: string;
  note?: string;
}

const len = (s: string) => [...s.normalize('NFC')].length;
const clean = (s: string | undefined) => (s ?? '').trim().replace(/\s+/g, ' ');

/** « 2x Shawarma poulet » complété de points jusqu'à 30 caractères, puis le prix. */
export function itemLine(qty: number, name: string, total: number): string {
  const left = `${qty}x ${clean(name)} `;
  const dots = '.'.repeat(Math.max(MIN_DOTS, LINE_WIDTH - len(left)));
  return `${left}${dots} ${formatPrice(total)}`;
}

export function buildMessage(m: MessageInput): string {
  const livraison = m.mode === 'livraison';
  const field = (label: string, value: string | undefined) => (clean(value) ? `${label} : ${clean(value)}` : null);

  const blocks: (string | null)[][] = [
    [`Commande FOODIX ${m.number}`, `Mode : ${livraison ? 'Livraison' : 'À emporter'}`],
    m.lines.flatMap((l) => [itemLine(l.qty, l.name, l.total), clean(l.note) ? `   > ${clean(l.note)}` : null]),
    [`Total : ${formatPrice(m.total)}${livraison ? ' (hors livraison)' : ''}`, field('Paiement', m.payment)],
    [
      field('Nom', m.name),
      field('Tél', m.phone),
      ...(livraison ? [field('Adresse', m.address), field('Position', m.position)] : [field('Retrait', m.pickup)]),
      field('Note', m.note),
    ],
  ];

  return blocks
    .map((b) => b.filter((x): x is string => x !== null))
    .filter((b) => b.length > 0)
    .map((b) => b.join('\n'))
    .join('\n\n');
}

export function whatsappLink(number: string, text?: string): string {
  return `https://wa.me/${number}` + (text ? `?text=${encodeURIComponent(text)}` : '');
}

const ORDER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0, O, 1, I

/** Numéro de commande court, ex. « #A7K2 », différent de ceux déjà utilisés. */
export function orderNumber(taken: Iterable<string> = [], random: () => number = Math.random): string {
  const used = new Set(taken);
  for (;;) {
    let id = '#';
    for (let i = 0; i < 4; i++) id += ORDER_CHARS[Math.floor(random() * ORDER_CHARS.length)];
    if (!used.has(id)) return id;
  }
}

export function mapsLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}
