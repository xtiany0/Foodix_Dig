import { useState } from 'react';
import BackLink from '../components/BackLink';
import ConfirmSheet from '../components/ConfirmSheet';
import ScreenHeader, { PageTitle } from '../components/ScreenHeader';
import { TrashIcon, WarningIcon } from '../components/icons';
import { formatOrderDate } from '../lib/dates';
import { planReorder, type Order } from '../lib/orders';
import { formatPrice } from '../lib/price';
import { navigate, useOverlayHistory } from '../lib/router';
import { useStore } from '../state/store';
import base from './Screen.module.css';
import styles from './OrdersScreen.module.css';

/** Mes commandes : historique gardé sur le téléphone, Recommander, suppression. */
export default function OrdersScreen() {
  const { t, lang, history, index, dispatch, removeOrder, clearHistory, canOrder } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);
  useOverlayHistory(confirmClear, () => setConfirmClear(false));

  const reorder = (order: Order) => {
    for (const line of planReorder(index, order).add) dispatch({ type: 'add', line });
    navigate('panier');
  };

  return (
    <div className={base.screen}>
      <ScreenHeader title={t.myOrders} backLabel={t.backToMenu} />

      <main className={styles.content}>
        <PageTitle>{t.myOrders}</PageTitle>
        <span className={styles.limit}>{t.ordersLimit}</span>

        {history.map((order) => {
          const plan = planReorder(index, order);
          const changed = plan.total !== order.total;
          return (
            <article key={order.id} className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardId}>
                  <span className={styles.num}>{order.id}</span>
                  <span className={styles.mode}>{order.mode === 'livraison' ? t.modeLivraison : t.modeEmporter}</span>
                </div>
                <span className={styles.date}>{formatOrderDate(order.at, lang, t)}</span>
              </div>

              <ul className={styles.lines}>
                {plan.lines.map(({ line, status }, i) => (
                  <li key={i} className={`${styles.line} ${status === 'out' ? styles.out : ''}`}>
                    <span className={styles.lineName}>
                      {line.qty}x {line.name}
                      {line.note && <span className={styles.note}> · {line.note}</span>}
                    </span>
                    <span className={styles.price}>{formatPrice(line.unit * line.qty)}</span>
                  </li>
                ))}
              </ul>

              {(plan.hasOut || plan.hasPriceChange) && (
                <div role="note" className={styles.alerts}>
                  {[...plan.lines.filter((l) => l.status === 'out'), ...plan.lines.filter((l) => l.status === 'price')].map(({ line, status, unit }, i) => (
                      <div key={i} className={styles.alert}>
                        <WarningIcon size={17} stroke={2.2} color="var(--fx-orange-text)" />
                        <span>
                          <strong className={styles.alertTag}>{status === 'out' ? t.outTag : t.priceTag} :</strong>{' '}
                          {status === 'out'
                            ? t.outAlert(line.name)
                            : t.priceAlert(line.name, formatPrice(unit!), formatPrice(line.unit))}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <div className={styles.cardFoot}>
                <div className={styles.total}>
                  <span className={styles.totalLabel}>{t.total}</span>
                  <span className={styles.totalValue}>{formatPrice(order.total)}</span>
                </div>
                <button type="button" className={styles.remove} aria-label={t.removeOrder(order.id)} onClick={() => removeOrder(order.id)}>
                  <TrashIcon size={19} stroke={1.9} />
                </button>
                {plan.add.length > 0 && (
                  <button type="button" className={styles.reorder} disabled={!canOrder} onClick={() => reorder(order)}>
                    {t.reorder}
                    {changed ? ` · ${formatPrice(plan.total)}` : ''}
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {history.length > 0 ? (
          <button type="button" className={styles.clearAll} onClick={() => setConfirmClear(true)}>
            {t.clearHistory}
          </button>
        ) : (
          <div className={styles.empty}>
            <img src="/brand/foodix-toque.png" width={240} height={132} alt="" className={styles.toque} />
            <strong className={styles.emptyTitle}>{t.noOrders}</strong>
            <span className={styles.emptyText}>{t.noOrdersText}</span>
            <BackLink className={styles.seeMenu}>{t.seeMenu}</BackLink>
          </div>
        )}
      </main>

      {confirmClear && (
        <ConfirmSheet
          title={t.clearHistoryQ}
          text={t.clearHistoryText}
          cancelLabel={t.cancel}
          confirmLabel={t.erase}
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            clearHistory();
            setConfirmClear(false);
          }}
        />
      )}
    </div>
  );
}
