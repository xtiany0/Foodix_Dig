import { describe, expect, it } from 'vitest';
import { config, type WeeklyHours } from '../src/config';
import { isOpenAt, localTime, pickupSlots } from '../src/lib/hours';

const TZ = 'Africa/Porto-Novo'; // UTC+1, sans heure d'été

// Lundi 5 octobre 2026
const at = (isoUtc: string) => new Date(isoUtc);

describe('heure du Bénin', () => {
  it('convertit l’heure UTC en heure locale, quel que soit le fuseau du téléphone', () => {
    expect(localTime(at('2026-10-05T10:30:00Z'), TZ)).toEqual({ day: 1, minutes: 11 * 60 + 30 });
    // 23:30 UTC le dimanche = 00:30 le lundi au Bénin
    expect(localTime(at('2026-10-04T23:30:00Z'), TZ)).toEqual({ day: 1, minutes: 30 });
  });
});

describe('Ouvert / Fermé', () => {
  const hours: WeeklyHours = {
    1: [{ open: '11:00', close: '15:00' }, { open: '18:00', close: '23:00' }],
    5: [{ open: '18:00', close: '02:00' }],
  };

  it('horaires inconnus : toujours ouvert', () => {
    expect(isOpenAt(at('2026-10-05T03:00:00Z'), null, TZ)).toBe(true);
  });

  it('suit les plages du jour', () => {
    expect(isOpenAt(at('2026-10-05T09:59:00Z'), hours, TZ)).toBe(false); // 10:59
    expect(isOpenAt(at('2026-10-05T10:00:00Z'), hours, TZ)).toBe(true); // 11:00
    expect(isOpenAt(at('2026-10-05T14:00:00Z'), hours, TZ)).toBe(false); // 15:00, fermé
    expect(isOpenAt(at('2026-10-05T20:00:00Z'), hours, TZ)).toBe(true); // 21:00
  });

  it('jour sans plage : fermé', () => {
    expect(isOpenAt(at('2026-10-06T12:00:00Z'), hours, TZ)).toBe(false); // mardi
  });

  it('gère une plage qui passe minuit', () => {
    expect(isOpenAt(at('2026-10-09T22:00:00Z'), hours, TZ)).toBe(true); // vendredi 23:00
    expect(isOpenAt(at('2026-10-10T00:30:00Z'), hours, TZ)).toBe(true); // samedi 01:30
    expect(isOpenAt(at('2026-10-10T01:00:00Z'), hours, TZ)).toBe(false); // samedi 02:00
  });

  it('fermeture à minuit (« 00:00 ») : ouvert jusqu’à 23:59, fermé à 00:00', () => {
    const late: WeeklyHours = { 5: [{ open: '10:00', close: '00:00' }] };
    expect(isOpenAt(at('2026-10-09T08:59:00Z'), late, TZ)).toBe(false); // vendredi 09:59
    expect(isOpenAt(at('2026-10-09T09:00:00Z'), late, TZ)).toBe(true); // vendredi 10:00
    expect(isOpenAt(at('2026-10-09T22:59:00Z'), late, TZ)).toBe(true); // vendredi 23:59
    expect(isOpenAt(at('2026-10-09T23:00:00Z'), late, TZ)).toBe(false); // samedi 00:00
  });

  it('horaires de Foodix : 23h en semaine, minuit le week-end', () => {
    const h = config.openingHours;
    expect(isOpenAt(at('2026-10-08T21:59:00Z'), h, TZ)).toBe(true); // jeudi 22:59
    expect(isOpenAt(at('2026-10-08T22:00:00Z'), h, TZ)).toBe(false); // jeudi 23:00
    expect(isOpenAt(at('2026-10-11T22:30:00Z'), h, TZ)).toBe(true); // dimanche 23:30
    expect(isOpenAt(at('2026-10-11T23:00:00Z'), h, TZ)).toBe(false); // lundi 00:00
    expect(isOpenAt(at('2026-10-12T08:30:00Z'), h, TZ)).toBe(false); // lundi 09:30
  });
});

describe('créneaux de retrait', () => {
  const h = config.openingHours;

  it('toutes les 15 min, au plus tôt dans 15 min, arrondi au quart d’heure', () => {
    // Lundi 12 octobre 2026, 13:07 au Bénin
    const slots = pickupSlots(at('2026-10-12T12:07:30Z'), h, TZ, { count: 3 });
    expect(slots).toEqual([
      { time: '13:30', nextDay: false },
      { time: '13:45', nextDay: false },
      { time: '14:00', nextDay: false },
    ]);
  });

  it('s’arrête à la fermeture et reprend le lendemain à l’ouverture', () => {
    // Lundi 22:20 : fermeture à 23:00
    const slots = pickupSlots(at('2026-10-12T21:20:00Z'), h, TZ, { count: 4 });
    expect(slots).toEqual([
      { time: '22:45', nextDay: false },
      { time: '10:00', nextDay: true },
      { time: '10:15', nextDay: true },
      { time: '10:30', nextDay: true },
    ]);
  });

  it('vendredi : jusqu’à 23:45 (fermeture à minuit)', () => {
    const slots = pickupSlots(at('2026-10-16T22:00:00Z'), h, TZ, { count: 3 });
    expect(slots.map((s) => s.time)).toEqual(['23:15', '23:30', '23:45']);
  });

  it('en pleine nuit : créneaux du matin, aujourd’hui', () => {
    // Mardi 02:30 : ouverture à 10:00 le jour même
    const slots = pickupSlots(at('2026-10-13T01:30:00Z'), h, TZ, { count: 2 });
    expect(slots).toEqual([
      { time: '10:00', nextDay: false },
      { time: '10:15', nextDay: false },
    ]);
  });
});
