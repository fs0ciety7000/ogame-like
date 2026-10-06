import { useMemo, useState, type ReactNode } from "react";
import { SortableGrid, SortableGridToggle } from "@/components/ui/sortable-grid";
import { EmptyAction, FoldSection, HudPanel } from "@/components/ui/panel";
import { relicImage } from "@/game/relics";
import { AmberAmount } from "@/components/ui/amber";
import { toast } from "sonner";
import { Anchor, BookOpen, Combine, Library, Package, Coins, Cog, Crosshair, Handshake, Landmark, ShieldCheck, Truck, Eye, FlaskConical, Gem, Hammer, Lock, Medal, Recycle, Shield, ShieldHalf, Sparkles, Swords, Timer, UserPlus, Wrench, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudTag, StatTile, EmptyState } from "@/components/ui/hud";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceIcon } from "@/components/ui/game-icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { EffectSheet } from "@/components/game/EffectSheet";
import {
  COMMANDER_RULES,
  COMMANDER_SOURCES,
  COMMANDERS,
  SEASON_COMMANDERS,
  commanderLevel,
  commanderSlots,
  commandersState,
  recruitCost,
  xpForLevel,
  type CommanderDef,
  type CommanderId,
} from "@/game/commanders";
import { playerModifiers } from "@/game/modifiers";
import {
  describeRelic,
  equippedRelics,
  findTemplate,
  RARITIES,
  rarityInfo,
  RELIC_RULES,
  relicSlots,
  relicsState,
  type RelicEffect,
  type RelicItem,
} from "@/game/relics";
import {
  CAPSULE_TYPES,
  CAPSULES,
  capsuleCost,
  capsulePct,
  craftSeconds,
  SYNTH_BUILDING,
  SYNTH_RULES,
  synthesisState,
  synthLevel,
  type CapsuleType,
} from "@/game/synthesis";
import { productionHours } from "@/game/pirates";
import { bountyState } from "@/game/bounties";
import {
  activateCapsule,
  assignCommanders,
  craftCapsule,
  equipRelic,
  fuseRelics,
  GameActionError,
  recruitCommander,
  recycleRelic,
  trainCommander,
} from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { assetUrl } from "@/lib/assets";
import { cn, formatCompact, formatDuration, alpha } from "@/lib/utils";
import type { PlayerState, ResourceId } from "@/types/game";
import { useNavigate, useSearchParams } from "react-router-dom";

/* =====================================================
   État-major (v4.0) : officiers en poste, reliques équipées et Labo de
   synthèse (capsules). Tout est arbitré par le serveur (actions de jeu).
===================================================== */

function errorText(err: unknown) {
  return err instanceof GameActionError ? err.message : "Action impossible.";
}

async function run<T>(task: () => Promise<T>, success?: (out: T) => string | null) {
  try {
    const out = await task();
    const msg = success?.(out);
    if (msg) toast.success(msg);
    return out;
  } catch (err) {
    toast.error(errorText(err));
    return undefined;
  }
}

const COMMANDER_TONES: Record<CommanderId, string> = {
  admiral: "var(--color-ember-glow)",
  strategist: "var(--color-cyan-glow)",
  engineer: "var(--color-gold-glow)",
  spy: "var(--color-violet-glow)",
  steward: "var(--color-mint-glow)",
  logistician: "var(--color-cyan-glow)",
  mechanic: "var(--color-ember-glow)",
  governor: "var(--color-mint-glow)",
  corsair: "var(--color-danger-glow)",
  warden: "var(--color-gold-glow)",
  diplomat: "var(--color-violet-glow)",
  hunter: "var(--color-danger-glow)",
};

const COMMANDER_ICONS: Record<CommanderId, typeof Swords> = {
  admiral: Swords,
  strategist: Shield,
  engineer: Wrench,
  spy: Eye,
  steward: Coins,
  logistician: Truck,
  mechanic: Cog,
  governor: Landmark,
  corsair: Anchor,
  warden: ShieldCheck,
  diplomat: Handshake,
  hunter: Crosshair,
};

