import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLayout } from './lib/env';
import { useRoute, type Route } from './lib/router';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import MenuScreen from './screens/MenuScreen';
import OrdersScreen from './screens/OrdersScreen';
import SendScreen from './screens/SendScreen';
import { StoreProvider } from './state/store';
import type { Menu } from './types/menu';

function Screens() {
  const layout = useLayout();
  const raw = useRoute();
  // Tablette et ordinateur : le panier est le panneau de droite de l'accueil.
  const route: Route = raw === 'panier' && layout !== 'phone' ? 'menu' : raw;
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
      {route === 'commande' && <CheckoutScreen />}
      {route === 'envoi' && <SendScreen />}
      {route === 'confirmation' && <ConfirmationScreen />}
      {route === 'commandes' && <OrdersScreen />}
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
