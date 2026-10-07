import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminUploadAsset } from "@/services/adminService";
import { saveCustomEmojis, useEmojiStore } from "@/services/emojiService";
import { EMOJI_CODE_RE, GAME_EMOJIS, MAX_CUSTOM_EMOJIS, type CustomEmoji } from "@/game/emojis";
import { KESH_EMOJIS } from "@/game/bounties";

/** Codes des emojis intégrés au jeu (factions, ressources, Kesh'Vaar). */
const RESERVED = new Set([...GAME_EMOJIS, ...KESH_EMOJIS].map((e) => e.code));

/* Administration des emojis personnalisés (v3.8) : image + code, écrits
   :code: dans la messagerie, le tchat d'alliance et les canaux de pacte. */

export function EmojisPanel() {
  const stored = useEmojiStore((s) => s.emojis);
  const [list, setList] = useState<CustomEmoji[]>(stored);
  const [code, setCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setList(stored);
  }, [stored]);

  const cleanCode = code.trim().toLowerCase().replace(/^:|:$/g, "");
  const codeError = !cleanCode
    ? null
    : !EMOJI_CODE_RE.test(cleanCode)
      ? "2 à 24 caractères : lettres minuscules, chiffres, _"
      : list.some((e) => e.code === cleanCode) || RESERVED.has(cleanCode)
        ? "Ce code existe déjà (emojis du jeu compris)."
        : null;
  const dirty = JSON.stringify(list) !== JSON.stringify(stored);

  const add = async () => {
    if (!file || !cleanCode || codeError) return;
    setBusy(true);
    try {
      const url = await adminUploadAsset(file);
      setList((l) => [...l, { code: cleanCode, url }]);
      setCode("");
      setFile(null);
    } catch {
      toast.error("Envoi de l'image impossible.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await saveCustomEmojis(list);
      toast.success("Emojis enregistrés.");
    } catch {
      toast.error("Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="hud-title text-sm text-slate-100">Nouvel emoji</h3>
          <p className="mt-1 text-xs text-slate-400">
            Image carrée (PNG, WebP ou GIF, 128 px suffisent). Les joueurs l'écrivent <span className="font-mono text-cyan-glow">:code:</span> ou la choisissent dans le
            sélecteur des discussions. {MAX_CUSTOM_EMOJIS} emojis au plus. {GAME_EMOJIS.length} emojis du jeu (factions, ressources, insignes) sont déjà
            intégrés.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Code
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="leviathan" className="w-48 font-mono" />
          </label>
          <label className="flex h-9 cursor-pointer items-center gap-2 border border-cyan-glow/20 px-3 text-xs text-slate-300 hover:text-cyan-glow">
            <ImagePlus className="h-4 w-4" />
            <span className="max-w-[12rem] truncate">{file ? file.name : "Choisir une image"}</span>
            <input type="file" accept="image/png,image/webp,image/gif,image/jpeg" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <Button disabled={busy || !file || !cleanCode || !!codeError || list.length >= MAX_CUSTOM_EMOJIS} onClick={() => void add()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Ajouter
          </Button>
        </div>
        {codeError && <p className="text-xs text-danger-glow">{codeError}</p>}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <h3 className="hud-title text-sm text-slate-100">
            Emojis du serveur <span className="text-slate-500">({list.length})</span>
          </h3>
          <Button className="ml-auto" size="sm" disabled={busy || !dirty} onClick={() => void save()}>
            <Save className="h-4 w-4" /> Enregistrer
          </Button>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun emoji personnalisé pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((e) => (
              <div key={e.code} className="flex items-center gap-3 border border-white/5 p-2">
                <img src={e.url} alt={e.code} className="h-8 w-8 object-contain" />
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-200">:{e.code}:</span>
                <Button size="icon" variant="ghost" aria-label={`Supprimer :${e.code}:`} onClick={() => setList((l) => l.filter((x) => x.code !== e.code))}>
                  <Trash2 className="h-4 w-4 text-danger-glow" />
                </Button>
              </div>
            ))}
          </div>
        )}
        {dirty && <p className="text-xs text-gold-glow">Modifications non enregistrées.</p>}
      </Card>
    </div>
  );
}
