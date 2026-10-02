import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CloudUpload, Download, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminBackupToR2, adminDownloadBackup, adminListBackups, type BackupFile } from "@/services/adminService";

/* v4.9 : sauvegardes du serveur — liste, téléchargement, copie vers Cloudflare R2. */

function size(n: number): string {
  return n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".", ",")} Mo` : `${Math.round(n / 1e3)} ko`;
}

export function BackupsCard() {
  const [list, setList] = useState<BackupFile[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = () => adminListBackups().then(setList).catch((err) => toast.error(`Sauvegardes illisibles : ${(err as Error).message}`));
  useEffect(() => {
    void load();
  }, []);

  const toR2 = async () => {
    setBusy("r2");
    try {
      const out = await adminBackupToR2();
      if (out.dispatched) toast.success(out.message);
      else toast.message(out.message);
      await load();
    } catch (err) {
      toast.error(`Impossible : ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const download = async (key: string) => {
    setBusy(key);
    try {
      await adminDownloadBackup(key);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const shown = list ? (showAll ? list : list.slice(0, 6)) : [];
  return (
    <Card className="flex flex-col gap-2 p-4 md:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="hud-title text-sm text-white">Sauvegardes du serveur</h3>
        <span className="text-[11px] text-slate-500">{list ? `${list.length} sur le serveur` : "…"}</span>
        <Button variant="ghost" size="sm" className="ml-auto" disabled={busy !== null} onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" disabled={busy !== null} onClick={() => void toR2()}>
          <CloudUpload className="mr-1 h-3.5 w-3.5" /> {busy === "r2" ? "Sauvegarde…" : "Sauvegarder vers R2"}
        </Button>
      </div>
      <p className="text-xs text-slate-400">
        « Sauvegarder vers R2 » : sauvegarde complète maintenant (base et fichiers envoyés), puis copie sur Cloudflare R2 de toutes les sauvegardes et des illustrations du jeu. La copie se fait aussi chaque nuit à 3 h 30.
      </p>
      <ul className="divide-y divide-white/5 text-xs">
        {shown.map((b) => (
          <li key={b.key} className="flex items-center gap-3 py-1.5">
            <span className="min-w-0 flex-1 truncate font-mono text-slate-300">{b.key}</span>
            <span className="text-slate-500">{new Date(b.modifiedAtMs).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            <span className="w-16 text-right text-slate-500">{size(b.size)}</span>
            <Button variant="ghost" size="sm" className="h-7 px-2" disabled={busy !== null} onClick={() => void download(b.key)} title="Télécharger">
              <Download className="h-3.5 w-3.5" /> {busy === b.key ? "…" : ""}
            </Button>
          </li>
        ))}
      </ul>
      {list && list.length > 6 && (
        <button type="button" className="self-start text-[11px] text-cyan-glow hover:underline" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Afficher moins" : `Afficher les ${list.length}`}
        </button>
      )}
    </Card>
  );
}
