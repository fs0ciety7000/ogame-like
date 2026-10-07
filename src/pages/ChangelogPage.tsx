import { Newspaper } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { assetUrl } from "@/lib/assets";
import { EmptyState } from "@/components/ui/hud";
import { useEffect, useState } from "react";
import { ShowMoreButton } from "@/components/ui/panel";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChangelogBadgePill, Markdown } from "@/components/ui/markdown";
import { countBadges } from "@/lib/changelogBadges";
import { CURRENT_VERSION, isUnread, markChangelogSeen, useChangelogStore } from "@/lib/changelog";
import { CHANGELOG } from "@/lib/changelogEntries";

const STEP = 10;

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : formatDateTime(d, "date");
}

export function ChangelogPage() {
  // Photo de l'état « lu » à l'ouverture : les entrées nouvelles gardent leur
  // badge pendant la visite, puis tout est marqué comme lu.
  const seenAtOpen = useChangelogStore.getState().seen;
  // AU13 : la page affichait toutes les notes d'un bloc (180 000 px à 375 px) ; par tranches de 10, les plus récentes d'abord.
  const [shown, setShown] = useState(STEP);
  useEffect(() => {
    markChangelogSeen();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Journal" title="Nouveautés" description={CURRENT_VERSION ? `Les dernières mises à jour du jeu — version actuelle : v${CURRENT_VERSION}.` : "Les dernières mises à jour du jeu."} />
      {CHANGELOG.length === 0 && <EmptyState icon={<Newspaper />} title="Aucune mise à jour">Les nouveautés du jeu s'afficheront ici.</EmptyState>}
      <div className="flex flex-col gap-3">
        {CHANGELOG.slice(0, shown).map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.04 }}
          >
            <Card className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {entry.version && (
                  <span className="hud-chip hud-chip-sm hud-tone-accent">
                    v{entry.version}
                  </span>
                )}
                <h2 className="font-display text-base text-slate-100">{entry.title}</h2>
                {isUnread(entry.id, seenAtOpen) && <Badge variant="success">Nouveau</Badge>}
                <span className="ml-auto text-xs text-slate-500">
                  {entry.iteration !== null && <>Itération {entry.iteration} · </>}
                  {formatDate(entry.date)}
                </span>
              </div>
              {countBadges(entry.body).length > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {countBadges(entry.body).map(({ badge, count }) => (
                    <span key={badge.id} className="inline-flex items-center text-xs text-slate-400">
                      <ChangelogBadgePill badge={badge} className="mr-1" />
                      {count} {count > 1 ? badge.plural.toLowerCase() : badge.label.toLowerCase()}
                    </span>
                  ))}
                </div>
              )}
              {entry.image && <img src={assetUrl(entry.image)} alt="" className="mb-3 max-h-80 w-full object-cover object-top" />}
              <Markdown source={entry.body} />
            </Card>
          </motion.div>
        ))}
        {CHANGELOG.length > shown && <ShowMoreButton more={CHANGELOG.length - shown} step={STEP} onClick={() => setShown((n) => n + STEP)} />}
      </div>
    </div>
  );
}
