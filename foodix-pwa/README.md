# Foodix · Menu digital

Application web installable (PWA) du food truck **Foodix**, à Cotonou. Le client scanne le QR code, consulte le menu, compose son panier et envoie sa commande sur WhatsApp, en livraison ou à emporter.

Pas de serveur, pas de base de données, pas de compte client :

- le menu vient du fichier `data/menu.json` ;
- le panier et l'historique des commandes restent sur le téléphone du client ;
- la commande part sous forme de message WhatsApp vers le 01 95 94 51 51.

Le site est hébergé sur Cloudflare Pages.

---

## 1. Lancer le projet en local

Prérequis : **Node.js 22** ou plus récent (`node -v` pour vérifier).

```bash
cd foodix-pwa
npm install        # une seule fois
npm run dev        # ouvre http://localhost:5173
```

Pour voir l'app comme sur un téléphone : outils de développement du navigateur (F12), puis mode appareil mobile.

Autres commandes :

| Commande | Rôle |
|---|---|
| `npm test` | Lance les tests (prix, message WhatsApp, panier, Recommander, horaires…) |
| `npm run build` | Construit le site dans `dist/` (vérifie aussi le TypeScript) |
| `npm run preview` | Sert la version construite sur http://localhost:4173, service worker compris |
| `npm run icons` | Régénère les icônes et les logos WebP (voir § 5) |
| `npm run qrcode` | Génère le QR code du food truck (voir § 6) |
| `npm run deploy` | Construit puis publie sur Cloudflare Pages (voir § 7) |

> L'écran de lancement ne s'affiche qu'une fois par visite. Pour le revoir, ouvrez un nouvel onglet ou une fenêtre privée.

---

## 2. Modifier le menu : `data/menu.json`

Tout le menu est dans ce fichier : catégories, articles, prix, variantes, ruptures. Après une modification :

