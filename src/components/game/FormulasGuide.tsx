import { useMemo, useState, type ReactNode } from "react";
import { Calculator, Coins, Crosshair, Factory, Gauge, Shield, Skull, Sparkles, Swords, Ticket, Warehouse, Zap } from "lucide-react";
import { useContentStore } from "@/services/contentService";
import { BUILDINGS, effectiveBuildingLevel, getStorageCapacity, getUnitCapacity } from "@/game/buildings";
import { COMBAT_RULES, computeFullPower, getShieldPercent, homeDefensePower, resolveCombat } from "@/game/combat";
import { allianceShieldBonus } from "@/game/alliances";
import { ASCENSION_RULES } from "@/game/ascension";
import { COMMON_RESOURCES, ECONOMY_RULES, economySnapshot, getFleetUpkeep, KESH_BOOST_PCT, productionBonuses, protectedAmount, storageCapacityOf } from "@/game/economy";
import { playerModifiers } from "@/game/modifiers";
import { FACTIONS, pirateState, raidPower } from "@/game/pirates";
import { computeCombatXp, PVP_RULES } from "@/game/pvp";
import { DEBRIS_RULES } from "@/game/debris";
import { RESOURCE_LIST } from "@/game/resources";
import { activePass, PASS_POINTS } from "@/game/seasonPass";
import { currentSeasonId } from "@/game/seasons";
import { UNITS, UNIT_BASE_STATS, OFFENSIVE_UNITS } from "@/game/units";
import { WARLORD_RULES } from "@/game/warlords";
import { BASE_COUNTS } from "@/game/procedural";
import { OBJECTIVE_LABELS } from "@/game/chronicles";
import type { PlayerState, ResourceId } from "@/types/game";
import { cn, formatCompact } from "@/lib/utils";

/* =====================================================
   v5.4 : les formules du jeu, expliquées. Les valeurs viennent du contenu
   en vigueur (code + réglages de l'administration) : la page ne peut pas
   se tromper de chiffre. Avec un joueur connecté, chaque section montre
   « ton calcul » ; sinon, un exemple.
===================================================== */

const pct = (x: number, digits = 0) => `${(x * 100).toLocaleString("fr-FR", { maximumFractionDigits: digits })} %`;
const n = (x: number) => (Number.isFinite(x) ? formatCompact(Math.round(x)) : "∞");
const PASS_LABELS: Record<string, string> = {
  contract: "Contrat du jour récupéré",
  bounty: "Prime Kesh'Vaar remplie",
  raidRepelled: "Raid de faction repoussé",
  victory: "Combat gagné",
  bossAssault: "Assaut sur un boss",
  dailyLogin: "Connexion du jour",
  mission: "Mission terminée",
  vendetta: "Vendetta gagnée contre un seigneur",
  chronicle: "Épisode des Chroniques terminé",
  seasonBoss: "Participation au boss de saison",
  allianceBoss: "Boss d'alliance abattu (5 % des dégâts)",
  allianceBossTry: "Participation au boss d'alliance",
  coalition: "Coalition gagnée contre un seigneur",
  allianceDaily: "Objectif du jour d'alliance",
};
const resName = (id: string) => RESOURCE_LIST.find((r) => r.id === id)?.name ?? id;

export const FORMULA_SECTIONS = [
  { id: "production", label: "Production", icon: Factory },
  { id: "stockage", label: "Stockage", icon: Warehouse },
  { id: "energie", label: "Énergie et entretien", icon: Zap },
  { id: "puissance", label: "Attaque et défense", icon: Swords },
  { id: "combat", label: "Combat", icon: Crosshair },
  { id: "protections", label: "Protections", icon: Shield },
  { id: "menaces", label: "Raids et seigneurs", icon: Skull },
  { id: "gains", label: "Missions et gains", icon: Coins },
  { id: "bonus", label: "Bonus", icon: Sparkles },
  { id: "passe", label: "Passe et Chroniques", icon: Ticket },
] as const;

function Formula({ children }: { children: ReactNode }) {
  return <pre className="overflow-x-auto whitespace-pre-wrap border-l-2 border-cyan-glow/60 bg-space-950/70 px-3 py-2 font-mono text-[12px] leading-relaxed text-cyan-100">{children}</pre>;
}

