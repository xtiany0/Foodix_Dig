# Lire la maquette

Le dossier `maquette/` contient les écrans validés par le client, exportés depuis le canevas de conception. Ce sont des **références visuelles et fonctionnelles**, pas du code à réutiliser tel quel.

## Format des fichiers `.dc.html`

Chaque fichier est un composant au format « Design Component » :

- Le balisage est dans `<x-dc>…</x-dc>`. Tous les styles sont en ligne (`style="…"`), donc les valeurs exactes (tailles, espacements, couleurs) se lisent directement.
- `{{nom}}` est une valeur calculée dans `renderVals()` (le script en bas du fichier).
- `<sc-if value="{{x}}">` est un affichage conditionnel. `<sc-for list="{{liste}}" as="it">` est une boucle.
- `<dc-import name="Menu" layout="tablet" …>` monte le composant `Menu.dc.html` avec des paramètres. Les petits fichiers (Fiche, Ferme, Menu-tablette…) ne font que ça.
- Le script `class Component extends DCLogic` contient la logique : état (`this.state`), gestion du panier, traductions FR/EN.
- `support.js` est le moteur du canevas : il n'est pas fourni et n'est pas nécessaire. Ces fichiers ne s'ouvrent donc pas tels quels dans un navigateur.

## Composants principaux

| Fichier | Rôle | Paramètres |
|---|---|---|
| `Menu.dc.html` | Accueil / menu, fiche article (feuille du bas ou fenêtre), panier latéral, bandeaux d'état, guide iPhone, sélecteur FR/EN | `layout` phone, small, tablet, desktop · `cart` partial, example, empty · `situation` closed, offline, install-android, install-ios · `sheet` id d'article · `lang` fr, en |
| `Panier.dc.html` | Panier téléphone, panier vide | `layout` phone, small · `preset` example, empty |
| `Livraison.dc.html` | Validation livraison et à emporter, géolocalisation | `mode` livraison, emporter · `geo` ok, idle, refused |
| `Envoi.dc.html` | Paiement préféré, aperçu du message WhatsApp, bouton Commander | `layout` phone, small, tablet, desktop |
| `Confirmation.dc.html` | Commande envoyée | `layout` phone, desktop |
| `Commandes.dc.html` | Historique, Recommander, alertes épuisé / prix modifié | |
| `Main.dc.html` | Écran de lancement | |

`canvas.json` donne la liste des 28 écrans et leur format (390 × 844, 360 × 740, 768 × 1024, 1280 × 800).

## Images

Les chemins d'images pointent vers `../../public/brand/`. Les données du menu (articles, prix, variantes, traductions) sont reprises proprement dans `data/menu.json`, c'est ce fichier qui fait foi.
