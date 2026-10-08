/**
 * Ouvert / Fermé, calculé à l'heure du Bénin (config.timeZone),
 * quel que soit le fuseau réglé sur le téléphone.
 */

import type { WeeklyHours } from '../config';

type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAYS: Record<string, Day> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Jour de la semaine et minute de la journée dans le fuseau donné. */
export function localTime(date: Date, timeZone: string): { day: Day; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { day: DAYS[get('weekday')], minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

/**
 * Foodix est-il ouvert à cette date ?
 * hours null (horaires pas encore confirmés) : toujours ouvert.
 * Une plage dont la fermeture est avant l'ouverture passe minuit (ex. 18:00 → 02:00).
 */
export function isOpenAt(date: Date, hours: WeeklyHours | null, timeZone: string): boolean {
  if (!hours) return true;
  const { day, minutes } = localTime(date, timeZone);
  const previous = ((day + 6) % 7) as Day;

  for (const r of hours[day] ?? []) {
    const open = toMinutes(r.open);
    const close = toMinutes(r.close);
    if (close > open ? minutes >= open && minutes < close : minutes >= open) return true;
  }
  // Plage de la veille qui déborde après minuit.
  for (const r of hours[previous] ?? []) {
    const open = toMinutes(r.open);
    const close = toMinutes(r.close);
    if (close <= open && minutes < close) return true;
  }
  return false;
}
