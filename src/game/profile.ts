import { bossEmblems, chroniclesConfig } from "@/game/chronicles";
import { GameActionError } from "@/game/errors";
import { bountyState, KESH } from "@/game/bounties";
import { commanderLevel, commandersState, type OfficerId } from "@/game/commanders";
import { FACTIONS, pirateState } from "@/game/pirates";
import { equippedRelics, type RelicRarity } from "@/game/relics";
import { seasonLabel } from "@/game/seasons";
import type { PlayerState } from "@/types/game";

/* =====================================================
   Profil personnalisable (v4.0) : bannière et emblème de la fiche
   publique, débloqués par les exploits (repaires tombés, Essaim,
   Léviathan), et une devise. La vitrine montre d'office les officiers en
   poste et les reliques équipées.
===================================================== */

export interface ProfileStyle {
  banner: string;
  emblem: string;
  motto: string;
  /** v4.9.3 : succès mis en avant sur la fiche publique (obtenus, 3 au plus). */
  pinned: string[];
}

export interface CosmeticOption {
  id: string;
  label: string;
  /** Image (bannière ou sceau) ; sinon dégradé CSS. */
  image?: string;
  gradient?: string;
  hint: string;
  unlocked: boolean;
}

export const PROFILE_RULES = { mottoMax: 60, pinnedMax: 3 };

type StylePlayer = Pick<PlayerState, "pirates" | "bounties" | "stats"> & Partial<Pick<PlayerState, "profileStyle" | "referral" | "seasonPass" | "chronicle" | "unlockedAchievements">>;

const FREE_BANNERS: Omit<CosmeticOption, "unlocked">[] = [
  { id: "nebula", label: "Nébuleuse", gradient: "linear-gradient(120deg,#0b1430 0%,#1d2a6b 45%,#4be8ff55 100%)", hint: "Offerte" },
  { id: "aurore", label: "Aurore", gradient: "linear-gradient(120deg,#0a1a1a 0%,#0f4d45 50%,#5ef2b066 100%)", hint: "Offerte" },
  { id: "braise", label: "Braise", gradient: "linear-gradient(120deg,#1a0a06 0%,#5c1f0e 50%,#ff7a4566 100%)", hint: "Offerte" },
  { id: "abysse", label: "Abysse", gradient: "linear-gradient(120deg,#07060f 0%,#2a1450 50%,#a78bfa66 100%)", hint: "Offerte" },
];

function leviathanKills(p: StylePlayer): number {
  return Number((p.stats as Record<string, unknown> | undefined)?.leviathanKills) || 0;
}

export function bannerOptions(p: StylePlayer): CosmeticOption[] {
  const kesh = bountyState(p);
  return [
    ...FREE_BANNERS.map((b) => ({ ...b, unlocked: true })),
    ...FACTIONS.filter((f) => f.banner || f.art).map((f) => ({
      id: `faction:${f.id}`,
      label: f.name,
      image: f.banner || f.art,
      hint: `Faire tomber ${f.lair.name}`,
      unlocked: pirateState(p, f.id).lairsTaken > 0,
    })),
    { id: "kesh", label: "Essaim Kesh'Vaar", image: KESH.banner, hint: "Remplir une prime Kesh'Vaar", unlocked: kesh.completed > 0 },
    { id: "leviathan", label: "Léviathan", image: "/assets/leviathan/leviathan.webp", hint: "Abattre un Léviathan", unlocked: leviathanKills(p) > 0 },
    // v4.1 : parrainage et passes de saison terminés.
    { id: "recruteur", label: "Recruteur", gradient: "linear-gradient(120deg,#1a1405 0%,#6b4d0e 45%,#ffd86b88 100%)", hint: "Parrainer un joueur jusqu'à Bronze I", unlocked: (p.referral?.recruits ?? 0) > 0 },
    ...(p.seasonPass?.completed ?? []).map((seasonId, i) => ({
      id: `pass:${seasonId}`,
      label: `Passe ${seasonLabel(seasonId)}`,
      gradient: PASS_GRADIENTS[i % PASS_GRADIENTS.length],
      hint: "Terminer le passe de saison",
      unlocked: true,
    })),
    // v5.4 : une bannière par chapitre des Chroniques terminé.
    ...chroniclesConfig()
      .months.filter((m) => m.completion)
      .map((m) => ({
        id: `chapter:${m.id}`,
        label: `Chapitre « ${m.title} »`,
        gradient: m.completion!.banner,
        hint: `Terminer les quatre épisodes de « ${m.title} »`,
        unlocked: ((p.chronicle as { chapters?: string[] } | undefined)?.chapters ?? []).includes(m.id),
      })),
  ];
}

const PASS_GRADIENTS = [
  "linear-gradient(120deg,#05101a 0%,#0e4d6b 40%,#4be8ff 70%,#a78bfa 100%)",
  "linear-gradient(120deg,#140514 0%,#5c0e4d 40%,#ff5df0 70%,#ffd86b 100%)",
  "linear-gradient(120deg,#05140c 0%,#0e5c3a 40%,#5ef2b0 70%,#4be8ff 100%)",
];