/** Portrait avec repli (initiales sur un dégradé) tant que l'image manque. */
function Portrait({ def, className }: { def: CommanderDef; className?: string }) {
  const [broken, setBroken] = useState(false);
  const tone = COMMANDER_TONES[def.role];
  const Icon = COMMANDER_ICONS[def.role];
  return (
    <div
      className={cn("hud-cut relative grid place-items-center overflow-hidden border", className)}
      style={{ borderColor: `${alpha(tone, 40)}`, background: `radial-gradient(circle at 50% 30%, ${alpha(tone, 20)}, transparent 70%), var(--color-space-900)` }}
    >
      {!broken ? (
        <img src={assetUrl(def.portrait)} alt={def.name} className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <Icon className="h-1/2 w-1/2" style={{ color: tone }} />
      )}
    </div>
  );
}

function Bar({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden bg-white/5">
      <div className="h-full transition-all" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%`, background: tone, boxShadow: `0 0 8px ${tone}` }} />
    </div>
  );
}

function CostLine({ cost }: { cost: Partial<Record<ResourceId, number>> }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {(Object.entries(cost) as [ResourceId, number][])
        .filter(([, n]) => n > 0)
        .map(([res, n]) => (
          <span key={res} className="inline-flex items-center gap-1 font-mono text-xs text-slate-300">
            <ResourceIcon id={res} className="h-3.5 w-3.5" />
            {formatCompact(n)}
          </span>
        ))}
    </span>
  );
}

/* ---------- Commandants ---------- */

function CommanderCard({ def, player, now }: { def: CommanderDef; player: PlayerState; now: number }) {
  const st = commandersState(player);
  const entry = st.roster[def.id];
  const active = st.active.includes(def.id);
  const tone = COMMANDER_TONES[def.role];
  const [busy, setBusy] = useState(false);
  const free = recruitCost(player) === "free";
  const amber = bountyState(player).amber;
  const xp = entry?.xp ?? 0;
  const level = commanderLevel(xp);
  const maxed = level >= COMMANDER_RULES.maxLevel;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const movedAt = st.movedAtMs[def.id] ?? 0;
  const cooldown = movedAt && !player.testMode ? movedAt + COMMANDER_RULES.swapCooldownHours * 3600_000 - now : 0;
  const slots = commanderSlots(player);
  // v5.14.1 : officier rare ou commandant de saison pas encore débloqué → sous le brouillard.
  const fogged = !entry && !!(def.rare || def.season);

  const act = async (task: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    await run(task, () => msg);
    setBusy(false);
  };

  const toggle = () => {
    const ids = active ? st.active.filter((id) => id !== def.id) : [...st.active, def.id];
    if (!active && ids.length > slots) {
      toast.error(`${slots} postes au plus : relève d'abord un officier.`);
      return;
    }
    void act(() => assignCommanders(ids), active ? `${def.title} relevé de son poste.` : `${def.title} ${def.name} prend son poste.`);
  };

  return (
    <Card className={cn("flex flex-col gap-3 p-4", active && "ring-1")} style={active ? { boxShadow: `0 0 24px -12px ${tone}`, borderColor: `${alpha(tone, 53)}` } : undefined}>
      <div className="flex gap-3">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden">
          <Portrait def={def} className={cn("h-24 w-20", !entry && "opacity-60 grayscale", fogged && "scale-110 blur-md brightness-50")} />
          {fogged && (
            <span className="absolute inset-0 flex items-center justify-center bg-space-950/40">
              <Lock className="h-5 w-5 text-slate-300" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="hud-eyebrow text-[10px]" style={{ color: tone }}>
            {def.title}
          </p>
          <h3 className="font-display text-lg font-semibold text-slate-100">{fogged ? "???" : def.name}</h3>
          {def.season && (
            <HudTag tone="gold" className="mt-1">
              Passe de {def.season.label}
            </HudTag>
          )}
          {entry ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <HudTag tone={active ? "mint" : "accent"}>{active ? "En poste" : "En réserve"}</HudTag>
              <span className="font-mono text-xs text-slate-300">Niv. {level}</span>
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-500">{def.season || def.rare ? "À débloquer" : `Non recruté${free ? " · le premier est offert" : ""}`}</p>
          )}
        </div>
      </div>
      {fogged ? (
        <p className="text-sm text-slate-400">Identité et effets inconnus tant que cet officier n'est pas débloqué.</p>
      ) : (
        <>
          <p className="text-sm text-slate-300">{def.bonus(Math.max(1, level))}{entry ? "" : " (au niveau 1)"}</p>
          {def.lore && <p className="text-xs italic leading-relaxed text-slate-400">{def.lore}</p>}
        </>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-xs text-slate-500">Progresse avec :</p>
        <div className="flex flex-wrap gap-1">
          {COMMANDER_SOURCES[def.role].map((src) => (
            <span key={src.label} className="hud-chip hud-chip-sm hud-tone-neutral max-w-full whitespace-normal">
              {src.label} <span className="font-mono" style={{ color: tone }}>+{src.xp}</span>
            </span>
          ))}
        </div>
        {entry && !active && <p className="text-[11px] text-gold-glow">En réserve : il ne gagne pas d'XP. Mets-le en poste pour qu'il progresse.</p>}
      </div>
      {entry && (
        <div className="flex flex-col gap-1">
          <Bar value={maxed ? 1 : (xp - floor) / Math.max(1, ceil - floor)} tone={tone} />
          <p className="font-mono text-[11px] text-slate-500">{maxed ? "Niveau maximal" : `${xp - floor} / ${ceil - floor} XP vers le niveau ${level + 1}`}</p>
        </div>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        {!entry && def.season ? (
          <HudTag tone="gold">Dernier palier du passe de {def.season.label}</HudTag>
        ) : !entry && def.rare ? (
          <HudTag tone="violet">Palier 30 d'un passe ou butin de boss</HudTag>
        ) : !entry ? (
          free ? (
            <Button size="sm" disabled={busy} onClick={() => void act(() => recruitCommander(def.id, "amber"), `${def.title} ${def.name} rejoint ta flotte !`)}>
              <UserPlus className="h-3.5 w-3.5" /> Recruter (offert)
            </Button>
          ) : (
            <>
              <Button size="sm" variant="secondary" disabled={busy || amber < COMMANDER_RULES.recruitAmber} onClick={() => void act(() => recruitCommander(def.id, "amber"), `${def.title} ${def.name} rejoint ta flotte !`)}>
                <UserPlus className="h-3.5 w-3.5" /> <AmberAmount value={COMMANDER_RULES.recruitAmber} />
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void act(() => recruitCommander(def.id, "production"), `${def.title} ${def.name} rejoint ta flotte !`)}>
                {COMMANDER_RULES.recruitProductionHours} h de production
              </Button>
            </>
          )
        ) : (
          <>
            <Button size="sm" variant={active ? "outline" : "secondary"} disabled={busy || cooldown > 0} onClick={toggle}>
              {cooldown > 0 ? (
                <>
                  <Timer className="h-3.5 w-3.5" /> {formatDuration(Math.ceil(cooldown / 1000))}
                </>
              ) : active ? (
                "Relever"
              ) : (
                "Mettre en poste"
              )}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy || st.dossiers <= 0 || maxed} onClick={() => void act(() => trainCommander(def.id), `+${COMMANDER_RULES.dossierXp} XP pour ${def.name}.`)}>
              <BookOpen className="h-3.5 w-3.5" /> Dossier ({st.dossiers})
            </Button>
          </>
        )}
      </div>
      {!entry && !free && !def.rare && !def.season && <p className="text-[11px] text-slate-500">Production : <CostLine cost={productionHours(player, COMMANDER_RULES.recruitProductionHours)} /></p>}
    </Card>
  );
}

function CommandersTab({ player, now }: { player: PlayerState; now: number }) {
  const st = commandersState(player);
  const slots = commanderSlots(player);
  const [editingCards, setEditingCards] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Postes" value={`${st.active.length} / ${slots}`} sub={slots < 3 ? "Un 3e poste au rang Platine" : "Rang Platine atteint"} icon={<Medal className="h-4 w-4" />} />
        <StatTile label="Officiers" value={`${Object.keys(st.roster).length} / ${COMMANDERS.length + SEASON_COMMANDERS.length}`} sub="Seuls les officiers en poste progressent" tone="gold" icon={<UserPlus className="h-4 w-4" />} />
        <StatTile label="Dossiers" value={st.dossiers} sub="Au Comptoir de la Ruche (40 Ambre)" tone="mint" icon={<BookOpen className="h-4 w-4" />} />
      </div>
      <div className="flex justify-end">
        <SortableGridToggle page="officiers" editing={editingCards} onToggle={() => setEditingCards((e) => !e)} />
      </div>
      <SortableGrid
        page="officiers"
        editing={editingCards}
        className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
        items={COMMANDERS.filter((d) => !d.rare)}
        getId={(def) => def.id}
        getLabel={(def) => def.name}
        render={(def) => <CommanderCard key={def.id} def={def} player={player} now={now} />}
      />
      <FoldSection id="etat-major-rares" tone="violet" title="Officiers rares" aside={<span className="text-[11px] text-slate-500">Ne se recrutent pas : commandant de saison de ce rôle au palier 30, ou trouvaille très rare sur un boss</span>}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {COMMANDERS.filter((d) => d.rare).map((def) => (
            <CommanderCard key={def.id} def={def} player={player} now={now} />
          ))}
        </div>
      </FoldSection>
      {SEASON_COMMANDERS.length > 0 && (
        <FoldSection id="etat-major-saison" tone="gold" defaultOpen={false} title={<>Commandants de saison <span className="font-mono text-slate-500">{SEASON_COMMANDERS.length}</span></>} aside={<span className="text-[11px] text-slate-500">Un par passe, au dernier palier</span>}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[...SEASON_COMMANDERS].reverse().map((def) => (
              <CommanderCard key={def.id} def={def} player={player} now={now} />
            ))}
          </div>
        </FoldSection>
      )}
      <p className="text-xs text-slate-500">Changer un officier de poste : une fois par {COMMANDER_RULES.swapCooldownHours} h et par officier. Niveau maximal : {COMMANDER_RULES.maxLevel}.</p>
    </div>
  );
}

