import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { config } from '../config';
import CartPanel from '../components/CartPanel';
import CartPill from '../components/CartPill';
import Footer from '../components/Footer';
import { InstallBanner, IosGuide } from '../components/InstallPrompt';
import ItemSheet from '../components/ItemSheet';
import MenuRow from '../components/MenuRow';
import StatusBanner from '../components/StatusBanner';
import Toast from '../components/Toast';
import { GlobeIcon, NextIcon, PhoneIcon, ReceiptIcon, SearchIcon } from '../components/icons';
import { useInstallOffer } from '../lib/install';
import { ALL_PAGE, pageOfCategory, realPages } from '../lib/menu';
import { href, useOverlayHistory, useRoute } from '../lib/router';
import { normalize, searchText } from '../lib/search';
import { useStore } from '../state/store';
import type { Category, MenuGroup, MenuItem, MenuPage } from '../types/menu';
import styles from './MenuScreen.module.css';

interface Section {
  category: Category;
  groups: { group: MenuGroup; items: MenuItem[] }[];
  /** Onglet « Tout » : début d'une page de la carte (séparateur et photo avant la catégorie). */
  pageStart?: { page: MenuPage; n: number };
}

const TOAST_MS = 2400;

/** « 900 / 551 » → dimensions de l'image, pour réserver sa place avant le chargement. */
function ratioSize(ratio: string | null): { width: number; height: number } {
  const [width, height] = (ratio ?? '4 / 3').split('/').map((n) => Number(n.trim()));
  return { width, height };
}

