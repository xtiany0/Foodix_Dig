import { useEffect } from 'react';
import BackLink from '../components/BackLink';
import { CheckIcon, WhatsAppIcon } from '../components/icons';
import { config } from '../config';
import { formatPrice } from '../lib/price';
import { href, navigate } from '../lib/router';
import { whatsappLink } from '../lib/whatsapp';
import { useStore } from '../state/store';
import base from './Screen.module.css';
import styles from './ConfirmationScreen.module.css';

/** Commande envoyée : numéro, étapes suivantes, rouvrir WhatsApp. */
export default function ConfirmationScreen() {
  const { t, history, layout } = useStore();
  const order = history[0];

  useEffect(() => {
    if (!order) navigate('menu', true);
  }, [order]);
  if (!order) return null;

  const livraison = order.mode === 'livraison';
  const phone = config.phones[0];

  return (
    <div className={base.screen}>
      {layout !== 'phone' && (
        <header className={`${base.header} ${base.headerWide}`}>
          <span className={base.logoWrap}>
            <img src="/brand/foodix-logo-nuit-sans-slogan.webp" width={640} height={314} alt="Foodix" className={base.logo} />
          </span>
        </header>
      )}
      <main className={styles.content}>
        <div className={styles.hero}>
          <span className={styles.check}>
            <CheckIcon size={30} stroke={2.8} />
          </span>
          <h1 className={styles.title}>{t.sent}</h1>
          <p className={styles.recap}>
            {t.orderRecap} <strong className={styles.number}>{order.id}</strong> · {formatPrice(order.total)}
            {livraison ? ` ${t.exDelivery}` : ''}
          </p>
        </div>

        <section className={styles.next}>
          <h2 className={styles.band}>
            {t.next}
            <span className={styles.bandTick} aria-hidden="true" />
          </h2>
          <ol className={styles.steps}>
            <li className={styles.stepItem}>
              <span className={styles.stepNum}>1</span>
              <span className={styles.stepText}>{t.next1}</span>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepText}>{livraison ? t.next2Livraison : t.next2Emporter}</span>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNum}>3</span>
              <span className={styles.stepText}>{t.next3(order.mode, t.payIn[order.payment])}</span>
            </li>
          </ol>
        </section>

        <div className={styles.actions}>
          <a href={whatsappLink(config.whatsappNumber)} target="_blank" rel="noopener" className={styles.reopen}>
            <WhatsAppIcon size={20} color="var(--fx-green)" />
            {t.reopenWa}
          </a>
          <span className={styles.small}>{t.notSentYet}</span>
          <BackLink className={styles.toMenu}>{t.backToMenu}</BackLink>
          <a href={href('commandes')} className={styles.orders}>
            {t.seeOrders}
          </a>
        </div>

        <div className={styles.foot}>
          <span className={styles.faint}>{t.cartCleared}</span>
          <a href={`tel:${phone.tel}`} className={styles.call}>
            {t.question(phone.display)}
          </a>
        </div>
      </main>
    </div>
  );
}
