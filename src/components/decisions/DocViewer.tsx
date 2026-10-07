import { useMemo } from "react";
import { ExternalLink, FileText, X } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { renderMarkdown } from "@/game/blogMarkdown";

/* 6.14.42 : lecture d'un document dans /decisions (version en direct ou du build), sans passer par GitHub.
   Le rendu est celui du devblog (`renderMarkdown`, HTML échappé). */

export function DocViewer({ path, content, url, onClose }: { path: string; content: string; url: string; onClose: () => void }) {
  const html = useMemo(() => renderMarkdown(content).html, [content]);
  return (
    <HudPanel
      icon={<FileText className="h-4 w-4" />}
      title={<span className="break-all font-mono text-sm">{path}</span>}
      aside={
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="ghost">
            <a href={url} target="_blank" rel="noreferrer" aria-label="Ouvrir sur GitHub">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="Fermer le document">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      }
    >
      <div className="prose max-h-[70vh] min-w-0 overflow-y-auto overflow-x-auto text-sm" dangerouslySetInnerHTML={{ __html: html }} />
    </HudPanel>
  );
}