export default function MenuScreen() {
  const { menu, index, lang, setLang, t, isOpen, online, layout } = useStore();
  const [query, setQuery] = useState('');
  const cardPages = useMemo(() => realPages(menu), [menu]);
  // Page ouverte par défaut : la première de la carte (Plats principaux), jamais « Tout ».
  const [pageId, setPageId] = useState(cardPages[0]?.id ?? ALL_PAGE);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number>(undefined);
  const tabsRef = useRef<HTMLDivElement>(null);
  const wide = layout !== 'phone';
  const desktop = layout === 'desktop';
  const offer = useInstallOffer();
  const onMenu = useRoute() === 'menu';
  // La bannière Android ne doit jamais faire sauter le menu sous le doigt du client :
  // elle n'apparaît que si elle est prête pendant l'écran de lancement, ou au retour sur le menu.
  const [installVisible, setInstallVisible] = useState(false);
  useEffect(() => {
    if (offer !== 'android') setInstallVisible(false);
    else if (!onMenu || document.getElementById('launch')) setInstallVisible(true);
  }, [offer, onMenu]);
  const showInstall = offer === 'android' && installVisible;

  useOverlayHistory(sheetId !== null, () => setSheetId(null));

  const page = menu.pages.find((p) => p.id === pageId) ?? cardPages[0];
  const q = normalize(query);
  const isAll = page.id === ALL_PAGE;
  // Pendant une recherche : tout le menu, sans photo ni page suivante.
  const hero = !q && !isAll && page.image ? page : null;
  const nextPage = !q && !isAll ? menu.pages[menu.pages.indexOf(page) + 1] : undefined;

  const sections = useMemo<Section[]>(() => {
    const byId = new Map(menu.categories.map((c) => [c.id, c]));
    const order = q ? menu.categories : page.categories.map((id) => byId.get(id)).filter((c): c is Category => !!c);
    const starts = new Map<string, Section['pageStart']>();
    if (isAll && !q) cardPages.forEach((p, i) => starts.set(p.categories[0], { page: p, n: i + 1 }));
    return order
      .map((category) => ({
        category,
        pageStart: starts.get(category.id),
        groups: category.groups
          .map((group) => ({
            group,
            items: q ? group.items.filter((it) => searchText(it, category, lang).includes(q)) : group.items,
          }))
          .filter((g) => g.items.length > 0),
      }))
      .filter((s) => s.groups.length > 0);
  }, [menu, page, cardPages, isAll, q, lang]);

  // Garde l'onglet actif visible dans la barre qui défile horizontalement.
  useEffect(() => {
    const bar = tabsRef.current;
    const tab = bar?.querySelector<HTMLElement>(`[data-page="${page.id}"]`);
    if (!bar || !tab) return;
    if (tab.offsetLeft < bar.scrollLeft || tab.offsetLeft + tab.offsetWidth > bar.scrollLeft + bar.clientWidth) {
      bar.scrollTo({ left: tab.offsetLeft - 8 });
    }
  }, [page.id]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /** Nouvelle page : on revient en haut du menu si on l'avait dépassé (l'en-tête reste visible sinon). */
  const pickPage = (id: string) => {
    setPageId(id);
    setQuery('');
    const top = document.getElementById('menu-haut');
    if (!top) return;
    const margin = parseFloat(getComputedStyle(top).scrollMarginTop) || 0;
    if (top.getBoundingClientRect().top < margin) top.scrollIntoView({ block: 'start' });
  };

  // Fiche ouverte depuis « Tout » : le menu passe sur la page de l'article, qui reste sous le doigt.
  const keepInView = useRef<{ id: string; top: number } | null>(null);
  const openItem = (id: string) => {
    setSheetId(id);
    const ref = index.get(id);
    const target = ref && pageOfCategory(menu, ref.category.id);
    if (!target || target.id === page.id) return;
    const row = document.getElementById('item-' + id);
    keepInView.current = row ? { id, top: row.getBoundingClientRect().top } : null;
    setPageId(target.id);
  };
  useLayoutEffect(() => {
    const keep = keepInView.current;
    if (!keep) return;
    keepInView.current = null;
    const row = document.getElementById('item-' + keep.id);
    if (row) window.scrollBy(0, row.getBoundingClientRect().top - keep.top);
  }, [page.id]);

  const showToast = useCallback(
    (label: string) => {
      setToast(t.added + label);
      clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(''), TOAST_MS);
    },
    [t],
  );

  const phone = config.phones[0];

  // Un seul bouton langue : un appui bascule FR ↔ EN (choix mémorisé).
  const langToggle = (
    <button type="button" className={styles.langToggle} aria-label={t.langAria} onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}>
      <GlobeIcon size={18} stroke={1.9} />
      {lang === 'en' ? 'EN' : 'FR'}
    </button>
  );

  const status = (
    <span className={styles.status}>
      <span className={styles.dot} style={{ background: isOpen ? 'var(--fx-green-on-navy)' : 'var(--fx-red-on-navy)' }} aria-hidden="true" />
      {isOpen ? t.open : t.closed}
    </span>
  );

  const search = (
    <div className={styles.search}>
      <SearchIcon size={19} color="var(--fx-placeholder)" />
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
  );

  return (
    <div className={styles.screen} data-layout={layout}>
      {desktop && (
        <header className={styles.topbar} data-navy>
          <img src="/brand/foodix-logo-nuit-sans-slogan.webp" width={640} height={314} alt="Foodix" className={styles.topLogo} />
          {status}
          <div className={styles.topSearch}>{search}</div>
          <div className={styles.topActions}>
            {langToggle}
            <a href={href('commandes')} className={styles.textLink}>
              <ReceiptIcon size={20} stroke={1.9} />
              {t.myOrders}
            </a>
            <a href={`tel:${phone.tel}`} className={`${styles.textLink} ${styles.num}`}>
              <PhoneIcon size={20} stroke={1.9} />
              {phone.display}
            </a>
          </div>
        </header>
      )}

      <div className={styles.body}>
        {desktop && (
          <nav aria-label={t.catsAria} className={styles.sideNav}>
            {menu.pages.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-current={page.id === p.id ? 'page' : undefined}
                className={`${styles.sideLink} ${page.id === p.id ? styles.sideOn : ''}`}
                onClick={() => pickPage(p.id)}
              >
                <span className={styles.sideDot} aria-hidden="true" />
                {p.title[lang]}
              </button>
            ))}
          </nav>
        )}

        <div className={styles.center}>
          {!desktop && (
            <header className={styles.header} data-navy>
              {/* 3 colonnes : les deux côtés ont la même largeur, le logo reste au centre de la page. */}
              <div className={styles.headGrid}>
                <div className={styles.headLeft}>{langToggle}</div>
                <img src="/brand/foodix-logo-nuit-sans-slogan.webp" width={640} height={314} alt="Foodix" className={styles.logo} />
                <div className={styles.headRight}>
                  <a href={href('commandes')} className={styles.iconLink} aria-label={t.myOrders}>
                    <ReceiptIcon size={22} stroke={1.9} />
                  </a>
                  <a href={`tel:${phone.tel}`} className={styles.iconLink} aria-label={t.call}>
                    <PhoneIcon size={22} stroke={1.9} />
                  </a>
                </div>
              </div>
              <div className={styles.subRow}>
                <span className={styles.slogan}>{t.slogan}</span>
                {status}
              </div>
              <div className={styles.headSearch}>{search}</div>
            </header>
          )}

          {(!isOpen || !online || showInstall) && (
            <div className={styles.banners}>
              {!isOpen && <StatusBanner kind="closed" />}
              {!online && <StatusBanner kind="offline" />}
              {showInstall && <InstallBanner />}
            </div>
          )}

          {!desktop && (
            <nav aria-label={t.catsAria} className={styles.tabs}>
              <div ref={tabsRef} className={styles.tabsScroll}>
                {menu.pages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    data-page={p.id}
                    aria-current={page.id === p.id ? 'page' : undefined}
                    className={`${styles.tab} ${page.id === p.id ? styles.tabOn : ''}`}
                    onClick={() => pickPage(p.id)}
                  >
                    {p.title[lang]}
                  </button>
                ))}
              </div>
            </nav>
          )}

          <main className={styles.main}>
            <div id="menu-haut" className={styles.top} />
            {hero && (
              <div className={styles.hero}>
                <img src={hero.image!} alt="" {...ratioSize(hero.imageRatio)} decoding="async" className={styles.photo} />
              </div>
            )}

            {sections.map(({ category, groups, pageStart }) => (
              <section key={category.id} id={'cat-' + category.id} className={styles.section}>
                {pageStart && (
                  <>
                    <div className={`${styles.divider} ${pageStart.n === 1 ? styles.dividerFirst : ''}`}>
                      <span className={styles.rule} aria-hidden="true" />
                      <div className={styles.dividerText}>
                        <div className={styles.pageNum}>{t.pageOf(pageStart.n, cardPages.length)}</div>
                        <h2 className={styles.pageTitle}>{pageStart.page.title[lang]}</h2>
                      </div>
                      <span className={styles.rule} aria-hidden="true" />
                    </div>
                    {pageStart.page.image && (
                      <div className={styles.dividerPhoto}>
                        <img
                          src={pageStart.page.image}
                          alt=""
                          {...ratioSize(pageStart.page.imageRatio)}
                          loading="lazy"
                          decoding="async"
                          className={styles.photo}
                        />
                      </div>
                    )}
                  </>
                )}
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
                        <MenuRow key={it.id} item={it} editingKey={editing} onOpen={openItem} onToggleNote={setEditing} />
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

            {nextPage && (
              <div className={styles.nextWrap}>
                <button type="button" className={styles.next} onClick={() => pickPage(nextPage.id)}>
                  <span>
                    {t.nextPage} : {nextPage.title[lang]}
                  </span>
                  <NextIcon size={20} stroke={2.4} />
                </button>
              </div>
            )}
          </main>

          <Footer wide={wide} />
        </div>

        {wide && <CartPanel />}
      </div>

      <Toast text={toast} />
      {!wide && <CartPill />}
      {offer === 'ios' && <IosGuide blocked={!onMenu || sheetId !== null} />}
      {sheetId && <ItemSheet itemId={sheetId} onClose={() => setSheetId(null)} onAdded={showToast} />}
    </div>
  );
}
