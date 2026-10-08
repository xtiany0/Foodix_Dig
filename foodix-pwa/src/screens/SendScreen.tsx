import { useEffect, useRef } from 'react';
import BackLink from '../components/BackLink';
import { BackIcon, WhatsAppIcon } from '../components/icons';
import { config } from '../config';
import { draftErrors } from '../lib/checkout';
import { PAYMENTS } from '../lib/orders';
import { navigate, restartAt } from '../lib/router';
import { useStore } from '../state/store';
import base from './Screen.module.css';
import styles from './SendScreen.module.css';

/** Envoi : paiement préféré, aperçu exact du message, bouton « Commander sur WhatsApp » (étape 2 sur 2). */
export default function SendScreen() {
  const { t, lang, draft, updateDraft, pending, confirmSend, lines, canOrder } = useStore();
  const sending = useRef(false);

  // Arrivée sans panier ou sans coordonnées (lien direct, rechargement) : on revient à l'étape utile.
  useEffect(() => {
    if (sending.current) return;
    if (lines.length === 0) navigate('panier', true);
    else if (draftErrors(draft).length) navigate('commande', true);
  }, [lines.length, draft]);

  const send = () => {
    // Le lien s'ouvre (WhatsApp) ; l'app enregistre la commande, vide le panier et passe à la confirmation.
    sending.current = true;
    confirmSend();
    restartAt('confirmation');
  };

  return (
    <div className={base.screen}>
      <header className={base.header}>
        <BackLink className={base.back} label={t.back}>
          <BackIcon size={22} stroke={2.2} />
        </BackLink>
        <h1 className={base.title}>{t.send}</h1>
        <span className={base.step}>{t.step2}</span>
      </header>

      <main className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.h2} id="pay-title">
            {t.payTitle}
          </h2>
          <p className={styles.p}>{t.payText}</p>
          <div role="radiogroup" aria-labelledby="pay-title" className={styles.pays}>
            {PAYMENTS.map((p) => {
              const on = draft.payment === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`${styles.pay} ${on ? styles.payOn : ''}`}
                  onClick={() => updateDraft({ payment: p.id })}
                >
                  <span className={styles.payLabel}>{p[lang]}</span>
                  <span className={styles.radio} aria-hidden="true">
                    <span className={styles.radioDot} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>{t.msgTitle}</h2>
          <p className={styles.p}>
            {draft.mode === 'livraison' ? t.msgText(config.whatsappDisplay) : t.msgTextPickup(config.whatsappDisplay)}
          </p>
          <div className={styles.preview}>
            <div className={styles.msg} lang="fr">
              {pending.message}
            </div>
          </div>
        </section>
      </main>

      <div className={base.bar}>
        <div className={base.barInner}>
          {canOrder ? (
            <a href={pending.link} target="_blank" rel="noopener" className={styles.wa} onClick={send}>
              <WhatsAppIcon size={24} />
              {t.orderWhatsapp}
            </a>
          ) : (
            <div className={base.blocked}>{t.blockedClosed}</div>
          )}
          <span className={styles.hint}>{t.waHint}</span>
        </div>
      </div>
    </div>
  );
}
