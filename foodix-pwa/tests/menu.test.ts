import { describe, expect, it } from 'vitest';
import { allItems, indexMenu, MenuError, parseMenu } from '../src/lib/menu';
import { rawMenu, realMenu } from './fixtures';

describe('parseMenu', () => {
  it('accepte data/menu.json : 10 catégories, 66 articles', () => {
    const menu = realMenu();
    expect(menu.categories).toHaveLength(10);
    expect([...allItems(menu)]).toHaveLength(66);
  });

  it('donne à chaque option une clé stable égale au cartName d’origine', () => {
    const boeuf = indexMenu(realMenu()).get('shawarma-boeuf')!.item;
    expect(boeuf.variants!.options.map((o) => o.key)).toEqual([
      'Shawarma viande de bœuf (1.000 F)',
      'Shawarma viande de bœuf (1.500 F)',
    ]);
  });

  it('garde l’itemId des options de bubble tea et le defaultVariant', () => {
    const fraise = indexMenu(realMenu()).get('bt-fraise')!.item;
    expect(fraise.defaultVariant).toBe(1);
    expect(fraise.variants!.options[1].itemId).toBe('bt-fraise');
  });

  it('refuse un prix invalide avec un message lisible', () => {
    const raw = rawMenu() as any;
    raw.categories[0].groups[0].items[0].price = '2000';
    expect(() => parseMenu(raw)).toThrow(MenuError);
    expect(() => parseMenu(raw)).toThrow(/shawarma-poulet/);
  });

  it('refuse un identifiant en double', () => {
    const raw = rawMenu() as any;
    raw.categories[0].groups[0].items[1].id = 'shawarma-poulet';
    expect(() => parseMenu(raw)).toThrow(/double/);
  });

  it('refuse un contenu qui n’est pas un menu', () => {
    expect(() => parseMenu(null)).toThrow(MenuError);
    expect(() => parseMenu({ categories: 'x' })).toThrow(MenuError);
  });
});
