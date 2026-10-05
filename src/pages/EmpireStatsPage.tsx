import { useMemo, type ReactNode } from "react";
import { EmptyAction } from "@/components/ui/panel";
import { Link } from "react-router-dom";
import { motion, MotionConfig, type Variants } from "framer-motion";
import { BarChart3, Coins, Crown, Factory, Gauge, Globe2, Rocket, Shield, Sigma, Skull, Sparkles, Swords, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HudTag, EmptyState } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { RadialGauge } from "@/components/ui/radial-gauge";
import { CornerBrackets } from "@/components/ui/corner-brackets";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmpireShareActions } from "@/components/game/EmpireShareActions";
import { empireStats, ratio } from "@/game/empireStats";
import { FLEET_MISSION_LABELS, type FleetMission } from "@/game/fleets";
import { usePlayerStore } from "@/store/playerStore";
import { useFleetStore } from "@/store/fleetStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { useContentStore } from "@/services/contentService";
import { cn, formatCompact } from "@/lib/utils";

/* v5.6 : statistiques complètes de l'empire (planète mère et colonies). */

const n = (x: number) => formatCompact(Math.round(x));
const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits).replace(".", ",")} %`;

const CYAN = "var(--color-cyan-glow)";
const GOLD = "var(--color-gold-glow)";
const EMBER = "var(--color-ember-glow)";
const MINT = "var(--color-mint-glow)";
const VIOLET = "var(--color-violet-glow)";
const DANGER = "var(--color-danger-glow)";

const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

/** Nombre qui compte depuis 0 à l'apparition, au format compact. */
function Num({ value, className }: { value: number; className?: string }) {
  return <AnimatedNumber value={Math.round(value)} format={(v) => formatCompact(Math.round(v))} countUp className={cn("tabular-nums", className)} />;
}

/** Barre qui se remplit à l'apparition. */
function Bar({ value, tone = CYAN, className }: { value: number; tone?: string; className?: string }) {
  const w = Math.min(100, Math.max(0, value * 100));
  return (
    <div className={cn("relative h-1.5 overflow-hidden bg-white/[0.06]", className)}>
      <motion.i
        className="absolute inset-y-0 left-0 block"
        style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${tone} 55%, transparent), ${tone})`, boxShadow: `0 0 10px color-mix(in srgb, ${tone} 60%, transparent)` }}
        initial={{ width: 0 }}
        whileInView={{ width: `${w}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </div>
  );
}

function Section({ title, icon: Icon, tone = CYAN, aside, className, children }: { title: string; icon: typeof Factory; tone?: string; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <motion.section
      variants={rise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className={cn("glass-panel relative flex min-w-0 flex-col gap-4 overflow-hidden p-4 sm:p-5", className)}
    >
      <div className="relative flex flex-wrap items-center gap-3">
        <span className="hud-cut grid h-9 w-9 place-items-center border" style={{ color: tone, borderColor: `color-mix(in srgb, ${tone} 40%, transparent)`, background: `color-mix(in srgb, ${tone} 8%, transparent)` }}>
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="hud-title text-sm text-white">{title}</h2>
        <div className="ml-auto">{aside}</div>
      </div>
      <span aria-hidden className="relative -mt-1 block h-px w-full" style={{ background: `linear-gradient(90deg, ${tone}, transparent 70%)`, opacity: 0.45 }} />
      <div className="relative flex min-w-0 flex-col gap-4">{children}</div>
    </motion.section>
  );
}

function SectionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-glow/80 transition-colors hover:text-cyan-glow">
      {children} →
    </Link>
  );
}

function HeroTile({ label, value, display, sub, icon: Icon, tone }: { label: string; value?: number; display?: ReactNode; sub: ReactNode; icon: typeof Factory; tone: string }) {
  return (
    <motion.div variants={rise} whileHover={{ y: -3 }} className="glass-panel group relative min-w-0 overflow-hidden p-4">
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: tone, boxShadow: `0 0 14px ${tone}` }} />
      <Icon aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 opacity-[0.06] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" style={{ color: tone }} />
      <p className="relative font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="hud-title relative mt-1.5 text-3xl normal-case" style={{ color: tone, textShadow: `0 0 18px color-mix(in srgb, ${tone} 45%, transparent)` }}>
        {display ?? <Num value={value ?? 0} />}
      </p>
      <div className="relative mt-1 text-xs text-slate-500">{sub}</div>
    </motion.div>
  );
}

/** Ligne libellé / valeur, pour les petites listes. */
function Row({ label, children, tone }: { label: ReactNode; children: ReactNode; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-white/5 py-1.5 text-sm first:border-t-0">
      <span className="min-w-0 text-slate-400">{label}</span>
      <span className="shrink-0 text-right font-mono text-slate-200" style={tone ? { color: tone } : undefined}>
        {children}
      </span>
    </div>
  );
}

/** Jauge circulaire avec pourcentage au centre et légende dessous. */
function Ring({ label, value, max, tone, size = 84 }: { label: string; value: number; max: number; tone: string; size?: number }) {
  const r = ratio(value, max);
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <RadialGauge value={r * 100} size={size} color={tone}>
        <span className="font-mono text-sm text-white">{Math.round(r * 100)}%</span>
      </RadialGauge>
      <p className="max-w-[9rem] text-[11px] leading-tight text-slate-400">{label}</p>
      <p className="font-mono text-xs text-slate-200">
        {n(value)} / {n(max)}
      </p>
    </div>
  );
}

function Places({ label, used, capacity }: { label?: string; used: number; capacity: number }) {
  const r = ratio(used, capacity);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2 text-xs">
        {label && <span className="text-slate-400">{label}</span>}
        <span className={cn("ml-auto font-mono", r >= 0.9 ? "text-ember-glow" : "text-slate-300")}>
          {n(used)} / {n(capacity)}
        </span>
      </div>
      <Bar value={r} tone={r >= 0.9 ? EMBER : CYAN} />
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="truncate font-mono text-sm text-slate-100" style={tone ? { color: tone } : undefined}>
        {value}
      </p>
    </div>
  );
}

const MOD_LABELS: { key: "attack" | "defense" | "productionAll" | "storage" | "buildTime" | "researchTime" | "repair" | "cargo" | "detection" | "bossDamage"; label: string; sign: "+" | "−" }[] = [
  { key: "attack", label: "Attaque", sign: "+" },
  { key: "defense", label: "Défense", sign: "+" },
  { key: "productionAll", label: "Production (toutes)", sign: "+" },
  { key: "storage", label: "Entrepôt", sign: "+" },
  { key: "buildTime", label: "Durée de construction", sign: "−" },
  { key: "researchTime", label: "Durée de recherche", sign: "−" },
  { key: "repair", label: "Réparation", sign: "+" },
  { key: "cargo", label: "Cale", sign: "+" },
  { key: "detection", label: "Détection", sign: "+" },
  { key: "bossDamage", label: "Dégâts contre les boss", sign: "+" },
];

export function EmpireStatsPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const fleets = useFleetStore((s) => s.fleets);
  const version = useContentStore((s) => s.version);
  const minute = Math.floor(Date.now() / 60_000);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcul à la minute, au contenu et aux flottes
  const st = useMemo(() => (player ? empireStats(player, fleets, Date.now()) : null), [player, fleets, version, minute]);
  if (!player || !st) return null;
  const o = st.overview;
  const m = st.military;
  const prodRes = st.command.modifiers.production;
  const bonusRows = [
    ...MOD_LABELS.filter((x) => (st.command.modifiers[x.key] ?? 0) > 0).map((x) => ({ key: x.key as string, label: <>{x.label}</>, sign: x.sign, value: st.command.modifiers[x.key] as number })),
    ...Object.entries(prodRes)
      .filter(([, v]) => (v ?? 0) > 0)
      .map(([res, v]) => ({
        key: `prod-${res}`,
        label: (
          <span className="inline-flex items-center gap-1">
            <ResourceIcon id={res} className="h-3.5 w-3.5" /> Production
          </span>
        ),
        sign: "+" as const,
        value: v ?? 0,
      })),
  ];
  const bonusMax = Math.max(0.01, ...bonusRows.map((b) => b.value));
  const maxUnitPower = Math.max(1, ...m.units.map((u) => u.power));
  const maxPlanetProd = Math.max(1, ...st.planets.map((p) => Object.values(p.perHour).reduce((a: number, b) => a + (b ?? 0), 0)));
  const commons = st.resources.filter((r) => r.rarity === "common");
  const rares = st.resources.filter((r) => r.rarity !== "common");

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-w-0 flex-col gap-5">
        <PageHeader eyebrow="Empire" title="Statistiques" description="Tout ton empire en chiffres : planète mère et colonies, production, armée à quai et en vol, état-major, bonus, menaces et carrière." right={
            <div className="flex flex-wrap gap-2">
              {/* 5.15 : les Formules quittent le menu ; on les ouvre d'ici. */}
              <Button size="sm" variant="secondary" asChild>
                <Link to="/game/formules">
                  <Sigma className="h-4 w-4" /> Formules
                </Link>
              </Button>
              <EmpireShareActions player={player} stats={st} kind="empire" />
            </div>
          }
        />

        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <HeroTile label="Rang" display={o.rank} sub={`${n(o.xp)} XP · ${n(o.seasonXp)} cette saison`} icon={Crown} tone={GOLD} />
          <HeroTile label="Production / h" value={st.economy.totalPerHour} sub={`ressources communes, ${st.planets.length} planète(s)`} icon={Factory} tone={CYAN} />
          <HeroTile label="Attaque (bonus compris)" value={m.modifiedAttack} sub={`${n(m.attackHome)} à quai · ${n(m.attackAway)} en vol`} icon={Swords} tone={EMBER} />
          <HeroTile label="Défense planète mère" value={m.modifiedDefense} sub={`bouclier ${pct(m.shieldPct, 1)} · colonies ${n(m.coloniesDefense)}`} icon={Shield} tone={MINT} />
          <HeroTile
            label="Combats"
            display={
              <>
                <span className="text-mint-glow">{o.victories}</span>
                <span className="mx-1 text-slate-600">/</span>
                <span className="text-danger-glow">{o.defeats}</span>
              </>
            }
            sub={
              <span className="flex flex-col gap-1.5">
                <span>{o.winPct} % de victoires</span>
                <Bar value={o.winPct / 100} tone={VIOLET} />
              </span>
            }
            icon={Trophy}
            tone={VIOLET}
          />
        </motion.div>

        <Section title="Ressources" icon={Coins} tone={CYAN} aside={<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">par heure, bonus compris</span>}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {commons.map((r) => {
              const total = r.perHourHome + r.perHourColonies;
              const homeShare = total > 0 ? r.perHourHome / total : 1;
              const fill = ratio(r.stock, st.economy.capacity);
              const full = st.economy.full.includes(r.name);
              return (
                <motion.div key={r.id} variants={rise} whileHover={{ y: -2 }} className="hud-cut relative min-w-0 border border-white/[0.07] bg-white/[0.025] p-3">
                  <div className="flex items-center gap-2">
                    <ResourceIcon id={r.id} className="h-7 w-7 text-xl" />
                    <span className="min-w-0 truncate text-sm text-slate-200">{r.name}</span>
                    {full && (
                      <HudTag tone="gold" className="ml-auto">
                        plein
                      </HudTag>
                    )}
                  </div>
                  <p className="mt-2 font-mono text-2xl text-white">
                    <Num value={total} />
                    <span className="ml-1 text-xs text-slate-500">/ h</span>
                  </p>
                  <div className="mt-2 flex h-1.5 overflow-hidden bg-white/[0.06]" title="Planète mère / colonies">
                    <motion.i className="block h-full bg-cyan-glow" initial={{ width: 0 }} whileInView={{ width: `${homeShare * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: "easeOut" }} />
                    <motion.i className="block h-full bg-violet-glow" initial={{ width: 0 }} whileInView={{ width: `${(1 - homeShare) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }} />
                  </div>
                  <div className="mt-1 flex justify-between gap-2 font-mono text-[10px]">
                    <span className="text-cyan-glow/80">mère {n(r.perHourHome)}</span>
                    <span className="text-violet-glow/80">colonies {n(r.perHourColonies)}</span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-[11px]">
                    <span className="text-slate-500">Stock mère</span>
                    <span className="font-mono text-slate-300">
                      {n(r.stock)} <span className="text-slate-600">/ {n(st.economy.capacity)}</span>
                    </span>
                  </div>
                  <Bar value={fill} tone={fill >= 0.95 ? GOLD : MINT} className="mt-1 h-1" />
                  {r.stockColonies > 0 && <p className="mt-1 text-right font-mono text-[10px] text-slate-500">+ {n(r.stockColonies)} dans les colonies</p>}
                </motion.div>
              );
            })}
          </motion.div>

          {rares.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {rares.map((r) => (
                <div key={r.id} className="flex min-w-0 items-center gap-2.5 border border-violet-glow/15 bg-violet-glow/[0.04] px-3 py-2">
                  <ResourceIcon id={r.id} className="h-6 w-6 text-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-300">{r.name}</p>
                    <p className="font-mono text-[10px] text-slate-500">{n(r.perHourHome + r.perHourColonies)} / h</p>
                  </div>
                  <span className="font-mono text-sm text-violet-glow">{n(r.stock + r.stockColonies)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Entrepôt / ressource", value: n(st.economy.capacity), tone: undefined },
              { label: "À l'abri du pillage", value: n(st.economy.protectedPerResource), tone: MINT },
              { label: "Entretien (énergie / h)", value: n(st.economy.upkeepPerHour), tone: undefined },
              { label: "Bilan d'énergie / h", value: `${st.economy.energyNetPerHour > 0 ? "+" : ""}${n(st.economy.energyNetPerHour)}`, tone: st.economy.energyNetPerHour < 0 ? DANGER : MINT },
            ].map((x) => (
              <div key={x.label} className="border-l-2 border-white/10 bg-white/[0.02] px-3 py-2">
                <Mini label={x.label} value={x.value} tone={x.tone} />
              </div>
            ))}
          </div>
          {(st.economy.outage || st.economy.full.length > 0) && (
            <p className="flex items-center gap-2 border border-gold-glow/30 bg-gold-glow/[0.06] px-3 py-2 text-xs text-gold-glow">
              <Zap className="h-3.5 w-3.5 shrink-0" />
              {st.economy.outage && "Panne d'énergie : production divisée par deux. "}
              {st.economy.full.length > 0 && `Entrepôt plein : ${st.economy.full.join(", ")}.`}
            </p>
          )}
        </Section>

        <Section title="Planètes" icon={Globe2} tone={VIOLET} aside={<SectionLink to="/game/colonies">Colonies</SectionLink>}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {st.planets.map((p) => {
              const prod = Object.values(p.perHour).reduce((a: number, b) => a + (b ?? 0), 0);
              const stock = Object.values(p.stock).reduce((a: number, b) => a + (b ?? 0), 0);
              const home = p.kind === "home";
              const tone = home ? GOLD : VIOLET;
              return (
                <motion.div key={p.id} variants={rise} whileHover={{ y: -2 }} className="relative min-w-0 overflow-hidden border border-white/[0.07] bg-white/[0.025] p-4">
                  {home && <CornerBrackets color="color-mix(in srgb, var(--color-gold-glow) 60%, transparent)" />}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-60"
                    style={{ background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${tone} 55%, white 10%), color-mix(in srgb, ${tone} 20%, transparent) 55%, transparent 70%)`, boxShadow: `0 0 40px color-mix(in srgb, ${tone} 30%, transparent)` }}
                  />
                  <div className="relative flex flex-wrap items-center gap-2">
                    <span className="hud-title min-w-0 truncate text-sm text-white">{p.name}</span>
                    {home ? <HudTag tone="gold">Mère</HudTag> : <HudTag tone="accent">Colonie</HudTag>}
                  </div>
                  {!home && p.biome && (
                    <p className="relative mt-0.5 text-[11px] text-slate-500">
                      gisement {p.biome} niv. {p.depositLevel}
                    </p>
                  )}
                  <div className="relative mt-3 grid grid-cols-3 gap-2">
                    <Mini label="Niveaux" value={p.levels} />
                    <Mini label="Stock" value={n(stock)} />
                    <Mini label="Défense" value={n(p.defensePower)} tone={MINT} />
                  </div>
                  <div className="relative mt-3">
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-slate-500">Production / h</span>
                      <span className="font-mono text-slate-200">{n(prod)}</span>
                    </div>
                    <Bar value={prod / maxPlanetProd} tone={tone} className="mt-1" />
                  </div>
                  <div className="relative mt-3">
                    <p className="mb-1 text-[11px] text-slate-500">Places de défense</p>
                    <Places used={p.defensePlaces.used} capacity={p.defensePlaces.capacity} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </Section>

        <Section title="Armée" icon={Rocket} tone={EMBER} aside={<SectionLink to="/game/unites">Unités</SectionLink>}>
          <div className="grid gap-4 sm:grid-cols-[auto_auto_1fr] sm:items-center">
            <Ring label="Hangars d'attaque (à quai et en vol)" value={m.attackPlaces.used} max={m.attackPlaces.capacity} tone={ratio(m.attackPlaces.used, m.attackPlaces.capacity) >= 0.9 ? EMBER : CYAN} />
            <Ring label="Hangars de défense (planète mère)" value={m.defensePlaces.used} max={m.defensePlaces.capacity} tone={ratio(m.defensePlaces.used, m.defensePlaces.capacity) >= 0.9 ? EMBER : MINT} />
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Attaque à quai", value: m.attackHome, tone: EMBER },
                { label: "Attaque en vol", value: m.attackAway, tone: GOLD },
                { label: "Défense mère (brute)", value: m.homeDefense, tone: MINT },
                { label: "Défense colonies", value: m.coloniesDefense, tone: VIOLET },
              ].map((x) => (
                <div key={x.label} className="border-l-2 bg-white/[0.02] px-3 py-2" style={{ borderColor: `color-mix(in srgb, ${x.tone} 50%, transparent)` }}>
                  <Mini label={x.label} value={<Num value={x.value} />} tone={x.tone} />
                </div>
              ))}
            </div>
          </div>

          {m.units.length === 0 ? (
            <EmptyState size="sm" icon="🚀" title="Aucune unité" action={<EmptyAction to="/game/unites">Construire une flotte</EmptyAction>} />
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="py-2 pr-3 font-normal">Unité</th>
                    <th className="py-2 pr-3 text-right font-normal">Niv.</th>
                    <th className="py-2 pr-3 text-right font-normal">À quai</th>
                    <th className="py-2 pr-3 text-right font-normal">En vol</th>
                    <th className="py-2 pr-3 text-right font-normal">Colonies</th>
                    <th className="py-2 pr-3 text-right font-normal">ATK</th>
                    <th className="py-2 pr-3 text-right font-normal">DEF</th>
                    <th className="w-40 py-2 pr-3 font-normal">Puissance</th>
                    <th className="py-2 text-right font-normal">Places</th>
                  </tr>
                </thead>
                <tbody>
                  {m.units.map((u, i) => {
                    const tone = u.category === "defense" ? MINT : EMBER;
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.03 }}
                        className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="py-2 pr-3">
                          <span className="flex items-center gap-2 text-slate-200">
                            <span aria-hidden className="h-2 w-2 shrink-0 rotate-45" style={{ background: tone, boxShadow: `0 0 6px ${tone}` }} />
                            {u.name}
                            <span className="text-[10px] text-slate-500">{u.category === "defense" ? "défense" : "flotte"}</span>
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right font-mono text-slate-400">{u.level}</td>
                        <td className="py-2 pr-3 text-right font-mono text-slate-200">{n(u.home)}</td>
                        <td className="py-2 pr-3 text-right font-mono text-gold-glow">{u.away ? n(u.away) : <span className="text-slate-600">—</span>}</td>
                        <td className="py-2 pr-3 text-right font-mono text-violet-glow">{u.colonies ? n(u.colonies) : <span className="text-slate-600">—</span>}</td>
                        <td className="py-2 pr-3 text-right font-mono text-slate-300">{n(u.attack)}</td>
                        <td className="py-2 pr-3 text-right font-mono text-slate-300">{n(u.defense)}</td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <Bar value={u.power / maxUnitPower} tone={tone} className="flex-1" />
                            <span className="w-12 text-right font-mono text-slate-200">{n(u.power)}</span>
                          </div>
                        </td>
                        <td className="py-2 text-right font-mono text-slate-400">{n(u.places)}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-slate-500">Puissance : ATK pour la flotte, ATK + DEF pour les défenses (comme au combat), avant le bonus à domicile et tes bonus de commandement.</p>
        </Section>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Flottes en vol" icon={Gauge} tone={GOLD} aside={<SectionLink to="/game/galaxie">Galaxie</SectionLink>}>
            {st.fleets.inFlight === 0 ? (
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="hud-cut-sm grid h-10 w-10 shrink-0 place-items-center border border-dashed border-white/15">
                  <Rocket className="h-4 w-4 text-slate-500" />
                </span>
                Aucune flotte en mission : toute ton armée est à quai.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-6">
                  <div>
                    <p className="font-mono text-4xl text-gold-glow">
                      <Num value={st.fleets.inFlight} />
                    </p>
                    <p className="text-xs text-slate-500">flotte(s) en mission</p>
                  </div>
                  <div>
                    <p className="font-mono text-4xl text-white">
                      <Num value={st.fleets.unitsAway} />
                    </p>
                    <p className="text-xs text-slate-500">vaisseaux hors de la base</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(st.fleets.byMission) as [FleetMission, number][]).map(([mission, count]) => (
                    <HudTag key={mission} tone={mission === "attack" ? "ember" : "accent"}>
                      {FLEET_MISSION_LABELS[mission]} × {count}
                    </HudTag>
                  ))}
                </div>
              </>
            )}
          </Section>

          <Section title="Développement" icon={BarChart3} tone={CYAN}>
            <div className="flex flex-wrap justify-around gap-4">
              <Ring label="Bâtiments débloqués" value={st.development.buildingsUnlocked} max={st.development.buildingsTotal} tone={CYAN} />
              <Ring label="Technologies recherchées" value={st.development.techResearched} max={st.development.techTotal} tone={VIOLET} />
            </div>
            <div>
              <Row label="Niveaux de bâtiments (planète mère)">{n(st.development.buildingLevels)}</Row>
              <Row label="Niveaux de technologies">{n(st.development.techLevels)}</Row>
              <Row label="Technologies au maximum">{st.development.techMaxed}</Row>
              <Row label="Ascensions" tone={o.ascensions > 0 ? GOLD : undefined}>
                {o.ascensions}
              </Row>
            </div>
          </Section>
        </div>

        <Section title="État-major et bonus" icon={Sparkles} tone={GOLD} aside={<SectionLink to="/game/etat-major">État-major</SectionLink>}>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Officiers en poste {st.command.active.length} / {st.command.slots}
              </p>
              <div className="flex gap-1">
                {Array.from({ length: st.command.slots }, (_, i) => (
                  <span key={i} className={cn("h-1.5 flex-1", i < st.command.active.length ? "bg-gold-glow shadow-[0_0_8px_var(--color-gold-glow)]" : "bg-white/[0.08]")} />
                ))}
              </div>
              {st.command.active.length === 0 ? (
                <EmptyState size="sm" icon="🎖️" title="Aucun officier en poste" action={<EmptyAction to="/game/etat-major">Nommer un officier</EmptyAction>} />
              ) : (
                st.command.active.map((c) => (
                  <motion.div key={c.id} whileHover={{ x: 3 }} className="flex items-center gap-3 border border-gold-glow/15 bg-gold-glow/[0.04] px-3 py-2">
                    <span className="hud-cut grid h-8 w-8 shrink-0 place-items-center border border-gold-glow/40 font-mono text-xs text-gold-glow">{c.level}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-100">{c.name}</p>
                      <p className="truncate text-[11px] text-slate-500">{c.title}</p>
                    </div>
                  </motion.div>
                ))
              )}
              <p className="text-[11px] text-slate-500">
                {st.command.recruited} recruté(s) · {st.command.dossiers} dossier(s)
              </p>
              <div className="mt-1 border-t border-white/5 pt-2">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-400">Talents d'Ascension</span>
                  <span className="font-mono text-slate-200">
                    {st.command.talents.spent} / {st.command.talents.total}
                  </span>
                </div>
                <Bar value={ratio(st.command.talents.spent, st.command.talents.total)} tone={VIOLET} className="mt-1" />
                {st.command.talents.free > 0 && <p className="mt-1 text-[11px] text-violet-glow">{st.command.talents.free} point(s) à dépenser</p>}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Reliques équipées ({st.command.relicsEquipped.length}) · {st.command.relicsOwned} en collection
              </p>
              {st.command.relicsEquipped.length === 0 ? (
                <EmptyState size="sm" icon="🏺" title="Aucune relique équipée" action={<EmptyAction to="/game/etat-major">Équiper une relique</EmptyAction>} />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {st.command.relicsEquipped.map((r, i) => (
                    <motion.span key={i} whileHover={{ scale: 1.04 }} className="hud-cut-sm border border-violet-glow/30 bg-violet-glow/[0.07] px-2.5 py-1.5 text-xs text-violet-glow">
                      {r}
                    </motion.span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Bonus actifs (officiers, reliques, talents, secteurs)</p>
              {bonusRows.length === 0 && st.command.modifiers.spyLevel <= 0 ? (
                <EmptyState size="sm" icon="✨" title="Aucun bonus actif" action={<EmptyAction to="/game/labo">Ouvrir le Labo</EmptyAction>} />
              ) : (
                <>
                  {bonusRows.map((b) => (
                    <div key={b.key} className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="text-slate-400">{b.label}</span>
                        <span className={cn("font-mono", b.sign === "−" ? "text-cyan-glow" : "text-mint-glow")}>
                          {b.sign}
                          {pct(b.value, 1)}
                        </span>
                      </div>
                      <Bar value={b.value / bonusMax} tone={b.sign === "−" ? CYAN : MINT} className="h-1" />
                    </div>
                  ))}
                  {st.command.modifiers.spyLevel > 0 && (
                    <Row label="Niveaux d'espionnage" tone={MINT}>
                      +{st.command.modifiers.spyLevel.toFixed(1).replace(".", ",")}
                    </Row>
                  )}
                </>
              )}
            </div>
          </div>
        </Section>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Menaces" icon={Skull} tone={DANGER} aside={<SectionLink to="/game/menaces">Menaces</SectionLink>}>
            {st.threats.length === 0 ? (
              <EmptyState size="sm" icon="☮️" title="Aucune faction active">Le secteur est calme pour l'instant.</EmptyState>
            ) : (
              <div className="flex flex-col gap-3">
                {st.threats.map((t) => {
                  const r = ratio(t.notoriety, t.maxNotoriety);
                  const tone = r >= 0.75 ? DANGER : r >= 0.4 ? EMBER : MINT;
                  return (
                    <div key={t.id} className="border-l-2 bg-white/[0.02] px-3 py-2" style={{ borderColor: `color-mix(in srgb, ${tone} 60%, transparent)` }}>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-sm text-slate-100">{t.name}</span>
                        <span className="ml-auto font-mono text-[11px] text-slate-400">
                          notoriété {t.notoriety} / {t.maxNotoriety}
                        </span>
                      </div>
                      <Bar value={r} tone={tone} className="mt-1.5 h-1" />
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px]">
                        <span className="text-mint-glow">{t.raidsWon} repoussé(s)</span>
                        <span className="text-danger-glow">{t.raidsLost} perdu(s)</span>
                        <span className="text-slate-400">{t.lairsTaken} repaire(s)</span>
                        <span className={t.adapt > 1 ? "text-ember-glow" : "text-slate-500"}>adaptation ×{t.adapt.toFixed(2).replace(".", ",")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          <Section title="Progression" icon={Trophy} tone={MINT}>
            <div className="flex flex-wrap justify-around gap-4">
              <Ring label="Succès obtenus" value={st.progression.achievements} max={st.progression.achievementsTotal} tone={MINT} />
              <Ring label="Passe de saison" value={st.progression.passTier} max={st.progression.passTiers} tone={GOLD} />
            </div>
            <div>
              <Row label="Points de passe">{n(st.progression.passPoints)}</Row>
              <Row label="Chapitres des Chroniques terminés">{st.progression.chapters}</Row>
              <Row label="Sceaux de boss de saison">{st.progression.seals}</Row>
              <Row label="Série de connexion" tone={st.progression.streak > 0 ? GOLD : undefined}>
                {st.progression.streak} j <span className="text-slate-500">(record {st.progression.bestStreak})</span>
              </Row>
              <Row label="Titres">{st.progression.titles}</Row>
              <Row label="Temps de jeu">{o.playtimeHours} h</Row>
              <Row label="Ancienneté">{o.accountDays} jour(s)</Row>
            </div>
          </Section>
        </div>

        <Section title="Carrière" icon={Crown} tone={VIOLET}>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {st.career.map((c) => (
              <motion.div key={c.label} variants={rise} whileHover={{ y: -2 }} className="min-w-0 border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <p className="font-mono text-xl text-white">
                  <Num value={c.value} />
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{c.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </Section>
      </div>
    </MotionConfig>
  );
}
