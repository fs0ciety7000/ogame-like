/* =====================================================
   Tutoriel scénarisé (v4.1) : les dix objectifs de prise en main deviennent
   trois chapitres racontés par Vashka, avec un premier raid de la
   Confrérie du Vide (Varan), affaibli : le joueur le repousse forcément.
===================================================== */

export type Speaker = "vashka" | "varan" | "kor" | "ilyon" | "nerea" | "brannoc" | "lysa" | "vesper";

export const STORY_SPEAKERS: Record<Speaker, { name: string; role: string; image: string; color: string }> = {
  vashka: { name: "Vashka", role: "Matriarche-Chasseuse · Essaim Kesh'Vaar", image: "/assets/bounties/vashka.webp", color: "#ffd86b" },
  varan: { name: "Capitaine Orsk Varan", role: "Confrérie du Vide", image: "/assets/story/varan.webp", color: "#ff7a45" },
  // v4.3 : voix des Chroniques mensuelles.
  kor: { name: "Madame Vashti Kor", role: "Cartel Néon", image: "/assets/story/cartel.webp", color: "#ff5fd2" },
  ilyon: { name: "Cantor Ilyon", role: "Déserteur du Chœur", image: "/assets/warlords/ilyon.webp", color: "#b18cff" },
  nerea: { name: "Sœur Néréa des Échos", role: "Marchande", image: "/assets/warlords/nerea.webp", color: "#d6b4ff" },
  brannoc: { name: "Brannoc Demi-Barbe", role: "Seigneur de guerre", image: "/assets/warlords/brannoc.webp", color: "#ff9a5c" },
  lysa: { name: "Lysa Ferro", role: "La Comptable", image: "/assets/warlords/lysa.webp", color: "#ffb347" },
  vesper: { name: "L'Archonte Vesper", role: "Le Chœur Silencieux", image: "/assets/story/choeur.webp", color: "#9fd8ff" },
};

export interface StoryLine {
  speaker: Speaker;
  text: string;
}

export interface StoryChapter {
  id: number;
  title: string;
  /** Objectifs de prise en main du chapitre (identifiants d'ONBOARDING_STEPS). */
  steps: string[];
  intro: StoryLine[];
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 1,
    title: "La Ruche se souvient",
    steps: ["scrap3", "reactor3", "research", "drones5"],
    intro: [
      { speaker: "vashka", text: "Commandant {pseudo}. Je suis Vashka. Il y a trois cycles, des pillards ont brûlé notre Ruche-Mère et vendu les œufs de notre Reine." },
      { speaker: "vashka", text: "L'Essaim est trop affaibli pour chasser seul. Il nous faut des alliés solides… et un allié solide commence par une économie qui tourne." },
      { speaker: "vashka", text: "Fais tourner tes extracteurs de ferraille, ton réacteur, lance une recherche et construis quelques drones. Je reviens quand tu seras prêt." },
    ],
  },
  {
    id: 2,
    title: "La Confrérie rôde",
    steps: ["mission", "storage2", "rockets10"],
    intro: [
      { speaker: "vashka", text: "Bien. Mais tes signaux ont été captés. La Confrérie du Vide flaire les jeunes empires comme le tien." },
      { speaker: "varan", text: "Une nouvelle colonie, toute neuve, toute brillante… Mes gars adorent les coffres qui n'ont jamais connu de serrure." },
      { speaker: "vashka", text: "Mets ton stock à l'abri dans l'entrepôt et installe des roquettes. Quand Varan viendra, il faudra lui répondre." },
    ],
  },
  {
    id: 3,
    title: "Le Serment de la Traque",
    steps: ["spy", "alliance", "rank"],
    intro: [
      { speaker: "vashka", text: "Varan a goûté à tes roquettes. Il reviendra plus fort : la Confrérie n'oublie jamais une humiliation." },
      { speaker: "vashka", text: "Apprends à voir avant de frapper : envoie une sonde. Puis trouve des alliés, on ne survit pas seul dans ce secteur." },
      { speaker: "vashka", text: "Atteins le rang Fer II, et l'Essaim te reconnaîtra comme l'un des siens." },
    ],
  },
];

/** Raid scripté, déclenché quand les roquettes du chapitre 2 sont installées. */
export const TUTORIAL_RAID = { factionId: "varan", trigger: "rockets10", powerPct: 0.25, minPower: 5, delayMinutes: 2 };

export const RAID_LINES: StoryLine[] = [
  { speaker: "varan", text: "Alors comme ça, tu joues aux défenseurs ? Mes éclaireurs arrivent, {pseudo}. Montre-moi ce que valent tes roquettes." },
  { speaker: "vashka", text: "Pas de panique : ce n'est qu'une avant-garde. Tes défenses suffiront. Regarde la flotte hostile approcher sur l'accueil." },
];

export const OUTRO_LINES: StoryLine[] = [
  { speaker: "vashka", text: "Tu as tenu ta parole, commandant. Le Serment de la Traque te lie désormais à l'Essaim." },
  { speaker: "vashka", text: "Porte le titre de Recrue de Vashka avec fierté. Et quand tu voudras chasser pour nous, la page Primes t'attend." },
];

export const TUTORIAL_TITLE = "Recrue de Vashka";

export function chapterOf(claimed: string[]): StoryChapter | null {
  return STORY_CHAPTERS.find((c) => c.steps.some((s) => !claimed.includes(s))) ?? null;
}

export function storyText(line: StoryLine, pseudo: string): string {
  return line.text.split("{pseudo}").join(pseudo);
}
