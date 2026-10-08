import { beforeEach, describe, expect, it } from 'vitest';
import { readStored, removeStored, writeStored } from '../src/lib/storage';

class MemoryStorage {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

let mem: MemoryStorage;
const parseNumbers = (d: unknown) => (Array.isArray(d) && d.every((x) => typeof x === 'number') ? (d as number[]) : null);

beforeEach(() => {
  mem = new MemoryStorage();
  (globalThis as any).localStorage = mem;
});

describe('storage', () => {
  it('relit une valeur écrite avec la même version', () => {
    writeStored('cart', 1, [1, 2, 3]);
    expect(readStored('cart', 1, parseNumbers, [])).toEqual([1, 2, 3]);
    expect(mem.getItem('foodix.cart')).toBe('{"v":1,"data":[1,2,3]}');
  });

  it('renvoie la valeur par défaut si rien n’est enregistré', () => {
    expect(readStored('cart', 1, parseNumbers, [])).toEqual([]);
  });

  it('repart proprement si le JSON est corrompu, et efface la clé', () => {
    mem.setItem('foodix.cart', '{pas du json');
    expect(readStored('cart', 1, parseNumbers, [])).toEqual([]);
    expect(mem.getItem('foodix.cart')).toBeNull();
  });

  it('repart proprement si la version est ancienne', () => {
    mem.setItem('foodix.cart', '{"v":0,"data":[1]}');
    expect(readStored('cart', 1, parseNumbers, [])).toEqual([]);
    expect(mem.getItem('foodix.cart')).toBeNull();
  });

  it('repart proprement si la forme des données est invalide', () => {
    mem.setItem('foodix.cart', '{"v":1,"data":["a"]}');
    expect(readStored('cart', 1, parseNumbers, [])).toEqual([]);
    mem.setItem('foodix.cart', 'null');
    expect(readStored('cart', 1, parseNumbers, [])).toEqual([]);
  });

  it('ne plante pas si le stockage est inaccessible ou plein', () => {
    (globalThis as any).localStorage = {
      getItem() {
        throw new Error('SecurityError');
      },
      setItem() {
        throw new Error('QuotaExceededError');
      },
      removeItem() {
        throw new Error('SecurityError');
      },
    };
    expect(() => writeStored('cart', 1, [1])).not.toThrow();
    expect(readStored('cart', 1, parseNumbers, [9])).toEqual([9]);
    expect(() => removeStored('cart')).not.toThrow();
  });
});