function Mine({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="border border-mint-glow/25 bg-mint-glow/[0.04] p-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-mint-glow">
        <Gauge className="h-3.5 w-3.5" /> {title ?? "Ton calcul"}
      </p>
      <div className="flex flex-col gap-1 text-sm text-slate-200">{children}</div>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-white">{value}</span>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </p>
  );
}

function Block({ id, title, icon: Icon, intro, children }: { id: string; title: string; icon: typeof Factory; intro: string; children: ReactNode }) {
  return (
    <section id={`f-${id}`} className="scroll-mt-24 border border-white/10 bg-space-900/40 p-4 sm:p-5">
      <h2 className="hud-title mb-1 flex items-center gap-2 text-lg text-white">
        <Icon className="h-5 w-5 text-cyan-glow" /> {title}
      </h2>
      <p className="mb-3 text-sm text-slate-300">{intro}</p>
      <div className="flex flex-col gap-3 text-sm text-slate-300">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead className="text-slate-500">
          <tr>
            {head.map((h) => (
              <th key={h} className="py-1 pr-3 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/5">
              {r.map((c, k) => (
                <td key={k} className={cn("py-1 pr-3", k > 0 && "font-mono text-slate-200")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Calculette de combat : deux puissances, un bouclier → issue, pertes, XP. */
function CombatCalculator({ attack, defense, shield }: { attack: number; defense: number; shield: number }) {
  const [a, setA] = useState(Math.round(attack) || 10_000);
  const [d, setD] = useState(Math.round(defense) || 8_000);
  const [s, setS] = useState(Math.round(shield * 100));
  const out = useMemo(() => {
    const r = resolveCombat({
      attackerUnits: {},
      attackerTechLevels: {},
      attackerRepairPct: 0,
      fleet: {},
      defenderUnits: {},
      defenderTechLevels: {},
      defenderRepairPct: 0,
      defenderResources: {},
      defenderShieldPct: s / 100,
      attackerPowerOverride: a,
      defenderPowerOverride: d,
    });
    return { r, xp: computeCombatXp(r.outcome, r.attackerPower, r.defenderPower) };
  }, [a, d, s]);
  const input = (label: string, value: number, set: (v: number) => void, max?: number) => (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      {label}
      <input type="number" min={0} max={max} value={value} onChange={(e) => set(Math.max(0, Number(e.target.value) || 0))} className="w-full border border-white/15 bg-space-950 px-2 py-1 font-mono text-sm text-white" />
    </label>
  );
  const outcome = out.r.outcome === "attacker_win" ? "L'attaquant gagne" : out.r.outcome === "defender_win" ? "Le défenseur tient" : "Égalité";
  return (
    <div className="border border-gold-glow/30 bg-gold-glow/[0.04] p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gold-glow">
        <Calculator className="h-3.5 w-3.5" /> Calculette
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {input("Attaque de la flotte envoyée", a, setA)}
        {input("Défense de la base (bonus compris)", d, setD)}
        {input("Bouclier du défenseur (%)", s, (v) => setS(Math.min(95, v)), 95)}
      </div>
      <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
        <Row label="Attaque après bouclier" value={n(out.r.attackerPower)} />
        <Row label="Issue" value={outcome} />
        <Row label="Pertes de l'attaquant" value={pct(out.r.attackerLossPercent, 1)} />
        <Row label="Pertes du défenseur" value={pct(out.r.defenderLossPercent, 1)} hint={`dont ${pct(COMBAT_RULES.defenseRebuildPct)} des défenses reconstruites`} />
        <Row label="XP attaquant / défenseur" value={`${out.xp.attackerXp >= 0 ? "+" : ""}${out.xp.attackerXp} / ${out.xp.defenderXp >= 0 ? "+" : ""}${out.xp.defenderXp}`} />
      </div>
    </div>
  );
}

export function FormulasGuide({ player }: { player: PlayerState | null }) {
  // Se recalcule quand l'administration change le contenu.
  useContentStore((s) => s.version);
  const now = Date.now();
  const p = player;
  const mods = playerModifiers(p);
  const eco = p ? economySnapshot(p, now) : null;
  const units = p?.units ?? {};
  const tech = p?.techLevels ?? {};
  const attack = p ? computeFullPower(units, tech, OFFENSIVE_UNITS, ["attack"]) : 0;
  const defense = p ? homeDefensePower(units, tech) : 0;
  const shield = p ? getShieldPercent(p.buildings, allianceShieldBonus(p.allianceResearch)) : 0;
  const pass = activePass(currentSeasonId(now));
  const buildingLevels = p ? BUILDINGS.reduce((a, b) => a + effectiveBuildingLevel(p.buildings, b.id), 0) : 0;
  const unitRows = UNITS.filter((u) => UNIT_BASE_STATS[u.id]).map((u) => {
    const s = UNIT_BASE_STATS[u.id];
    return [
      u.name,
      u.category === "defense" ? "Défense" : "Flotte",
      s.attack,
      s.defense,
      `+${s.perLevel}`,
      u.hangarSpace,
      n(u.hangarSpace * (u.category === "attack" ? ECONOMY_RULES.upkeepPerPlaceAttack : ECONOMY_RULES.upkeepPerPlaceDefense) * 3600),
    ];
  });

  return (
    <div className="flex flex-col gap-4">
      <nav className="sticky top-0 z-10 -mx-1 flex gap-1 overflow-x-auto border-b border-white/10 bg-space-950/90 px-1 py-2 backdrop-blur">
        {FORMULA_SECTIONS.map((s) => (
          <a key={s.id} href={`#f-${s.id}`} className="flex shrink-0 items-center gap-1 border border-white/10 px-2 py-1 text-xs text-slate-300 hover:border-cyan-glow/60 hover:text-white">
            <s.icon className="h-3.5 w-3.5" /> {s.label}
          </a>
        ))}
      </nav>

      <Block id="production" title="Production" icon={Factory} intro="Chaque extracteur produit en continu, même hors ligne. Le serveur et ton écran font exactement le même calcul.">
        <Formula>
          {`production / s = table du bâtiment (niveau)
               × (1 + technologies)
               × recherche d'alliance × (1 + ${pct(ASCENSION_RULES.productionPerAscension)} par ascension)
               × (1 + Intendant + reliques + talents + secteurs d'alliance)
               × événement en cours × Gelée de la Reine (+${pct(KESH_BOOST_PCT)})
panne d'énergie (stock à 0 et bilan négatif) : × ${ECONOMY_RULES.outageProductionFactor}`}
        </Formula>
        <p>Les bonus s'additionnent dans chaque parenthèse, puis les parenthèses se multiplient. Le niveau d'un bâtiment verrouillé compte pour 0.</p>
        {p && eco && (
          <Mine>
            {COMMON_RESOURCES.map((res) => {
              const bonuses = productionBonuses(p, now, res as ResourceId);
              return (
                <Row
                  key={res}
                  label={resName(res)}
                  value={`${n((eco.gross[res as ResourceId] ?? 0) * 3600)} / h`}
                  hint={bonuses.length ? bonuses.map((b) => `${b.label} +${pct(b.pct, 1)}`).join(" · ") : "aucun bonus actif"}
                />
              );
            })}
            {eco.outage && <p className="text-danger-glow">Panne d'énergie en cours : production divisée par deux.</p>}
          </Mine>
        )}
      </Block>

      <Block id="stockage" title="Stockage et bunker" icon={Warehouse} intro="L'entrepôt plafonne les ressources communes. Au-delà, la production s'arrête (ce qui dépasse déjà est gardé). Une partie du stock est à l'abri du pillage.">
        <Formula>
          {`capacité = Σ base × croissance^niveau (entrepôts) × (1 + technologies) × (1 + 2 % par niveau d'Intendant)
à l'abri = capacité × (${pct(ECONOMY_RULES.protectedStoragePct)} + technologies + Bastion d'alliance), au plus 75 % (+ Bastion)`}
        </Formula>
        {p && (
          <Mine>
            <Row label="Capacité par ressource" value={n(storageCapacityOf(p))} hint={Number.isFinite(getStorageCapacity(p.buildings, tech)) ? undefined : "pas encore d'entrepôt : illimité"} />
            <Row label="À l'abri du pillage" value={n(protectedAmount(p.buildings, "scrap", tech, p.allianceResearch))} hint="par ressource commune" />
            {eco && eco.full.length > 0 && <p className="text-gold-glow">Plein : {eco.full.map(resName).join(", ")}.</p>}
          </Mine>
        )}
      </Block>

      <Block id="energie" title="Énergie et entretien" icon={Zap} intro="Chaque place de hangar occupée consomme de l'énergie en continu. Si le stock d'énergie tombe à zéro alors que le bilan est négatif, c'est la panne.">
        <Formula>
          {`entretien / s = Σ unités × places × (${ECONOMY_RULES.upkeepPerPlaceAttack} flotte | ${ECONOMY_RULES.upkeepPerPlaceDefense} défense) × (1 − technologies)
bilan d'énergie = production d'énergie − entretien
après une ascension : entretien offert pendant ${ASCENSION_RULES.upkeepFreeDays} jours`}
        </Formula>
        {p && eco && (
          <Mine>
            <Row label="Entretien" value={`${n(getFleetUpkeep(units, tech) * 3600)} / h`} />
            <Row label="Production d'énergie" value={`${n((eco.gross.energy ?? 0) * 3600)} / h`} />
            <Row label="Bilan" value={`${n(((eco.gross.energy ?? 0) - eco.upkeep) * 3600)} / h`} hint={(eco.gross.energy ?? 0) - eco.upkeep < 0 ? "négatif : le stock baisse" : undefined} />
          </Mine>
        )}
      </Block>

      <Block id="puissance" title="Attaque et défense" icon={Swords} intro="La puissance d'une unité grandit avec son niveau et tes technologies ; celle d'une armée est la somme de ses unités.">
        <Formula>
          {`stat d'une unité = (base + (niveau − 1) × gain par niveau) × (1 + technologies)
attaque d'une flotte = Σ ATK × nombre
défense de la base = (Σ (ATK + DEF) des défenses + Σ (ATK + DEF) des vaisseaux à quai × ${pct(COMBAT_RULES.homeFleetDefenseFactor)})
                     × (1 + ${pct(COMBAT_RULES.homeDefenseBonus)} à domicile) × (1 + bonus de défense)
garnisons alliées : (ATK + DEF) × 50 % en plus`}
        </Formula>
        <Table head={["Unité", "Type", "ATK", "DEF", "Par niveau", "Places", "Entretien / h"]} rows={unitRows} />
        {p && (
          <Mine>
            <Row label="Attaque de toute ta flotte" value={n(attack * (1 + mods.attack))} hint={mods.attack ? `bonus d'attaque +${pct(mods.attack, 1)} compris` : undefined} />
            <Row label="Défense de ta base" value={n(defense * (1 + mods.defense))} hint={mods.defense ? `bonus de défense +${pct(mods.defense, 1)} compris` : undefined} />
            <Row label="Bouclier" value={pct(shield, 1)} hint={`${pct(COMBAT_RULES.shieldPerLevel, 2)} par niveau de hangar de défense, plafond ${pct(COMBAT_RULES.shieldMax)} + générateur`} />
            <Row label="Places de hangar" value={`${n(getUnitCapacity(p.buildings, "attack", tech))} flotte · ${n(getUnitCapacity(p.buildings, "defense", tech))} défense`} />
          </Mine>
        )}
      </Block>

      <Block id="combat" title="Combat" icon={Crosshair} intro="Un seul échange : la puissance la plus forte gagne. L'écart entre les deux décide des pertes.">
        <Formula>
          {`attaque engagée = attaque de la flotte × formation × (1 + bonus d'attaque) × (1 − bouclier adverse)
écart = |attaque − défense| ÷ (attaque + défense)
pertes du vainqueur = 30 % × (1 − écart), entre 5 % et 30 %
pertes du vaincu    = 30 % + 40 % × écart, entre 30 % et 70 %
plafond : un camp ne détruit pas plus que sa propre puissance
défenses détruites : ${pct(COMBAT_RULES.defenseRebuildPct)} reconstruites gratuitement · vaisseaux : Atelier de réparation`}
        </Formula>
        <Formula>
          {`butin (si l'attaquant gagne) = ${pct(COMBAT_RULES.lootPercentCommon)} des ressources communes + ${pct(COMBAT_RULES.lootPercent)} des rares, hors bunker
limité par la cale : Σ cargaison × niveau × nombre des survivants × (1 + technologies)
débris : ${pct(DEBRIS_RULES.percent)} du coût (ferraille, énergie) des vaisseaux détruits, ${DEBRIS_RULES.lifetimeHours} h
XP : vainqueur +40 × rapport de force (×0,1 à ×2) · attaquant battu −20 · défenseur qui tient +20 à +60`}
        </Formula>
        <p>
          Formations : assaut attaque +{pct(COMBAT_RULES.assaultAttack)} et pertes +{pct(COMBAT_RULES.assaultLosses)} ; prudente attaque {pct(COMBAT_RULES.cautiousAttack)} et pertes {pct(COMBAT_RULES.cautiousLosses)} ; raid attaque {pct(COMBAT_RULES.raidAttack)} et cale +{pct(COMBAT_RULES.raidCargo)}. Postures : bunker défenses +{pct(COMBAT_RULES.bunkerDefense)} (vaisseaux à l'abri), riposte vaisseaux engagés à {pct(COMBAT_RULES.riposteHomeFleet)}.
        </p>
        <CombatCalculator attack={attack * (1 + mods.attack)} defense={defense * (1 + mods.defense)} shield={shield} />
      </Block>

      <Block id="protections" title="Protections" icon={Shield} intro="Des garde-fous empêchent d'écraser un joueur sans défense.">
        <Table
          head={["Règle", "Valeur"]}
          rows={[
            ["Délai entre deux attaques sur la même cible", `${PVP_RULES.attackCooldownMs / 3_600_000} h`],
            ["Bouclier après une défaite en défense", `${PVP_RULES.shieldAfterDefeatMs / 3_600_000} h`],
            ["Protection débutant (levée si tu attaques)", `${PVP_RULES.newbieProtectionMs / 3_600_000} h`],
            ["Bouclier après une ascension", `${PVP_RULES.ascensionShieldMs / 3_600_000} h`],
            ["Écart d'XP maximal avec la cible", `×${PVP_RULES.maxXpRatio} (dès ${PVP_RULES.xpGapFloor} XP)`],
            ["XP perdue en défense, au plus", `${PVP_RULES.defenseXpLossCapPer24h} par 24 h`],
          ]}
        />
      </Block>

      <Block id="menaces" title="Raids et seigneurs de guerre" icon={Skull} intro="Les menaces se règlent sur ta propre force : elles restent à ta portée sans jamais devenir triviales.">
        <Formula>
          {`raid de faction = max(plancher + par niveau × niveaux de bâtiments,
                      cible × (part de base + part par notoriété × notoriété))
cible : ta défense (base) ou ta flotte à quai (selon la faction)
seigneur de guerre : attaque avec ${pct(WARLORD_RULES.attackPowerMin)} à ${pct(WARLORD_RULES.attackPowerMax)} de ta défense`}
        </Formula>
        <Table
          head={p ? ["Faction", "Cible", "Base", "+ / notoriété", "Raid sur toi (notoriété actuelle)"] : ["Faction", "Cible", "Base", "+ / notoriété", "Notoriété max"]}
          rows={FACTIONS.filter((f) => f.enabled).map((f) => [
            f.name,
            f.raid.target === "fleet" ? "flotte" : "base",
            pct(f.raid.basePct),
            pct(f.raid.perNotorietyPct),
            p ? n(raidPower(f, p, pirateState(p, f.id).notoriety)) : f.raid.maxNotoriety,
          ])}
        />
        {p && <Mine>{<Row label="Niveaux de bâtiments cumulés" value={buildingLevels} hint="servent au plancher des raids" />}</Mine>}
      </Block>

      <Block id="gains" title="Missions et gains" icon={Coins} intro="Les récompenses suivent ton développement : une mission rapporte toujours au moins ce que tes extracteurs auraient produit pendant sa durée.">
        <Formula>
          {`ressources communes = max(récompense fixe, ${ECONOMY_RULES.missionProductionMultiplier} × durée × production)
ressources rares = récompense × max(1 + niveaux de bâtiments ÷ ${ECONOMY_RULES.missionRareLevelDivisor},
                                    production horaire moyenne ÷ ${formatCompact(ECONOMY_RULES.missionRareProductionRef)})`}
        </Formula>
        {p && eco && (
          <Mine>
            <Row label="Multiplicateur des rares" value={`×${Math.max(1 + buildingLevels / ECONOMY_RULES.missionRareLevelDivisor, (COMMON_RESOURCES.reduce((a, r) => a + (eco.gross[r as ResourceId] ?? 0), 0) / COMMON_RESOURCES.length) * 3600 / ECONOMY_RULES.missionRareProductionRef).toFixed(2)}`} />
          </Mine>
        )}
      </Block>

      <Block id="bonus" title="Bonus" icon={Sparkles} intro="Officiers, reliques, talents d'Ascension et secteurs d'alliance s'additionnent par effet. Les réductions de durée sont plafonnées à 50 %.">
        <Table
          head={["Source", "Effet"]}
          rows={[
            ["Amiral", "+1 % d'attaque par niveau"],
            ["Stratège", "+1 % de défense par niveau"],
            ["Ingénieur", "−1 % de durée (construction, recherche) par niveau"],
            ["Intendant", "+1 % de production et +2 % d'entrepôt par niveau"],
            ["Espion", "+0,2 niveau d'espionnage et +1 % de détection par niveau"],
            ["Reliques", "leur effet (attaque, défense, production, durées, cale, réparation…) selon la rareté"],
            ["Talents d'Ascension", "production, attaque, défense, durées selon l'arbre"],
            ["Secteurs d'alliance", "production de tous les membres tant que le secteur est tenu"],
          ]}
        />
        {p && (
          <Mine title="Tes bonus actifs">
            <Row label="Attaque" value={`+${pct(mods.attack, 1)}`} />
            <Row label="Défense" value={`+${pct(mods.defense, 1)}`} />
            <Row label="Production (toutes)" value={`+${pct(mods.productionAll, 1)}`} />
            <Row label="Entrepôt" value={`+${pct(mods.storage, 1)}`} />
            <Row label="Construction / recherche" value={`−${pct(mods.buildTime, 1)} / −${pct(mods.researchTime, 1)}`} />
            <Row label="Réparation / cale" value={`+${pct(mods.repair, 1)} / +${pct(mods.cargo, 1)}`} />
          </Mine>
        )}
      </Block>

      <Block id="passe" title="Passe et Chroniques" icon={Ticket} intro="Le passe se remplit avec l'activité du mois ; les Chroniques ajoutent quatre épisodes par mois. Quand aucun chapitre n'est écrit à la main, le jeu en écrit un d'après ce que les joueurs ont fait le mois précédent.">
        <Table head={["Action", "Points"]} rows={Object.entries(PASS_POINTS).map(([k, v]) => [PASS_LABELS[k] ?? k, `+${v}`])} />
        <p>
          Ce mois-ci : {pass.tiers.length} paliers de {pass.pointsPerTier} points.
        </p>
        <Formula>
          {`chapitre généré :
difficulté = 1 + (part des joueurs actifs ayant fini les épisodes − 50 %), entre ×0,7 et ×1,4
objectif = activité médiane d'une semaine × difficulté, entre ½ et 3 × la base
bases : ${Object.entries(BASE_COUNTS).filter(([k]) => k !== "bossAssault").map(([k, v]) => `${OBJECTIVE_LABELS[k as keyof typeof OBJECTIVE_LABELS].toLowerCase()} ${v}`).join(", ")}
passe du mois : palier +15 % si plus de 40 % ont fini le passe, −15 % si moins de 10 %`}
        </Formula>
      </Block>
    </div>
  );
}
