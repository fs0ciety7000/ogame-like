import { pb } from "@/lib/pocketbase";
import { b64urlDecode, b64urlEncode } from "@/game/base64url";
import { ensurePlayerDoc } from "@/services/playerService";

/* =====================================================
   v5.9 : passkeys (empreinte, Face ID, code du téléphone, clé de
   sécurité). Le navigateur signe un défi ; le serveur de jeu vérifie
   la signature et ouvre la session.
===================================================== */

export interface PasskeyInfo {
  id: string;
  name: string;
  createdAtMs: number;
  lastUsedAtMs: number;
}

export function passkeysSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials?.create;
}

const buf = (b64: string) => b64urlDecode(b64).buffer as ArrayBuffer;
const enc = (b: ArrayBuffer | null | undefined) => (b ? b64urlEncode(new Uint8Array(b)) : "");

/** Message lisible pour les erreurs du navigateur (annulation, délai, appareil déjà inscrit). */
export function passkeyErrorMessage(err: unknown): string {
  const name = (err as { name?: string })?.name;
  if (name === "NotAllowedError") return "Opération annulée ou délai dépassé.";
  if (name === "InvalidStateError") return "Cet appareil a déjà une passkey pour ton compte.";
  if (name === "SecurityError") return "Les passkeys ne sont pas disponibles sur cette adresse.";
  const message = (err as { response?: { message?: string }; message?: string })?.response?.message ?? (err as { message?: string })?.message;
  return message || "Passkey refusée.";
}

/** Nom proposé par défaut : l'appareil et le navigateur. */
export function defaultPasskeyName(): string {
  const ua = navigator.userAgent;
  const device = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Appareil";
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  return browser ? `${device} · ${browser}` : device;
}

export async function listPasskeys(uid: string): Promise<PasskeyInfo[]> {
  const rows = await pb.collection("passkeys").getFullList({ filter: pb.filter("user = {:u}", { u: uid }), sort: "-createdAtMs", fields: "id,name,createdAtMs,lastUsedAtMs" });
  return rows.map((r) => ({ id: r.id, name: String(r.name || "Passkey"), createdAtMs: Number(r.createdAtMs) || 0, lastUsedAtMs: Number(r.lastUsedAtMs) || 0 }));
}

interface RegisterOptions {
  challenge: string;
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: "public-key"; alg: number }[];
  excludeCredentials: { type: "public-key"; id: string }[];
  authenticatorSelection: AuthenticatorSelectionCriteria;
  attestation: AttestationConveyancePreference;
  timeout: number;
}

/** Ajoute une passkey au compte connecté. */
export async function registerPasskey(name: string): Promise<PasskeyInfo> {
  const o = await pb.send<RegisterOptions>("/api/cosmic/passkey/register/options", { method: "POST" });
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: buf(o.challenge),
      rp: o.rp,
      user: { ...o.user, id: buf(o.user.id) },
      pubKeyCredParams: o.pubKeyCredParams,
      excludeCredentials: o.excludeCredentials.map((c) => ({ type: c.type, id: buf(c.id) })),
      authenticatorSelection: o.authenticatorSelection,
      attestation: o.attestation,
      timeout: o.timeout,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("Opération annulée.");
  const res = cred.response as AuthenticatorAttestationResponse;
  return pb.send<PasskeyInfo>("/api/cosmic/passkey/register/verify", {
    method: "POST",
    body: {
      name,
      transports: typeof res.getTransports === "function" ? res.getTransports() : [],
      response: { clientDataJSON: enc(res.clientDataJSON), attestationObject: enc(res.attestationObject) },
    },
  });
}

export async function renamePasskey(id: string, name: string): Promise<PasskeyInfo> {
  return pb.send<PasskeyInfo>("/api/cosmic/passkey/rename", { method: "POST", body: { id, name } });
}

export async function deletePasskey(id: string): Promise<void> {
  await pb.collection("passkeys").delete(id);
}

/** Connexion sans mot de passe : le navigateur propose les passkeys du site. */
export async function loginWithPasskey(): Promise<void> {
  const o = await pb.send<{ challenge: string; rpId: string; userVerification: UserVerificationRequirement; timeout: number }>("/api/cosmic/passkey/login/options", { method: "POST" });
  const cred = (await navigator.credentials.get({
    publicKey: { challenge: buf(o.challenge), rpId: o.rpId, userVerification: o.userVerification, timeout: o.timeout, allowCredentials: [] },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("Opération annulée.");
  const res = cred.response as AuthenticatorAssertionResponse;
  const auth = await pb.send<{ token: string; record: Record<string, unknown> }>("/api/cosmic/passkey/login/verify", {
    method: "POST",
    body: {
      id: enc(cred.rawId),
      response: { clientDataJSON: enc(res.clientDataJSON), authenticatorData: enc(res.authenticatorData), signature: enc(res.signature), userHandle: enc(res.userHandle) },
    },
  });
  pb.authStore.save(auth.token, auth.record as never);
  if (auth.record.name || auth.record.username) await ensurePlayerDoc(String(auth.record.id), String(auth.record.name || auth.record.username));
}
