import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { checkIsAdmin } from "@/services/adminService";
import { ContentEditor } from "@/pages/admin/ContentEditor";
import { BuildingForm, MissionForm, newBuilding, newMission, newTech, newUnit, TechForm, UnitForm } from "@/pages/admin/forms";
import { PlayersPanel, RulesPanel, ToolsPanel } from "@/pages/admin/panels";
import { FactionForm, newFaction } from "@/pages/admin/FactionForm";
import { newRank, RankForm } from "@/pages/admin/RankForm";
import { AchievementForm, newAchievement } from "@/pages/admin/AchievementForm";
import { StatsPanel } from "@/pages/admin/StatsPanel";
import { LogsPanel } from "@/pages/admin/LogsPanel";

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
  const tab = params.get("onglet") ?? "buildings";

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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Administration"
        title="Administration"
        description="Contenu du jeu, règles, joueurs. Chaque enregistrement s'applique immédiatement à tous les joueurs."
      />
      <Tabs value={tab} onValueChange={(v) => setParams({ onglet: v }, { replace: true })}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="buildings">Bâtiments</TabsTrigger>
          <TabsTrigger value="units">Unités</TabsTrigger>
          <TabsTrigger value="technologies">Technologies</TabsTrigger>
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="factions">Factions</TabsTrigger>
          <TabsTrigger value="ranks">Rangs</TabsTrigger>
          <TabsTrigger value="achievements">Succès</TabsTrigger>
          <TabsTrigger value="rules">Règles</TabsTrigger>
          <TabsTrigger value="players">Joueurs</TabsTrigger>
          <TabsTrigger value="logs">Journal</TabsTrigger>
          <TabsTrigger value="tools">Outils</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <LogsPanel />
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <StatsPanel />
        </TabsContent>
        <TabsContent value="buildings" className="mt-4">
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
        <TabsContent value="units" className="mt-4">
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
        <TabsContent value="technologies" className="mt-4">
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
        <TabsContent value="missions" className="mt-4">
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
        <TabsContent value="factions" className="mt-4">
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
        <TabsContent value="ranks" className="mt-4">
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
        <TabsContent value="achievements" className="mt-4">
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
        <TabsContent value="rules" className="mt-4">
          <RulesPanel />
        </TabsContent>
        <TabsContent value="players" className="mt-4">
          <PlayersPanel />
        </TabsContent>
        <TabsContent value="tools" className="mt-4">
          <ToolsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
