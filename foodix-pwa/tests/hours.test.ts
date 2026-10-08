import { describe, expect, it } from 'vitest';
import type { WeeklyHours } from '../src/config';
import { isOpenAt, localTime } from '../src/lib/hours';

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
});
