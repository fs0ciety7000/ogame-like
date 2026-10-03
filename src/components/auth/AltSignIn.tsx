import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { enabledOAuthProviders, oauthErrorMessage, signInWithProvider, type OAuthProviderId } from "@/services/oauthService";
import { loginWithPasskey, passkeyErrorMessage, passkeysSupported } from "@/services/passkeyService";
import { pbConfigured } from "@/lib/pocketbase";

/* v5.9 : connexion sans mot de passe, sous le formulaire de connexion. */

export function GoogleMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.6 44 33 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function AppleMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M16.37 12.6c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.81 1.4-.02 2.29-1.27 3.14-2.52.99-1.45 1.4-2.85 1.42-2.92-.03-.01-2.72-1.04-2.75-4.13zM13.8 4.96c.72-.87 1.2-2.08 1.07-3.29-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.09 3.18 1.15.09 2.32-.58 3.04-1.45z" />
    </svg>
  );
}

const btn = "flex h-10 w-full items-center justify-center gap-2 border border-white/10 bg-white/[0.03] text-sm font-medium text-slate-200 transition hover:border-cyan-glow/50 hover:text-white disabled:opacity-50";

export function AltSignIn({ onNeedsPseudo }: { onNeedsPseudo?: () => void }) {
  const [providers, setProviders] = useState<OAuthProviderId[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const passkeys = pbConfigured && passkeysSupported();

  useEffect(() => {
    if (pbConfigured) void enabledOAuthProviders().then(setProviders);
  }, []);

  if (!passkeys && providers.length === 0) return null;

  const withPasskey = async () => {
    setBusy("passkey");
    try {
      await loginWithPasskey();
    } catch (err) {
      toast.error(passkeyErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const withProvider = async (p: OAuthProviderId) => {
    setBusy(p);
    try {
      if (await signInWithProvider(p)) onNeedsPseudo?.();
    } catch (err) {
      toast.error(oauthErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-600">
        <span className="h-px flex-1 bg-white/10" /> ou <span className="h-px flex-1 bg-white/10" />
      </div>
      {passkeys && (
        <button type="button" className={btn} disabled={busy !== null} onClick={() => void withPasskey()}>
          {busy === "passkey" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4 text-cyan-glow" />} Se connecter avec une passkey
        </button>
      )}
      {providers.length > 0 && (
        <div className={providers.length > 1 ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
          {providers.map((p) => (
            <button key={p} type="button" className={btn} disabled={busy !== null} onClick={() => void withProvider(p)}>
              {busy === p ? <Loader2 className="h-4 w-4 animate-spin" /> : p === "google" ? <GoogleMark /> : <AppleMark />}
              {p === "google" ? "Google" : "Apple"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
