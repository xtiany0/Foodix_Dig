import { allItems } from './lib/menu';
import type { Menu } from './types/menu';

interface Props {
  menu: Menu;
}

/** Étape 1 : vérifie le chargement du menu. Les écrans arrivent à l'étape 2. */
export default function App({ menu }: Props) {
  const count = [...allItems(menu)].length;
  return (
    <main style={{ padding: 16 }}>
      <p style={{ fontWeight: 800 }}>
        Menu chargé : {menu.categories.length} catégories, {count} articles.
      </p>
      <p style={{ fontFamily: 'var(--fx-font-display)', fontSize: 23 }}>Plats principaux</p>
    </main>
  );
}
