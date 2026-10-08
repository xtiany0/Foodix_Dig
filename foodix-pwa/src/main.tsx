import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';
import LoadError from './screens/LoadError';
import { dropLaunch, finishLaunch } from './lib/launch';
import { loadMenu } from './lib/menu';
import { initHistory } from './lib/router';

const container = document.getElementById('root')!;

initHistory();

// L'écran de lancement de index.html recouvre l'app jusqu'au chargement du menu (durée minimale : config.launchMinMs).
loadMenu()
  .then((menu) => {
    createRoot(container).render(
      <StrictMode>
        <App menu={menu} />
      </StrictMode>,
    );
    void finishLaunch();
    // Première visite : le service worker n'interceptait pas encore le premier chargement du menu.
    // On le redemande une fois qu'il est actif, pour que le menu soit consultable hors connexion.
    if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => void fetch('/menu.json', { cache: 'no-cache' }).catch(() => {}),
        { once: true },
      );
    }
  })
  .catch((err: unknown) => {
    console.error(err);
    dropLaunch();
    createRoot(container).render(<LoadError />);
  });
