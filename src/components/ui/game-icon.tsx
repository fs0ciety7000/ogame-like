import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { emojiIcon, iconUrl, isGameIcon, splitEmojiText, type GameIconName } from "@/lib/icons";
import { RESOURCE_LIST } from "@/game/resources";

/** Illustration du jeu, dimensionnée comme du texte (1.25em) par défaut. */
export function GameIcon({ name, className, title }: { name: GameIconName; className?: string; title?: string }) {
  return (
    <img
      src={iconUrl(name)}
      alt={title ?? ""}
      title={title}
      draggable={false}
      loading="lazy"
      className={cn("inline-block h-[1.25em] w-[1.25em] shrink-0 select-none object-contain align-[-0.25em]", className)}
    />
  );
}

/** Icône d'une ressource ; retombe sur son emoji si l'identifiant est inconnu. */
export function ResourceIcon({ id, className, title }: { id: string; className?: string; title?: string }) {
  const def = RESOURCE_LIST.find((r) => r.id === id);
  if (isGameIcon(id)) return <GameIcon name={id} className={className} title={title ?? def?.name} />;
  return <span className={className}>{def?.emoji ?? "❔"}</span>;
}

/** Emoji isolé (souvent issu des données) : illustration si elle existe. */
export function EmojiIcon({ emoji, className }: { emoji: string; className?: string }) {
  const name = emojiIcon(emoji);
  return name ? <GameIcon name={name} className={className} /> : <span className={className}>{emoji}</span>;
}

/** Texte libre dont les emojis connus sont remplacés par leur illustration. */
export function EmojiText({ text, iconClassName }: { text: string; iconClassName?: string }) {
  return (
    <>
      {splitEmojiText(text).map((part, i) =>
        typeof part === "string" ? <Fragment key={i}>{part}</Fragment> : <GameIcon key={i} name={part.icon} className={iconClassName} />,
      )}
    </>
  );
}
