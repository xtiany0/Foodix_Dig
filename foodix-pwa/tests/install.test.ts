import { describe, expect, it } from 'vitest';
import { canOffer, iosGuideKind, isIosSafari, safariVersion } from '../src/lib/install';

const DAY = 86_400_000;

describe('proposition d’installation', () => {
  const now = Date.UTC(2026, 9, 8);

  it('est proposée si l’utilisateur n’a jamais refusé', () => {
    expect(canOffer(null, now, 3)).toBe(true);
  });

  it('n’est pas reproposée pendant 3 jours après un refus', () => {
    expect(canOffer(now - 1 * DAY, now, 3)).toBe(false);
    expect(canOffer(now - 2.9 * DAY, now, 3)).toBe(false);
    expect(canOffer(now - 3 * DAY, now, 3)).toBe(true);
  });

  it('ignore une date de refus dans le futur (horloge du téléphone changée)', () => {
    expect(canOffer(now + 3 * DAY, now, 3)).toBe(true);
  });
});

describe('détection iPhone Safari', () => {
  const safari =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

  it('reconnaît Safari sur iPhone', () => {
    expect(isIosSafari(safari, 5)).toBe(true);
  });

  it('écarte Chrome iOS, les navigateurs intégrés et Android', () => {
    expect(isIosSafari(safari.replace('Version/18.0', 'CriOS/129.0'), 5)).toBe(false);
    expect(isIosSafari(safari + ' Instagram 300.0', 5)).toBe(false);
    expect(
      isIosSafari('Mozilla/5.0 (Linux; Android 13; TECNO) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36', 5),
    ).toBe(false);
  });

  it('reconnaît un iPad qui se présente comme un Mac', () => {
    const ipad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
    expect(isIosSafari(ipad, 5)).toBe(true);
    expect(isIosSafari(ipad, 0)).toBe(false);
  });
});

describe('guide iPhone selon la version de Safari', () => {
  const ios18 =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
  // iOS 26 garde « OS 18_6 » dans l'identifiant : seule la version de Safari change.
  const ios26 =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';

  it('lit la version de Safari', () => {
    expect(safariVersion(ios18)).toBe(18);
    expect(safariVersion(ios26)).toBe(26);
    expect(safariVersion('Mozilla/5.0 (iPhone) Safari/604.1')).toBeNull();
  });

  it('iOS 18 : Partager directement ; iOS 26 ou inconnu : par « ••• »', () => {
    expect(iosGuideKind(ios18)).toBe('share');
    expect(iosGuideKind(ios26)).toBe('menu');
    expect(iosGuideKind('Mozilla/5.0 (iPhone) Safari/604.1')).toBe('menu');
  });
});
