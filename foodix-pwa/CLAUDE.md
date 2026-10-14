# Foodix · Menu digital PWA

Application de menu et de commande pour **Foodix**, food truck à Parakou (Bénin). Slogan : « Manger bon, manger mobile ».
Le client scanne un QR code, consulte le menu, compose son panier et envoie sa commande **sur WhatsApp**. Pas de serveur, pas de compte, pas de paiement en ligne.

Maquette validée par le client. Le cahier des charges complet est dans `docs/cahier-des-charges-v2.pdf` (version précédente : `cahier-des-charges.pdf`), il fait foi en cas de doute. Les décisions prises depuis avec le client, notées ici, priment sur le PDF et sur la maquette.

## Contenu du dossier

| Chemin | Contenu |
|---|---|
| `data/menu.json` | **Source de vérité du menu** : 10 catégories, 66 articles, prix, variantes, mentions 18+, traductions FR/EN |
| `design/maquette/` | Les écrans validés (voir `design/LIRE-LA-MAQUETTE.md`), hors dépôt git |
| `design/tokens.css` | Couleurs, typo, rayons de l'identité |
| `public/images/pages/` | 6 photos, une par page du menu (WebP légers) |
| `public/brand/` | Logo Foodix (version fond nuit, sans slogan, toque seule, originaux) et icônes Facebook, TikTok, Instagram, WhatsApp |
| `docs/` | Cahier des charges, brief de maquette, photos du menu papier |

## Stack

- **Vite + React** (ou HTML/JS léger si plus simple), TypeScript conseillé.
- **PWA** : manifest + service worker (`vite-plugin-pwa`), menu et logos en cache, photos des pages gardées dès la première vue, ouverture en plein écran.
- **Hébergement** : Cloudflare Pages (HTTPS obligatoire pour la géolocalisation et la PWA).
- **Statistiques** : Cloudflare Web Analytics, paramètre `?src=truck` pour les scans du QR code.
- Aucune base de données : le menu vient de `menu.json`, le panier et l'historique sont dans le `localStorage` du téléphone.

## Contraintes d'usage (prioritaires)

