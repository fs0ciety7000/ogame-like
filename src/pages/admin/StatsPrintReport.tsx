import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type { GameStats } from "@/game/analytics";
import { assetUrl } from "@/lib/assets";
import { formatCompact, formatNumber } from "@/lib/utils";

/* =====================================================
   v4.8 : rapport de statistiques imprimable (export PDF par l'impression
   du navigateur). Rendu dans #print-root, seul élément visible à
   l'impression ; mise en page A4 aux couleurs du jeu.
===================================================== */

const C = {
  bg: "#060a14",
  panel: "#0c1324",
  line: "rgba(75, 232, 255, 0.18)",
  cyan: "#4be8ff",
  gold: "#ffc861",
  mint: "#5ef2b0",
  danger: "#ff5d6c",
  text: "#e2e8f0",
  muted: "#8a96ad",
};

function Section({ title, children, breakBefore }: { title: string; children: ReactNode; breakBefore?: boolean }) {
  return (
    <section className="print-avoid-break" style={{ marginTop: 18, breakBefore: breakBefore ? "page" : undefined }}>
      <h2 style={{ fontFamily: "var(--font-display, inherit)", fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: C.cyan, borderBottom: `1px solid ${C.line}`, paddingBottom: 4, marginBottom: 10 }}>{title}</h2>
      {children}
    </section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, padding: "10px 12px", clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>
      <div style={{ fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted }}>{label}</div>
      <div style={{ fontSize: 22, color: C.text, marginTop: 2, fontWeight: 600 }}>{value}</div>
      {hint && <div style={{ fontSize: 8.5, color: C.muted, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function Bar({ label, value, max, display, color = C.cyan }: { label: string; value: number; max: number; display: string; color?: string }) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "34% 1fr 16%", alignItems: "center", gap: 6, fontSize: 9, marginBottom: 4 }}>
      <span style={{ color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
        <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ color: C.muted, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{display}</span>
    </div>
  );
}

function Grid({ cols, children }: { cols: number; children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 10 }}>{children}</div>;
}

function Box({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="print-avoid-break" style={{ background: C.panel, border: `1px solid ${C.line}`, padding: 10 }}>
      <div style={{ fontSize: 9.5, fontWeight: 600, color: C.text, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

export function StatsPrintReport({ stats }: { stats: GameStats }) {
  const host = document.getElementById("print-root") ?? (() => {
    const el = document.createElement("div");
    el.id = "print-root";
    document.body.appendChild(el);
    return el;
  })();
  const { players, economy, units, missions, combat, insights, balance, retention } = stats;
  const winRate = combat.attacks > 0 ? Math.round((combat.outcomes.attacker_win / combat.attacks) * 100) : 0;
  const maxRank = Math.max(1, ...players.ranks.map((r) => r.count));
  const maxDay = Math.max(1, ...combat.perDay.map((d) => d.count));
  const maxUnits = Math.max(1, ...units.map((u) => u.total));
  const maxMission = Math.max(1, ...missions.map((m) => m.running));
  const date = new Date(stats.generatedAt);
  const days = retention?.daily ?? [];
  const maxActive = Math.max(1, ...days.map((d) => d.active));

  return createPortal(
    <div style={{ background: C.bg, color: C.text, fontFamily: "Inter, system-ui, sans-serif", padding: "0 2mm" }}>
      {/* Couverture */}
      <header style={{ position: "relative", overflow: "hidden", border: `1px solid ${C.line}`, padding: "22px 20px", background: `radial-gradient(circle at 85% 20%, rgba(75,232,255,0.18), transparent 55%), radial-gradient(circle at 10% 100%, rgba(255,200,97,0.12), transparent 50%), ${C.panel}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={assetUrl("/assets/logo/logo.webp")} alt="" style={{ width: 54, height: 54, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: C.cyan }}>COSMIC EMPIRES · ADMINISTRATION</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.04em", marginTop: 2 }}>Rapport d'activité du secteur</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
              Calculé le {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} à {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      </header>

      <Section title="Indicateurs clés">
        <Grid cols={5}>
          <Kpi label="Joueurs" value={players.total} hint={`${players.new7d} nouveau(x) en 7 j`} />
          <Kpi label="Actifs 24 h" value={players.active24h} hint={`${Math.round((players.active24h / Math.max(1, players.total)) * 100)} % des joueurs`} />
          <Kpi label="Actifs 7 jours" value={players.active7d} />
          <Kpi label="Temps de jeu médian" value={`${players.medianPlaytimeHours} h`} />
          <Kpi label={`Combats (${combat.windowDays} j)`} value={combat.attacks} hint={`${winRate} % gagnés par l'attaquant`} />
        </Grid>
      </Section>

      {insights.length > 0 && (
        <Section title="Pistes d'équilibrage">
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 9.5, lineHeight: 1.55, color: C.text }}>
            {insights.map((i) => (
              <li key={i} style={{ marginBottom: 2 }}>
                <span style={{ color: C.gold }}>▸ </span>
                {i}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {retention && (
        <Section title="Rétention">
          <Grid cols={2}>
            <Box title={`Joueurs actifs par jour (${days.length} j)`}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 70 }}>
                {days.map((d) => (
                  <div key={d.day} title={`${d.day} : ${d.active}`} style={{ flex: 1, height: `${Math.max(2, (d.active / maxActive) * 100)}%`, background: C.cyan, opacity: 0.85 }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: C.muted, marginTop: 4 }}>
                <span>{days[0]?.day ?? ""}</span>
                <span>{days[days.length - 1]?.day ?? ""}</span>
              </div>
            </Box>
            <Box title="Cohortes hebdomadaires">
              <table style={{ width: "100%", fontSize: 9, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: C.muted, textAlign: "left" }}>
                    <th>Semaine</th>
                    <th>Inscrits</th>
                    <th>J+1</th>
                    <th>J+7</th>
                    <th>Actifs</th>
                  </tr>
                </thead>
                <tbody>
                  {retention.cohorts.map((c) => (
                    <tr key={c.week} style={{ borderTop: `1px solid ${C.line}` }}>
                      <td>{c.week}</td>
                      <td>{c.signups}</td>
                      <td>{c.d1Pct === null ? "—" : `${c.d1Pct} %`}</td>
                      <td>{c.d7Pct === null ? "—" : `${c.d7Pct} %`}</td>
                      <td>{c.activeNowPct} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Grid>
          {retention.funnel.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <Box title={`Prise en main (${retention.recentPlayers} joueurs récents)`}>
                {retention.funnel.map((f) => (
                  <Bar key={f.id} label={f.label} value={f.pct} max={100} display={`${f.pct} %`} color={C.mint} />
                ))}
              </Box>
            </div>
          )}
        </Section>
      )}

      <Section title="Joueurs et combats" breakBefore>
        <Grid cols={3}>
          <Box title="Répartition des rangs">
            {players.ranks.map((r) => (
              <Bar key={r.label} label={r.label} value={r.count} max={maxRank} display={String(r.count)} color={C.gold} />
            ))}
            <div style={{ fontSize: 8.5, color: C.muted, marginTop: 4 }}>XP médiane : {formatNumber(players.medianXp)}</div>
          </Box>
          <Box title="Meilleurs joueurs (XP)">
            {players.topXp.map((p, i) => (
              <div key={p.pseudo} style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 3 }}>
                <span>
                  <span style={{ color: C.muted, marginRight: 6 }}>#{i + 1}</span>
                  {p.pseudo}
                </span>
                <span style={{ color: C.muted }}>{formatNumber(p.xp)}</span>
              </div>
            ))}
          </Box>
          <Box title={`Combats par jour (${combat.windowDays} j)`}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 70 }}>
              {combat.perDay.map((d) => (
                <div key={d.day} style={{ flex: 1, height: `${Math.max(2, (d.count / maxDay) * 100)}%`, background: C.danger, opacity: 0.85 }} />
              ))}
            </div>
            <div style={{ fontSize: 8.5, color: C.muted, marginTop: 6 }}>
              Victoires attaquant {combat.outcomes.attacker_win} · défenseur {combat.outcomes.defender_win} · nuls {combat.outcomes.draw} · butin moyen {formatCompact(combat.avgLoot)}
            </div>
          </Box>
        </Grid>
      </Section>

      <Section title="Économie">
        <table style={{ width: "100%", fontSize: 9, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: C.muted, textAlign: "left" }}>
              <th>Ressource</th>
              <th style={{ textAlign: "right" }}>Stock médian</th>
              <th style={{ textAlign: "right" }}>Stock total</th>
              <th style={{ textAlign: "right" }}>Production médiane</th>
            </tr>
          </thead>
          <tbody>
            {economy.resources.map((r) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${C.line}` }}>
                <td style={{ padding: "3px 0" }}>{r.name}</td>
                <td style={{ textAlign: "right" }}>{formatCompact(r.median)}</td>
                <td style={{ textAlign: "right" }}>{formatCompact(r.total)}</td>
                <td style={{ textAlign: "right" }}>{r.medianRate > 0 ? `+${formatCompact(r.medianRate)}/s` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 8.5, color: C.muted, marginTop: 6 }}>
          Flux sur {balance.windowDays} j : production {formatCompact(balance.flows.productionPerHour)}/h · dépensé {formatCompact(balance.flows.spentTotal)} · pillé {formatCompact(balance.flows.lootWindow)} · échangé au marché {formatCompact(balance.flows.tradedTotal)} ({balance.flows.marketTrades} échanges, taxe {formatCompact(balance.flows.marketTax)})
        </div>
      </Section>

      <Section title="Flottes et missions">
        <Grid cols={2}>
          <Box title="Unités en service">
            {units.slice(0, 14).map((u) => (
              <Bar key={u.id} label={u.name} value={u.total} max={maxUnits} display={formatCompact(u.total)} />
            ))}
          </Box>
          <Box title="Missions en cours">
            {missions.map((m) => (
              <Bar key={m.key} label={m.name} value={m.running} max={maxMission} display={String(m.running)} color={C.mint} />
            ))}
          </Box>
        </Grid>
      </Section>

      <footer style={{ marginTop: 18, paddingTop: 6, borderTop: `1px solid ${C.line}`, fontSize: 8, color: C.muted, display: "flex", justifyContent: "space-between" }}>
        <span>Cosmic Empires · document interne</span>
        <span>empire.fs0ciety.org</span>
      </footer>
    </div>,
    host,
  );
}
