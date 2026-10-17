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

/** Créneau de retrait proposé : « HH:MM » à l'heure du Bénin, aujourd'hui ou demain. */
export interface Slot {
  time: string;
  nextDay: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Heures de retrait proposées : toutes les `step` minutes, au plus tôt dans `lead` minutes,
 * jusqu'à la fermeture (ou, hors horaires, sur toute la prochaine plage d'ouverture). Moins
 * de `minToday` créneaux avant la fermeture : la plage d'ouverture suivante (demain) est ajoutée.
 * Remplace le sélecteur d'heure du téléphone, coupé ou peu lisible sur certains Android.
 */
export function pickupSlots(
  now: Date,
  hours: WeeklyHours | null,
  timeZone: string,
  { step = 15, lead = 15, minToday = 4 } = {},
): Slot[] {
  const { minutes } = localTime(now, timeZone);
  const first = Math.ceil((minutes + lead) / step) * step;
  // Instant du premier créneau : début de la minute locale en cours, plus l'écart.
  const base = now.getTime() - now.getUTCSeconds() * 1000 - now.getUTCMilliseconds() + (first - minutes) * 60_000;
  const slots: Slot[] = [];
  let periods = 0; // plages d'ouverture parcourues
  let inPeriod = false;
  for (let m = first; m < 3 * 1440; m += step) {
    const open = isOpenAt(new Date(base + (m - first) * 60_000), hours, timeZone);
    if (!open) {
      if (inPeriod) {
        inPeriod = false;
        periods++;
        if (periods === 2 || slots.length >= minToday) break;
      }
      continue;
    }
    inPeriod = true;
    const day = m % 1440;
    slots.push({ time: `${pad(Math.floor(day / 60))}:${pad(day % 60)}`, nextDay: m >= 1440 });
  }
  return slots;
}