- Téléphones Android d'entrée de gamme, réseau 3G, usage d'une main, souvent en plein soleil.
- Bundle léger, peu d'animations, polices limitées (Nunito + Squada One).
- **Zones cliquables de 44 px minimum** partout, contraste fort : fond clair crème, texte bleu nuit, texte secondaire `#5C5980` minimum, prix en orange foncé `#A84B05` (jamais l'orange vif en texte sur fond clair).
- Tout le texte est réel, en français par défaut. Jamais de lorem ipsum.

## Écrans et parcours

Parcours principal : Lancement > Menu > fiche article > Ajouter > Panier > Validation (livraison ou à emporter) > Envoi > Confirmation. Puis Mes commandes > Recommander > Panier.

1. **Lancement** : logo fond nuit, barre de chargement fine.
2. **Accueil / Menu** (style « Plein jour ») : fond crème. En-tête en bloc bleu nuit aux coins bas arrondis (28 px) avec bouton langue (globe + FR ou EN) à gauche, logo centré, Mes commandes et appel à droite ; dessous, slogan et statut Ouvert / Fermé centrés (point vert ou rouge avec un halo qui pulse, plus lent quand c'est fermé ; coupé si « réduire les animations »), puis la barre de recherche blanche dans le bloc. Onglets de pages collants en pastilles (« Tout » puis les 6 pages ; active : bleu nuit texte blanc ; autres : blanches bordure beige), voir « Menu en pages ». Pour chaque catégorie : bandeau orange avec le nom (police Squada One), puis une carte blanche arrondie (18 px) qui contient les articles : nom en gras bleu nuit, prix en orange foncé dessous, séparateurs fins beiges.
3. **Sur chaque ligne du menu** :
   - pas dans le panier : un bouton rond bleu nuit « + » (36 px visible, 44 px cliquable) ;
   - dans le panier : une deuxième ligne apparaît avec un sélecteur « − n + » à droite (à 0, l'article sort du panier) et, à gauche, « + Ajouter une précision » (ou « Précision : … · Modifier ») qui ouvre un champ texte + OK sous l'article ;
   - articles à variantes (format, garniture…) : le « + » reste toujours visible et ouvre la fiche ; sous l'article, une sous-ligne par choix dans le panier, « 2 × Format à 1.500 F = 3.000 F », chacune avec son « − n + » et sa précision (ex. 1 shawarma bœuf à 1.000 F et 2 à 1.500 F = deux sous-lignes). Bubble tea : une ligne de menu par parfum, pas de sous-ligne de choix.
4. **Fiche article** (feuille qui monte du bas sur téléphone et tablette, fenêtre centrée sur ordinateur) : catégorie, nom, prix, mention 18+ si besoin, quantité et champ « Précision » ; pour un article à variantes, chaque choix a sa propre quantité (0 par défaut) et sa précision, on peut prendre plusieurs choix d'un coup ; bouton « Ajouter · prix » (total de tous les choix), inactif tant qu'aucune quantité n'est choisie. **Pas de photo** (il n'y en a pas, comme sur le menu papier).
5. **Panier** : lignes avec + / −, Retirer, précision modifiable, « Ajouter d'autres articles », total (pas encore de ligne Livraison : le mode n'est choisi qu'à l'étape suivante), bouton « Valider ma commande ». Bouton Vider avec confirmation. **Panier vide** : toque, texte, Voir le menu, lien Recommander une commande passée.
6. **Validation livraison** : sélecteur Livraison / À emporter, nom, téléphone, quartier, adresse ou repère, position GPS (facultative), note ; récapitulatif Sous-total, Livraison « À confirmer sur WhatsApp », Total hors livraison (en à emporter : Total seul).
7. **Validation à emporter** : nom, téléphone, heure de retrait (Dès que possible / À une heure précise).
8. **Envoi** : paiement préféré (Espèces, MTN Mobile Money, Moov Money), aperçu exact du message WhatsApp, gros bouton orange « Commander sur WhatsApp » avec le logo WhatsApp.
9. **Confirmation** : Commande envoyée, numéro, 3 étapes suivantes, Rouvrir la discussion WhatsApp, Retour au menu, Mes commandes.
10. **Mes commandes** : historique local, Recommander, suppression d'une commande ou de tout l'historique.
11. **Installation** : bannière Android (`beforeinstallprompt`, boutons Plus tard / Installer), guide iPhone illustré en 4 étapes, avec les mots exacts de l'iPhone (••• puis « Partager », « En voir plus », « Sur l'écran d'accueil », « Ajouter »). Bannière : après « Plus tard », pas de nouvelle proposition pendant 3 jours (`installSnoozeDays`). Bouton « Installer l'app » permanent dans le pied de page. Après la première commande envoyée : une seule carte d'installation sur la confirmation. Déjà installée : rien.
12. **États** : food truck fermé (menu consultable, commande bloquée, bandeau + barre « Commandes fermées »), pas de connexion (menu en cache, bandeau), localisation refusée (aide + champ pour coller un lien de position).

## Style visuel validé : « Plein jour »

- Fond général crème `#F5F0E8`, cartes et feuilles blanches, texte bleu nuit `#15132D`.
- Le bleu nuit est réservé aux zones fortes : en-tête, barre du haut sur ordinateur, pied de page, barre panier, boutons + et compteurs − n +, choix sélectionnés (pastilles, variantes, Livraison / À emporter).
- L'orange `#F28A22` sert aux bandeaux de catégorie et aux boutons principaux (Ajouter, Valider ma commande, Commander sur WhatsApp), toujours avec du texte bleu nuit dessus.
- Fiche article : feuille blanche, sélecteur de quantité sur fond crème, champ Précision crème, bouton orange « Ajouter · prix ».
- Écran de lancement : reste en bleu nuit avec le logo.
- **Menu en pages, comme la carte papier** : le menu n'est plus une longue liste. Il est découpé en 6 pages (`pages` dans `menu.json`), précédées d'un onglet **« Tout » / « All »** (premier onglet) : Plats principaux ; Bols et desserts (bols et plats chauds + crêpes, gaufres et desserts) ; Boissons ; Bubble tea et cocktails ; Jus, glaces et lactés (jus naturels + desserts glacés + chaudes et lactées) ; Chichas. Les onglets collants (pastilles sur téléphone et tablette, colonne de gauche sur ordinateur) changent de page au lieu de faire défiler. Chaque page commence par **sa photo en entier, en haut**, centrée et sans recadrage (`aspect-ratio` = `imageRatio`, coins 18 px ; sur tablette et ordinateur hauteur limitée à 280 / 300 px avec `object-fit: cover; object-position: center`), puis les catégories de la page avec leur bandeau orange et leur carte d'articles. En bas de page, deux boutons côte à côte, « Page précédente » et « Page suivante » avec le nom de la page (un seul, toute la largeur, sur la première et la dernière page ; jamais vers « Tout »), mènent à la page voisine et remontent en haut. La recherche cherche dans tout le menu : pendant une recherche, la photo et le bouton de page suivante sont masqués et les résultats de toutes les pages s'affichent. Ouvrir une fiche article affiche la page de cet article, jamais « Tout » (la ligne touchée reste au même endroit de l'écran). L'onglet « Tout » affiche le menu complet dans l'ordre de la carte papier, avec un séparateur au début de chaque page : filet gris clair (2 px, #E4DCCF) de chaque côté, au centre « Page 2 sur 6 » (Nunito 800, 12 px, majuscules, #5C5980) et le nom de la page (Squada One, 28 px téléphone / 32 px tablette et ordinateur, bleu nuit), 34 px d'espace au-dessus (6 px pour la première page), puis la photo de la page, puis ses catégories ; pas de photo en tête ni de boutons de page dans « Tout ». La page ouverte par défaut reste « Plats principaux ». Photos dans `public/images/pages/` (WebP 900 px de large, 30 à 70 Ko). Jamais de photo par article.
- Toutes les valeurs sont dans `design/tokens.css`. La version précédente (fond nuit) n'est plus à suivre.

## Responsive

Mêmes textes, même identité et mêmes parcours partout. Seule la mise en page change.

| Format | Mise en page |
|---|---|
| Petit téléphone 360 px | Rien ne déborde, prix et bouton panier toujours visibles |
| Téléphone 390 px | Panier en barre flottante bleu nuit en bas (pastille orange avec le nombre d'articles, texte et total en blanc), fiche blanche qui monte du bas |
| Tablette 768 px | Articles en 2 colonnes, panier en panneau fixe à droite (290 px) |
| Ordinateur 1280 px | Barre du haut bleu nuit (logo, statut, recherche blanche, Mes commandes, téléphone), pages du menu en colonne à gauche, articles en 2 colonnes au centre, panier fixe à droite (340 px), fiche en fenêtre centrée de 480 px, formulaires limités à 560 px et centrés |

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
Lien : `https://wa.me/2290190568989?text=` + message encodé (`encodeURIComponent`). Numéro de commande court aléatoire (ex. `#A7K2`). Le panier est vidé après l'envoi et la commande enregistrée dans l'historique.

```
Commande FOODIX #A7K2
Mode : Livraison

2x Shawarma poulet ........... 4.000 F
1x Tacos ..................... 3.500 F
   ↳ sans piment
1x Bubble tea Mangue ......... 1.500 F

Total : 9.000 F (hors livraison)
Paiement : MTN Mobile Money

Nom : Koffi
Tél : 01 97 00 00 00
Adresse : Banikanni, près de la pharmacie
Position : https://maps.google.com/?q=9.3372,2.6303
Note : appeler en arrivant
```
- Points de conduite pour aligner les prix sur 30 caractères avant le prix.
- Précision sur une ligne à part : `   ↳ précision`.
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
- « Merci de faire route avec nous ! », dans un pied de page bleu nuit : icônes rondes Facebook, TikTok, Instagram (fichiers dans `public/brand/icons/`, en blanc), `@foodix`, numéros 01 95 94 51 51 et 01 90 56 89 89 en liens `tel:`.
- Tout en bas, séparé par un trait fin, en petit gris : « Envie d'une app comme celle-ci ? Écrivez-nous : » suivi du logo WhatsApp (petite sonnerie toutes les 4 s) et de +229 01 41 90 08 35 (en anglais « Want an app like this one? Message us: »), lien `https://wa.me/2290141900835`. **Ne jamais afficher de nom à cet endroit.**

## Hors périmètre (ne pas construire)

Pas de mode « sur place », pas de compte client, pas de fidélité, pas de paiement en ligne, pas d'espace d'administration, pas d'historique synchronisé, pas de photos de plats. Les mises à jour du menu se font en modifiant `menu.json`.

## Points encore à confirmer avec Foodix

- Emplacement du food truck. (Horaires confirmés : lundi–jeudi 10h–23h, vendredi–dimanche 10h–minuit.)
- Noms des variantes à double prix : shawarma viande de bœuf (1.000 / 1.500 F), donuts (1.500 / 3.500 F), 3x (1.000 / 2.000 F). Provisoirement « Format à 1.000 F », etc.
- Zones et frais de livraison, adresses exactes des pages Facebook / TikTok / Instagram (supposées `/foodix`).
- Nom de domaine : `foodix.bj` retenu (achat et branchement Cloudflare en cours) ; d'ici là, `foodix.pages.dev`. Une fois actif : `siteUrl` dans `src/config.ts`, README, puis QR code à régénérer.
- Dans la maquette, « Pastel » est marqué épuisé et l'historique contient des commandes d'exemple : ce sont des **données de démonstration**, pas des données réelles.

## Ordre de travail conseillé

1. Projet Vite + React, tokens, polices, chargement de `menu.json`.
2. Accueil / menu (téléphone d'abord), fiche article, + / − et précision en ligne, panier persistant.
3. Validation, géolocalisation, envoi WhatsApp, confirmation, historique et Recommander.
4. FR / EN, états (fermé, hors ligne), responsive tablette et ordinateur.
5. PWA (manifest, icônes à partir de `foodix-toque.png`, cache), installation Android et guide iPhone.
6. Tests sur vrai téléphone Android en 3G, Lighthouse, déploiement Cloudflare Pages.
