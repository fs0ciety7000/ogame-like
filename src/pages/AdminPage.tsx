import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import {
  Award,
  BarChart3,
  Calculator,
  Coins,
  Building2,
  Compass,
  Construction,
  FlaskConical,
  Medal,
  Gem,
  Rocket,
  Scale,
  Sparkles,
  ScrollText,
  ShieldAlert,
  Bug,
  ShieldCheck,
  Skull,
  Users,
  Wrench,
  type LucideIcon,
  Megaphone,
  CalendarRange,
  Bell,
  Smile,
  Mail,
  Crown,
  Ticket,
  BookOpen,
  ExternalLink,
  PenSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { checkIsAdmin } from "@/services/adminService";
import { ContentEditor } from "@/pages/admin/ContentEditor";
import { BalancePanel } from "@/pages/admin/BalancePanel";
import { ProceduralPanel } from "@/pages/admin/ProceduralPanel";
import { ServerPotPanel } from "@/pages/admin/ServerPotPanel";
import { ContestsAdmin } from "@/pages/admin/ContestsAdmin";
import { CasinoAdmin } from "@/pages/admin/CasinoAdmin";
import { PlannerPanel } from "@/pages/admin/PlannerPanel";
import { BroadcastPanel } from "@/pages/admin/BroadcastPanel";
import { newTitle, TitleForm, titleListLabel } from "@/pages/admin/TitleForm";
import { BuildingForm, MissionForm, newBuilding, newMission, newTech, newUnit, TechForm, UnitForm } from "@/pages/admin/forms";
import { PlayersPanel, RulesPanel, ToolsPanel } from "@/pages/admin/panels";
import { FactionForm, newFaction } from "@/pages/admin/FactionForm";
import { newRank, RankForm } from "@/pages/admin/RankForm";
import { newRelic, RelicForm, RelicSettingsCard, relicListLabel } from "@/pages/admin/RelicForm";
import { AchievementForm, newAchievement } from "@/pages/admin/AchievementForm";
import { StatsPanel } from "@/pages/admin/StatsPanel";
import { WarlordsPanel } from "@/pages/admin/WarlordsPanel";
import { PassPanel } from "@/pages/admin/PassPanel";
import { PassSeasonsPanel } from "@/pages/admin/PassSeasonsPanel";
import { ChroniclesPanel } from "@/pages/admin/ChroniclesPanel";
import { AnnouncementsPanel } from "@/pages/admin/AnnouncementsPanel";
import { SimulatorPage } from "@/pages/SimulatorPage";
import { LogsPanel } from "@/pages/admin/LogsPanel";
import { MaintenancePanel } from "@/pages/admin/MaintenancePanel";
import { BannersPanel } from "@/pages/admin/BannersPanel";
import { EmojisPanel } from "@/pages/admin/EmojisPanel";
import { MailPanel } from "@/pages/admin/MailPanel";
import { AdminsPanel } from "@/pages/admin/AdminsPanel";
import { ReportsPanel } from "@/pages/admin/ReportsPanel";
import { useReportBadges } from "@/services/reportService";
import { AdminStatusStrip } from "@/pages/admin/AdminStatusStrip";
import { useMaintenance } from "@/services/maintenanceService";
import { useContentStore } from "@/services/contentService";
import type { ContentSection } from "@/game/content";
import { cn } from "@/lib/utils";

/** `to` : lien vers une autre page du jeu plutôt qu'un onglet. */
type NavEntry = { id: string; label: string; icon: LucideIcon; hint: string; to?: string };

const NAV: { label: string; items: NavEntry[] }[] = [
  {
    label: "Pilotage",
    items: [
      { id: "stats", label: "Statistiques", icon: BarChart3, hint: "Activité, progression et pistes d'équilibrage." },
      { id: "balance", label: "Équilibrage", icon: Scale, hint: "Diagnostic du contenu et des joueurs réels, propositions chiffrées et bac à sable d'unité." },
      { id: "maintenance", label: "Maintenance", icon: Construction, hint: "Fermer le jeu aux joueurs le temps d'une mise à jour." },
      { id: "planner", label: "Planificateur", icon: CalendarRange, hint: "Calendrier des boss, week-ends, Chroniques, concours et fin de saison ; dates précises déplaçables." },
      { id: "banners", label: "Annonces", icon: Megaphone, hint: "Bandeaux en haut du site et annonces plein écran : création et programmation." },
      { id: "simulator", label: "Simulateur", icon: Calculator, hint: "Bac à sable de combat pour vérifier l'équilibrage." },
      { id: "logs", label: "Journal", icon: ScrollText, hint: "Toutes les modifications faites par les administrateurs." },
    ],
  },
  {
    label: "Contenu",
    items: [
      { id: "buildings", label: "Bâtiments", icon: Building2, hint: "Coûts, production, paliers et déblocages." },
      { id: "units", label: "Unités", icon: Rocket, hint: "Statistiques, coûts et temps de construction." },
      { id: "technologies", label: "Technologies", icon: FlaskConical, hint: "Arbre du Labo : effets et prérequis." },
      { id: "missions", label: "Missions", icon: Compass, hint: "Durées, prérequis et récompenses." },
      { id: "factions", label: "Factions", icon: Skull, hint: "Déclencheurs, tributs, raids et repaires." },
      { id: "warlords", label: "Seigneurs", icon: Crown, hint: "Seigneurs de guerre : puissance, fréquence d'attaque, fiches et répliques." },
      { id: "seasonPass", label: "Passe", icon: Ticket, hint: "Paliers du passe de saison et points par action." },
      { id: "chronicles", label: "Chroniques", icon: BookOpen, hint: "Arcs mensuels : épisodes, objectifs, boss de saison et teinte du mois." },
      { id: "procedural", label: "Générateur", icon: Sparkles, hint: "Chapitres écrits automatiquement selon l'activité des joueurs : scénario, récompenses, titres, bannières, Codex, passe et succès." },
      { id: "ranks", label: "Rangs", icon: Medal, hint: "Seuils d'XP et emblèmes." },
      { id: "relics", label: "Reliques", icon: Gem, hint: "Reliques : effets, images, raretés, tirage, fusion et recyclage." },
      { id: "achievements", label: "Succès", icon: Award, hint: "Conditions, paliers et récompenses." },
      { id: "titles", label: "Titres", icon: Crown, hint: "Catalogue des titres : libellé, rareté, icône, déblocage automatique ; décernés aussi par les succès." },
      { id: "rules", label: "Règles", icon: Scale, hint: "Combat, protections et économie." },
    ],
  },
  {
    label: "Communauté",
    items: [
      { id: "players", label: "Joueurs", icon: Users, hint: "Profils, ressources, niveaux et files." },
      { id: "serverpot", label: "Pot commun", icon: Coins, hint: "Taxes du marché et des cadeaux mises en commun : Casino orbital (ouverture, gains, jetons), concours, solde et mouvements." },
      { id: "broadcast", label: "Messages ciblés", icon: Bell, hint: "Notification dans le jeu pour un groupe de joueurs : inactifs, nouveaux, une alliance…" },
      { id: "mail", label: "E-mails", icon: Mail, hint: "Campagnes e-mail : aperçu, test et envoi à tous les joueurs." },
      { id: "emojis", label: "Emojis", icon: Smile, hint: "Emojis personnalisés des discussions : image et :code:." },
      { id: "reports", label: "Signalements", icon: Bug, hint: "Problèmes signalés par les joueurs : tri, réponses, résolution." },
      { id: "devblog", label: "Devblog", icon: PenSquare, hint: "Espace rédaction du devblog : articles, brouillons et auteurs.", to: "/game/redaction" },
      { id: "admins", label: "Administrateurs", icon: ShieldCheck, hint: "Qui a accès à cette console." },
    ],
  },
  { label: "Système", items: [{ id: "tools", label: "Outils", icon: Wrench, hint: "Sauvegardes, hooks, ultimatums et remise à zéro." }] },
];

/** Administration du jeu : contenu (bâtiments, unités, technos, missions),
 *  règles de combat, joueurs et outils. Réservée aux comptes listés dans
 *  la collection PocketBase `admins` (les règles d'accès le garantissent
 *  côté serveur ; cette page ne fait que masquer l'interface). */
export function AdminPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  // Onglet dans l'URL : il survit au rechargement de l'écran qui suit
  // chaque enregistrement de contenu (voir AppShell).
  const [params, setParams] = useSearchParams();
  const tab = params.get("onglet") ?? "stats";
  const maintenance = useMaintenance();
  const customized = useContentStore((s) => s.customized);
  const pendingReports = useReportBadges((s) => s.pendingNew);

  useEffect(() => {
    if (uid) void checkIsAdmin(uid).then(setAllowed);
  }, [uid]);

  if (allowed === null) return null;
  if (!allowed) {
    return (
      <Card className="mx-auto mt-10 flex max-w-md flex-col items-center gap-2 p-6 text-center">
        <ShieldAlert className="h-8 w-8 text-danger-glow" />
        <p className="text-sm text-slate-200">Accès réservé aux administrateurs du jeu.</p>
      </Card>
    );
  }

  const active = NAV.flatMap((g) => g.items).find((i) => i.id === tab);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Administration"
        title="Console d'administration"
        description="Contenu du jeu, règles, joueurs et maintenance. Chaque enregistrement s'applique immédiatement à tous les joueurs."
      />
      <AdminStatusStrip onOpen={(id) => setParams({ onglet: id }, { replace: true })} />
      <Tabs value={tab} orientation="vertical" onValueChange={(v) => setParams({ onglet: v }, { replace: true })} className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        <TabsPrimitive.List aria-label="Sections de l'administration" className="hud-cut-sm -mx-1 flex gap-1 overflow-x-auto border border-cyan-glow/10 bg-space-950/60 p-1.5 lg:sticky lg:top-0 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:p-2">
          {NAV.map((group) => (
            <div key={group.label} className="contents lg:block">
              <p className="hud-eyebrow hidden px-2 pb-1 pt-2 text-[9px] text-slate-600 first:pt-0 lg:block">{group.label}</p>
              {group.items.map((item) =>
                item.to ? (
                  <Link
                    key={item.id}
                    to={item.to}
                    title={item.hint}
                    className="group relative flex shrink-0 items-center gap-2.5 px-2.5 py-2 text-left font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200 lg:w-full"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                    <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                  </Link>
                ) : (
                <TabsPrimitive.Trigger
                  key={item.id}
                  value={item.id}
                  className={cn(
                    "group relative flex shrink-0 items-center gap-2.5 px-2.5 py-2 text-left font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400 transition-colors lg:w-full",
                    "hover:bg-white/[0.04] hover:text-slate-200",
                    "data-[state=active]:bg-cyan-glow/[0.1] data-[state=active]:text-cyan-glow",
                  )}
                >
                  <span aria-hidden className="absolute inset-y-1 left-0 hidden w-0.5 bg-cyan-glow shadow-[0_0_8px_var(--color-cyan-glow)] group-data-[state=active]:block" />
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.id === "reports" && pendingReports > 0 && (
                    <span className="ml-auto bg-danger-glow px-1 font-mono text-[9px] font-bold text-space-950">{pendingReports}</span>
                  )}
                  {item.id === "maintenance" && maintenance.enabled && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-gold-glow shadow-[0_0_6px_var(--color-gold-glow)]" />}
                  {customized.includes(item.id as ContentSection) && (
                    <span title="Personnalisé (différent du code)" className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-glow" />
                  )}
                </TabsPrimitive.Trigger>
                ),
              )}
            </div>
          ))}
        </TabsPrimitive.List>

        <div className="min-w-0">
          {active && (
            <div className="mb-3 flex items-baseline gap-3 border-b border-white/5 pb-2">
              <active.icon className="h-4 w-4 self-center text-cyan-glow" />
              <h2 className="hud-title text-lg text-white">{active.label}</h2>
              <p className="truncate text-xs text-slate-500">{active.hint}</p>
            </div>
          )}
        <TabsContent value="reports">
          <ReportsPanel />
        </TabsContent>
        <TabsContent value="admins">
          <AdminsPanel />
        </TabsContent>
        <TabsContent value="broadcast">
          <BroadcastPanel />
        </TabsContent>
        <TabsContent value="mail">
          <MailPanel />
        </TabsContent>
        <TabsContent value="emojis">
          <EmojisPanel />
        </TabsContent>
        <TabsContent value="banners">
          <div className="flex flex-col gap-6">
            <BannersPanel />
            <AnnouncementsPanel />
          </div>
        </TabsContent>
        <TabsContent value="maintenance">
          <MaintenancePanel />
        </TabsContent>
        <TabsContent value="simulator">
          <SimulatorPage />
        </TabsContent>
        <TabsContent value="logs">
          <LogsPanel />
        </TabsContent>
        <TabsContent value="stats">
          <StatsPanel />
        </TabsContent>
        <TabsContent value="balance">
          <BalancePanel />
        </TabsContent>
        <TabsContent value="buildings">
          <ContentEditor
            section="buildings"
            title="Bâtiments"
            getId={(b) => b.id}
            getLabel={(b) => b.name}
            setId={(b, id) => ({ ...b, id })}
            createItem={newBuilding}
            renderForm={(b, onChange, isNew) => <BuildingForm value={b} onChange={onChange} isNew={isNew} />}
          />
        </TabsContent>
        <TabsContent value="units">
          <ContentEditor
            section="units"
            title="Unités"
            getId={(u) => u.id}
            getLabel={(u) => u.name}
            setId={(u, id) => ({ ...u, id })}
            createItem={newUnit}
            renderForm={(u, onChange, isNew) => <UnitForm value={u} onChange={onChange} isNew={isNew} />}
          />
        </TabsContent>
        <TabsContent value="technologies">
          <ContentEditor
            section="technologies"
            title="Technologies"
            getId={(t) => t.id}
            getLabel={(t) => t.nom}
            setId={(t, id) => ({ ...t, id })}
            createItem={newTech}
            renderForm={(t, onChange, isNew) => <TechForm value={t} onChange={onChange} isNew={isNew} />}
          />
        </TabsContent>
        <TabsContent value="missions">
          <ContentEditor
            section="missions"
            title="Missions"
            getId={(m) => m.key}
            getLabel={(m) => m.name}
            setId={(m, key) => ({ ...m, key })}
            createItem={newMission}
            renderForm={(m, onChange, isNew) => <MissionForm value={m} onChange={onChange} isNew={isNew} />}
          />
        </TabsContent>
        <TabsContent value="factions">
          <ContentEditor
            section="factions"
            title="Factions"
            getId={(f) => f.id}
            getLabel={(f) => (f.enabled ? f.name : `${f.name} (inactive)`)}
            setId={(f, id) => ({ ...f, id })}
            createItem={newFaction}
            renderForm={(f, onChange, isNew) => <FactionForm value={f} onChange={onChange} isNew={isNew} />}
          />
        </TabsContent>
        <TabsContent value="seasonPass" className="flex flex-col gap-4">
          <PassSeasonsPanel />
          <PassPanel />
        </TabsContent>
        <TabsContent value="chronicles">
          <ChroniclesPanel />
        </TabsContent>
        <TabsContent value="procedural">
          <ProceduralPanel />
        </TabsContent>
        <TabsContent value="planner">
          <PlannerPanel />
        </TabsContent>
        <TabsContent value="serverpot" className="flex flex-col gap-4">
          <CasinoAdmin />
          <ContestsAdmin />
          <ServerPotPanel />
        </TabsContent>
        <TabsContent value="warlords">
          <WarlordsPanel />
        </TabsContent>
        <TabsContent value="ranks">
          <ContentEditor
            section="ranks"
            title="Rangs"
            getId={(r) => r.id}
            getLabel={(r) => `${r.name} · ${r.xp.toLocaleString("fr-FR")} XP`}
            setId={(r, id) => ({ ...r, id })}
            createItem={newRank}
            renderForm={(r, onChange, isNew) => <RankForm value={r} onChange={onChange} isNew={isNew} />}
          />
        </TabsContent>
        <TabsContent value="relics">
          <div className="flex flex-col gap-4">
            <ContentEditor
              section="relics"
              title="Reliques"
              getId={(t) => t.id}
              getLabel={relicListLabel}
              setId={(t, id) => ({ ...t, id, image: t.image })}
              createItem={newRelic}
              renderForm={(t, onChange, isNew) => <RelicForm value={t} onChange={onChange} isNew={isNew} />}
            />
            <RelicSettingsCard />
          </div>
        </TabsContent>
        <TabsContent value="achievements">
          <ContentEditor
            section="achievements"
            title="Succès"
            getId={(a) => a.id}
            getLabel={(a) => `${a.emoji} ${a.name}${a.enabled ? "" : " (inactif)"}`}
            setId={(a, id) => ({ ...a, id })}
            createItem={newAchievement}
            renderForm={(a, onChange, isNew) => <AchievementForm value={a} onChange={onChange} isNew={isNew} />}
          />
        </TabsContent>
        <TabsContent value="titles">
          <ContentEditor
            section="titles"
            title="Titres"
            getId={(t) => t.id}
            getLabel={titleListLabel}
            setId={(t, id) => ({ ...t, id })}
            createItem={newTitle}
            renderForm={(t, onChange, isNew) => <TitleForm value={t} onChange={onChange} isNew={isNew} />}
          />
        </TabsContent>
        <TabsContent value="rules">
          <RulesPanel />
        </TabsContent>
        <TabsContent value="players">
          <PlayersPanel />
        </TabsContent>
        <TabsContent value="tools">
          <ToolsPanel />
        </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
