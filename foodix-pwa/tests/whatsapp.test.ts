import { describe, expect, it } from 'vitest';
import { addLine, resolveCart, cartTotals, type CartLine } from '../src/lib/cart';
import { draftMessage, emptyDraft, type Draft } from '../src/lib/checkout';
import { dictionaries } from '../src/lib/i18n';
import { indexMenu } from '../src/lib/menu';
import { buildMessage, itemLine, LINE_WIDTH, orderNumber, whatsappLink } from '../src/lib/whatsapp';
import { realMenu } from './fixtures';

const index = indexMenu(realMenu());

/** Panier de l'exemple du cahier des charges. */
function exampleCart(): CartLine[] {
  let c: CartLine[] = [];
  c = addLine(c, { itemId: 'shawarma-poulet', variant: null, note: '', qty: 2 });
  c = addLine(c, { itemId: 'tacos', variant: null, note: 'sans piment', qty: 1 });
  c = addLine(c, { itemId: 'bt-mangue', variant: 'Bubble tea Mangue', note: '', qty: 1 });
  return c;
}

function message(d: Partial<Draft>, cart = exampleCart()) {
  const lines = resolveCart(index, cart);
  return draftMessage('#A7K2', { ...emptyDraft, ...d }, lines, cartTotals(lines).total);
}

const koffi: Partial<Draft> = {
  name: 'Koffi',
  phone: '01 97 00 00 00',
  quartier: 'Fidjrossè',
  adresse: 'près de la pharmacie',
  note: 'appeler en arrivant',
  payment: 'mtn',
};

describe('message WhatsApp', () => {
  it('livraison : reproduit exactement l’exemple du cahier des charges', () => {
    const msg = message({ ...koffi, mode: 'livraison', geo: { lat: 6.3541, lng: 2.3725, accuracy: 15 } });
    expect(msg).toBe(
      [
        'Commande FOODIX #A7K2',
        'Mode : Livraison',
        '',
        '2x Shawarma poulet ........... 4.000 F',
        '1x Tacos ..................... 3.500 F',
        '   > sans piment',
        '1x Bubble tea Mangue ......... 1.500 F',
        '',
        'Total : 9.000 F (hors livraison)',
        'Paiement : MTN Mobile Money',
        '',
        'Nom : Koffi',
        'Tél : 01 97 00 00 00',
        'Adresse : Fidjrossè, près de la pharmacie',
        'Position : https://maps.google.com/?q=6.354100,2.372500',
        'Note : appeler en arrivant',
      ].join('\n'),
    );
  });

  it('à emporter : mode, heure de retrait à la place de l’adresse, sans « hors livraison »', () => {
    const msg = message({ ...koffi, mode: 'emporter', pickup: 'time', time: '13:30', geo: { lat: 1, lng: 2, accuracy: 5 } });
    expect(msg).toContain('Mode : À emporter');
    expect(msg).toContain('Total : 9.000 F\n');
    expect(msg).not.toContain('hors livraison');
    expect(msg.endsWith('Tél : 01 97 00 00 00\nRetrait : 13:30')).toBe(true);
    expect(msg).not.toContain('Note');
    expect(msg).not.toContain('Adresse');
    expect(msg).not.toContain('Position');
  });

  it('à emporter dès que possible', () => {
    expect(message({ ...koffi, mode: 'emporter', pickup: 'asap' })).toContain('Retrait : Dès que possible');
  });

  it('aligne les prix : 30 caractères avant le prix', () => {
    for (const line of message(koffi).split('\n').filter((l) => /^\d+x /.test(l))) {
      expect(line.lastIndexOf(' ', line.length - 3)).toBeGreaterThanOrEqual(LINE_WIDTH);
      expect([...line.split(/ \d[\d.]* F$/)[0]].length).toBe(LINE_WIDTH);
    }
    // accents et œ comptent pour un caractère
    expect(itemLine(1, 'Kebab viande de bœuf', 2500)).toBe('1x Kebab viande de bœuf ...... 2.500 F');
  });

  it('garde au moins trois points pour un nom très long, sans le couper', () => {
    const line = itemLine(12, 'Shawarma viande de bœuf (1.500 F)', 18000);
    expect(line).toBe('12x Shawarma viande de bœuf (1.500 F) ... 18.000 F');
  });

  it('met chaque précision sur sa propre ligne, sous l’article', () => {
    const lines = message(koffi).split('\n');
    expect(lines[lines.indexOf('1x Tacos ..................... 3.500 F') + 1]).toBe('   > sans piment');
  });

  it('omet les champs vides ou facultatifs', () => {
    const msg = message({ mode: 'livraison', name: 'Koffi', phone: '0197000000', quartier: 'Akpakpa', payment: 'cash' });
    expect(msg).not.toContain('Position');
    expect(msg).not.toContain('Note');
    expect(msg.endsWith('Adresse : Akpakpa')).toBe(true);
    expect(msg).not.toMatch(/\n\n\n/);
    expect(buildMessage({ number: '#AAAA', mode: 'emporter', lines: [], total: 0, payment: 'Espèces' })).toBe(
      'Commande FOODIX #AAAA\nMode : À emporter\n\nTotal : 0 F\nPaiement : Espèces',
    );
  });

  it('utilise un lien de position collé quand le GPS est refusé', () => {
    expect(message({ ...koffi, geoLink: ' https://maps.app.goo.gl/abc ' })).toContain('Position : https://maps.app.goo.gl/abc');
  });

  it('reste en français même si l’interface est en anglais', () => {
    // Les choix de l'interface anglaise (« Cash », « As soon as possible »…) ne passent jamais dans le message.
    const msg = message({ ...koffi, mode: 'emporter', pickup: 'asap', payment: 'cash' });
    expect(msg).toContain('Paiement : Espèces');
    expect(msg).toContain('Retrait : Dès que possible');
    expect(msg).toContain('Commande FOODIX');
    for (const word of ['Cash', 'Delivery', 'Takeaway', 'Pickup', 'Payment', 'Name', 'Phone', dictionaries.en.exDelivery]) {
      expect(msg).not.toContain(word);
    }
  });

  it('encode le message dans le lien wa.me', () => {
    expect(whatsappLink('2290195945151', 'Tél : 1 & 2\n> ok')).toBe(
      'https://wa.me/2290195945151?text=T%C3%A9l%20%3A%201%20%26%202%0A%3E%20ok',
    );
  });
});

describe('numéro de commande', () => {
  it('a la forme #XXXX sans caractères ambigus', () => {
    for (let i = 0; i < 200; i++) expect(orderNumber()).toMatch(/^#[A-HJ-NP-Z2-9]{4}$/);
  });

  it('évite les numéros déjà utilisés', () => {
    const seq = [0, 0, 0, 0, 0.99, 0, 0, 0];
    let i = 0;
    expect(orderNumber(['#AAAA'], () => seq[i++])).toBe('#9AAA');
  });
});
