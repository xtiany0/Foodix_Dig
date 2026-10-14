import { config, type VariantName } from '../config';
import type { Category, Localized, Menu, MenuGroup, MenuItem, MenuPage, VariantOption, Variants } from '../types/menu';

export class MenuError extends Error {}

type Obj = Record<string, unknown>;

const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string' && x.length > 0;
const isPrice = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 0;

function fail(path: string, what: string): never {
  throw new MenuError(`menu.json : ${path} ${what}`);
}

function localized(x: unknown, path: string): Localized {
  if (!isObj(x) || !isStr(x.fr) || !isStr(x.en)) fail(path, 'doit contenir « fr » et « en »');
  return { fr: x.fr, en: x.en };
}

function option(x: unknown, path: string, rename: VariantName | undefined): VariantOption {
  if (!isObj(x)) fail(path, 'n’est pas un objet');
  if (!isStr(x.label)) fail(path, 'sans « label »');
  if (!isPrice(x.price)) fail(path, 'a un prix invalide');
  if (!isStr(x.cartName)) fail(path, 'sans « cartName »');
  if (x.itemId !== undefined && !isStr(x.itemId)) fail(path, 'a un « itemId » invalide');
  return {
    label: rename?.label || x.label,
    price: x.price,
    cartName: rename?.cartName || x.cartName,
    key: x.cartName,
    ...(x.itemId ? { itemId: x.itemId as string } : {}),
  };
}

function item(x: unknown, path: string): MenuItem {
  if (!isObj(x)) fail(path, 'n’est pas un objet');
  if (!isStr(x.id)) fail(path, 'sans « id »');
  path = `${path} (${x.id})`;
  if (!isStr(x.name)) fail(path, 'sans « name »');
  if (!isPrice(x.price)) fail(path, 'a un prix invalide');
  if (typeof x.available !== 'boolean') fail(path, '« available » doit valoir true ou false');

  const out: MenuItem = { id: x.id, name: x.name, price: x.price, available: x.available };
  if (x.subtitle !== undefined) out.subtitle = localized(x.subtitle, `${path}.subtitle`);
  if (x.sheetTitle !== undefined) {
    if (!isStr(x.sheetTitle)) fail(path, 'a un « sheetTitle » invalide');
    out.sheetTitle = x.sheetTitle;
  }
  if (x.cartName !== undefined) {
    if (!isStr(x.cartName)) fail(path, 'a un « cartName » invalide');
    out.cartName = x.cartName;
  }
  if (x.listPrice !== undefined) {
    if (x.listPrice !== 'base') fail(path, '« listPrice » ne peut valoir que "base"');
    out.listPrice = 'base';
  }
  if (x.variants !== undefined) {
    const v = x.variants;
    if (!isObj(v) || !Array.isArray(v.options) || v.options.length === 0) fail(path, 'a des variantes invalides');
    const names = config.variantNames[out.id] ?? [];
    const variants: Variants = {
      label: localized(v.label, `${path}.variants.label`),
      options: v.options.map((o, i) => option(o, `${path}.variants.options[${i}]`, names[i])),
    };
    out.variants = variants;
    if (x.defaultVariant !== undefined) {
      const d = x.defaultVariant;
      if (typeof d !== 'number' || !Number.isInteger(d) || d < 0 || d >= variants.options.length) {
        fail(path, 'a un « defaultVariant » hors limites');
      }
      out.defaultVariant = d;
    }
  }
  return out;
}

function group(x: unknown, path: string): MenuGroup {
  if (!isObj(x)) fail(path, 'n’est pas un objet');
  if (!Array.isArray(x.items)) fail(path, 'sans « items »');
  return {
    label: x.label === null || x.label === undefined ? null : localized(x.label, `${path}.label`),
    adultsOnly: x.adultsOnly === true,
    items: x.items.map((it, i) => item(it, `${path}.items[${i}]`)),
  };
}

function category(x: unknown, path: string): Category {
  if (!isObj(x) || !isStr(x.id)) fail(path, 'sans « id »');
  path = `catégorie ${x.id}`;
  if (!Array.isArray(x.groups)) fail(path, 'sans « groups »');
  return {
    id: x.id,
    title: localized(x.title, `${path}.title`),
    tab: localized(x.tab, `${path}.tab`),
    groups: x.groups.map((g, i) => group(g, `${path}.groups[${i}]`)),
  };
}

