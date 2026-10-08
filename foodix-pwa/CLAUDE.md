# Foodix · Menu digital PWA

Application de menu et de commande pour **Foodix**, food truck à Cotonou (Bénin). Slogan : « Manger bon, manger mobile ».
Le client scanne un QR code, consulte le menu, compose son panier et envoie sa commande **sur WhatsApp**. Pas de serveur, pas de compte, pas de paiement en ligne.

Maquette validée par le client. Le cahier des charges complet est dans `docs/cahier-des-charges-v2.pdf`, il fait foi en cas de doute.

## Contenu du dossier

| Chemin | Contenu |
|---|---|
| `data/menu.json` | **Source de vérité du menu** : 10 catégories, 66 articles, prix, variantes, mentions 18+, traductions FR/EN |
| `design/maquette/` | Les 28 écrans validés (voir `design/LIRE-LA-MAQUETTE.md`) |
| `design/tokens.css` | Couleurs, typo, rayons de l'identité |
| `public/brand/` | Logo Foodix (version fond nuit, sans slogan, toque seule, originaux) et icônes Facebook, TikTok, Instagram, WhatsApp |
| `docs/` | Cahier des charges, brief de maquette, photos du menu papier |

## Stack

- **Vite + React** (ou HTML/JS léger si plus simple), TypeScript conseillé.
- **PWA** : manifest + service worker (`vite-plugin-pwa`), menu et images en cache, ouverture en plein écran.
- **Hébergement** : Cloudflare Pages (HTTPS obligatoire pour la géolocalisation et la PWA).
- **Statistiques** : Cloudflare Web Analytics, paramètre `?src=truck` pour les scans du QR code.
- Aucune base de données : le menu vient de `menu.json`, le panier et l'historique sont dans le `localStorage` du téléphone.

## Contraintes d'usage (prioritaires)

- Téléphones Android d'entrée de gamme, réseau 3G, usage d'une main, souvent en plein soleil.
- Bundle léger, peu d'animations, polices limitées (Nunito + Squada One).
- **Zones cliquables de 44 px minimum** partout, contraste fort (texte secondaire `#BEBBDB` minimum sur le fond nuit).
- Tout le texte est réel, en français par défaut. Jamais de lorem ipsum.

## Écrans et parcours

Parcours principal : Lancement > Menu > fiche article > Ajouter > Panier > Validation (livraison ou à emporter) > Envoi > Confirmation. Puis Mes commandes > Recommander > Panier.

