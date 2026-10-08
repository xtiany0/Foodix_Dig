import { useEffect, useLayoutEffect, useRef } from 'react';
import { useRoute } from './lib/router';
import CartScreen from './screens/CartScreen';
import MenuScreen from './screens/MenuScreen';
import { StoreProvider } from './state/store';
import type { Menu } from './types/menu';

function Screens() {
  const route = useRoute();
  const routeRef = useRef(route);
  routeRef.current = route;
  const menuScroll = useRef(0);

  // Mémorise la position dans le menu pour la retrouver au retour du panier.
  useEffect(() => {
    const onScroll = () => {
      if (routeRef.current === 'menu') menuScroll.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, route === 'menu' ? menuScroll.current : 0);
  }, [route]);

  return (
    <>
      {/* Le menu reste monté (recherche, position) pendant qu'un autre écran est affiché. */}
      <div hidden={route !== 'menu'}>
        <MenuScreen />
      </div>
      {route === 'panier' && <CartScreen />}
    </>
  );
}

export default function App({ menu }: { menu: Menu }) {
  return (
    <StoreProvider menu={menu}>
      <Screens />
    </StoreProvider>
  );
}
