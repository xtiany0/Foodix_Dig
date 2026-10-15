/**
 * Validation de la commande (livraison, à emporter ou sur place) et passage au message WhatsApp.
 */

import type { ResolvedLine } from './cart';
import { PAYMENTS, type Order, type PaymentId } from './orders';
import { buildMessage, mapsLink, type OrderMode } from './whatsapp';

export interface Geo {
  lat: number;
  lng: number;
  /** Précision en mètres. */
  accuracy: number;
}

export interface Draft {
  mode: OrderMode;
  name: string;
  phone: string;
  quartier: string;
  adresse: string;
  note: string;
  /** Sur place : numéro de table (à la place du nom). */
  table: string;
  pickup: 'asap' | 'time';
  /** « HH:MM » quand pickup vaut « time ». */
  time: string;
  geo: Geo | null;
  /** Lien de position collé quand le GPS est refusé. */
  geoLink: string;
  payment: PaymentId;
}

export const emptyDraft: Draft = {
  mode: 'livraison',
  name: '',
  phone: '',
  quartier: '',
  adresse: '',
  note: '',
  table: '',
  pickup: 'asap',
  time: '',
  geo: null,
  geoLink: '',
  payment: 'cash',
};

export type DraftError = 'name' | 'table' | 'phone' | 'address' | 'time';

/** Champs obligatoires manquants, dans l'ordre de l'écran. */
export function draftErrors(d: Draft): DraftError[] {
  const errors: DraftError[] = [];
  // Sur place : le numéro de table suffit. À emporter : le nom suffit (la commande arrive
  // du WhatsApp du client, Foodix a déjà son numéro). Livraison : nom et téléphone pour le livreur.
  if (d.mode === 'surplace') {
    if (!d.table.trim()) errors.push('table');
  } else if (!d.name.trim()) errors.push('name');
  if (d.mode === 'livraison' && d.phone.replace(/\D/g, '').length < 8) errors.push('phone');
  if (d.mode === 'livraison' && !d.quartier.trim() && !d.adresse.trim()) errors.push('address');
  if (d.mode === 'emporter' && d.pickup === 'time' && !/^\d{2}:\d{2}$/.test(d.time)) errors.push('time');
  return errors;
}

export function positionOf(d: Draft): string {
  if (d.geo) return mapsLink(d.geo.lat, d.geo.lng);
  return d.geoLink.trim();
}

/** Message WhatsApp de la commande : toujours en français, quelle que soit la langue de l'interface. */
export function draftMessage(number: string, d: Draft, lines: ResolvedLine[], total: number): string {
  const livraison = d.mode === 'livraison';
  return buildMessage({
    number,
    mode: d.mode,
    lines: lines.map((r) => ({ qty: r.line.qty, name: r.name, total: r.total, note: r.line.note })),
    total,
    payment: PAYMENTS.find((p) => p.id === d.payment)?.fr ?? PAYMENTS[0].fr,
    // Sur place : le numéro de table remplace le nom.
    name: d.mode === 'surplace' ? undefined : d.name,
    table: d.mode === 'surplace' ? d.table : undefined,
    phone: livraison ? d.phone : undefined,
    address: livraison ? [d.quartier.trim(), d.adresse.trim()].filter(Boolean).join(', ') : undefined,
    position: livraison ? positionOf(d) : undefined,
    // Sur place : le client est déjà là, pas d'heure.
    pickup: d.mode !== 'emporter' ? undefined : d.pickup === 'asap' ? 'Dès que possible' : d.time,
    // « À emporter » et « Sur place » n'ont pas de champ Note : une note saisie en livraison n'est pas envoyée.
    note: livraison ? d.note : undefined,
  });
}

/** Commande à garder dans l'historique (noms et prix du moment). */
export function draftOrder(number: string, d: Draft, lines: ResolvedLine[], total: number, now = new Date()): Order {
  return {
    id: number,
    at: now.toISOString(),
    mode: d.mode,
    payment: d.payment,
    total,
    lines: lines.map((r) => ({
      itemId: r.line.itemId,
      variant: r.line.variant,
      note: r.line.note.trim(),
      qty: r.line.qty,
      name: r.name,
      unit: r.unit,
    })),
  };
}