1. **Lancement** : logo fond nuit, barre de chargement fine.
2. **Accueil / Menu** : logo, slogan, statut Ouvert / Fermé, sélecteur FR / EN, Mes commandes, appel. Recherche. Onglets de catégories collants à défilement horizontal (trait orange sous l'onglet actif). Liste façon menu papier : bandeau orange avec le nom de la catégorie, puis lignes « nom ........ prix » en blanc.
3. **Sur chaque ligne du menu** :
   - pas dans le panier : un petit bouton rond « + » ;
   - dans le panier : une deuxième ligne apparaît avec un sélecteur « − n + » à droite (à 0, l'article sort du panier) et, à gauche, « + Ajouter une précision » (ou « Précision : … · Modifier ») qui ouvre un champ texte + OK sous l'article ;
   - articles à variantes : « + » ouvre la fiche pour choisir et reste visible pour ajouter un autre choix ; chaque ligne du panier (choix + précision) a sa propre sous-ligne « − n + » sous l'article (ex. 1 shawarma bœuf à 1.000 F et 2 à 1.500 F).
4. **Fiche article** (feuille qui monte du bas sur téléphone et tablette, fenêtre centrée sur ordinateur) : catégorie, nom, prix, mention 18+ si besoin, choix de variante, quantité, champ « Précision », bouton « Ajouter · prix ». **Pas de photo** (il n'y en a pas, comme sur le menu papier).
5. **Panier** : lignes avec + / −, Retirer, précision modifiable, « Ajouter d'autres articles », sous-total, livraison « À confirmer sur WhatsApp », bouton « Valider ma commande ». Bouton Vider avec confirmation. **Panier vide** : toque, texte, Voir le menu, lien Recommander une commande passée.
6. **Validation livraison** : sélecteur Livraison / À emporter, nom, téléphone, quartier, adresse ou repère, position GPS (facultative), note.
7. **Validation à emporter** : nom, téléphone, heure de retrait (Dès que possible / À une heure précise).
8. **Envoi** : paiement préféré (Espèces, MTN Mobile Money, Moov Money), aperçu exact du message WhatsApp, gros bouton orange « Commander sur WhatsApp » avec le logo WhatsApp.
9. **Confirmation** : Commande envoyée, numéro, 3 étapes suivantes, Rouvrir la discussion WhatsApp, Retour au menu, Mes commandes.
10. **Mes commandes** : historique local, Recommander, suppression d'une commande ou de tout l'historique.
11. **Installation** : bannière Android (`beforeinstallprompt`, boutons Plus tard / Installer), guide iPhone (Partager > Sur l'écran d'accueil > Ajouter). Après refus : pas de nouvelle proposition pendant 7 jours. Déjà installée : rien.
12. **États** : food truck fermé (menu consultable, commande bloquée, bandeau + barre « Commandes fermées »), pas de connexion (menu en cache, bandeau), localisation refusée (aide + champ pour coller un lien de position).

## Responsive

Mêmes textes, même identité et mêmes parcours partout. Seule la mise en page change.

| Format | Mise en page |
|---|---|
| Petit téléphone 360 px | Rien ne déborde, prix et bouton panier toujours visibles |
| Téléphone 390 px | Panier en bouton flottant orange en bas (compteur + total), fiche qui monte du bas |
| Tablette 768 px | Articles en 2 colonnes, panier en panneau fixe à droite (290 px) |
| Ordinateur 1280 px | Barre du haut (logo, statut, recherche, Mes commandes, téléphone), catégories en colonne à gauche, articles en 2 colonnes au centre, panier fixe à droite (340 px), fiche en fenêtre centrée de 480 px, formulaires limités à 560 px et centrés |

## Règles métier

### Panier
- Une ligne = article + variante + précision. Deux shawarmas, l'un avec piment, l'autre sans = deux lignes.
- Chaque ligne garde l'`id` de l'article d'origine (pour bubble tea, l'`itemId` de l'option choisie) afin d'afficher le bon compteur sur la ligne du menu.
- Sauvegarde dans `localStorage` : le panier survit à la fermeture de l'app.
- Total en temps réel. Frais de livraison toujours « à confirmer sur WhatsApp ».

### Prix
- Format `2.000 F` (point comme séparateur des milliers), devise FCFA.
- Article à plusieurs prix : afficher `1.000 / 1.500 F` dans la liste.
- Chichas : la liste affiche le prix de la pose, la ligne « Changement : 1.000 F » en dessous ; la fiche propose Pose ou Changement (`listPrice: "base"` dans le JSON).

### Message WhatsApp (format exact)
Lien : `https://wa.me/2290195945151?text=` + message encodé (`encodeURIComponent`). Numéro de commande court aléatoire (ex. `#A7K2`). Le panier est vidé après l'envoi et la commande enregistrée dans l'historique.

```
Commande FOODIX #A7K2
Mode : Livraison

2x Shawarma poulet ........... 4.000 F
1x Tacos ..................... 3.500 F
   > sans piment
1x Bubble tea Mangue ......... 1.500 F

Total : 9.000 F (hors livraison)
Paiement : MTN Mobile Money

Nom : Koffi
Tél : 01 97 00 00 00
Adresse : Fidjrossè, près de la pharmacie
Position : https://maps.google.com/?q=6.3541,2.3725
Note : appeler en arrivant
```
- Points de conduite pour aligner les prix sur 30 caractères avant le prix.
- Précision sur une ligne à part : `   > précision`.
- À emporter : `Mode : À emporter`, ligne `Retrait : 13:30` (ou `Dès que possible`) à la place d'Adresse / Position, pas de « (hors livraison) ».
- Lignes vides ou facultatives (position, note) omises si non remplies.
- **Le message reste toujours en français**, même si l'interface est en anglais.

### Géolocalisation (livraison uniquement)
- `navigator.geolocation.getCurrentPosition`, haute précision. Afficher « Position enregistrée · Précision : à X m près » avec Recommencer et Supprimer.
- Lien : `https://maps.google.com/?q=lat,lng`. Facultatif : l'adresse écrite suffit.
- Refus ou GPS coupé : message d'aide + champ pour coller un lien Google Maps ou WhatsApp.

### Historique et Recommander
- Stocké sur le téléphone (date, numéro, articles, total, mode). Limite affichée à l'utilisateur.
- Recommander remet les articles, variantes et précisions dans le panier **aux prix actuels**.
- Article retiré ou épuisé : signalé (« Épuisé ») et non ajouté. Prix changé : signalé (« Prix modifié : 3.500 F au lieu de 3.000 F »).
- Nom, téléphone et dernière adresse pré-remplis.

### Horaires et disponibilité
- Hors horaires : menu consultable, ajout au panier et envoi bloqués, message explicatif.
- Article `available: false` : grisé, mention « Épuisé », pas de bouton +.
- Cocktails alcoolisés et chichas : mention « 18+ · Réservé aux majeurs ».

### Langues
- Français par défaut, anglais via le sélecteur FR / EN de l'accueil (choix mémorisé).
- Traduits : textes d'interface, catégories, sous-groupes, sous-titres, libellés de variantes (`menu.json` contient `fr` et `en`). Les noms des plats restent ceux du menu papier.
- La maquette traduit l'accueil et la fiche ; reprendre les mêmes clés pour Panier, Validation, Envoi, Confirmation et Mes commandes.

### Pied de page de l'accueil
- « Merci de faire route avec nous ! », icônes rondes Facebook, TikTok, Instagram (fichiers dans `public/brand/icons/`, en blanc), `@foodix`, numéros 01 95 94 51 51 et 01 90 56 89 89 en liens `tel:`.
- Tout en bas, séparé par un trait fin, en petit gris : « Conception de l'application : +229 01 41 90 08 35 » (en anglais « App design: »), lien `https://wa.me/2290141900835`. **Ne jamais afficher de nom à cet endroit.**

## Hors périmètre (ne pas construire)

Pas de mode « sur place », pas de compte client, pas de fidélité, pas de paiement en ligne, pas d'espace d'administration, pas d'historique synchronisé, pas de photos de plats. Les mises à jour du menu se font en modifiant `menu.json`.

## Points encore à confirmer avec Foodix

- Horaires d'ouverture (la maquette affiche `[HORAIRES À CONFIRMER]`) et emplacement du food truck.
- Noms des variantes à double prix : shawarma viande de bœuf (1.000 / 1.500 F), donuts (1.500 / 3.500 F), 3x (1.000 / 2.000 F). Provisoirement « Format à 1.000 F », etc.
- Zones et frais de livraison, nom de domaine, adresses exactes des pages Facebook / TikTok / Instagram (supposées `/foodix`).
- Dans la maquette, « Pastel » est marqué épuisé et l'historique contient des commandes d'exemple : ce sont des **données de démonstration**, pas des données réelles.

## Ordre de travail conseillé

1. Projet Vite + React, tokens, polices, chargement de `menu.json`.
2. Accueil / menu (téléphone d'abord), fiche article, + / − et précision en ligne, panier persistant.
3. Validation, géolocalisation, envoi WhatsApp, confirmation, historique et Recommander.
4. FR / EN, états (fermé, hors ligne), responsive tablette et ordinateur.
5. PWA (manifest, icônes à partir de `foodix-toque.png`, cache), installation Android et guide iPhone.
6. Tests sur vrai téléphone Android en 3G, Lighthouse, déploiement Cloudflare Pages.
