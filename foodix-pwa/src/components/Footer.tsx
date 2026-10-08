import { config } from '../config';
import { useStore } from '../state/store';
import { FacebookIcon, InstagramIcon, PhoneIcon, TikTokIcon } from './icons';
import styles from './Footer.module.css';

/** Pied de page de l'accueil. Contact de la conception : jamais de nom. */
export default function Footer() {
  const { t } = useStore();
  const { social, phones, designer } = config;
  const networks = [
    { name: 'Facebook', url: social.facebook, icon: <FacebookIcon size={21} /> },
    { name: 'TikTok', url: social.tiktok, icon: <TikTokIcon size={19} /> },
    { name: 'Instagram', url: social.instagram, icon: <InstagramIcon size={20} /> },
  ];

  return (
    <footer className={styles.footer}>
      <img src="/brand/foodix-logo-nuit.png" width={720} height={358} alt="Foodix, Manger bon, manger mobile" className={styles.logo} loading="lazy" />
      <p className={styles.thanks}>{t.thanks}</p>
      <div className={styles.socials}>
        {networks.map((n) => (
          <a key={n.name} href={n.url} className={styles.social} aria-label={t.socialAria(n.name)} target="_blank" rel="noopener">
            {n.icon}
          </a>
        ))}
      </div>
      <span className={styles.handle}>{social.handle}</span>
      <div className={styles.phones}>
        {phones.map((p) => (
          <a key={p.tel} href={`tel:${p.tel}`} className={styles.phone}>
            <PhoneIcon size={18} color="var(--fx-orange-text)" />
            {p.display}
          </a>
        ))}
      </div>
      <a href={designer.url} className={styles.credit} target="_blank" rel="noopener">
        {t.credit}
        <span className={styles.creditNum}>{designer.display}</span>
      </a>
    </footer>
  );
}
