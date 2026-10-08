import { config, type VariantName } from '../config';
import type { Category, Localized, Menu, MenuGroup, MenuItem, VariantOption, Variants } from '../types/menu';

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

/**
 * Vérifie et normalise le contenu de menu.json.
 * Lève une MenuError avec un message lisible si une donnée est invalide.
 */
export function parseMenu(raw: unknown): Menu {
  if (!isObj(raw) || !Array.isArray(raw.categories)) fail('', 'doit contenir « categories »');
  const menu: Menu = {
    version: typeof raw.version === 'number' ? raw.version : 1,
    categories: raw.categories.map((c, i) => category(c, `categories[${i}]`)),
  };
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
