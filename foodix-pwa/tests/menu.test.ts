import { describe, expect, it } from 'vitest';
import { ALL_PAGE, allItems, indexMenu, MenuError, pageOfCategory, parseMenu, realPages } from '../src/lib/menu';
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

describe('pages du menu', () => {
  it('« Tout » puis les 6 pages de la carte, chacune avec sa photo', () => {
    const menu = realMenu();
    expect(menu.pages[0].id).toBe(ALL_PAGE);
    expect(menu.pages[0].image).toBeNull();
    const pages = realPages(menu);
    expect(pages.map((p) => p.title.fr)).toEqual([
      'Plats principaux',
      'Bols et desserts',
      'Boissons',
      'Bubble tea et cocktails',
      'Jus, glaces et lactés',
      'Chichas',
    ]);
    for (const p of pages) expect(p.image).toMatch(/^\/images\/pages\/.+\.webp$/);
  });

  it('chaque catégorie est dans une page, et « Tout » suit l’ordre de la carte', () => {
    const menu = realMenu();
    expect(pageOfCategory(menu, 'crepes')?.id).toBe('bols-desserts');
    expect(pageOfCategory(menu, 'chaudes')?.id).toBe('jus-lactes');
    expect(menu.pages[0].categories).toEqual(realPages(menu).flatMap((p) => p.categories));
  });

  it('refuse une page qui cite une catégorie inconnue', () => {
    const raw = rawMenu() as any;
    raw.pages[1].categories.push('pizzas');
    expect(() => parseMenu(raw)).toThrow(/pizzas/);
  });

  it('refuse une catégorie absente de toutes les pages', () => {
    const raw = rawMenu() as any;
    raw.pages = raw.pages.filter((p: { id: string }) => p.id !== 'chichas');
    raw.pages[0].categories = raw.pages[0].categories.filter((c: string) => c !== 'chichas');
    expect(() => parseMenu(raw)).toThrow(/chichas/);
  });

  it('sans « pages » : une page par catégorie', () => {
    const raw = rawMenu() as any;
    delete raw.pages;
    const menu = parseMenu(raw);
    expect(menu.pages).toHaveLength(10);
    expect(pageOfCategory(menu, 'bols')?.id).toBe('bols');
  });
});
