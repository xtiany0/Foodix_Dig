import type { ReactNode } from 'react';
import { goBack } from '../lib/router';

/** Lien qui revient à l'écran précédent sans empiler une nouvelle entrée d'historique. */
export default function BackLink({ className, label, children }: { className: string; label?: string; children: ReactNode }) {
  return (
    <a
      href="#/"
      className={className}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        goBack();
      }}
    >
      {children}
    </a>
  );
}
