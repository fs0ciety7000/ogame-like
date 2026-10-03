import { useState } from "react";
import { toast } from "sonner";
import { Check, Lock, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bannerOptions, emblemOptions, PROFILE_RULES, profileStyle, type CosmeticOption } from "@/game/profile";
import { getRankIcon } from "@/game/ranks";
import { ACHIEVEMENTS, TIER_LABELS } from "@/game/achievements";
import { GameActionError, saveProfileStyle } from "@/services/playerService";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/* v4.0 : bannière, emblème et devise de la fiche publique. Les options se
   débloquent par les exploits ; le serveur revérifie chaque choix. */

function Option({ option, selected, onPick, children }: { option: CosmeticOption; selected: boolean; onPick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={!option.unlocked}
      onClick={onPick}
      title={option.unlocked ? option.label : `${option.label} — ${option.hint}`}
      className={cn(
        "hud-cut-sm relative overflow-hidden border text-left transition-colors",
        selected ? "border-cyan-glow ring-1 ring-cyan-glow/60" : "border-white/10 hover:border-cyan-glow/40",
        !option.unlocked && "cursor-not-allowed opacity-40 grayscale",
      )}
    >
      {children}
      <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 text-[10px] text-slate-200">
        {!option.unlocked && <Lock className="h-3 w-3" />}
        {selected && <Check className="h-3 w-3 text-cyan-glow" />}
        <span className="truncate">{option.unlocked ? option.label : option.hint}</span>
      </span>
    </button>
  );
}

export function ProfileStyleCard({ player }: { player: PlayerState }) {
  const current = profileStyle(player);
  const [banner, setBanner] = useState(current.banner);
  const [emblem, setEmblem] = useState(current.emblem);
  const [motto, setMotto] = useState(current.motto);
  const [pinned, setPinned] = useState<string[]>(current.pinned);
  const owned = ACHIEVEMENTS.filter((a) => (player.unlockedAchievements ?? []).includes(a.id));
  const [busy, setBusy] = useState(false);
  const banners = bannerOptions(player);
  const emblems = emblemOptions(player);
  const changed = banner !== current.banner || emblem !== current.emblem || motto.trim() !== current.motto || pinned.join(",") !== current.pinned.join(",");
  const preview = banners.find((b) => b.id === banner);

  const save = async () => {
    setBusy(true);
    try {
      await saveProfileStyle({ banner, emblem, motto, pinned });
      toast.success("Fiche publique mise à jour.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 overflow-hidden p-0">
      <div
        className="relative h-28 bg-cover bg-center"
        style={preview?.image ? { backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(7,10,20,0.95) 100%), url(${assetUrl(preview.image)})` } : { background: preview?.gradient }}
      >
        <div className="absolute bottom-2 left-4 flex items-end gap-3">
          <img src={emblem === "rank" ? getRankIcon(player.xp) : assetUrl(emblems.find((e) => e.id === emblem)?.image ?? "")} alt="" className="h-14 w-14 object-contain drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]" />
          <div>
            <p className="font-display text-lg font-semibold text-white">{player.pseudo}</p>
            {motto.trim() && <p className="text-xs italic text-slate-300">« {motto.trim()} »</p>}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <div>
          <p className="hud-eyebrow mb-2 text-slate-400">Bannière</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {banners.map((b) => (
              <Option key={b.id} option={b} selected={banner === b.id} onPick={() => setBanner(b.id)}>
                <div className="h-16 w-full bg-cover bg-center" style={b.image ? { backgroundImage: `url(${assetUrl(b.image)})` } : { background: b.gradient }} />
              </Option>
            ))}
          </div>
        </div>
        <div>
          <p className="hud-eyebrow mb-2 text-slate-400">Emblème</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {emblems.map((e) => (
              <Option key={e.id} option={e} selected={emblem === e.id} onPick={() => setEmblem(e.id)}>
                <div className="grid h-20 place-items-center bg-white/[0.02] pb-4">
                  <img src={e.id === "rank" ? getRankIcon(player.xp) : assetUrl(e.image ?? "")} alt="" className="h-12 w-12 object-contain" />
                </div>
              </Option>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Devise ({motto.length}/{PROFILE_RULES.mottoMax})
          <Input value={motto} maxLength={PROFILE_RULES.mottoMax} onChange={(e) => setMotto(e.target.value)} placeholder="Ex. : Personne ne passe le Bastion." />
        </label>
        <div>
          <p className="hud-eyebrow mb-2 text-slate-400">
            Succès en vitrine ({pinned.length}/{PROFILE_RULES.pinnedMax})
          </p>
          {owned.length === 0 ? (
            <p className="text-xs text-slate-500">Obtiens des succès pour les afficher sur ta fiche.</p>
          ) : (
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              {owned.map((a) => {
                const on = pinned.includes(a.id);
                const full = !on && pinned.length >= PROFILE_RULES.pinnedMax;
                return (
                  <button
                    key={a.id}
                    type="button"
                    disabled={full}
                    title={a.description}
                    onClick={() => setPinned((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))}
                    className={cn(
                      "flex items-center gap-1.5 border px-2 py-1 text-xs transition-colors",
                      on ? "border-gold-glow/70 bg-gold-glow/10 text-gold-glow" : "border-white/10 text-slate-300 hover:border-gold-glow/40",
                      full && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span>{a.emoji}</span> {a.name}
                    <span className="font-mono text-[9px] uppercase opacity-60">{TIER_LABELS[a.tier]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">Ta fiche montre aussi tes officiers en poste et tes reliques équipées.</p>
          <Button size="sm" disabled={!changed || busy} onClick={() => void save()}>
            <Save className="h-3.5 w-3.5" /> Enregistrer
          </Button>
        </div>
      </div>
    </Card>
  );
}
