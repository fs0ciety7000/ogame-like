// Position galactique déterministe : dérivée par hash de l'uid, jamais
// stockée. Chaque joueur retombe toujours sur les mêmes coordonnées sans
// nécessiter de migration ni d'écriture Firestore supplémentaire.
export interface GalaxyCoords {
  galaxy: number;
  system: number;
  position: number;
  x: number;
  y: number;
}

function hashString(input: string, seed: number): number {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function galaxyCoords(uid: string): GalaxyCoords {
  return {
    galaxy: 1 + (hashString(uid, 3) % 9),
    system: 1 + (hashString(uid, 4) % 499),
    position: 1 + (hashString(uid, 5) % 15),
    x: hashString(uid, 1) / 4294967296,
    y: hashString(uid, 2) / 4294967296,
  };
}

export function formatCoords(c: Pick<GalaxyCoords, "galaxy" | "system" | "position">): string {
  return `${c.galaxy}:${c.system}:${c.position}`;
}
