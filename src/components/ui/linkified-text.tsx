import { Fragment } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

/* Texte de message (v3.8) : les liens de rapports partagés deviennent des
   boutons, les autres liens http(s) restent cliquables. */

const LINK_RE = /(https?:\/\/[^\s]+|\/game\/rapport\/[a-z0-9]{6,30})/gi;

export function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(LINK_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const report = part.match(/\/game\/rapport\/([a-z0-9]{6,30})/i);
        const sameSite = !part.startsWith("http") || part.startsWith(window.location.origin);
        if (report && sameSite) {
          return (
            <Link key={i} to={`/game/rapport/${report[1]}`} className="mx-0.5 inline-flex items-center gap-1 border border-cyan-glow/30 bg-cyan-glow/10 px-1.5 py-px text-xs font-semibold text-cyan-glow hover:bg-cyan-glow/20">
              <FileText className="h-3 w-3" /> Rapport partagé
            </Link>
          );
        }
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-cyan-glow underline underline-offset-2">
            {part}
          </a>
        );
      })}
    </>
  );
}
