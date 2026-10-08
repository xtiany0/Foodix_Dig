import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';
import LoadError from './screens/LoadError';
import { loadMenu } from './lib/menu';
import { initHistory } from './lib/router';

const container = document.getElementById('root')!;

initHistory();

// L'écran de lancement de index.html reste affiché jusqu'à ce que le menu soit chargé.
loadMenu()
  .then((menu) => {
    createRoot(container).render(
      <StrictMode>
        <App menu={menu} />
      </StrictMode>,
    );
  })
  .catch((err: unknown) => {
    console.error(err);
    createRoot(container).render(<LoadError />);
  });
