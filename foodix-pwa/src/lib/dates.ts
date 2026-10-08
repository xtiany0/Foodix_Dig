import { config } from '../config';
import type { Lang } from '../types/menu';

/** Jour civil (AAAA-MM-JJ) à l'heure du Bénin. */
function dayKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: config.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Date d'une commande dans « Mes commandes », à l'heure du Bénin :
 * « Aujourd’hui, 13:05 », « Hier, 20:10 », sinon « Dim. 27 sept. ».
 */
export function formatOrderDate(iso: string, lang: Lang, words: { today: string; yesterday: string }, now = new Date()): string {
  const d = new Date(iso);
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const time = new Intl.DateTimeFormat(locale, { timeZone: config.timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (dayKey(d) === dayKey(now)) return `${words.today}, ${time}`;
  if (dayKey(d) === dayKey(yesterday)) return `${words.yesterday}, ${time}`;
  const sameYear = dayKey(d).slice(0, 4) === dayKey(now).slice(0, 4);
  return capitalize(
    new Intl.DateTimeFormat(locale, {
      timeZone: config.timeZone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      ...(sameYear ? {} : { year: 'numeric' }),
    })
      .format(d)
      .replace(',', ''),
  );
}
