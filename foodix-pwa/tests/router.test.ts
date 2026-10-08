import { describe, expect, it } from 'vitest';
import { analyticsPath, parseHash } from '../src/lib/router';

describe('scan du QR code', () => {
  it('transforme ?src=truck en chemin /truck, compté par Cloudflare Web Analytics', () => {
    expect(analyticsPath('/', '?src=truck')).toBe('/truck');
    expect(analyticsPath('/', '?src=truck&x=1')).toBe('/truck?x=1');
  });

  it('laisse les autres adresses telles quelles', () => {
    expect(analyticsPath('/', '')).toBe('/');
    expect(analyticsPath('/', '?src=insta')).toBe('/?src=insta');
    expect(analyticsPath('/truck', '')).toBe('/truck');
  });
});

describe('écrans', () => {
  it('reconnaît les écrans et renvoie au menu pour une adresse inconnue', () => {
    expect(parseHash('#/panier')).toBe('panier');
    expect(parseHash('#/commandes')).toBe('commandes');
    expect(parseHash('')).toBe('menu');
    expect(parseHash('#/nimporte-quoi')).toBe('menu');
  });
});
