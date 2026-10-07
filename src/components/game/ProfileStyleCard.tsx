import { useState } from "react";
import { toast } from "sonner";
import { Check, Lock, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HomePlanet } from "@/components/game/HomePlanet";
import { PLANET_SLOTS, planetLookOptions, type PlanetLook } from "@/game/planetLook";
import { bannerOptions, emblemOptions, PROFILE_RULES, profileStyle, type CosmeticOption } from "@/game/profile";
import { getRankIcon } from "@/game/ranks";
import { ACHIEVEMENTS, TIER_LABELS } from "@/game/achievements";
import { GameActionError, saveProfileStyle } from "@/services/playerService";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";
import type { PlayerState } from "@/types/game";
import { setPlayerData, usePlayerStore } from "@/store/playerStore";

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
      <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 text-[11px] text-slate-200">
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
  const [planet, setPlanet] = useState<PlanetLook>(current.planet);
  const owned = ACHIEVEMENTS.filter((a) => (player.unlockedAchievements ?? []).includes(a.id));
  const [busy, setBusy] = useState(false);
  const banners = bannerOptions(player);
  const emblems = emblemOptions(player);
  const changed = banner !== current.banner || emblem !== current.emblem || motto.trim() !== current.motto || pinned.join(",") !== current.pinned.join(",") || JSON.stringify(planet) !== JSON.stringify(current.planet);
  const preview = banners.find((b) => b.id === banner);

  const save = async () => {
    setBusy(true);
    try {
      const saved = await saveProfileStyle({ banner, emblem, motto, pinned, planet });
      // v5.9 : le style validé par le serveur s'affiche tout de suite, sans attendre la synchronisation.
      const latest = usePlayerStore.getState().player;
      if (latest && saved) setPlayerData({ ...latest, profileStyle: saved });
      if (saved) {
        setBanner(saved.banner);
        setEmblem(saved.emblem);
        setMotto(saved.motto);
        setPinned(saved.pinned);
        if (saved.planet) setPlanet(saved.planet);
      }
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
        style={preview?.image ? { backgroundImage: `linear-gradient(180deg, transparent 35%, color-mix(in srgb,var(--color-space-950) 95%,transparent) 100%), url(${assetUrl(preview.image)})` } : { background: preview?.gradient }}
      >
        <div className="absolute bottom-2 left-4 flex items-end gap-3">
          <img src={emblem === "rank" ? getRankIcon(player.xp) : assetUrl(emblems.find((e) => e.id === emblem)?.image ?? "")} alt="" className="h-14 w-14 object-contain drop-shadow-[0_0_10px_color-mix(in_srgb,var(--color-space-950)_80%,transparent)]" />
          <div>
            <p className="font-display text-lg font-semibold text-slate-100">{player.pseudo}</p>
            {motto.trim() && <p className="text-xs italic text-slate-300">« {motto.trim()} »</p>}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <div>
          <p className="hud-eyebrow mb-2 text-slate-400">Bannière</p>
          <div className="grid grid-cols-2 gap-2 @lg:grid-cols-3">
            {banners.map((b) => (
              <Option key={b.id} option={b} selected={banner === b.id} onPick={() => setBanner(b.id)}>
                <div className="h-16 w-full bg-cover bg-center" style={b.image ? { backgroundImage: `url(${assetUrl(b.image)})` } : { background: b.gradient }} />
              </Option>
            ))}
          </div>
        </div>
        <div>
          <p className="hud-eyebrow mb-2 text-slate-400">Emblème</p>
          <div className="grid grid-cols-3 gap-2 @lg:grid-cols-4">
            {emblems.map((e) => (
              <Option key={e.id} option={e} selected={emblem === e.id} onPick={() => setEmblem(e.id)}>
                <div className="grid h-20 place-items-center bg-white/[0.02] pb-4">
                  <img src={e.id === "rank" ? getRankIcon(player.xp) : assetUrl(e.image ?? "")} alt="" className="h-12 w-12 object-contain" />
                </div>
              </Option>
            ))}
          </div>
        </div>
        {/* 5.16 : planète personnalisée (fiche publique, galaxie, accueil) */}
        <div>
          <p className="hud-eyebrow mb-2 text-slate-400">Planète</p>
          <div className="flex flex-col items-center gap-4 @md:flex-row @md:items-start">
            <div className="grid shrink-0 place-items-center">
              <HomePlanet buildings={player.buildings} size={56} look={planet} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              {PLANET_SLOTS.map(({ slot, label }) => (
                <div key={slot} className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {planetLookOptions(player, slot).map((o) => {
                      const on = planet[slot] === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          disabled={!o.unlocked}
                          aria-pressed={on}
                          title={o.unlocked ? o.label : `${o.label} : ${o.hint}`}
                          onClick={() => setPlanet((p) => ({ ...p, [slot]: o.id }))}
                          className={cn(
                            "hud-cut-sm flex items-center gap-1 border px-2 py-1 text-xs transition-colors",
                            on ? "border-cyan-glow bg-cyan-glow/10 text-cyan-glow" : "border-white/10 text-slate-300 hover:border-cyan-glow/40",
                            !o.unlocked && "cursor-not-allowed opacity-40",
                          )}
                        >
                          {!o.unlocked && <Lock className="h-3 w-3" />}
                          {on && <Check className="h-3 w-3" />}
                          {o.label}
                          {!o.unlocked && <span className="text-[11px] text-slate-500">· {o.hint}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
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
                    <span className="font-mono text-[11px] uppercase opacity-60">{TIER_LABELS[a.tier]}</span>
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
