import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Coins, Gauge, Package } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HudPanel } from "@/components/ui/panel";
import { GLOSSARY, walletEntries, type WalletEntry } from "@/game/wallet";
import { formatCompact } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";

/* 5.31 (lot D) : portefeuille unique. Chaque monnaie ou jauge : solde, d'où elle vient,
   à quoi elle sert, et un lien vers l'écran qui la fait bouger. Puis le glossaire. */

const GROUPS: { id: WalletEntry["group"]; title: string; icon: React.ReactNode; tone: "accent" | "gold" | "violet" }[] = [
  { id: "ressources", title: "Ressources", icon: <Package />, tone: "accent" },
  { id: "monnaies", title: "Monnaies", icon: <Coins />, tone: "gold" },
  { id: "jauges", title: "Jauges", icon: <Gauge />, tone: "violet" },
];

function EntryRow({ entry }: { entry: WalletEntry }) {
  return (
    <li>
      <Link to={entry.link} className="glass-panel hud-cut-sm flex flex-col gap-2 p-3 transition-colors hover:border-cyan-glow/40 sm:flex-row sm:items-start sm:gap-4">
        <span className="flex min-w-0 items-baseline justify-between gap-3 sm:w-56 sm:flex-col sm:justify-start sm:gap-0.5">
          <span className="text-sm text-slate-100">{entry.name}</span>
          {entry.value !== null && <span className="font-mono text-lg tabular-nums text-slate-100">{formatCompact(entry.value)}</span>}
          {entry.sub && <span className="hidden text-[11px] text-slate-500 sm:block">{entry.sub}</span>}
        </span>
        <span className="grid min-w-0 flex-1 grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
          <span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-mint-glow">D'où ça vient</span>
            <span className="block text-slate-300">{entry.earn}</span>
          </span>
          <span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-gold-glow">À quoi ça sert</span>
            <span className="block text-slate-300">{entry.spend}</span>
          </span>
        </span>
        <ChevronRight className="hidden h-4 w-4 shrink-0 self-center text-slate-500 sm:block" />
      </Link>
    </li>
  );
}

export function WalletPage() {
  const player = usePlayerStore((s) => s.player);
  if (!player) return null;
  const entries = walletEntries(player, Date.now());
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Empire" title="Portefeuille" description="Tout ce que tu possèdes, d'où ça vient et à quoi ça sert." />
      {GROUPS.map((g) => (
        <HudPanel key={g.id} icon={g.icon} title={g.title} tone={g.tone}>
          <ul className="flex flex-col gap-2">
            {entries
              .filter((e) => e.group === g.id)
              .map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
          </ul>
        </HudPanel>
      ))}
      <HudPanel icon={<BookOpen />} title="Les mots du jeu" tone="accent">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.term}>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-cyan-glow">{g.term}</dt>
              <dd className="text-sm text-slate-300">{g.meaning}</dd>
            </div>
          ))}
        </dl>
      </HudPanel>
    </div>
  );
}
