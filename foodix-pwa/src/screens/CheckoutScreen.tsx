import { useEffect, useRef, useState, type ReactNode } from 'react';
import ScreenHeader, { PageTitle } from '../components/ScreenHeader';
import { CloseIcon, PinIcon, RefreshIcon, WarningIcon } from '../components/icons';
import { draftErrors, type DraftError } from '../lib/checkout';
import { formatPrice } from '../lib/price';
import { navigate } from '../lib/router';
import { useStore } from '../state/store';
import base from './Screen.module.css';
import styles from './CheckoutScreen.module.css';

type GeoStatus = 'idle' | 'loading' | 'refused' | 'failed';

const FIELD_ID: Record<DraftError, string> = { name: 'f-nom', phone: 'f-tel', address: 'f-quartier', time: 'f-heure' };

interface FieldProps {
  id: string;
  label: ReactNode;
  error?: string;
  children: (a11y: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children({ id, ...(error ? { 'aria-invalid': true, 'aria-describedby': id + '-err' } : {}) })}
      {error && (
        <span id={id + '-err'} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}

/** Validation de la commande : livraison ou à emporter (étape 1 sur 2). */
export default function CheckoutScreen() {
  const { t, draft, updateDraft, saveProfile, lines, count, total, canOrder } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>(draft.geoLink ? 'refused' : 'idle');
  const geoRef = useRef<HTMLDivElement>(null);
  const livraison = draft.mode === 'livraison';

  // Panier vide (retour arrière après un envoi, lien direct) : retour au panier.
  useEffect(() => {
    if (lines.length === 0) navigate('panier', true);
  }, [lines.length]);

  const errors = submitted ? draftErrors(draft) : [];
  const errorText: Record<DraftError, string> = { name: t.errName, phone: t.errPhone, address: t.errAddress, time: t.errTime };
  const err = (k: DraftError) => (errors.includes(k) ? errorText[k] : undefined);

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('failed');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateDraft({
          geo: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) },
          geoLink: '',
        });
        setGeoStatus('idle');
      },
      (e) => {
        setGeoStatus(e.code === e.PERMISSION_DENIED ? 'refused' : 'failed');
        requestAnimationFrame(() => geoRef.current?.scrollIntoView({ block: 'nearest' }));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const next = () => {
    const found = draftErrors(draft);
    setSubmitted(true);
    if (found.length) {
      document.getElementById(FIELD_ID[found[0]])?.focus();
      return;
    }
    saveProfile();
    navigate('envoi');
  };

  const segment = (on: boolean) => `${styles.segBtn} ${on ? styles.segOn : ''}`;

  return (
    <div className={base.screen}>
      <ScreenHeader title={t.myOrder} backLabel={t.backToCart} step={t.step1} />

      <main className={styles.form}>
        <PageTitle>{t.myOrder}</PageTitle>
        <div role="group" aria-label={t.modeGroup} className={styles.segment}>
          <button type="button" aria-pressed={livraison} className={segment(livraison)} onClick={() => updateDraft({ mode: 'livraison' })}>
            {t.modeLivraison}
          </button>
          <button type="button" aria-pressed={!livraison} className={segment(!livraison)} onClick={() => updateDraft({ mode: 'emporter' })}>
            {t.modeEmporter}
          </button>
        </div>

        <Field id="f-nom" label={t.name} error={err('name')}>
          {(a) => (
            <input {...a} type="text" autoComplete="name" className={styles.input} value={draft.name} onChange={(e) => updateDraft({ name: e.target.value })} />
          )}
        </Field>
        <Field id="f-tel" label={t.phone} error={err('phone')}>
          {(a) => (
            <input
              {...a}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={`${styles.input} ${styles.num}`}
              value={draft.phone}
              onChange={(e) => updateDraft({ phone: e.target.value })}
            />
          )}
        </Field>

        {livraison ? (
          <>
            <Field id="f-quartier" label={t.quartier} error={err('address')}>
              {(a) => (
                <input
                  {...a}
                  type="text"
                  className={styles.input}
                  placeholder={t.quartierPh}
                  value={draft.quartier}
                  onChange={(e) => updateDraft({ quartier: e.target.value })}
                />
              )}
            </Field>
            <Field id="f-adresse" label={t.adresse}>
              {(a) => (
                <input
                  {...a}
                  type="text"
                  className={styles.input}
                  placeholder={t.adressePh}
                  value={draft.adresse}
                  onChange={(e) => updateDraft({ adresse: e.target.value })}
                />
              )}
            </Field>

            <div ref={geoRef} className={styles.geo}>
              <span className={styles.label}>
                {t.gps} <span className={styles.optional}>{t.optional}</span>
              </span>

              {draft.geo ? (
                <div className={styles.geoOk}>
                  <div className={styles.geoOkText}>
                    <strong className={styles.geoOkTitle}>{t.geoOk}</strong>
                    <span className={styles.help}>{t.geoAccuracy(draft.geo.accuracy)}</span>
                  </div>
                  <button type="button" className={styles.iconBtn} aria-label={t.geoRetry} onClick={locate}>
                    <RefreshIcon size={19} />
                  </button>
                  <button type="button" className={styles.iconBtn} aria-label={t.geoClear} onClick={() => updateDraft({ geo: null })}>
                    <CloseIcon size={18} stroke={2.2} />
                  </button>
                </div>
              ) : geoStatus === 'refused' || geoStatus === 'failed' ? (
                <>
                  <div role="alert" className={styles.geoAlert}>
                    <div className={styles.geoAlertRow}>
                      <WarningIcon size={20} stroke={2.2} color="var(--fx-orange-text)" />
                      <div className={styles.geoAlertText}>
                        <strong className={styles.geoOkTitle}>{geoStatus === 'refused' ? t.geoRefused : t.geoFailed}</strong>
                        <span className={styles.help}>{t.geoRefusedText}</span>
                      </div>
                    </div>
                    <button type="button" className={styles.retry} onClick={locate}>
                      {t.retry}
                    </button>
                  </div>
                  <div className={styles.field} style={{ paddingTop: 6 }}>
                    <label htmlFor="f-lien" className={styles.label}>
                      {t.geoLink}
                    </label>
                    <input
                      id="f-lien"
                      type="url"
                      inputMode="url"
                      className={`${styles.input} ${styles.light}`}
                      placeholder={t.geoLinkPh}
                      value={draft.geoLink}
                      onChange={(e) => updateDraft({ geoLink: e.target.value })}
                    />
                    <span className={styles.help}>{t.geoLinkHelp}</span>
                  </div>
                </>
              ) : (
                <>
                  <button type="button" className={styles.shareGeo} onClick={locate} disabled={geoStatus === 'loading'}>
                    <PinIcon size={20} color="var(--fx-orange-text)" />
                    {geoStatus === 'loading' ? t.geoLoading : t.shareGeo}
                  </button>
                  <span className={styles.help}>{t.geoHelp}</span>
                </>
              )}
            </div>
          </>
        ) : (
          <fieldset className={styles.pickup}>
            <legend className={styles.legend}>{t.pickup}</legend>
            <div className={styles.segment}>
              <button type="button" aria-pressed={draft.pickup === 'asap'} className={`${segment(draft.pickup === 'asap')} ${styles.segSmall}`} onClick={() => updateDraft({ pickup: 'asap' })}>
                {t.asap}
              </button>
              <button type="button" aria-pressed={draft.pickup === 'time'} className={`${segment(draft.pickup === 'time')} ${styles.segSmall}`} onClick={() => updateDraft({ pickup: 'time' })}>
                {t.atTime}
              </button>
            </div>
            {draft.pickup === 'time' && (
              <div className={styles.timeRow}>
                <label htmlFor="f-heure" className={styles.timeLabel}>
                  {t.pickupAt}
                </label>
                <input
                  id="f-heure"
                  type="time"
                  className={styles.time}
                  value={draft.time}
                  {...(err('time') ? { 'aria-invalid': true, 'aria-describedby': 'f-heure-err' } : {})}
                  onChange={(e) => updateDraft({ time: e.target.value })}
                />
              </div>
            )}
            {err('time') && (
              <span id="f-heure-err" className={styles.error}>
                {err('time')}
              </span>
            )}
            <span className={styles.help} style={{ paddingTop: 4 }}>
              {t.pickupHelp}
            </span>
          </fieldset>
        )}

        {livraison && (
          <div className={styles.field}>
            <label htmlFor="f-note" className={styles.label}>
              {t.orderNote} <span className={styles.optional}>{t.optional}</span>
            </label>
            <textarea
              id="f-note"
              rows={2}
              className={styles.textarea}
              placeholder={t.orderNotePh}
              value={draft.note}
              maxLength={300}
              onChange={(e) => updateDraft({ note: e.target.value })}
            />
          </div>
        )}

        <span className={styles.kept}>{t.keptOnPhone}</span>
      </main>

      <div className={base.bar}>
        <div className={base.barInner}>
          {canOrder ? (
            <button type="button" className={base.primary} onClick={next}>
              <span>{t.continue}</span>
              <span className={`${base.num} ${styles.barMeta}`}>
                {t.item(count)} · {formatPrice(total)}
              </span>
            </button>
          ) : (
            <div className={base.blocked}>{t.blockedClosed}</div>
          )}
        </div>
      </div>
    </div>
  );
}