1. vérifiez avec `npm test` (un fichier mal formé fait échouer les tests et le build, avec le nom de l'article fautif) ;
2. publiez (§ 7).

Les téléphones reçoivent le nouveau menu à leur prochaine ouverture avec du réseau.

### Changer un prix

Repérez l'article par son nom et changez `price`. Les prix sont des nombres entiers en francs CFA, **sans point ni espace** :

```json
{ "id": "tacos", "name": "Tacos", "price": 3500, "available": true }
```

Pour un article à variantes, changez aussi le `price` de l'option concernée, dans `variants.options` :

```json
{ "label": "Format à 1.500 F", "price": 1500, "cartName": "Shawarma viande de bœuf (1.500 F)" }
```

Pour les chichas, le `price` de l'article est le prix de la pose. Pensez à mettre à jour le `subtitle` (« Changement : 1.000 F ») et le libellé des options.

### Passer un article en épuisé

Mettez `available` à `false` :

```json
{ "id": "pastel", "name": "Pastel", "price": 500, "available": false }
```

L'article reste visible mais grisé, avec la mention « Épuisé » et sans bouton « + ».

Effets sur le reste de l'app :

- les paniers qui le contenaient le perdent à la prochaine ouverture ;
- « Recommander » le signale comme épuisé et ne l'ajoute pas.

Remettez `true` quand l'article revient.

### Ajouter un article

Copiez un article voisin dans la même catégorie et changez ses valeurs. L'`id` doit être **unique**, en minuscules, sans espace ni accent (ex. `"burger-double"`). Les noms des plats ne sont pas traduits : ils restent ceux du menu papier.

### Champs d'un article

| Champ | Obligatoire | Rôle |
|---|---|---|
| `id` | oui | Identifiant unique, ne jamais le changer pour un article existant (il relie les paniers et l'historique) |
| `name` | oui | Nom affiché dans le menu |
| `price` | oui | Prix en F CFA (nombre entier) |
| `available` | oui | `true` disponible, `false` épuisé |
| `subtitle` | non | Ligne sous le nom, en `fr` et `en` |
| `variants` | non | Choix proposés dans la fiche (`label` en `fr` / `en`, et `options`) |
| `defaultVariant` | non | Option présélectionnée (0 = la première) |
| `cartName` | non | Nom dans le panier et le message WhatsApp, s'il diffère de `name` |
| `sheetTitle` | non | Titre de la fiche, s'il diffère de `name` |
| `listPrice: "base"` | non | Affiche le seul prix de base dans la liste (chichas) au lieu de « 1.000 / 3.000 F » |

Un groupe d'articles marqué `"adultsOnly": true` (dans `groups`) affiche « 18+ · Réservé aux majeurs » (cocktails alcoolisés, chichas).

> Les champs `whatsapp`, `phones` et `social` en tête de `menu.json` ne sont pas utilisés par l'app : les coordonnées se règlent dans `src/config.ts`.

---

## 3. Réglages et informations à confirmer : `src/config.ts`

Tout ce qui reste **à confirmer avec Foodix** est regroupé dans ce fichier :

| Réglage | Valeur actuelle |
|---|---|
| `siteUrl` | `https://foodix.pages.dev` (provisoire, sert au QR code) |
| `openingHours` | `null` : horaires inconnus, l'app est toujours « Ouvert » |
| `openingHoursText` | `[HORAIRES À CONFIRMER]`, affiché dans le bandeau « Foodix est fermé » |
| `location` | `[EMPLACEMENT À CONFIRMER]` (pas encore affiché) |
| `social` | Pages Facebook / TikTok / Instagram supposées `/foodix` |
| `variantNames` | Noms provisoires « Format à 1.000 F »… pour shawarma bœuf, donuts et 3x |
| `analyticsToken` | Vide (voir § 8) |

Exemple d'horaires, calculés à l'heure du Bénin quel que soit le réglage du téléphone. Les jours vont de 0 (dimanche) à 6 (samedi). Une fermeture après minuit est acceptée :

```ts
openingHours: {
  1: [{ open: '11:00', close: '15:00' }, { open: '18:00', close: '23:00' }], // lundi
  5: [{ open: '18:00', close: '02:00' }],                                     // vendredi soir
},
```

Un jour absent = fermé. Hors horaires, le menu reste consultable mais l'ajout au panier et l'envoi sont bloqués.

Autres réglages : numéros de téléphone, numéro WhatsApp des commandes, nombre de commandes gardées dans « Mes commandes » (30), délai avant de reproposer l'installation (7 jours), durée minimale de l'écran de lancement.

---

## 4. Organisation du code

```
data/menu.json        Menu (source de vérité)
src/config.ts         Réglages et informations à confirmer
src/lib/              Logique sans affichage : prix, panier, message WhatsApp,
                      historique, horaires, navigation, stockage, installation
src/state/store.tsx   État partagé : panier, langue, commande en cours, historique
src/screens/          Écrans : menu, panier, validation, envoi, confirmation, mes commandes
src/components/       Éléments réutilisés : ligne du menu, fiche, panneau panier…
src/styles/           Couleurs (tokens.css, reprises de la maquette), polices
tests/                Tests Vitest
public/               Fichiers publiés tels quels : logos, icônes, _headers, _redirects
scripts/              Génération des icônes et du QR code
```

Points à connaître :

- **Navigation** : par l'adresse (`#/panier`, `#/commande`…). Le bouton retour Android ferme la fiche ou revient à l'écran précédent, sans jamais quitter l'app d'un coup.
- **Données sur le téléphone** : `localStorage`, versionné et lu avec précaution. Une donnée abîmée ou d'une ancienne version est effacée et l'app repart proprement.
- **Langues** : les textes de l'interface sont dans `src/lib/i18n.ts` (FR / EN). Le message WhatsApp reste toujours en français.
- **Hors connexion** : le service worker garde l'app et le dernier menu. Le menu est consultable, l'envoi attend le retour du réseau.

---

## 5. Icônes et logos

Les icônes de l'app (écran d'accueil, onglet du navigateur) sont générées depuis la toque `public/brand/foodix-toque.png` :

```bash
npm run icons
```

Le script produit `public/icons/*.png` et les logos `public/brand/*.webp`, plus légers en 3G. Les fichiers produits sont commités. Relancez le script si le logo change, avec une toque en plus haute définition si possible (l'actuelle fait 240 px de large).

---

## 6. QR code du food truck

```bash
npm run qrcode                         # adresse de config.ts (siteUrl)
npm run qrcode -- https://foodix.bj    # ou une autre adresse
```

Le script produit dans `qrcode/` (non commité) :

- `foodix-qr.svg` : vectoriel, à donner à l'imprimeur ;
- `foodix-qr.png` : 4096 × 4096 px.

Le code pointe vers l'adresse du site suivie de `?src=truck`. Il utilise la correction d'erreur maximale : il reste lisible s'il est un peu sali. Gardez la marge blanche autour du code, elle est nécessaire au scan.

> **À refaire une fois le nom de domaine définitif choisi**, puis tester le scan avec deux ou trois téléphones avant l'impression.

---

## 7. Déployer sur Cloudflare Pages

### Première mise en place (une fois)

Dans le tableau de bord Cloudflare : **Workers & Pages → Créer → Pages → Connecter à Git**. Choisissez le dépôt GitHub `Foodix_Dig`, puis réglez :

| Réglage | Valeur |
|---|---|
| Branche de production | `main` |
| Préréglage du framework | Aucun |
| Commande de build | `npm run build` |
| Répertoire de sortie | `dist` |
| Répertoire racine | `foodix-pwa` |
| Variable d'environnement | `NODE_VERSION` = `22` (le fichier `.node-version` le précise aussi) |

Ensuite, **chaque `git push` sur `main` publie le site automatiquement**. Les autres branches reçoivent une adresse de prévisualisation.

Pour relier le nom de domaine : **Domaines personnalisés** dans le projet Pages. Mettez ensuite à jour `siteUrl` dans `src/config.ts` et régénérez le QR code.

### Publier sans passer par Git

```bash
npm run deploy     # build + npx wrangler pages deploy dist --project-name foodix
```

La première fois, `wrangler` demande de se connecter au compte Cloudflare.

### Fichiers propres à Cloudflare (dans `public/`)

- **`_headers`** : règles de cache.
  - `sw.js`, `manifest.webmanifest`, la page et `menu.json` sont revérifiés à chaque visite. Sans cela, un ancien service worker ou un ancien menu pourrait rester bloqué sur les téléphones.
  - Les fichiers de `assets/` ont un nom versionné : ils sont gardés un an.
  - Le fichier contient aussi quelques en-têtes de sécurité.
- **`_redirects`** : sert l'app à l'adresse `/truck` (voir § 8).

### Mise à jour sur les téléphones

Le service worker se met à jour tout seul. Une nouvelle version s'installe en arrière-plan et s'affiche à l'ouverture suivante. Rien à faire côté client.

---

## 8. Statistiques : Cloudflare Web Analytics

1. Dans Cloudflare : **Analytics & Logs → Web Analytics → Ajouter un site**, puis copiez le **jeton** (token).
2. Dans le projet Pages : **Paramètres → Variables d'environnement**, ajoutez `VITE_CF_BEACON_TOKEN` = le jeton, puis redéployez.
   Autre possibilité : renseigner `analyticsToken` dans `src/config.ts`.

Sans jeton, aucun script de statistiques n'est ajouté.

**Scans du QR code** : Cloudflare Web Analytics n'enregistre pas les paramètres d'adresse comme `?src=truck`. L'app remplace donc `?src=truck` par le chemin `/truck` au chargement, avant le script de statistiques. Dans Web Analytics, filtrez sur le chemin **`/truck`** pour compter les scans du food truck.

---

## 9. Avant la mise en ligne

- [ ] Informations confirmées par Foodix et reportées dans `src/config.ts` : horaires, emplacement, noms des variantes, réseaux sociaux, domaine
- [ ] Prix et articles relus avec Foodix dans `data/menu.json`
- [ ] Test sur un vrai téléphone Android d'entrée de gamme en 3G : chargement, commande complète jusqu'à WhatsApp, position GPS, hors connexion, installation
- [ ] Test sur iPhone (Safari) : commande et guide d'installation
- [ ] QR code régénéré avec le domaine définitif et testé avant impression

## Hors périmètre

Pas de mode « sur place », de compte client, de fidélité, de paiement en ligne, d'espace d'administration, d'historique synchronisé ni de photos de plats. Les mises à jour du menu se font dans `data/menu.json`.
