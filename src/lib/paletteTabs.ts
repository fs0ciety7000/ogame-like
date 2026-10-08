/* 5.26.2 : onglets des pages à onglets, proposés par la palette Ctrl+K
   (« enchères », « modules », « atelier »…). Liste figée : les pages sont
   chargées à la demande, la palette ne doit pas les importer. */

export interface PaletteTab {
  /** Page (même chemin que la navigation). */
  page: string;
  pageLabel: string;
  label: string;
  to: string;
  /** Mots en plus pour la recherche. */
  keywords?: string;
}

const tab = (page: string, pageLabel: string, id: string, label: string, keywords?: string): PaletteTab => ({ page, pageLabel, label, to: `${page}?onglet=${id}`, keywords });

const PALETTE_TABS: PaletteTab[] = [
  tab("/game/commerce", "Commerce", "marche", "Marché", "offres ordres achat"),
  tab("/game/commerce", "Commerce", "contrats", "Contrats", "livraison"),
  tab("/game/commerce", "Commerce", "encheres", "Enchères", "hôtel vente relique plan alerte cote"),
  tab("/game/commerce", "Commerce", "pot", "Pot commun", "taxes serveur tableau de bord"),
  tab("/game/etat-major", "État-major", "commanders", "Commandants", "officiers"),
  tab("/game/etat-major", "État-major", "relics", "Reliques"),
  tab("/game/etat-major", "État-major", "modules", "Modules", "plans fusion préréglage"),
  tab("/game/etat-major", "État-major", "synthesis", "Labo de synthèse", "capsules"),
  tab("/game/etat-major", "État-major", "effects", "Effets", "bonus"),
  tab("/game/primes", "Primes", "comptoir", "Comptoir de la Ruche", "ambre boutique"),
  tab("/game/primes", "Primes", "elite", "Proie d'élite"),
  tab("/game/batiments", "Bâtiments", "atelier", "Atelier de réparation", "réparer coques"),
  tab("/game/messages", "Messages", "global", "Canal global", "chat"),
  tab("/game/messages", "Messages", "prives", "Messages privés"),
  tab("/game/alliance", "Alliance", "tresor", "Trésor"),
  tab("/game/alliance", "Alliance", "recherches", "Recherches"),
  tab("/game/alliance", "Alliance", "projets", "Projets"),
  tab("/game/alliance", "Alliance", "boss", "Boss d'alliance"),
  tab("/game/alliance", "Alliance", "guerre", "Guerre"),
  tab("/game/alliance", "Alliance", "diplomatie", "Diplomatie", "pactes"),
  tab("/game/alliance", "Alliance", "calendrier", "Calendrier"),
  // 6.14.49 (É30-1c) : panneau Lune de l'écran Statistiques (la page fait défiler jusqu'à lui).
  tab("/game/statistiques", "Statistiques", "lune", "Phalange", "lune radar balayage perce-brouillard leurre"),
  tab("/game/statistiques", "Statistiques", "lune", "Porte de saut", "lune saut rapatrier patrouille garnison"),
  tab("/game/reglages", "Réglages", "compte", "Compte", "mot de passe"),
  tab("/game/reglages", "Réglages", "apparence", "Apparence et son", "thème compact"),
  tab("/game/reglages", "Réglages", "notifications", "Notifications"),
  tab("/game/reglages", "Réglages", "jeu", "Jeu et aide"),
];

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Onglets correspondant à la recherche (au moins 2 lettres), en excluant les pages masquées. */
export function matchPaletteTabs(query: string, hidden: ReadonlySet<string> = new Set()): PaletteTab[] {
  const q = fold(query.trim());
  if (q.length < 2) return [];
  return PALETTE_TABS.filter((t) => !hidden.has(t.page) && fold(`${t.pageLabel} ${t.label} ${t.keywords ?? ""}`).includes(q));
}
