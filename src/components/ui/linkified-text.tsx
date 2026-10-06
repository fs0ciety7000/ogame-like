import { Fragment } from "react";
import { Link } from "react-router-dom";
import { FileText, Play } from "lucide-react";
import { useEmojiStore } from "@/services/emojiService";
import { GAME_EMOJIS, splitCustomEmojis } from "@/game/emojis";
import { assetUrl } from "@/lib/assets";
import { KESH_EMOJIS } from "@/game/bounties";
import { isVideoLink } from "@/lib/videoLink";

/* Texte de message (v3.8) : les liens de rapports partagés deviennent des
   boutons, les autres liens http(s) restent cliquables, les emojis
   personnalisés (:code:) s'affichent en image.
   5.24 : un lien vers une vidéo (.mp4, .webm), du jeu (/assets/…) ou en https,
   devient un lecteur dans la bulle (un libellé « Vidéo » dans les aperçus). */

const LINK_RE = /(https?:\/\/[^\s]+|\/game\/rapport\/[a-z0-9]{6,30}|\/assets\/[\w./-]+\.(?:mp4|webm))/gi;
/** Texte avec les emojis personnalisés (:code:) en images. */
function WithEmojis({ text, jumbo = false }: { text: string; jumbo?: boolean }) {
  const emojis = useEmojiStore((s) => s.emojis);
  const tokens = splitCustomEmojis(text, [...GAME_EMOJIS, ...KESH_EMOJIS, ...emojis]);
  // Message fait seulement de 1 à 3 emojis : affichés en grand.
  const big = jumbo && tokens.every((t) => t.type === "emoji" || !t.text.trim()) && tokens.filter((t) => t.type === "emoji").length <= 3;
  return (
    <>
      {tokens.map((t, i) =>
        t.type === "text" ? (
          <Fragment key={i}>{t.text}</Fragment>
        ) : (
          <img key={i} src={assetUrl(t.emoji.url)} alt={`:${t.emoji.code}:`} title={`:${t.emoji.code}:`} className={big ? "inline-block h-14 w-14 object-contain" : "inline-block h-6 w-6 object-contain align-[-0.35em]"} />
        ),
      )}
    </>
  );
}

/** `jumbo` : un message fait seulement de 1 à 3 emojis les affiche en grand
 *  (bulles de discussion ; pas dans les aperçus). */
export function LinkifiedText({ text, jumbo = false, media = jumbo }: { text: string; jumbo?: boolean; media?: boolean }) {
  const parts = text.split(LINK_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <WithEmojis key={i} text={part} jumbo={jumbo && parts.length === 1} />;
        const report = part.match(/\/game\/rapport\/([a-z0-9]{6,30})/i);
        const sameSite = !part.startsWith("http") || part.startsWith(window.location.origin);
        if (report && sameSite) {
          return (
            <Link key={i} to={`/game/rapport/${report[1]}`} className="mx-0.5 inline-flex items-center gap-1 border border-cyan-glow/30 bg-cyan-glow/10 px-1.5 py-px text-xs font-semibold text-cyan-glow hover:bg-cyan-glow/20">
              <FileText className="h-3 w-3" /> Rapport partagé
            </Link>
          );
        }
        if (isVideoLink(part)) {
          const src = part.startsWith("/") ? assetUrl(part) : part;
          return media ? (
            <video key={i} src={src} controls playsInline preload="metadata" className="hud-cut-sm my-1.5 block w-full max-w-sm border border-cyan-glow/25 bg-space-950" aria-label="Vidéo partagée" />
          ) : (
            <span key={i} className="mx-0.5 inline-flex items-center gap-1 border border-cyan-glow/30 bg-cyan-glow/10 px-1.5 py-px text-xs font-semibold text-cyan-glow">
              <Play className="h-3 w-3" /> Vidéo
            </span>
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
