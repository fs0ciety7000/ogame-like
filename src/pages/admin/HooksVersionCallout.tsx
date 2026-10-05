import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HudCallout } from "@/components/ui/hud";
import { compareVersions } from "@/game/logicVersion";
import { CURRENT_VERSION } from "@/lib/changelog";
import { pb } from "@/lib/pocketbase";
import { adminUpdateHooks } from "@/services/adminService";

/* 5.15.13 : le site est déployé tout seul, mais PocketBase ne recharge ses
   hooks qu'au redémarrage (ou via « Mettre à jour les hooks »). Tant qu'ils
   sont en retard, les nouveautés côté serveur ne marchent pas : on le dit. */

async function serverVersion(): Promise<string | null> {
  try {
    const r = await pb.send<{ version?: string }>("/api/cosmic/version", { method: "GET" });
    return r.version ?? null;
  } catch {
    // Route absente : hooks d'avant la 5.15.13.
    return null;
  }
}

export function HooksVersionCallout() {
  const [server, setServer] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void serverVersion().then(setServer);
  }, []);
  if (server === undefined || !CURRENT_VERSION) return null;
  const late = server === null || compareVersions(server, CURRENT_VERSION) < 0;
  if (!late) return null;
  const update = async () => {
    setBusy(true);
    try {
      await adminUpdateHooks();
      toast.success("Hooks mis à jour.");
      setServer(await serverVersion());
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <HudCallout tone="ember" className="flex flex-wrap items-center gap-3 text-sm">
      <span className="min-w-0 flex-1">
        <b className="text-slate-100">Hooks du serveur en retard</b> : le site est en {CURRENT_VERSION}, le serveur en {server ?? "version antérieure à 5.15.13"}. Les nouveautés côté serveur (réclamations, actions) échouent tant qu'ils ne sont pas mis à jour.
      </span>
      <Button size="sm" disabled={busy} onClick={() => void update()}>
        <RefreshCw className="h-3.5 w-3.5" /> Mettre à jour les hooks
      </Button>
    </HudCallout>
  );
}
