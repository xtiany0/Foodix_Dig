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
  })
  .catch((err: unknown) => {
    console.error(err);
    dropLaunch();
    createRoot(container).render(<LoadError />);
  });
