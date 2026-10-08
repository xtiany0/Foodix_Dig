/**
 * QR code à coller sur le food truck, vers l'adresse du site avec ?src=truck.
 *
 *   npm run qrcode                       adresse de config.ts (siteUrl)
 *   npm run qrcode -- https://foodix.bj  autre adresse
 *
 * Produit qrcode/foodix-qr.svg (vectoriel, pour l'imprimeur) et qrcode/foodix-qr.png (4096 px).
 * Correction d'erreur maximale (H) : le code reste lisible s'il est un peu sali ou abîmé.
 * Bleu nuit sur blanc, marge de 4 modules : à ne pas réduire, elle est nécessaire au scan.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { config } from '../src/config.ts';

const site = (process.argv[2] || config.siteUrl).replace(/\/+$/, '');
let url;
try {
  url = new URL(site + '/');
} catch {
  console.error(`Adresse invalide : ${site}`);
  process.exit(1);
}
if (url.protocol !== 'https:') {
  console.error('L’adresse doit commencer par https:// (obligatoire pour la PWA et la géolocalisation).');
  process.exit(1);
}
url.searchParams.set('src', 'truck');
const target = url.toString();

const options = {
  errorCorrectionLevel: 'H',
  margin: 4,
  color: { dark: '#15132DFF', light: '#FFFFFFFF' },
};

const dir = fileURLToPath(new URL('../qrcode/', import.meta.url));
await mkdir(dir, { recursive: true });
await writeFile(dir + 'foodix-qr.svg', await QRCode.toString(target, { ...options, type: 'svg' }));
await QRCode.toFile(dir + 'foodix-qr.png', target, { ...options, type: 'png', width: 4096 });

console.log(`QR code vers ${target}`);
console.log('  qrcode/foodix-qr.svg');
console.log('  qrcode/foodix-qr.png (4096 × 4096 px)');
if (config.siteUrl.includes('pages.dev') && !process.argv[2]) {
  console.log('Attention : adresse provisoire. Régénérez le QR code une fois le nom de domaine confirmé.');
}
