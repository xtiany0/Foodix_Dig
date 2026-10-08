/**
 * Accès protégé au localStorage.
 *
 * Chaque valeur est enregistrée sous la forme { v: version, data }.
 * À la lecture, une valeur absente, illisible, d'une autre version ou de forme
 * inattendue est effacée et remplacée par la valeur par défaut :
 * l'application repart proprement au lieu de planter.
 */

const PREFIX = 'foodix.';

interface Envelope {
  v: number;
  data: unknown;
}

function store(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // accès refusé (navigation privée, réglages du navigateur)
  }
}

/**
 * @param parse renvoie la donnée validée, ou null si sa forme est invalide.
 */
export function readStored<T>(key: string, version: number, parse: (data: unknown) => T | null, fallback: T): T {
  const s = store();
  if (!s) return fallback;
  let raw: string | null;
  try {
    raw = s.getItem(PREFIX + key);
  } catch {
    return fallback;
  }
  if (raw === null) return fallback;
  try {
    const env = JSON.parse(raw) as Envelope;
    if (env && typeof env === 'object' && env.v === version) {
      const data = parse(env.data);
      if (data !== null) return data;
    }
  } catch {
    // JSON corrompu : on efface plus bas
  }
  removeStored(key);
  return fallback;
}

export function writeStored(key: string, version: number, data: unknown): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(PREFIX + key, JSON.stringify({ v: version, data } satisfies Envelope));
  } catch {
    // stockage plein ou refusé : l'application continue sans sauvegarde
  }
}

export function removeStored(key: string): void {
  try {
    store()?.removeItem(PREFIX + key);
  } catch {
    // rien à faire
  }
}
