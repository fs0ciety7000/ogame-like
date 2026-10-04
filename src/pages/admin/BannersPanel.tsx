import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bold, Link2, Plus, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/pages/admin/fields";
import { BannerStrip } from "@/components/layout/AnnouncementBanners";
import { saveBanners, useBannerStore } from "@/services/bannerService";
import { BANNER_KINDS, BANNER_MAX_LENGTH, BANNER_MAX_SHOWN, newBanner, safeHref, visibleBanners, type Banner, type BannerKind } from "@/game/banners";
import { cn } from "@/lib/utils";

/* Administration des bandeaux d'annonce (v3.7). */

const EMOJIS = ["📢", "🚀", "⚔️", "🛡️", "🔥", "⚠️", "🚨", "🎉", "🏆", "⏰", "🔧", "✨", "💎", "🌌", "👾", "💀", "🐙", "🎁", "🪐", "⚡"];

const KIND_COLOR: Record<BannerKind, string> = {
  info: "var(--color-cyan-glow)",
  event: "var(--color-violet-glow)",
  alert: "var(--color-ember-glow)",
  critical: "var(--color-danger-glow)",
};

/** Valeur d'un <input type="datetime-local"> (heure locale). */
function toLocalInput(ms: number | null): string {
  if (!ms) return "";
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

function fromLocalInput(value: string): number | null {
  const ms = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(ms) ? ms : null;
}

function Toggle({ label, hint, checked, disabled, onChange }: { label: string; hint: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2 border border-white/5 p-2", disabled && "cursor-not-allowed opacity-50")}>
      <input type="checkbox" className="mt-0.5 accent-cyan-400" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-xs font-semibold text-slate-200">{label}</span>
        <span className="block text-[11px] text-slate-500">{hint}</span>
      </span>
    </label>
  );
}

function BannerEditor({ banner, onChange, onDelete }: { banner: Banner; onChange: (b: Banner) => void; onDelete: () => void }) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const set = (patch: Partial<Banner>) => onChange({ ...banner, ...patch });

  /** Insère à la position du curseur (ou entoure la sélection). */
  const insert = (before: string, after = "", placeholder = "") => {
    const el = textRef.current;
    const start = el?.selectionStart ?? banner.text.length;
    const end = el?.selectionEnd ?? banner.text.length;
    const selected = banner.text.slice(start, end) || placeholder;
    const text = (banner.text.slice(0, start) + before + selected + after + banner.text.slice(end)).slice(0, BANNER_MAX_LENGTH);
    set({ text });
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + before.length + selected.length + after.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  const link = safeHref(linkUrl);
  const now = Date.now();
  const live = visibleBanners([banner], now).length > 0;
  const status = !banner.active ? "Brouillon" : banner.startsAtMs && banner.startsAtMs > now ? "Programmé" : banner.endsAtMs && banner.endsAtMs <= now ? "Terminé" : "En ligne";

  return (
    <Card className="flex flex-col gap-3 p-4" style={{ borderColor: `color-mix(in srgb, ${KIND_COLOR[banner.kind]} 35%, transparent)` }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]", live ? "bg-mint-glow/15 text-mint-glow" : "bg-white/5 text-slate-400")}>{status}</span>
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Type de bandeau">
          {(Object.keys(BANNER_KINDS) as BannerKind[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={banner.kind === k}
              title={BANNER_KINDS[k].hint}
              onClick={() => set({ kind: k, dismissible: k === "critical" ? false : banner.dismissible })}
              className={cn("border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors", banner.kind === k ? "text-space-950" : "text-slate-400 hover:text-slate-200")}
              style={{ borderColor: KIND_COLOR[k], background: banner.kind === k ? KIND_COLOR[k] : "transparent" }}
            >
              {BANNER_KINDS[k].label}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="ml-auto text-danger-glow" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" /> Supprimer
        </Button>
      </div>

      <Field label={`Texte (${banner.text.length}/${BANNER_MAX_LENGTH})`} hint="Emojis acceptés. **gras** et [texte du lien](/game/leviathan ou https://…).">
        <textarea
          ref={textRef}
          value={banner.text}
          onChange={(e) => set({ text: e.target.value.slice(0, BANNER_MAX_LENGTH) })}
          rows={3}
          placeholder="🚀 La Matriarche arrive mardi 18 h : [préparez vos flottes](/game/leviathan) !"
          className="resize-y border border-cyan-glow/20 bg-space-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-glow/60 focus:outline-none"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => insert("**", "**", "texte")} title="Gras">
          <Bold className="h-3.5 w-3.5" />
        </Button>
        {EMOJIS.map((e) => (
          <button key={e} type="button" onClick={() => insert(e)} className="h-8 w-8 text-base transition-transform hover:scale-125" aria-label={`Insérer ${e}`}>
            {e}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Texte du lien" className="min-w-[10rem] flex-1">
          <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Voir le boss mondial" />
        </Field>
        <Field label="Adresse" className="min-w-[12rem] flex-[2]">
          <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/game/leviathan ou https://…" />
        </Field>
        <Button
          variant="secondary"
          size="sm"
          disabled={!link || !linkText.trim()}
          title={linkUrl && !link ? "Adresse invalide : /game/… ou https://…" : undefined}
          onClick={() => {
            insert(`[${linkText.trim().replace(/[[\]]/g, "")}](${linkUrl.trim()})`);
            setLinkText("");
            setLinkUrl("");
          }}
        >
          <Link2 className="h-3.5 w-3.5" /> Insérer le lien
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Toggle label="En ligne" hint="Décoché : brouillon, invisible pour les joueurs." checked={banner.active} onChange={(v) => set({ active: v })} />
        <Toggle label="Texte défilant" hint="Le message défile de droite à gauche (pause au survol)." checked={banner.scrolling} onChange={(v) => set({ scrolling: v })} />
        <Toggle
          label="Masquable"
          hint={banner.kind === "critical" ? "Un bandeau Urgent reste toujours affiché." : "Le joueur peut le fermer (il réapparaît s'il est modifié)."}
          checked={banner.dismissible}
          disabled={banner.kind === "critical"}
          onChange={(v) => set({ dismissible: v })}
        />
        <Toggle label="Page de connexion" hint="Visible aussi avant de se connecter." checked={banner.public} onChange={(v) => set({ public: v })} />
        <Field label="Début (facultatif)">
          <Input type="datetime-local" value={toLocalInput(banner.startsAtMs)} onChange={(e) => set({ startsAtMs: fromLocalInput(e.target.value) })} />
        </Field>
        <Field label="Fin (facultatif)">
          <Input type="datetime-local" value={toLocalInput(banner.endsAtMs)} onChange={(e) => set({ endsAtMs: fromLocalInput(e.target.value) })} />
        </Field>
      </div>

      <div>
        <p className="hud-eyebrow mb-1 text-[10px] text-slate-500">Aperçu</p>
        <div className="border border-white/5">
          <BannerStrip banner={{ ...banner, text: banner.text || "Ton message apparaîtra ici." }} onDismiss={() => {}} />
        </div>
      </div>
    </Card>
  );
}

export function BannersPanel() {
  const stored = useBannerStore((s) => s.banners);
  const [draft, setDraft] = useState<Banner[]>(stored);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  // Réaligné quand un autre administrateur enregistre (sauf modifications en cours).
  useEffect(() => {
    if (!dirty) setDraft(stored);
  }, [stored, dirty]);

  const update = (next: Banner[]) => {
    setDraft(next);
    setDirty(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      const now = Date.now();
      // Un bandeau modifié reçoit une nouvelle date : il réapparaît chez ceux qui l'avaient masqué.
      const next = draft.map((b) => {
        const before = stored.find((s) => s.id === b.id);
        return before && JSON.stringify({ ...before, updatedAtMs: 0 }) === JSON.stringify({ ...b, updatedAtMs: 0 }) ? b : { ...b, updatedAtMs: now };
      });
      await saveBanners(next);
      setDirty(false);
      toast.success("Bandeaux enregistrés : visibles immédiatement par les joueurs.");
    } catch (err) {
      toast.error((err as Error).message || "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const live = visibleBanners(draft, Date.now());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-slate-400">
          {live.length} bandeau{live.length > 1 ? "x" : ""} en ligne ({BANNER_MAX_SHOWN} au plus à la fois, les plus graves d'abord).
        </p>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => update([newBanner(Date.now()), ...draft])}>
          <Plus className="h-3.5 w-3.5" /> Nouveau bandeau
        </Button>
        <Button size="sm" disabled={!dirty || busy} onClick={() => void save()}>
          <Save className="h-3.5 w-3.5" /> Enregistrer
        </Button>
      </div>
      {draft.length === 0 && <Card className="p-6 text-sm text-slate-500">Aucun bandeau. Crée-en un pour annoncer un évènement, une maintenance ou un incident.</Card>}
      {draft.map((b, i) => (
        <BannerEditor
          key={b.id}
          banner={b}
          onChange={(nb) => update(draft.map((x, j) => (j === i ? nb : x)))}
          onDelete={() => update(draft.filter((_, j) => j !== i))}
        />
      ))}
      {dirty && <p className="text-xs text-gold-glow">Modifications non enregistrées.</p>}
    </div>
  );
}