/* ---------- Reliques ---------- */

const RELIC_ICONS: Record<RelicEffect, typeof Swords> = {
  attack: Swords,
  defense: Shield,
  build_time: Hammer,
  research_time: FlaskConical,
  repair: Wrench,
  cargo: Coins,
  spy: Eye,
  production_scrap: Gem,
  production_energy: Zap,
  production_nano: Sparkles,
  production_data: Gem,
  production_all: Sparkles,
  aegis: ShieldHalf,
  boss_damage: Swords,
  repair_speed: Wrench,
  custom: Sparkles,
};

function RelicBadge({ item, className }: { item: Pick<RelicItem, "template" | "rarity">; className?: string }) {
  const t = findTemplate(item.template);
  const r = rarityInfo(item.rarity);
  const Icon = t ? RELIC_ICONS[t.effect] : Gem;
  const [broken, setBroken] = useState(false);
  return (
    <div
      className={cn("hud-cut-sm relative grid shrink-0 place-items-center overflow-hidden border", className)}
      style={{ borderColor: `${alpha(r.color, 53)}`, background: `radial-gradient(circle, ${alpha(r.color, 16)}, transparent 75%), var(--color-space-900)`, boxShadow: item.rarity === "legendary" || item.rarity === "mythic" ? `0 0 16px -4px ${r.color}` : undefined }}
    >
      {!broken ? (
        <img src={assetUrl(relicImage(item.template))} alt="" className="h-full w-full object-contain p-1" onError={() => setBroken(true)} />
      ) : (
        <Icon className="h-1/2 w-1/2" style={{ color: r.color }} />
      )}
    </div>
  );
}

