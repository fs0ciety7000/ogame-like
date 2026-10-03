import type { EmpireStats } from "@/game/empireStats";

/* =====================================================
   v5.7 : export des statistiques de l'empire (CSV pour un tableur,
   JSON pour un outil). Le CSV suit le format français : point-virgule
   comme séparateur, BOM UTF-8 pour qu'Excel lise les accents.
===================================================== */

type Row = [section: string, label: string, value: string | number];

const round = (x: number) => Math.round(x * 100) / 100;

export function empireStatsRows(st: EmpireStats): Row[] {
  const o = st.overview;
  const m = st.military;
  const rows: Row[] = [
    ["Joueur", "Pseudo", o.pseudo],
    ["Joueur", "Rang", o.rank],
    ["Joueur", "XP", o.xp],
    ["Joueur", "XP de la saison", o.seasonXp],
    ["Joueur", "Victoires", o.victories],
    ["Joueur", "Défaites", o.defeats],
    ["Joueur", "Victoires (%)", o.winPct],
    ["Joueur", "Temps de jeu (h)", o.playtimeHours],
    ["Joueur", "Ancienneté (jours)", o.accountDays],
    ["Joueur", "Ascensions", o.ascensions],
  ];
  for (const r of st.resources) {
    rows.push(["Ressources", `${r.name} / h (planète mère)`, round(r.perHourHome)]);
    rows.push(["Ressources", `${r.name} / h (colonies)`, round(r.perHourColonies)]);
    rows.push(["Ressources", `${r.name} (stock planète mère)`, r.stock]);
    rows.push(["Ressources", `${r.name} (stock colonies)`, r.stockColonies]);
  }
  rows.push(
    ["Économie", "Production totale / h (communes)", round(st.economy.totalPerHour)],
    ["Économie", "Entrepôt par ressource", st.economy.capacity],
    ["Économie", "À l'abri du pillage", st.economy.protectedPerResource],
    ["Économie", "Entretien (énergie / h)", round(st.economy.upkeepPerHour)],
    ["Économie", "Bilan d'énergie / h", round(st.economy.energyNetPerHour)],
  );
  for (const p of st.planets) {
    const prod = Object.values(p.perHour).reduce((a: number, b) => a + (b ?? 0), 0);
    rows.push([`Planète : ${p.name}`, "Type", p.kind === "home" ? "Planète mère" : "Colonie"]);
    rows.push([`Planète : ${p.name}`, "Niveaux", p.levels]);
    rows.push([`Planète : ${p.name}`, "Production / h", round(prod)]);
    rows.push([`Planète : ${p.name}`, "Défense", Math.round(p.defensePower)]);
    rows.push([`Planète : ${p.name}`, "Places de défense", `${p.defensePlaces.used} / ${p.defensePlaces.capacity}`]);
  }
  rows.push(
    ["Armée", "Attaque (bonus compris)", Math.round(m.modifiedAttack)],
    ["Armée", "Attaque à quai", Math.round(m.attackHome)],
    ["Armée", "Attaque en vol", Math.round(m.attackAway)],
    ["Armée", "Défense planète mère (bonus compris)", Math.round(m.modifiedDefense)],
    ["Armée", "Défense des colonies", Math.round(m.coloniesDefense)],
    ["Armée", "Bouclier (%)", round(m.shieldPct * 100)],
    ["Armée", "Hangars d'attaque", `${m.attackPlaces.used} / ${m.attackPlaces.capacity}`],
    ["Armée", "Hangars de défense", `${m.defensePlaces.used} / ${m.defensePlaces.capacity}`],
  );
  for (const u of m.units) rows.push(["Unités", `${u.name} (niv. ${u.level})`, `${u.home} à quai · ${u.away} en vol · ${u.colonies} en colonies · puissance ${Math.round(u.power)}`]);
  rows.push(["Flottes", "En mission", st.fleets.inFlight], ["Flottes", "Vaisseaux hors de la base", st.fleets.unitsAway]);
  for (const c of st.command.active) rows.push(["État-major", `${c.title} ${c.name}`, `niveau ${c.level}`]);
  for (const r of st.command.relicsEquipped) rows.push(["Reliques équipées", r, ""]);
  rows.push(
    ["Développement", "Niveaux de bâtiments", st.development.buildingLevels],
    ["Développement", "Technologies recherchées", `${st.development.techResearched} / ${st.development.techTotal}`],
    ["Développement", "Technologies au maximum", st.development.techMaxed],
  );
  for (const t of st.threats) rows.push(["Menaces", t.name, `notoriété ${t.notoriety} / ${t.maxNotoriety} · ${t.raidsWon} repoussés · ${t.raidsLost} perdus · ${t.lairsTaken} repaires`]);
  const pg = st.progression;
  rows.push(
    ["Progression", "Succès", `${pg.achievements} / ${pg.achievementsTotal}`],
    ["Progression", "Passe de saison", `palier ${pg.passTier} / ${pg.passTiers}`],
    ["Progression", "Chapitres des Chroniques", pg.chapters],
    ["Progression", "Sceaux de boss", pg.seals],
    ["Progression", "Série de connexion", `${pg.streak} (record ${pg.bestStreak})`],
    ["Progression", "Titres", pg.titles],
  );
  for (const c of st.career) rows.push(["Carrière", c.label, c.value]);
  return rows;
}

