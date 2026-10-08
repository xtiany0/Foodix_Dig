import type { MenuItem } from '../types/menu';

/** 2000 → « 2.000 » (point comme séparateur des milliers). */
export function formatAmount(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  const sign = v < 0 ? '-' : '';
  return sign + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 2000 → « 2.000 F ». */
export function formatPrice(n: number): string {
  return formatAmount(n) + ' F';
}

/**
 * Prix affiché sur la ligne du menu.
 * Article à plusieurs prix : « 1.000 / 1.500 F ».
 * Chichas (listPrice « base ») : le prix de la pose seul.
 */
export function listPriceLabel(item: MenuItem): string {
  if (!item.variants || item.listPrice === 'base') return formatPrice(item.price);
  const prices = [...new Set(item.variants.options.map((o) => o.price))].sort((a, b) => a - b);
  if (prices.length < 2) return formatPrice(prices[0] ?? item.price);
  return prices.map(formatAmount).join(' / ') + ' F';
}
