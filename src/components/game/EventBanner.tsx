import { useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CalendarClock, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { currentOrNextEvent, eventAt } from "@/game/events";
import { currentSeasonId, seasonEndMs, seasonLabel } from "@/game/seasons";
import { useNowTicker } from "@/hooks/useNowTicker";
import { showBrowserNotification } from "@/store/browserNotifyStore";
import { formatDuration } from "@/lib/utils";

const SEEN_KEY = "cosmic-empires:last-event";

function remaining(ms: number) {
  return formatDuration(Math.max(0, (ms - Date.now()) / 1000));
}

/** Annonce une fois le début d'un événement (toast + notification système). */
function useEventAnnouncer(key: string | undefined, title: string, body: string) {
  useEffect(() => {
    if (!key) return;
    try {
      if (localStorage.getItem(SEEN_KEY) === key) return;
      localStorage.setItem(SEEN_KEY, key);
    } catch {
      /* stockage indisponible : annonce à chaque chargement, tant pis */
    }
    toast(title, { description: body, icon: "🎉", duration: 8000 });
    showBrowserNotification(`🎉 ${title}`, body, key);
  }, [key, title, body]);
}

/** Pastille de l'en-tête : événement du week-end en cours. */
export function EventBadge() {
  useNowTicker();
  const event = eventAt(Date.now());
  useEventAnnouncer(event?.key, event ? `Événement : ${event.type.name}` : "", event?.type.description ?? "");
  if (!event) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/game"
          className="flex items-center gap-1.5 rounded-lg border border-gold-glow/50 bg-gold-glow/10 px-2 py-1 text-[11px] font-semibold text-gold-glow"
        >
          <span>{event.type.emoji}</span>
          {event.type.name} · {remaining(event.endMs)}
        </Link>
      </TooltipTrigger>
      <TooltipContent>{event.type.description}</TooltipContent>
    </Tooltip>
  );
}

/** Carte du tableau de bord : événement en cours ou prochain, fin de saison. */
export function EventCard() {
  useNowTicker();
  const now = Date.now();
  const event = currentOrNextEvent(now);
  const active = event !== null && event.startMs <= now;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-gold-glow" />
        <h3 className="font-display text-sm text-white">Événements et saison</h3>
      </div>
      {event ? (
        <div className={active ? "rounded-lg border border-gold-glow/40 bg-gold-glow/10 p-3" : "rounded-lg bg-black/20 p-3"}>
          <p className="text-sm font-semibold text-slate-100">
            {event.type.emoji} {event.type.name}
            <span className={active ? "ml-2 text-xs text-gold-glow" : "ml-2 text-xs text-slate-400"}>
              {active ? `en cours · fin dans ${remaining(event.endMs)}` : `dans ${remaining(event.startMs)}`}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-400">{event.type.description}</p>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Aucun événement programmé.</p>
      )}
      <Link to="/game/palmares" className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
        <Trophy className="h-3.5 w-3.5 text-gold-glow" />
        Saison {seasonLabel(currentSeasonId(now))} : fin dans {remaining(seasonEndMs(now))}
        <span className="ml-auto text-cyan-glow">Palmarès →</span>
      </Link>
    </Card>
  );
}
