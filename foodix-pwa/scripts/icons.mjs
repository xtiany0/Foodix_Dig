/**
 * Génère les icônes de la PWA et les versions WebP des logos.
 *
 *   npm run icons
 *
 * Source des icônes : public/brand/foodix-toque.png (toque seule), posée sur le bleu nuit.
 * Les fichiers produits sont commités : le build n'a pas besoin de ce script.
 */

import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const NIGHT = '#15132D';
const TOQUE = root('public/brand/foodix-toque.png');

/**
 * Toque centrée sur un carré bleu nuit.
 * @param size  côté de l'icône en pixels
 * @param ratio largeur de la toque par rapport au côté (zone sûre « maskable » : 80 % du côté)
 * @param radius arrondi des coins (0 = carré, pour les icônes que le système découpe lui-même)
 */
async function icon(out, size, ratio, radius = 0) {
  const width = Math.round(size * ratio);
  const toque = await sharp(TOQUE).resize({ width, kernel: 'lanczos3' }).png().toBuffer();
  const { height } = await sharp(toque).metadata();
  // La toque est un peu plus haute visuellement en bas (fourchette) : léger décalage vers le haut.
  const top = Math.round((size - height) / 2 - size * 0.02);
  let img = sharp({ create: { width: size, height: size, channels: 4, background: NIGHT } }).composite([
    { input: toque, left: Math.round((size - width) / 2), top },
  ]);
  if (radius) {
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></svg>`);
    img = sharp(await img.png().toBuffer()).composite([{ input: mask, blend: 'dest-in' }]);
  }
  await img.png({ compressionLevel: 9 }).toFile(root(`public/icons/${out}`));
  console.log('icons/' + out);
}

async function webp(name, width) {
  await sharp(root(`public/brand/${name}.png`))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(root(`public/brand/${name}.webp`));
  console.log(`brand/${name}.webp`);
}

await mkdir(root('public/icons'), { recursive: true });

// Android et manifest : « any » avec coins arrondis, « maskable » plein cadre (le système découpe).
await icon('pwa-192.png', 192, 0.72, 40);
await icon('pwa-512.png', 512, 0.72, 108);
await icon('maskable-512.png', 512, 0.6);
// iPhone : carré plein, iOS arrondit lui-même.
await icon('apple-touch-icon.png', 180, 0.66);
// Onglet du navigateur.
await icon('favicon-32.png', 32, 0.86, 7);

// Logos : WebP, deux fois la plus grande taille affichée (écrans haute densité).
await webp('foodix-logo-nuit', 540); // lancement : 270 px
await webp('foodix-logo-nuit-sans-slogan', 240); // en-tête : 120 px
await webp('foodix-toque', 240); // panier vide : 104 px

// Logo « jour » pour les en-têtes crème (style Plein jour) : lettres blanches du logo nuit passées en bleu nuit.
{
  const { data, info } = await sharp(root('public/brand/foodix-logo-nuit-sans-slogan.png'))
    .resize({ width: 240 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const [r0, g0, b0] = [0x15, 0x13, 0x2d];
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    // Blanc ou gris très clair (lettres « FOOD ») : on garde l'opacité, on change la couleur.
    if (Math.min(r, g, b) > 150 && Math.max(r, g, b) - Math.min(r, g, b) < 40) {
      data[i] = r0;
      data[i + 1] = g0;
      data[i + 2] = b0;
    }
  }
  await sharp(data, { raw: info }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(root('public/brand/foodix-logo-jour-sans-slogan.webp'));
  console.log('brand/foodix-logo-jour-sans-slogan.webp');
}
