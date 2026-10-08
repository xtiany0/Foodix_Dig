import { describe, expect, it } from 'vitest';
import {
  addLine,
  cartTotals,
  changeQty,
  commitNote,
  linesFor,
  parseCart,
  qtyFor,
  removeLine,
  resolveCart,
  sanitizeCart,
  setNote,
  type CartLine,
} from '../src/lib/cart';
import { indexMenu, parseMenu } from '../src/lib/menu';
import { rawMenu, realMenu } from './fixtures';

const index = indexMenu(realMenu());
const plain = (itemId: string, note = '', qty = 1) => ({ itemId, variant: null, note, qty });

describe('une ligne = article + variante + précision', () => {
  it('fusionne deux ajouts identiques', () => {
    let c = addLine([], plain('shawarma-poulet'));
    c = addLine(c, plain('shawarma-poulet', '', 2));
    expect(c).toHaveLength(1);
    expect(c[0].qty).toBe(3);
  });

  it('sépare deux shawarmas avec des précisions différentes', () => {
    let c = addLine([], plain('shawarma-poulet', 'avec piment'));
    c = addLine(c, plain('shawarma-poulet', 'sans piment'));
    expect(c).toHaveLength(2);
    expect(qtyFor(c, 'shawarma-poulet')).toBe(2);
  });

  it('ignore les espaces en trop dans la précision', () => {
    let c = addLine([], plain('tacos', 'sans piment'));
    c = addLine(c, plain('tacos', '  sans   piment '));
    expect(c).toHaveLength(1);
    expect(c[0].qty).toBe(2);
  });

  it('sépare deux variantes du même article', () => {
    let c = addLine([], { itemId: 'shawarma-boeuf', variant: 'Shawarma viande de bœuf (1.000 F)', note: '', qty: 1 });
    c = addLine(c, { itemId: 'shawarma-boeuf', variant: 'Shawarma viande de bœuf (1.500 F)', note: '', qty: 1 });
    expect(c).toHaveLength(2);
    const r = resolveCart(index, c);
    expect(r.map((x) => x.unit)).toEqual([1000, 1500]);
    expect(cartTotals(r)).toEqual({ count: 2, total: 2500 });
  });

  it('range le bubble tea sous l’itemId du parfum choisi', () => {
    const c = addLine([], { itemId: 'bt-fraise', variant: 'Bubble tea Fraise', note: '', qty: 1 });
    expect(qtyFor(c, 'bt-fraise')).toBe(1);
    expect(qtyFor(c, 'bt-mangue')).toBe(0);
    expect(resolveCart(index, c)[0].name).toBe('Bubble tea Fraise');
  });

  it('ne garde pas une quantité nulle et plafonne à 99', () => {
    expect(addLine([], plain('coca', '', 0))).toEqual([]);
    expect(addLine([], plain('coca', '', 500))[0].qty).toBe(99);
  });
});

describe('+ et − sur la bonne ligne', () => {
  let c: CartLine[] = [];
  c = addLine(c, plain('shawarma-poulet', '', 2));
  c = addLine(c, plain('tacos', 'sans piment'));
  c = addLine(c, plain('shawarma-poulet', 'avec piment'));
  const [a, b, d] = c;

  it('+ ne touche que la ligne visée', () => {
    const next = changeQty(c, b.key, 1);
    expect(next.map((l) => l.qty)).toEqual([2, 2, 1]);
  });

  it('− ne touche que la ligne visée', () => {
    const next = changeQty(c, a.key, -1);
    expect(next.map((l) => l.qty)).toEqual([1, 1, 1]);
  });

  it('le menu affiche une sous-ligne par ligne du panier (ex. 1 bœuf à 1.000 F, 2 à 1.500 F)', () => {
    let c = addLine([], { itemId: 'shawarma-boeuf', variant: 'Shawarma viande de bœuf (1.000 F)', note: '', qty: 1 });
    c = addLine(c, { itemId: 'shawarma-boeuf', variant: 'Shawarma viande de bœuf (1.500 F)', note: '', qty: 2 });
    const own = linesFor(c, 'shawarma-boeuf');
    expect(own.map((l) => l.qty)).toEqual([1, 2]);
    // − sur la sous-ligne à 1.500 F ne touche pas celle à 1.000 F
    const next = changeQty(c, own[1].key, -1);
    expect(linesFor(next, 'shawarma-boeuf').map((l) => l.qty)).toEqual([1, 1]);
    expect(resolveCart(index, next).map((r) => r.total)).toEqual([1000, 1500]);
  });

  it('à 0, la ligne sort du panier et les autres restent', () => {
    let next = changeQty(c, b.key, -1);
    expect(next.map((l) => l.key)).toEqual([a.key, d.key]);
    next = changeQty(next, a.key, -2);
    expect(next.map((l) => l.key)).toEqual([d.key]);
  });

  it('Retirer enlève la ligne entière', () => {
    expect(removeLine(c, a.key).map((l) => l.key)).toEqual([b.key, d.key]);
  });
});

describe('précision', () => {
  it('se modifie sans fusion pendant la saisie, puis fusionne à la validation', () => {
    let c = addLine([], plain('tacos', 'sans piment', 1));
    c = addLine(c, plain('tacos', '', 2));
    const empty = c[1];
    c = setNote(c, empty.key, 'sans piment ');
    expect(c).toHaveLength(2);
    c = commitNote(c, empty.key);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ note: 'sans piment', qty: 3 });
  });

  it('nettoie le texte à la validation', () => {
    let c = addLine([], plain('tacos'));
    c = commitNote(setNote(c, c[0].key, '  bien   cuit  '), c[0].key);
    expect(c[0].note).toBe('bien cuit');
  });
});

describe('panier enregistré', () => {
  it('refuse une forme invalide', () => {
    expect(parseCart(null)).toBeNull();
    expect(parseCart([{ key: 'a', itemId: 'x', variant: null, note: '', qty: 0, seq: 1 }])).toBeNull();
    expect(parseCart([{ key: 'a', itemId: 'x', variant: 3, note: '', qty: 1, seq: 1 }])).toBeNull();
    const ok = [{ key: 'a', itemId: 'x', variant: null, note: '', qty: 1, seq: 1 }];
    expect(parseCart(ok)).toEqual(ok);
  });

  it('retire les articles disparus, épuisés ou à variante inconnue', () => {
    const raw = rawMenu() as any;
    raw.categories[0].groups[0].items.find((i: any) => i.id === 'pastel').available = false;
    const idx = indexMenu(parseMenu(raw));
    const lines: CartLine[] = [
      { key: 'a', itemId: 'tacos', variant: null, note: '', qty: 1, seq: 1 },
      { key: 'b', itemId: 'pastel', variant: null, note: '', qty: 1, seq: 2 },
      { key: 'c', itemId: 'plat-disparu', variant: null, note: '', qty: 1, seq: 3 },
      { key: 'd', itemId: 'donuts', variant: 'Donuts (9.000 F)', note: '', qty: 1, seq: 4 },
      { key: 'e', itemId: 'donuts', variant: null, note: '', qty: 1, seq: 5 },
    ];
    expect(sanitizeCart(idx, lines).map((l) => l.key)).toEqual(['a']);
  });
});
