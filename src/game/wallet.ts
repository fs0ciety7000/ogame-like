import { bountyState, bountyRank, rankName } from "@/game/bounties";
import { playerCasino } from "@/game/casino";
import { factionStates, findFaction } from "@/game/pirates";
import { passState } from "@/game/seasonPass";
import { talentPoints } from "@/game/talents";
import { RESOURCE_LIST } from "@/game/resources";
import type { PlayerState } from "@/types/game";

/* =====================================================
   5.31 (lot D, constat Q2) : portefeuille unique. Chaque monnaie ou jauge,
   son solde, d'où elle vient et à quoi elle sert, au même endroit.
   Les textes reprennent docs/systems/commerce-monnaies.md ; une monnaie
   nouvelle s'ajoute ici (test : chaque entrée a une source et un usage).
===================================================== */

export interface WalletEntry {
  id: string;
  name: string;
  /** Solde lisible, ou null quand il n'y a rien à compter. */
  value: number | null;
  /** Précision sous le solde (« rang Traqueur », « 3 libres sur 6 »). */
  sub?: string;
  earn: string;
  spend: string;
  link: string;
  group: "ressources" | "monnaies" | "jauges";
}

export function walletEntries(player: PlayerState, now: number): WalletEntry[] {
  const b = bountyState(player);
  const casino = playerCasino(player);
  const tp = talentPoints(player);
  const ps = passState(player, now);
  const factions = Object.entries(factionStates(player))
    .map(([id, st]) => ({ id, name: findFaction(id)?.name ?? id, notoriety: st?.notoriety ?? 0 }))
    .sort((x, y) => y.notoriety - x.notoriety);
  const worst = factions[0];
  const commons = RESOURCE_LIST.filter((r) => r.rarity === "common");
  const rares = RESOURCE_LIST.filter((r) => r.rarity === "rare");
  const sum = (ids: { id: string }[]) => ids.reduce((a, r) => a + Math.floor((player.resources as Record<string, number>)[r.id] ?? 0), 0);
  return [
    {
      id: "communes",
      name: "Ressources communes",
      value: sum(commons),
      sub: commons.map((r) => r.name).join(", "),
      earn: "Production des extracteurs, missions, butin, expéditions, contrats.",
      spend: "Bâtiments, technologies, unités ; échange au comptoir.",
      link: "/game/ressources",
      group: "ressources",
    },
    {
      id: "rares",
      name: "Ressources rares",
      value: sum(rares),
      sub: rares.map((r) => r.name).join(", "),
      earn: "Fonderie et Synthétiseur, gisements des colonies, expéditions, combats contre les PNJ.",
      spend: "Bâtiments et technologies de fin de partie, Cale sèche, modules.",
      link: "/game/ressources",
      group: "ressources",
    },
    {
      id: "ambre",
      name: "Ambre de Ruche",
      value: Math.floor(b.amber ?? 0),
      sub: `${Math.floor(b.amberEarned ?? 0)} gagné au total`,
      earn: "Primes Kesh'Vaar, proie d'élite, boss, série (jour 6), fin de saison, parrainage.",
      spend: "Comptoir de la Ruche, accélérations, renommage, indices de succès, enchères.",
      link: "/game/primes",
      group: "monnaies",
    },
    {
      id: "jetons",
      name: "Jetons du casino",
      value: Math.floor(casino.tokens ?? 0),
      earn: "Missions du jour, série, combats (25 par semaine au plus), passe, défis.",
      spend: "Machine à sous du pot commun.",
      link: "/game/casino",
      group: "monnaies",
    },
    {
      id: "reputation",
      name: "Réputation Kesh",
      value: Math.floor(b.reputation ?? 0),
      sub: `rang ${rankName(bountyRank(b.reputation ?? 0))}`,
      earn: "Primes réussies.",
      spend: "Ne se dépense pas : débloque des rangs de chasseur (primes plus riches, objets du Comptoir).",
      link: "/game/primes",
      group: "jauges",
    },
    {
      id: "notoriete",
      name: "Notoriété",
      value: worst ? worst.notoriety : 0,
      sub: worst ? `la plus haute : ${worst.name}` : "aucune faction",
      earn: "Combats contre les factions, refus d'ultimatum.",
      spend: "Ne se dépense pas : plus elle est haute, plus les raids sont durs ; un traité la fait baisser.",
      link: "/game/menaces",
      group: "jauges",
    },
    {
      id: "xp",
      name: "Expérience",
      value: Math.floor(player.xp ?? 0),
      sub: `${Math.floor(player.seasonXp ?? 0)} cette saison`,
      earn: "Presque tout : construire, rechercher, combattre, missions.",
      spend: "Ne se dépense pas : rangs, classement de la saison, divisions.",
      link: "/game/joueurs",
      group: "jauges",
    },
    {
      id: "passe",
      name: "Points du passe",
      value: Math.floor(ps.points ?? 0),
      earn: "Activités du jour, missions du jour, épisodes des Chroniques.",
      spend: "Ne se dépensent pas : chaque palier atteint donne une récompense à réclamer.",
      link: "/game/passe",
      group: "jauges",
    },
    {
      id: "talents",
      name: "Points de talent",
      value: tp.free,
      sub: `${tp.free} libre${tp.free > 1 ? "s" : ""} sur ${tp.total}`,
      earn: "Chaque Ascension.",
      spend: "Arbre de talents (bonus permanents).",
      link: "/game/ascension",
      group: "jauges",
    },
  ];
}

/* 5.31 : un mot = un sens. « Saison » désigne le mois ; le passe et les Chroniques en sont deux parties. */
export const GLOSSARY: { term: string; meaning: string }[] = [
  { term: "Saison", meaning: "Le mois en cours. Classement d'XP, divisions et récompenses de fin de saison." },
  { term: "Passe", meaning: "Les 30 paliers du mois, qui avancent avec tes activités. Chaque palier se réclame." },
  { term: "Chroniques", meaning: "L'histoire du mois en 4 épisodes, avec son boss de saison." },
  { term: "Division", meaning: "Ton groupe de classement dans la saison, selon ton XP." },
  { term: "Ascension", meaning: "Recommencer plus fort : bâtiments au niveau 1, talents et bonus gardés pour toujours." },
  { term: "Pot commun", meaning: "La réserve du serveur, nourrie par les taxes et les dons. Elle paie le casino et les concours." },
  { term: "Prêts", meaning: "Vaisseaux réparés qui attendent une place au hangar (Atelier, Cale sèche)." },
];