function cell(v: string | number): string {
  const s = typeof v === "number" ? String(v).replace(".", ",") : v;
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function empireStatsCsv(st: EmpireStats): string {
  const lines = [["Section", "Statistique", "Valeur"], ...empireStatsRows(st)].map((r) => r.map(cell).join(";"));
  return `\ufeff${lines.join("\r\n")}\r\n`;
}

export function empireStatsJson(st: EmpireStats, now: number): string {
  return JSON.stringify({ exportedAt: new Date(now).toISOString(), game: "Cosmic Empires", ...st }, null, 2);
}

/** Fait télécharger un texte au navigateur. */
export function downloadText(fileName: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Impression (ou PDF via le navigateur) : rapport sobre rendu dans #print-root, seul élément imprimé. */
export function printEmpireReport(st: EmpireStats, now: number): void {
  const host = document.getElementById("print-root") ?? document.body.appendChild(Object.assign(document.createElement("div"), { id: "print-root" }));
  const sections = new Map<string, Row[]>();
  for (const r of empireStatsRows(st)) sections.set(r[0], [...(sections.get(r[0]) ?? []), r]);
  const date = new Date(now).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const blocks = [...sections.entries()]
    .map(
      ([name, rows]) => `<section class="print-avoid-break" style="border:1px solid #1e2a4a;background:#0b1224;padding:8px 10px;margin-top:8px">
<h2 style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#4be8ff;margin:0 0 6px">${esc(name)}</h2>
<table style="width:100%;border-collapse:collapse;font-size:10.5px">${rows
        .map((r) => `<tr><td style="padding:2px 0;color:#94a3b8">${esc(r[1])}</td><td style="padding:2px 0;text-align:right;color:#e2e8f0;font-family:monospace">${esc(typeof r[2] === "number" ? String(r[2]).replace(".", ",") : r[2])}</td></tr>`)
        .join("")}</table></section>`,
    )
    .join("");
  host.innerHTML = `<div style="color:#e2e8f0;font-family:Inter,system-ui,sans-serif">
<header style="border:1px solid #1e2a4a;padding:14px 16px;background:radial-gradient(circle at 85% 20%,rgba(75,232,255,.18),transparent 55%),#0b1224">
<div style="font-size:9px;letter-spacing:.3em;color:#4be8ff">COSMIC EMPIRES · ÉTAT DE L'EMPIRE</div>
<div style="font-size:24px;font-weight:700;margin-top:2px">${esc(st.overview.pseudo)}</div>
<div style="font-size:11px;color:#94a3b8">${esc(st.overview.rank)} · ${esc(date)}</div></header>${blocks}</div>`;
  const clear = () => {
    host.innerHTML = "";
    window.removeEventListener("afterprint", clear);
  };
  window.addEventListener("afterprint", clear);
  window.print();
}
