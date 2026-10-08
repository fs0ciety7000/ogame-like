import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currentGameContent } from "@/game/content";
import { BALANCE_EXCLUSION_RULES, BALANCE_EXCLUSION_RULES_META, validateBalanceExclusion } from "@/game/staff";
import { CheckboxField, TextAreaField } from "@/pages/admin/fields";
import { saveContentSection } from "@/services/contentService";
import { ChangesPreview } from "@/pages/admin/ContentEditor";
import { previewChanges } from "@/game/adminPreview";

/* =====================================================
   6.14.154 (AU27, lot R6, constat AA-31) : comptes écartés des statistiques
   d'équilibre (puissance des seigneurs, outil d'équilibrage, « Et si ? ») :
   pseudos des comptes d'essai, équipe et administrateurs, comptes en mode
   test. Groupe de règles « balanceExclusion » (aussi dans Tous les réglages).
===================================================== */

type Exclusion = typeof BALANCE_EXCLUSION_RULES;

const read = (): Exclusion => ({ ...BALANCE_EXCLUSION_RULES, ...((currentGameContent().rules as unknown as { balanceExclusion?: Partial<Exclusion> }).balanceExclusion ?? {}) });

export function BalanceExclusionCard() {
  const [saved, setSaved] = useState<Exclusion>(read);
  const [draft, setDraft] = useState<Exclusion>(saved);
  const [busy, setBusy] = useState(false);
  // Texte brut gardé tel quel (une ligne vide pendant la saisie), pseudos dérivés.
  const [text, setText] = useState(saved.pseudos.join("\n"));
  const changes = useMemo(() => previewChanges({ balanceExclusion: saved }, { balanceExclusion: draft }), [saved, draft]);
  const errors = useMemo(() => validateBalanceExclusion(draft), [draft]);

  const save = async () => {
    setBusy(true);
    try {
      await saveContentSection("rules", { ...currentGameContent().rules, balanceExclusion: draft } as never);
      setSaved(draft);
      toast.success("Exclusions enregistrées : prises en compte au prochain relevé des seigneurs et de l'équilibrage.");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-5 xl:col-span-2">
      <h3 className="hud-title flex items-center gap-2 text-sm text-slate-100">
        <Scale className="h-4 w-4 text-cyan-glow" /> Exclus des statistiques d'équilibre
      </h3>
      <p className="text-xs text-slate-500">
        Ces comptes restent des joueurs (et des cibles) comme les autres, mais ne servent pas de référence : puissance visée des seigneurs, outil d'équilibrage, « Et si ? ».
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextAreaField
          label={`${BALANCE_EXCLUSION_RULES_META.pseudos.label} (un par ligne)`}
          rows={4}
          value={text}
          onChange={(v) => {
            setText(v);
            setDraft((d) => ({ ...d, pseudos: [...new Set(v.split("\n").map((x) => x.trim()).filter(Boolean))] }));
          }}
        />
        <div className="flex flex-col gap-2">
          <CheckboxField label={BALANCE_EXCLUSION_RULES_META.excludeStaff.label} hint={BALANCE_EXCLUSION_RULES_META.excludeStaff.hint} checked={draft.excludeStaff} onChange={(v) => setDraft((d) => ({ ...d, excludeStaff: v }))} />
          <CheckboxField label={BALANCE_EXCLUSION_RULES_META.excludeTestMode.label} checked={draft.excludeTestMode} onChange={(v) => setDraft((d) => ({ ...d, excludeTestMode: v }))} />
        </div>
      </div>
      {changes.length > 0 && <ChangesPreview changes={changes} />}
      {errors.length > 0 && <p className="text-xs text-danger-glow">{errors[0]}</p>}
      <div className="flex justify-end">
        <Button size="sm" disabled={busy || changes.length === 0 || errors.length > 0} onClick={() => void save()}>
          <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
        </Button>
      </div>
    </Card>
  );
}