export function emblemOptions(p: StylePlayer): CosmeticOption[] {
  const kesh = bountyState(p);
  return [
    { id: "rank", label: "Insigne de rang", hint: "Offert", unlocked: true },
    ...FACTIONS.filter((f) => f.emblem).map((f) => ({
      id: `faction:${f.id}`,
      label: `Sceau ${f.name}`,
      image: f.emblem,
      hint: `Faire tomber ${f.lair.name}`,
      unlocked: pirateState(p, f.id).lairsTaken > 0,
    })),
    { id: "kesh", label: "Emblème de l'Essaim", image: KESH.emblem, hint: "Comptoir de la Ruche", unlocked: kesh.owned.includes("emblem") },
    { id: "leviathan", label: "Marque du Léviathan", image: "/assets/leviathan/leviathan-emblem.webp", hint: "Abattre un Léviathan", unlocked: leviathanKills(p) > 0 },
    // v4.3 : sceaux des boss de saison (uniques, jamais redonnés).
    ...bossEmblems(p).map((b) => ({ ...b, hint: "Participer à la chute du boss de saison" })),
  ];
}

export function profileStyle(p: StylePlayer): ProfileStyle {
  const raw = (p.profileStyle ?? {}) as Partial<ProfileStyle>;
  const unlocked = new Set(p.unlockedAchievements ?? []);
  const pinned = Array.isArray(raw.pinned) ? raw.pinned.filter((id, i, a) => typeof id === "string" && unlocked.has(id) && a.indexOf(id) === i).slice(0, PROFILE_RULES.pinnedMax) : [];
  return { banner: String(raw.banner ?? "nebula"), emblem: String(raw.emblem ?? "rank"), motto: String(raw.motto ?? ""), pinned };
}

export function sanitizeMotto(text: unknown): string {
  return String(text ?? "")
    // eslint-disable-next-line no-control-regex -- caractères de contrôle retirés
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PROFILE_RULES.mottoMax);
}

/** Choix du joueur, revérifié (une option verrouillée est refusée). */
export function setProfileStyle(player: PlayerState, input: unknown): ProfileStyle {
  const req = (input && typeof input === "object" ? input : {}) as Partial<ProfileStyle>;
  const current = profileStyle(player);
  const next: ProfileStyle = { ...current };
  if (req.banner !== undefined) {
    const opt = bannerOptions(player).find((o) => o.id === req.banner);
    if (!opt) throw new GameActionError("Bannière inconnue.");
    if (!opt.unlocked) throw new GameActionError(`Bannière verrouillée : ${opt.hint.toLowerCase()}.`);
    next.banner = opt.id;
  }
  if (req.emblem !== undefined) {
    const opt = emblemOptions(player).find((o) => o.id === req.emblem);
    if (!opt) throw new GameActionError("Emblème inconnu.");
    if (!opt.unlocked) throw new GameActionError(`Emblème verrouillé : ${opt.hint.toLowerCase()}.`);
    next.emblem = opt.id;
  }
  if (req.motto !== undefined) next.motto = sanitizeMotto(req.motto);
  if (req.pinned !== undefined) {
    if (!Array.isArray(req.pinned)) throw new GameActionError("Succès mis en avant invalides.");
    const unlocked = new Set(player.unlockedAchievements ?? []);
    const ids = [...new Set(req.pinned.map(String))];
    if (ids.length > PROFILE_RULES.pinnedMax) throw new GameActionError(`${PROFILE_RULES.pinnedMax} succès au plus en vitrine.`);
    if (ids.some((id) => !unlocked.has(id))) throw new GameActionError("Seuls les succès obtenus peuvent être mis en avant.");
    next.pinned = ids;
  }
  player.profileStyle = next;
  return next;
}

export interface PublicShowcase {
  banner: { image?: string; gradient?: string };
  emblem: string | null;
  motto: string;
  /** v4.9.3 : succès épinglés (id seulement ; le client retrouve nom, emoji et rang). */
  achievements?: string[];
  commanders: { id: OfficerId; level: number }[];
  relics: { template: string; rarity: RelicRarity }[];
}

/** Ce qui s'affiche sur la fiche publique (écrit par le serveur dans le profil). */
export function publicShowcase(p: StylePlayer & Pick<PlayerState, "commanders" | "relics" | "ascensions">): PublicShowcase {
  const style = profileStyle(p);
  const banner = bannerOptions(p).find((o) => o.id === style.banner && o.unlocked) ?? { ...FREE_BANNERS[0], unlocked: true };
  const emblem = emblemOptions(p).find((o) => o.id === style.emblem && o.unlocked);
  const st = commandersState(p);
  return {
    banner: banner.image ? { image: banner.image } : { gradient: banner.gradient },
    emblem: emblem?.image ?? null,
    motto: style.motto,
    achievements: style.pinned,
    commanders: st.active.map((id) => ({ id, level: commanderLevel(st.roster[id]?.xp ?? 0) })),
    relics: equippedRelics(p).map((r) => ({ template: r.template, rarity: r.rarity })),
  };
}