/** Identifiant de l'onglet qui montre tout le menu, page par page. */
export const ALL_PAGE = 'tout';

function page(x: unknown, path: string, categoryIds: Set<string>): MenuPage {
  if (!isObj(x) || !isStr(x.id)) fail(path, 'sans « id »');
  path = `page ${x.id}`;
  if (!Array.isArray(x.categories) || x.categories.length === 0) fail(path, 'sans « categories »');
  for (const c of x.categories) if (!isStr(c) || !categoryIds.has(c)) fail(path, `a une catégorie inconnue : ${String(c)}`);
  const image = x.image ?? null;
  const imageRatio = x.imageRatio ?? null;
  if (image !== null && !isStr(image)) fail(path, 'a une « image » invalide');
  if (imageRatio !== null && !(isStr(imageRatio) && /^\d+ \/ \d+$/.test(imageRatio))) fail(path, 'a un « imageRatio » invalide');
  if ((image === null) !== (imageRatio === null)) fail(path, 'doit avoir « image » et « imageRatio » ensemble');
  return { id: x.id, title: localized(x.title, `${path}.title`), categories: x.categories as string[], image, imageRatio };
}

/** Pages de la carte (sans l'onglet « Tout »). */
export function realPages(menu: Menu): MenuPage[] {
  return menu.pages.filter((p) => p.id !== ALL_PAGE);
}

/** Page de la carte où se trouve une catégorie (jamais « Tout »). */
export function pageOfCategory(menu: Menu, categoryId: string): MenuPage | undefined {
  return realPages(menu).find((p) => p.categories.includes(categoryId));
}

/**
 * Vérifie et normalise le contenu de menu.json.
 * Lève une MenuError avec un message lisible si une donnée est invalide.
 */
export function parseMenu(raw: unknown): Menu {
  if (!isObj(raw) || !Array.isArray(raw.categories)) fail('', 'doit contenir « categories »');
  const categories = raw.categories.map((c, i) => category(c, `categories[${i}]`));
  const categoryIds = new Set(categories.map((c) => c.id));
  // Sans « pages » : une page par catégorie, sans photo.
  const pages = Array.isArray(raw.pages)
    ? raw.pages.map((p, i) => page(p, `pages[${i}]`, categoryIds))
    : categories.map((c) => ({ id: c.id, title: c.title, categories: [c.id], image: null, imageRatio: null }));
  const menu: Menu = { version: typeof raw.version === 'number' ? raw.version : 1, pages, categories };
  const pageIds = new Set<string>();
  for (const p of pages) {
    if (pageIds.has(p.id)) fail(`page ${p.id}`, 'a un identifiant en double');
    pageIds.add(p.id);
  }
  for (const c of categories) if (!pageOfCategory(menu, c.id)) fail(`catégorie ${c.id}`, 'n’est dans aucune page');
  const seen = new Set<string>();
  for (const it of allItems(menu)) {
    if (seen.has(it.id)) fail(`article ${it.id}`, 'a un identifiant en double');
    seen.add(it.id);
  }
  return menu;
}

export function* allItems(menu: Menu): Generator<MenuItem> {
  for (const c of menu.categories) for (const g of c.groups) yield* g.items;
}

export interface ItemRef {
  item: MenuItem;
  category: Category;
  group: MenuGroup;
}

/** Index id → article, catégorie et groupe, pour des recherches rapides. */
export function indexMenu(menu: Menu): Map<string, ItemRef> {
  const index = new Map<string, ItemRef>();
  for (const category of menu.categories) {
    for (const group of category.groups) {
      for (const item of group.items) index.set(item.id, { item, category, group });
    }
  }
  return index;
}

/** Charge /menu.json (mis en cache par le service worker) et le vérifie. */
export async function loadMenu(): Promise<Menu> {
  // no-cache : le navigateur revérifie auprès du serveur ; hors connexion, le service worker répond.
  const res = await fetch('/menu.json', { cache: 'no-cache' });
  if (!res.ok) throw new MenuError(`menu.json : réponse ${res.status}`);
  return parseMenu(await res.json());
}
