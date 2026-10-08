import type { Category, Lang, MenuItem } from '../types/menu';

/** Minuscules sans accents : « Bœuf » et « boeuf », « Pastèque » et « pasteque » se retrouvent. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/gi, 'oe')
    .toLowerCase()
    .trim();
}

/** Texte dans lequel la recherche cherche un article. */
export function searchText(item: MenuItem, category: Category, lang: Lang): string {
  return normalize(
    [
      item.name,
      item.cartName ?? '',
      item.sheetTitle ?? '',
      item.subtitle?.[lang] ?? '',
      category.title[lang],
      ...(item.variants?.options.map((o) => o.label) ?? []),
    ].join(' '),
  );
}
