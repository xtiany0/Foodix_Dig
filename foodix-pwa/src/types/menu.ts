/** Types de data/menu.json, la source de vérité du menu. */

export type Lang = 'fr' | 'en';

export type Localized = Record<Lang, string>;

export interface VariantOption {
  /** Libellé affiché dans la fiche (non traduit, comme les noms des plats). */
  label: string;
  price: number;
  /** Nom écrit dans le panier et le message WhatsApp. */
  cartName: string;
  /** Pour le bubble tea : identifiant de l'article de la liste qui correspond à ce parfum. */
  itemId?: string;
  /**
   * Identifiant stable de l'option, calculé au chargement (pas dans le JSON) :
   * le cartName d'origine de menu.json. Il ne change pas quand config.ts renomme
   * la variante, donc les paniers et historiques déjà enregistrés restent valides.
   */
  key: string;
}

export interface Variants {
  label: Localized;
  options: VariantOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
  subtitle?: Localized;
  variants?: Variants;
  /** Option présélectionnée à l'ouverture de la fiche (index dans variants.options). */
  defaultVariant?: number;
  /** Titre de la fiche quand il diffère du nom de la liste (ex. « Bubble tea »). */
  sheetTitle?: string;
  /** Nom dans le panier quand il diffère du nom de la liste (ex. « Jus d’ananas »). */
  cartName?: string;
  /** « base » : la liste affiche le prix de base seul, pas « min / max » (chichas). */
  listPrice?: 'base';
}

export interface MenuGroup {
  label: Localized | null;
  adultsOnly: boolean;
  items: MenuItem[];
}

export interface Category {
  id: string;
  title: Localized;
  tab: Localized;
  groups: MenuGroup[];
}

export interface Menu {
  version: number;
  categories: Category[];
}
