import { describe, expect, it } from 'vitest';
import { shouldRefresh } from '../src/lib/refresh';

describe('actualisation au retour dans l’app', () => {
  const now = Date.UTC(2026, 9, 14, 12);
  const MIN = 60_000;

  it('ne fait rien sans passage en arrière-plan', () => {
    expect(shouldRefresh(null, now, 10)).toBe(false);
  });

  it('attend 10 minutes d’absence', () => {
    expect(shouldRefresh(now - 9 * MIN, now, 10)).toBe(false);
    expect(shouldRefresh(now - 10 * MIN, now, 10)).toBe(true);
    expect(shouldRefresh(now - 8 * 60 * MIN, now, 10)).toBe(true);
  });
});
