import * as PopoverPrimitive from "@radix-ui/react-dropdown-menu";
import { Smile } from "lucide-react";
import { EMOJI_GROUPS } from "@/game/emojis";
import { useEmojiStore } from "@/services/emojiService";
import { bountyState, KESH_EMOJIS, owns } from "@/game/bounties";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/lib/utils";

/* Sélecteur d'emojis des discussions (v3.8) : standards et personnalisés.
   `onPick` reçoit le texte à insérer (emoji, ou :code: personnalisé). */
export function EmojiPicker({ onPick, className }: { onPick: (text: string) => void; className?: string }) {
  const custom = useEmojiStore((s) => s.emojis);
  const keshOwned = usePlayerStore((s) => (s.player ? owns(bountyState(s.player), "emojis") : false));
  const cell = "grid h-8 w-8 place-items-center text-lg transition-transform hover:scale-125 focus:scale-125 focus:outline-none";
  return (
    <PopoverPrimitive.Root modal={false}>
      <PopoverPrimitive.Trigger
        type="button"
        aria-label="Insérer un emoji"
        className={cn("grid h-9 w-9 shrink-0 place-items-center border border-cyan-glow/20 text-slate-400 transition-colors hover:text-cyan-glow data-[state=open]:text-cyan-glow", className)}
      >
        <Smile className="h-4 w-4" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="top"
          align="end"
          sideOffset={6}
          collisionPadding={8}
          className="z-50 max-h-80 w-[min(20rem,calc(100vw-1rem))] overflow-y-auto glass-panel p-2 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
        >
          {custom.length > 0 && (
            <div className="mb-2">
              <p className="hud-eyebrow px-1 pb-1 text-[9px] text-gold-glow/80">Cosmic Empires</p>
              <div className="grid grid-cols-8">
                {custom.map((e) => (
                  <PopoverPrimitive.Item key={e.code} className={cell} title={`:${e.code}:`} onSelect={() => onPick(`:${e.code}: `)}>
                    <img src={e.url} alt={e.code} className="h-6 w-6 object-contain" />
                  </PopoverPrimitive.Item>
                ))}
              </div>
            </div>
          )}
          {keshOwned && (
            <div className="mb-2">
              <p className="hud-eyebrow px-1 pb-1 text-[9px] text-gold-glow/80">Kesh'Vaar</p>
              <div className="grid grid-cols-8">
                {KESH_EMOJIS.map((e) => (
                  <PopoverPrimitive.Item key={e.code} className={cell} title={`:${e.code}:`} onSelect={() => onPick(`:${e.code}: `)}>
                    <img src={e.url} alt={e.code} className="h-6 w-6 object-contain" />
                  </PopoverPrimitive.Item>
                ))}
              </div>
            </div>
          )}
          {EMOJI_GROUPS.map((g) => (
            <div key={g.label} className="mb-2 last:mb-0">
              <p className="hud-eyebrow px-1 pb-1 text-[9px] text-slate-500">{g.label}</p>
              <div className="grid grid-cols-8">
                {g.emojis.map((e) => (
                  <PopoverPrimitive.Item key={e} className={cell} onSelect={() => onPick(e)}>
                    {e}
                  </PopoverPrimitive.Item>
                ))}
              </div>
            </div>
          ))}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
