import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { config } from '../config';
import CartPill from '../components/CartPill';
import Footer from '../components/Footer';
import ItemSheet from '../components/ItemSheet';
import MenuRow from '../components/MenuRow';
import Toast from '../components/Toast';
import { PhoneIcon, ReceiptIcon, SearchIcon } from '../components/icons';
import { useOverlayHistory } from '../lib/router';
import { normalize, searchText } from '../lib/search';
import { useStore } from '../state/store';
import type { Category, MenuGroup, MenuItem } from '../types/menu';
import styles from './MenuScreen.module.css';

interface Section {
  category: Category;
  groups: { group: MenuGroup; items: MenuItem[] }[];
}

const TOAST_MS = 2400;
/** Hauteur des onglets collants : une section est « active » quand son titre passe dessous. */
const TABS_OFFSET = 60;

export default function MenuScreen() {
  const { menu, lang, setLang, t, isOpen } = useStore();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(menu.categories[0]?.id ?? '');
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number>(undefined);
  const tabsRef = useRef<HTMLDivElement>(null);

  useOverlayHistory(sheetId !== null, () => setSheetId(null));

  const sections = useMemo<Section[]>(() => {
    const q = normalize(query);
    return menu.categories
      .map((category) => ({
        category,
        groups: category.groups
          .map((group) => ({
            group,
            items: q ? group.items.filter((it) => searchText(it, category, lang).includes(q)) : group.items,
          }))
          .filter((g) => g.items.length > 0),
      }))
      .filter((s) => s.groups.length > 0);
  }, [menu, query, lang]);

  // Onglet actif = dernière section dont le titre est passé sous les onglets.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current = sections[0]?.category.id;
        for (const s of sections) {
          const el = document.getElementById('cat-' + s.category.id);
          if (el && el.getBoundingClientRect().top <= TABS_OFFSET + 1) current = s.category.id;
        }
        if (current) setActive(current);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [sections]);

  // Garde l'onglet actif visible dans la barre qui défile horizontalement.
  useEffect(() => {
    const bar = tabsRef.current;
    const tab = bar?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (!bar || !tab) return;
    if (tab.offsetLeft < bar.scrollLeft || tab.offsetLeft + tab.offsetWidth > bar.scrollLeft + bar.clientWidth) {
      bar.scrollTo({ left: tab.offsetLeft - 8 });
    }
  }, [active]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const pickCategory = (id: string) => {
    setActive(id);
    document.getElementById('cat-' + id)?.scrollIntoView({ block: 'start' });
  };

  const showToast = useCallback((label: string) => {
    setToast(t.added + label);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), TOAST_MS);
  }, [t]);

  const phone = config.phones[0];

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headRow}>
          <img src="/brand/foodix-logo-nuit-sans-slogan.png" width={640} height={314} alt="Foodix" className={styles.logo} />
          <div className={styles.actions}>
            <div role="group" aria-label={t.langGroup} className={styles.lang}>
              {(['fr', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  lang={l}
                  aria-pressed={lang === l}
                  className={`${styles.langBtn} ${lang === l ? styles.langOn : ''}`}
                  onClick={() => setLang(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <a href="#/commandes" className={styles.iconLink} aria-label={t.myOrders}>
              <ReceiptIcon size={22} stroke={1.9} />
            </a>
            <a href={`tel:${phone.tel}`} className={styles.iconLink} aria-label={t.call}>
              <PhoneIcon size={22} stroke={1.9} />
            </a>
          </div>
        </div>
        <div className={styles.subRow}>
          <span className={styles.slogan}>{t.slogan}</span>
          <span className={styles.status}>
            <span className={styles.dot} style={{ background: isOpen ? 'var(--fx-green)' : 'var(--fx-red)' }} aria-hidden="true" />
            {isOpen ? t.open : t.closed}
          </span>
        </div>
      </header>

      <div className={styles.search}>
        <SearchIcon size={19} color="var(--fx-text-muted)" />
        <input
          type="search"
          className={styles.searchInput}
          aria-label={t.searchAria}
          placeholder={t.search}
          value={query}
          enterKeyHint="search"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <nav aria-label={t.catsAria} className={styles.tabs}>
        <div ref={tabsRef} className={styles.tabsScroll}>
          {menu.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              data-cat={c.id}
              aria-current={active === c.id ? 'true' : undefined}
              className={`${styles.tab} ${active === c.id ? styles.tabOn : ''}`}
              onClick={() => pickCategory(c.id)}
            >
              {c.tab[lang]}
            </button>
          ))}
        </div>
      </nav>

      <main>
        {sections.map(({ category, groups }) => (
          <section key={category.id} id={'cat-' + category.id} className={styles.section}>
            <h2 className={styles.band}>
              {category.title[lang]}
              <span className={styles.bandTick} aria-hidden="true" />
            </h2>
            {groups.map(({ group, items }, gi) => (
              <div key={gi}>
                {(group.label || group.adultsOnly) && (
                  <div className={styles.groupHead}>
                    {group.label && <span className={styles.groupLabel}>{group.label[lang]}</span>}
                    {group.adultsOnly && <span className={styles.adult}>{t.adult}</span>}
                  </div>
                )}
                <div className={styles.items}>
                  {items.map((it) => (
                    <MenuRow key={it.id} item={it} editing={editing === it.id} onOpen={setSheetId} onToggleNote={setEditing} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}

        {sections.length === 0 && (
          <div className={styles.noResults}>
            <strong className={styles.noResTitle}>{t.noResTitle}</strong>
            <span className={styles.noResText}>{t.noResText}</span>
            <button type="button" className={styles.clearSearch} onClick={() => setQuery('')}>
              {t.clearSearch}
            </button>
          </div>
        )}
      </main>

      <Footer />
      <Toast text={toast} />
      <CartPill />
      {sheetId && <ItemSheet itemId={sheetId} onClose={() => setSheetId(null)} onAdded={showToast} />}
    </div>
  );
}
