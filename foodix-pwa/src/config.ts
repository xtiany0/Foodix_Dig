/**
 * Réglages de Foodix.
 *
 * Toutes les informations encore À CONFIRMER avec Foodix sont regroupées ici.
 * Modifier ce fichier, puis relancer le build et redéployer.
 * Le menu (articles, prix, ruptures) se modifie dans data/menu.json, pas ici.
 */

import type { Localized } from './types/menu';

/** Plage d'ouverture, heures au format « HH:MM » à l'heure du Bénin. */
export interface OpeningRange {
  open: string;
  /** Une heure de fermeture plus petite que l'ouverture passe minuit (ex. 18:00 → 02:00). */
  close: string;
}

/** Clés : 0 = dimanche, 1 = lundi … 6 = samedi. Jour absent ou liste vide = fermé ce jour-là. */
export type WeeklyHours = Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, OpeningRange[]>>;

export interface VariantName {
  label: string;
  cartName: string;
}

export const config = {
  /** Adresse du site (domaine définitif). Sert au QR code (?src=truck) et au lien « Copier » du guide iPhone. */
  siteUrl: 'https://commandefoodix.bj',

  /** Numéro qui reçoit les commandes WhatsApp (format international, sans « + »). */
  whatsappNumber: '2290190568989',
  whatsappDisplay: '01 90 56 89 89',

  /** Numéros affichés et appelables (liens tel:). Le premier sert au bouton « Appeler ». */
  phones: [
    { display: '01 95 94 51 51', tel: '+2290195945151' },
    { display: '01 90 56 89 89', tel: '+2290190568989' },
  ],

  /** À CONFIRMER : adresses exactes des pages (supposées /foodix). */
  social: {
    handle: '@foodix',
    facebook: 'https://www.facebook.com/foodix',
    tiktok: 'https://www.tiktok.com/@foodix',
    instagram: 'https://www.instagram.com/foodix',
  },

  /** Contact de la conception, en bas de page. Ne jamais afficher de nom. */
  designer: {
    display: '+229 01 41 90 08 35',
    url: 'https://wa.me/2290141900835',
  },

  /** Fuseau utilisé pour Ouvert / Fermé, quel que soit le réglage du téléphone. */
  timeZone: 'Africa/Porto-Novo',

  /**
   * Horaires d'ouverture : lundi au jeudi 10h–23h, vendredi au dimanche 10h–minuit.
   * null = horaires inconnus : l'application est considérée comme toujours ouverte.
   * Fermeture « 00:00 » = minuit.
   */
  openingHours: {
    1: [{ open: '10:00', close: '23:00' }],
    2: [{ open: '10:00', close: '23:00' }],
    3: [{ open: '10:00', close: '23:00' }],
    4: [{ open: '10:00', close: '23:00' }],
    5: [{ open: '10:00', close: '00:00' }],
    6: [{ open: '10:00', close: '00:00' }],
    0: [{ open: '10:00', close: '00:00' }],
  } as WeeklyHours | null,

  /**
   * Commande possible hors horaires : le statut reste « Fermé » et un bandeau prévient
   * que la commande sera traitée à la réouverture. false : commande bloquée hors horaires.
   */
  orderWhenClosed: true,

  /** Texte des horaires dans le bandeau « Foodix est fermé ». */
  openingHoursText: {
    fr: 'du lundi au jeudi de 10h à 23h, du vendredi au dimanche de 10h à minuit',
    en: 'Monday to Thursday 10am–11pm, Friday to Sunday 10am–midnight',
  } satisfies Localized,

  /** Ville du food truck ; emplacement exact À CONFIRMER (pas encore affiché dans la maquette). */
  location: {
    fr: 'Parakou · [EMPLACEMENT EXACT À CONFIRMER]',
    en: 'Parakou · [EXACT LOCATION TO CONFIRM]',
  } satisfies Localized,

  /**
   * À CONFIRMER : noms des variantes à double prix.
   * Remplace, dans l'ordre des options de menu.json, le libellé de la fiche
   * et le nom écrit dans le panier et le message WhatsApp.
   * Laisser un tableau vide pour garder les noms de menu.json.
   */
  variantNames: {
    'shawarma-boeuf': [
      { label: 'Format à 1.000 F', cartName: 'Shawarma viande de bœuf (1.000 F)' },
      { label: 'Format à 1.500 F', cartName: 'Shawarma viande de bœuf (1.500 F)' },
    ],
    donuts: [
      { label: 'Format à 1.500 F', cartName: 'Donuts (1.500 F)' },
      { label: 'Format à 3.500 F', cartName: 'Donuts (3.500 F)' },
    ],
    'trois-x': [
      { label: 'Format à 1.000 F', cartName: '3x (1.000 F)' },
      { label: 'Format à 2.000 F', cartName: '3x (2.000 F)' },
    ],
  } as Record<string, VariantName[]>,

  /** Jeton Cloudflare Web Analytics. Vide = pas de statistiques. Voir aussi VITE_CF_BEACON_TOKEN. */
  analyticsToken: '',

  /**
   * Durée minimale de l'écran de lancement, comptée depuis l'ouverture de la page
   * (un chargement plus lent n'est jamais rallongé). Une seule fois par visite.
   */
  launchMinMs: 1300,

  /** Nombre de commandes gardées dans « Mes commandes ». */
  historyLimit: 30,

  /** Retour dans l'app après N minutes ailleurs : menu rechargé, nouvelle version cherchée. */
  refreshAfterMinutes: 10,

  /** Proposition d'installation d'office : au plus une fois tous les N jours (affichée ou refusée). */
  installSnoozeDays: 3,
};
