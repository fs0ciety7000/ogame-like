import { motion } from "framer-motion";
import { PagedList } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/hud";
import { Play, Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { allAnnouncements, announcementOpen } from "@/components/game/Announcement";
import { PollCard } from "@/components/game/PollCard";
import { announcementStatus } from "@/game/announcements";
import { previewAnnouncement, useAnnouncementSettings } from "@/services/announcementService";
import { markAnnouncementsSeen } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* v4.7.1 : toutes les annonces plein écran publiées, à revoir quand on veut. */

export function AnnouncementsPage() {
  const settings = useAnnouncementSettings();
  const seen = usePlayerStore((s) => s.player?.announcementsSeen) ?? [];
  const now = Date.now();
  const list = allAnnouncements(settings).filter((a) => {
    const st = announcementStatus(a.id, settings, now);
    return (st === "live" || st === "ended") && announcementOpen(a, now);
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Journal" title="Annonces" description="Toutes les annonces des mises à jour, de la plus récente à la plus ancienne. Clique pour la revoir en plein écran." />
      {list.length === 0 && <EmptyState icon={<Megaphone />} title="Aucune annonce">Les messages de l'équipe s'afficheront ici.</EmptyState>}
      <PagedList items={list} className="grid gap-3 md:grid-cols-2" render={(a, i) => {
          const gold = a.tone === "gold";
          const art = a.art ?? a.artMobile ?? a.spotlight?.image;
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.04 }}>
              <Card className="group relative flex h-full flex-col overflow-hidden p-0">
                <button type="button" className="flex w-full flex-1 flex-col text-left" onClick={() => {
                    previewAnnouncement(a.id);
                    if (!seen.includes(a.id)) void markAnnouncementsSeen([a.id]).catch(() => undefined);
                  }}>
                  <div className="relative h-36 w-full overflow-hidden bg-space-950">
                    {art && <img src={assetUrl(art)} alt="" loading="lazy" className="h-full w-full object-cover object-[center_70%] transition-transform duration-500 group-hover:scale-105" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/40 to-transparent" />
                    <span className="absolute right-3 top-3 hud-cut-sm grid h-9 w-9 place-items-center border border-white/20 bg-space-950/70 text-slate-100 opacity-80 transition-opacity group-hover:opacity-100">
                      <Play className="h-4 w-4" />
                    </span>
                    {!seen.includes(a.id) && (
                      <span className="absolute left-3 top-3">
                        <Badge variant="success">Nouvelle</Badge>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-4">
                    <p className={cn("hud-eyebrow flex items-center gap-2 text-[11px]", gold ? "text-gold-glow" : "text-danger-glow")}>
                      {a.emblem && <img src={assetUrl(a.emblem)} alt="" className="h-5 w-5" />}
                      {a.eyebrow}
                    </p>
                    <h2 className="font-display text-lg leading-tight text-slate-100">{a.title}</h2>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">{a.text}</p>
                    {a.features && a.features.length > 0 && (
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                        {a.features.map((f) => (
                          <span key={f.title} className="hud-chip hud-chip-sm hud-tone-neutral">
                            {f.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
                {a.poll && <PollCard id={a.id} poll={a.poll} className="m-4 mt-0" />}
              </Card>
            </motion.div>
          );
        }} />
    </div>
  );
}