function RelicsTab({ player }: { player: PlayerState }) {
  const st = relicsState(player);
  const n = relicSlots(player);
  const equipped = equippedRelics(player);
  const [busy, setBusy] = useState(false);
  const [slot, setSlot] = useState(0);
  const mods = playerModifiers({ relics: player.relics, ascensions: player.ascensions });

  const act = async (task: () => Promise<unknown>, msg: (out: unknown) => string | null) => {
    setBusy(true);
    await run(task, msg);
    setBusy(false);
  };

  // Groupes fusionnables : 3 identiques non équipées.
  const equippedIds = new Set(st.slots.filter(Boolean));
  const groups = useMemo(() => {
    const map = new Map<string, RelicItem[]>();
    for (const r of st.items) {
      if (equippedIds.has(r.id)) continue;
      const key = `${r.template}|${r.rarity}`;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    return [...map.values()].filter((g) => g.length >= RELIC_RULES.fuseCount && g[0].rarity !== "legendary" && g[0].rarity !== "mythic");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.relics]);

  const sorted = [...st.items].sort((a, b) => RARITIES.findIndex((x) => x.id === b.rarity) - RARITIES.findIndex((x) => x.id === a.rarity) || a.template.localeCompare(b.template));

  return (
    <div className="flex flex-col gap-4">
      {/* 5.26 : emplacements et fusions à gauche, collection à droite sur grand écran. */}
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <HudPanel icon={<Gem />} title="Emplacements de la base" tone="gold" aside={<span className="text-xs text-slate-500">{n} emplacements{n < RELIC_RULES.slots + 1 ? " · un 4e à la première Ascension" : ""}</span>}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: n }).map((_, i) => {
                const item = st.items.find((r) => r.id === st.slots[i]);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlot(i)}
                    className={cn("hud-cut-sm flex min-h-28 flex-col items-center justify-center gap-1.5 border p-2 text-center transition-colors", slot === i ? "border-cyan-glow/70 bg-cyan-glow/10" : "border-white/10 bg-white/[0.02] hover:border-cyan-glow/40")}
                  >
                    {item ? (
                      <>
                        <RelicBadge item={item} className="h-12 w-12" />
                        <span className="text-xs font-semibold text-slate-100">{findTemplate(item.template)?.name}</span>
                        <span className="text-[11px]" style={{ color: rarityInfo(item.rarity).color }}>{describeRelic(item)}</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">Emplacement {i + 1} libre</span>
                    )}
                  </button>
                );
              })}
            </div>
            {equipped.length > 0 && (
              <p className="text-xs text-slate-400">
                Total :{" "}
                {[
                  mods.attack && `+${Math.round(mods.attack * 100)} % attaque`,
                  mods.defense && `+${Math.round(mods.defense * 100)} % défense`,
                  mods.buildTime && `−${Math.round(mods.buildTime * 100)} % construction`,
                  mods.researchTime && `−${Math.round(mods.researchTime * 100)} % recherche`,
                  mods.repair && `+${Math.round(mods.repair * 100)} % réparation`,
                  mods.cargo && `+${Math.round(mods.cargo * 100)} % soute`,
                  mods.productionAll && `+${Math.round(mods.productionAll * 100)} % production`,
                ]
                  .filter(Boolean)
                  .join(" · ") || "effets spécifiques"}
              </p>
            )}
            {st.slots[slot] && (
              <Button size="sm" variant="outline" className="self-start" disabled={busy} onClick={() => void act(() => equipRelic(slot, null), () => "Relique retirée.")}>
                Vider l'emplacement {slot + 1}
              </Button>
            )}
          </HudPanel>

          {groups.length > 0 && (
            <HudPanel icon={<Combine />} title="Fusions possibles" tone="gold" accent className="gap-2">
              {groups.map((g) => {
                const next = RARITIES[RARITIES.findIndex((r) => r.id === g[0].rarity) + 1];
                return (
                  <div key={`${g[0].template}${g[0].rarity}`} className="flex flex-wrap items-center gap-2 text-sm">
                    <RelicBadge item={g[0]} className="h-8 w-8" />
                    <span className="flex-1 text-slate-300">
                      {RELIC_RULES.fuseCount} × {findTemplate(g[0].template)?.name} ({rarityInfo(g[0].rarity).label.toLowerCase()}) → <span style={{ color: next.color }}>{next.label.toLowerCase()}</span>
                    </span>
                    <Button size="sm" variant="warn" disabled={busy} onClick={() => void act(() => fuseRelics(g[0].template, g[0].rarity), () => "Fusion réussie !")}>
                      Fusionner
                    </Button>
                  </div>
                );
              })}
            </HudPanel>
          )}

        </div>
        <HudPanel icon={<Library />} title="Collection" className="gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs text-slate-500">
              {st.items.length} / {RELIC_RULES.maxItems} · expéditions, proie d'élite, Léviathan
            </p>
          </div>
          {sorted.length === 0 && (
            <EmptyState icon="🏺" title="Aucune relique" action={<EmptyAction to="/game/missions">Lancer une expédition</EmptyAction>} className="p-0">
              Les longues expéditions en rapportent parfois (jusqu'à 15 % à 8 h), la proie d'élite et le Léviathan en donnent une à chaque victoire.
            </EmptyState>
          )}
          <div className="grid gap-2 md:grid-cols-2">
            {sorted.map((item) => {
              const t = findTemplate(item.template);
              const r = rarityInfo(item.rarity);
              const isEquipped = equippedIds.has(item.id);
              return (
                <div key={item.id} className="flex items-center gap-3 border border-white/5 bg-white/[0.02] p-2">
                  <RelicBadge item={item} className="h-11 w-11" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">{t?.name}</p>
                    <p className="text-xs" style={{ color: r.color }}>
                      {r.label} · {describeRelic(item)}
                    </p>
                    <p className="truncate text-[11px] italic text-slate-500">{t?.lore}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {isEquipped ? (
                      <HudTag tone="mint">Équipée</HudTag>
                    ) : (
                      <>
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => void act(() => equipRelic(slot, item.id), () => `${t?.name} équipée (emplacement ${slot + 1}).`)}>
                          Équiper
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy} title={`Recycler contre ${r.recycle} Ambre`} onClick={() => void act(() => recycleRelic(item.id), (out) => `Recyclée : +${(out as { amber: number }).amber} Ambre.`)}>
                          <Recycle className="h-3.5 w-3.5" /> {r.recycle}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </HudPanel>
      </div>
    </div>
  );
}

/* ---------- Labo de synthèse ---------- */

const CAPSULE_TONES: Record<CapsuleType, string> = {
  assault: "var(--color-ember-glow)",
  armor: "var(--color-cyan-glow)",
  decoy: "var(--color-violet-glow)",
  veil: "var(--color-mint-glow)",
};

function CapsuleIcon({ type, className }: { type: CapsuleType; className?: string }) {
  const [broken, setBroken] = useState(false);
  const tone = CAPSULE_TONES[type];
  return (
    <div className={cn("hud-cut-sm grid shrink-0 place-items-center overflow-hidden border", className)} style={{ borderColor: `${alpha(tone, 53)}`, background: `radial-gradient(circle, ${alpha(tone, 20)}, transparent 75%), var(--color-space-900)` }}>
      {!broken ? <img src={assetUrl(`/assets/capsules/${type}.webp`)} alt="" className="h-full w-full object-contain p-1" onError={() => setBroken(true)} /> : <FlaskConical className="h-1/2 w-1/2" style={{ color: tone }} />}
    </div>
  );
}

function SynthesisTab({ player, now }: { player: PlayerState; now: number }) {
  const navigate = useNavigate();
  const level = synthLevel(player);
  const st = synthesisState(player);
  const [chosen, setChosen] = useState<number>(Math.max(1, level));
  const [busy, setBusy] = useState(false);
  const craftLevel = Math.max(1, Math.min(level, chosen));
  const cost = capsuleCost(player, craftLevel);

  const act = async (task: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    await run(task, () => msg);
    setBusy(false);
  };

  if (level <= 0) {
    return (
      <Card className="flex flex-col gap-3 p-5 md:flex-row md:items-center">
        <img src={assetUrl(SYNTH_BUILDING.image)} alt="" className="h-32 w-32 shrink-0 object-contain" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
        <div className="flex flex-col gap-2">
          <h3 className="hud-title text-base text-slate-100">{SYNTH_BUILDING.name}</h3>
          <p className="text-sm text-slate-300">{SYNTH_BUILDING.description}</p>
          <p className="text-sm text-slate-400">
            Déblocage : <CostLine cost={SYNTH_BUILDING.unlockCost ?? {}} />
          </p>
          <Button className="self-start" onClick={() => navigate("/game/batiments")}>
            <Lock className="h-4 w-4" /> Aller aux Bâtiments
          </Button>
        </div>
      </Card>
    );
  }

  const armorLeft = st.armor && st.armor.untilMs > now ? st.armor.untilMs - now : 0;
  const veilLeft = st.veil && st.veil.untilMs > now ? st.veil.untilMs - now : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Labo de synthèse" value={`Niveau ${level}`} sub={`Capsules jusqu'à ${capsulePct(level)} %`} tone="violet" icon={<FlaskConical className="h-4 w-4" />} />
        <StatTile label="Carapace réactive" value={armorLeft ? `+${st.armor!.pct} %` : "Inactive"} sub={armorLeft ? `Encore ${formatDuration(Math.ceil(armorLeft / 1000))}` : "Contre la prochaine attaque de joueur"} icon={<Shield className="h-4 w-4" />} />
        <StatTile label="Brouilleur de défense" value={veilLeft ? `±${st.veil!.pct} %` : "Inactif"} sub={veilLeft ? `Encore ${formatDuration(Math.ceil(veilLeft / 1000))}` : "Fausse les rapports d'espionnage"} tone="mint" icon={<Eye className="h-4 w-4" />} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <HudPanel icon={<FlaskConical />} title="Synthèse" tone="accent">
          {st.crafting ? (
            <div className="flex items-center gap-3">
              <CapsuleIcon type={st.crafting.type} className="h-12 w-12" />
              <div className="flex-1">
                <p className="text-sm text-slate-100">
                  {CAPSULES[st.crafting.type].name} · niveau {st.crafting.level} ({capsulePct(st.crafting.level)} %)
                </p>
                <p className="font-mono text-xs text-slate-400">Prête dans {formatDuration(Math.max(0, Math.ceil((st.crafting.endsAtMs - now) / 1000)))}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                Niveau de la capsule
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: level }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setChosen(i + 1)}
                      className={cn("h-8 min-w-8 border px-2 font-mono text-xs", craftLevel === i + 1 ? "border-violet-glow bg-violet-glow/20 text-slate-100" : "border-white/10 text-slate-400 hover:border-violet-glow/50")}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Coût : <CostLine cost={cost} /> · durée {formatDuration(craftSeconds(craftLevel))}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {CAPSULE_TYPES.map((type) => (
                  <div key={type} className="flex items-center gap-3 border border-white/5 bg-white/[0.02] p-2">
                    <CapsuleIcon type={type} className="h-11 w-11" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-100">{CAPSULES[type].name}</p>
                      <p className="text-xs text-slate-400">{CAPSULES[type].description(capsulePct(craftLevel))}</p>
                    </div>
                    <Button size="sm" variant="secondary" disabled={busy || st.stock[type].length >= SYNTH_RULES.maxStock} onClick={() => void act(() => craftCapsule(type, craftLevel), `${CAPSULES[type].name} en synthèse.`)}>
                      Synthétiser
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </HudPanel>

        <HudPanel icon={<Package />} title="Réserve" className="gap-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {CAPSULE_TYPES.map((type) => {
              const stock = [...st.stock[type]].sort((a, b) => b - a);
              const activable = CAPSULES[type].use === "activate";
              const running = type === "armor" ? armorLeft > 0 : type === "veil" ? veilLeft > 0 : false;
              return (
                <div key={type} className="flex items-center gap-3 border border-white/5 bg-white/[0.02] p-2">
                  <CapsuleIcon type={type} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-100">{CAPSULES[type].short}</p>
                    <p className="font-mono text-xs text-slate-400">{stock.length ? stock.map((l) => `N${l}`).join(" · ") : "vide"} ({stock.length}/{SYNTH_RULES.maxStock})</p>
                  </div>
                  {activable ? (
                    <Button size="sm" variant="warn" disabled={busy || stock.length === 0 || running} onClick={() => void act(() => activateCapsule(type, stock[0]), `${CAPSULES[type].name} active pendant ${SYNTH_RULES.activeHours} h.`)}>
                      Activer
                    </Button>
                  ) : (
                    <span className="text-[11px] text-slate-500">À l'envoi d'une attaque</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">
            Les capsules ne jouent qu'entre joueurs et n'apparaissent pas dans l'espionnage. Une Espionne en poste chez l'adversaire peut toutefois flairer une « anomalie chimique ».
          </p>
        </HudPanel>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export function CommandPage() {
  const player = usePlayerStore((s) => s.player);
  useNowTicker();
  const [params, setParams] = useSearchParams();
  const now = Date.now();
  if (!player) return null;
  const st = commandersState(player);
  const tabs: { id: string; label: string; icon: ReactNode }[] = [
    { id: "commanders", label: "Commandants", icon: <Medal className="h-3.5 w-3.5" /> },
    { id: "relics", label: "Reliques", icon: <Gem className="h-3.5 w-3.5" /> },
    { id: "synthesis", label: "Labo de synthèse", icon: <FlaskConical className="h-3.5 w-3.5" /> },
    { id: "effects", label: "Effets", icon: <Sparkles className="h-3.5 w-3.5" /> },
  ];
  // 5.26 : onglet dans l'adresse (lien direct, retour arrière).
  const tab = tabs.some((t) => t.id === params.get("onglet")) ? params.get("onglet")! : "commanders";
  return (
    <div className="flex flex-col gap-5">
      <PageHeader backdrop="/assets/blog/articles/5-9/poste-commandement.webp"
        eyebrow="Commandement"
        title="État-major"
        description="Tes officiers, tes reliques et ton Labo de synthèse : des bonus permanents et des coups tordus."
        right={st.active.length === 0 && Object.keys(st.roster).length === 0 ? <HudTag tone="gold">Premier officier offert</HudTag> : undefined}
      />
      <Tabs value={tab} onValueChange={(v) => setParams((p) => (p.set("onglet", v), p), { replace: true })}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="inline-flex items-center gap-1.5">
              {t.icon} {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="commanders" className="mt-4">
          <CommandersTab player={player} now={now} />
        </TabsContent>
        <TabsContent value="relics" className="mt-4">
          <RelicsTab player={player} />
        </TabsContent>
        <TabsContent value="synthesis" className="mt-4">
          <SynthesisTab player={player} now={now} />
        </TabsContent>
        <TabsContent value="effects" className="mt-4">
          <EffectSheet player={player} now={now} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
