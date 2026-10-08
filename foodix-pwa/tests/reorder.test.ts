import { describe, expect, it } from 'vitest';
import { indexMenu, parseMenu } from '../src/lib/menu';
import { addOrder, parseHistory, planReorder, type Order } from '../src/lib/orders';
import { rawMenu } from './fixtures';

/** Menu du jour : Pastel épuisé, Smash burger passé à 3.500 F (commandé à 3.000 F). */
function today() {
  const raw = rawMenu() as any;
  const items = raw.categories[0].groups[0].items;
  items.find((i: any) => i.id === 'pastel').available = false;
  return indexMenu(parseMenu(raw));
}

const order: Order = {
  id: '#Q3M8',
  at: '2026-09-27T12:00:00.000Z',
  mode: 'emporter',
  payment: 'cash',
  total: 4500,
  lines: [
    { itemId: 'smash', variant: null, note: '', qty: 1, name: 'Smash burger', unit: 3000 },
    { itemId: 'pastel', variant: null, note: '', qty: 2, name: 'Pastel', unit: 500 },
    { itemId: 'coca', variant: null, note: 'bien frais', qty: 1, name: 'Coca', unit: 500 },
    { itemId: 'bt-fraise', variant: 'Bubble tea Fraise', note: '', qty: 2, name: 'Bubble tea Fraise', unit: 1500 },
  ],
};

describe('Recommander', () => {
  const plan = planReorder(today(), order);

  it('remet les articles aux prix actuels, avec variantes et précisions', () => {
    expect(plan.add).toEqual([
      { itemId: 'smash', variant: null, note: '', qty: 1 },
      { itemId: 'coca', variant: null, note: 'bien frais', qty: 1 },
      { itemId: 'bt-fraise', variant: 'Bubble tea Fraise', note: '', qty: 2 },
    ]);
    expect(plan.total).toBe(3500 + 500 + 3000);
  });

  it('signale un article épuisé et ne l’ajoute pas', () => {
    expect(plan.lines[1]).toMatchObject({ status: 'out' });
    expect(plan.add.some((l) => l.itemId === 'pastel')).toBe(false);
    expect(plan.hasOut).toBe(true);
  });

  it('signale un article retiré du menu ou une variante disparue', () => {
    const gone = planReorder(today(), {
      ...order,
      lines: [
        { itemId: 'plat-retire', variant: null, note: '', qty: 1, name: 'Plat retiré', unit: 1000 },
        { itemId: 'donuts', variant: 'Donuts (géant)', note: '', qty: 1, name: 'Donuts (géant)', unit: 5000 },
      ],
    });
    expect(gone.lines.map((l) => l.status)).toEqual(['out', 'out']);
    expect(gone.add).toEqual([]);
  });

  it('signale un prix modifié avec l’ancien et le nouveau prix', () => {
    expect(plan.lines[0]).toEqual({ line: order.lines[0], status: 'price', unit: 3500 });
    expect(plan.lines[2].status).toBe('ok');
    expect(plan.hasPriceChange).toBe(true);
  });
});

describe('historique', () => {
  it('garde les commandes les plus récentes en tête, dans la limite', () => {
    let h: Order[] = [];
    for (let i = 0; i < 5; i++) h = addOrder(h, { ...order, id: '#000' + i }, 3);
    expect(h.map((o) => o.id)).toEqual(['#0004', '#0003', '#0002']);
  });

  it('ignore une commande abîmée et garde les autres', () => {
    expect(parseHistory('x')).toBeNull();
    expect(parseHistory([order, { ...order, mode: 'sur place' }, { id: 1 }])).toEqual([order]);
  });
});
