/* 6.14.116 (É30-5) : page de chaque adresse du jeu (`/game/<segment>`), pour lancer le téléchargement de son code dès le
   démarrage, en parallèle des données (avant : après le chargement du contenu, une seconde de plus sur mobile).
   6.14.152 (R4) : module sans import, lu aussi par le build (`page-preload-plugin.ts`) : la page d'accueil (`index.html`)
   précharge le code de la page ouverte avant même le JavaScript du jeu. Clé = segment après `/game/`, valeur = nom de la page
   (fichier `src/pages/<nom>.tsx`, export du même nom). */
export const GAME_ROUTE_PAGES: Record<string, string> = {
  "": "DashboardPage",
  "ordres": "OrdersPage",
  "portefeuille": "WalletPage",
  "classe": "EmpireClassPage",
  "ressources": "ResourcesPage",
  "batiments": "BuildingsPage",
  "unites": "UnitsPage",
  "labo": "LabPage",
  "missions": "MissionsPage",
  "joueurs": "PlayersPage",
  "galaxie": "GalaxyPage",
  "combats": "CombatLogPage",
  "simulateur": "SimulatorPage",
  "planificateur": "PlannerPage",
  "commerce": "CommercePage",
  "uber": "LeviathanPage",
  "primes": "BountiesPage",
  "etat-major": "CommandPage",
  "passe": "SeasonPassPage",
  "colonies": "ColoniesPage",
  "statistiques": "EmpireStatsPage",
  "ascension": "AscensionPage",
  "prestige": "PrestigePage",
  "redaction": "BlogEditorPage",
  "palmares": "HallOfFamePage",
  "menaces": "ThreatsPage",
  "seigneurs": "WarlordsPage",
  "boss": "SeasonBossPage",
  "hall-of-fame": "BossHallPage",
  "concours": "ContestsPage",
  "casino": "CasinoPage",
  "gazette": "GazettePage",
  "succes": "AchievementsPage",
  "alliance": "AlliancePage",
  "guerre-territoire": "TerritoryWarPage",
  "profil": "ProfilePage",
  "reglages": "SettingsPage",
  "admin": "AdminPage",
  "journal": "JournalPage",
  "messages": "MessagesPage",
  "nouveautes": "ChangelogPage",
  "annonces": "AnnouncementsPage",
  "codex": "CodexPage",
  "chroniques": "ChroniclesPage",
  "formules": "FormulasPage",
  "signalements": "ReportsPage",
};

/** Page du jeu d'une adresse (`/game/galaxie` → `GalaxyPage`), ou `undefined` hors du jeu. */
export function gameRoutePage(pathname: string): string | undefined {
  const m = /^\/game(?:\/([^/?#]*))?/.exec(pathname);
  return m ? GAME_ROUTE_PAGES[m[1] ?? ""] : undefined;
}
