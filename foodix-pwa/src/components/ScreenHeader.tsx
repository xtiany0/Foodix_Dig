import { useStore } from '../state/store';
import BackLink from './BackLink';
import { BackIcon } from './icons';
import base from '../screens/Screen.module.css';

interface Props {
  /** Titre court de l'en-tête sur téléphone. */
  title: string;
  backLabel: string;
  step?: string;
}

/**
 * En-tête des écrans de commande.
 * Téléphone : retour, titre, étape. Tablette et ordinateur : « Retour », logo centré, étape ;
 * le titre passe alors dans la page (voir PageTitle).
 */
export default function ScreenHeader({ title, backLabel, step }: Props) {
  const { t, layout } = useStore();
  if (layout === 'phone') {
    return (
      <header className={base.header}>
        <BackLink className={base.back} label={backLabel}>
          <BackIcon size={22} stroke={2.2} />
        </BackLink>
        <h1 className={base.title}>{title}</h1>
        {step && <span className={base.step}>{step}</span>}
      </header>
    );
  }
  return (
    <header className={`${base.header} ${base.headerWide}`}>
      <BackLink className={base.backWide} label={backLabel}>
        <BackIcon size={22} stroke={2.2} />
        <span aria-hidden="true">{t.back}</span>
      </BackLink>
      <span className={base.logoWrap}>
        <img src="/brand/foodix-logo-jour-sans-slogan.webp" width={640} height={314} alt="Foodix" className={base.logo} />
      </span>
      <span className={base.step}>{step}</span>
    </header>
  );
}

/** Titre dans la page, sur tablette et ordinateur. */
export function PageTitle({ children }: { children: string }) {
  const { layout } = useStore();
  return layout === 'phone' ? null : <h1 className={base.pageTitle}>{children}</h1>;
}
