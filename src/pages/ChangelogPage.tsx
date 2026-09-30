import { useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Markdown } from "@/components/ui/markdown";
import { CHANGELOG, markChangelogSeen, useChangelogStore } from "@/lib/changelog";

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function ChangelogPage() {
  // Photo de l'état « lu » à l'ouverture : les entrées nouvelles gardent leur
  // badge pendant la visite, puis tout est marqué comme lu.
  const seenAtOpen = useChangelogStore.getState().seen;
  useEffect(() => {
    markChangelogSeen();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Journal" title="Nouveautés" description="Les dernières mises à jour du jeu." />
      {CHANGELOG.length === 0 && <p className="text-sm text-slate-500">Aucune mise à jour publiée pour l'instant.</p>}
      <div className="flex flex-col gap-3">
        {CHANGELOG.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.04 }}
          >
            <Card className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="font-display text-base text-white">{entry.title}</h2>
                {entry.id > seenAtOpen && <Badge variant="success">Nouveau</Badge>}
                <span className="ml-auto text-xs text-slate-500">{formatDate(entry.date)}</span>
              </div>
              <Markdown source={entry.body} />
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
