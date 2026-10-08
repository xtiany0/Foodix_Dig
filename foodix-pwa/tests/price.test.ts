import { describe, expect, it } from 'vitest';
import { formatAmount, formatPrice, listPriceLabel } from '../src/lib/price';
import { indexMenu } from '../src/lib/menu';
import { realMenu } from './fixtures';

describe('formatPrice', () => {
  it('sépare les milliers par un point', () => {
    expect(formatPrice(2000)).toBe('2.000 F');
    expect(formatPrice(500)).toBe('500 F');
    expect(formatPrice(0)).toBe('0 F');
    expect(formatPrice(12500)).toBe('12.500 F');
    expect(formatPrice(1250000)).toBe('1.250.000 F');
  });

  it('arrondit et résiste aux valeurs invalides', () => {
    expect(formatAmount(1499.6)).toBe('1.500');
    expect(formatAmount(Number.NaN)).toBe('0');
  });
});

describe('listPriceLabel', () => {
  const index = indexMenu(realMenu());
  const label = (id: string) => listPriceLabel(index.get(id)!.item);

  it('affiche un prix simple', () => {
    expect(label('shawarma-poulet')).toBe('2.000 F');
  });

  it('affiche « min / max » pour un article à deux prix', () => {
    expect(label('shawarma-boeuf')).toBe('1.000 / 1.500 F');
    expect(label('donuts')).toBe('1.500 / 3.500 F');
    expect(label('trois-x')).toBe('1.000 / 2.000 F');
  });

  it('affiche un seul prix quand toutes les variantes coûtent pareil', () => {
    expect(label('spaghetti')).toBe('1.500 F');
  });

  it('affiche le prix de la pose pour les chichas', () => {
    expect(label('chicha-love')).toBe('3.000 F');
    expect(label('chicha-ananas')).toBe('6.000 F');
  });
});
