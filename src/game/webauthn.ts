/* =====================================================
   v5.9 : passkeys (WebAuthn) vérifiées par le serveur de jeu.
   Code pur, exécuté aussi par PocketBase (goja) : pas d'atob, de
   TextEncoder ni d'API Node. Signatures : ES256 (P-256, le cas général)
   et RS256 (Windows Hello). Attestation « none » : on ne vérifie pas le
   fabricant de l'authentificateur, seulement la clé et les signatures.
===================================================== */
import { p256 } from "@noble/curves/p256";
import { sha256 } from "@noble/hashes/sha256";

export const PASSKEY_RULES = {
  challengeTtlMs: 5 * 60_000,
  maxPerUser: 10,
  nameMax: 40,
};

export class PasskeyError extends Error {
  name = "PasskeyError";
}

/* ---------- encodages ---------- */

export { b64urlDecode, b64urlEncode } from "@/game/base64url";
import { b64urlDecode, b64urlEncode } from "@/game/base64url";

export function utf8Encode(text: string): Uint8Array {
  const out: number[] = [];
  for (const ch of String(text)) {
    let c = ch.codePointAt(0) ?? 0;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else {
      c = Math.min(c, 0x10ffff);
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
  }
  return new Uint8Array(out);
}

export function utf8Decode(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    let c: number;
    if (b < 0x80) {
      c = b;
      i += 1;
    } else if (b < 0xe0) {
      c = ((b & 31) << 6) | (bytes[i + 1] & 63);
      i += 2;
    } else if (b < 0xf0) {
      c = ((b & 15) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63);
      i += 3;
    } else {
      c = ((b & 7) << 18) | ((bytes[i + 1] & 63) << 12) | ((bytes[i + 2] & 63) << 6) | (bytes[i + 3] & 63);
      i += 4;
    }
    out += String.fromCodePoint(c);
  }
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ---------- CBOR (sous-ensemble utilisé par WebAuthn) ---------- */

type Cbor = number | bigint | string | boolean | null | undefined | Uint8Array | Cbor[] | Map<Cbor, Cbor>;

export function cborDecode(bytes: Uint8Array): { value: Cbor; length: number } {
  let pos = 0;
  const need = (n: number) => {
    if (pos + n > bytes.length) throw new PasskeyError("Données CBOR tronquées.");
  };
  const readArg = (info: number): number => {
    if (info < 24) return info;
    if (info === 24) {
      need(1);
      return bytes[pos++];
    }
    if (info === 25) {
      need(2);
      const v = (bytes[pos] << 8) | bytes[pos + 1];
      pos += 2;
      return v;
    }
    if (info === 26) {
      need(4);
      const v = bytes[pos] * 2 ** 24 + ((bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]);
      pos += 4;
      return v;
    }
    if (info === 27) {
      need(8);
      let v = 0;
      for (let i = 0; i < 8; i++) v = v * 256 + bytes[pos + i];
      pos += 8;
      return v;
    }
    throw new PasskeyError("Longueur CBOR indéfinie non gérée.");
  };
  const item = (depth: number): Cbor => {
    if (depth > 16) throw new PasskeyError("CBOR trop imbriqué.");
    need(1);
    const head = bytes[pos++];
    const major = head >> 5;
    const info = head & 31;
    switch (major) {
      case 0:
        return readArg(info);
      case 1:
        return -1 - readArg(info);
      case 2: {
        const n = readArg(info);
        need(n);
        const v = bytes.slice(pos, pos + n);
        pos += n;
        return v;
      }
      case 3: {
        const n = readArg(info);
        need(n);
        const v = utf8Decode(bytes.slice(pos, pos + n));
        pos += n;
        return v;
      }
      case 4: {
        const n = readArg(info);
        const arr: Cbor[] = [];
        for (let i = 0; i < n; i++) arr.push(item(depth + 1));
        return arr;
      }
      case 5: {
        const n = readArg(info);
        const map = new Map<Cbor, Cbor>();
        for (let i = 0; i < n; i++) {
          const k = item(depth + 1);
          map.set(k, item(depth + 1));
        }
        return map;
      }
      case 6:
        readArg(info);
        return item(depth + 1);
      case 7:
        if (info === 20) return false;
        if (info === 21) return true;
        if (info === 22) return null;
        if (info === 23) return undefined;
        throw new PasskeyError("Valeur CBOR non gérée.");
      default:
        throw new PasskeyError("Type CBOR inconnu.");
    }
  };
  const value = item(0);
  return { value, length: pos };
}

/* ---------- données de l'authentificateur ---------- */

export interface AuthData {
  rpIdHash: Uint8Array;
  userPresent: boolean;
  userVerified: boolean;
  signCount: number;
  credentialId?: Uint8Array;
  publicKey?: Uint8Array;
}

export function parseAuthData(data: Uint8Array): AuthData {
  if (data.length < 37) throw new PasskeyError("Données d'authentification trop courtes.");
  const flags = data[32];
  const out: AuthData = {
    rpIdHash: data.slice(0, 32),
    userPresent: (flags & 0x01) !== 0,
    userVerified: (flags & 0x04) !== 0,
    signCount: ((data[33] << 24) >>> 0) + ((data[34] << 16) | (data[35] << 8) | data[36]),
  };
  if (flags & 0x40) {
    if (data.length < 55) throw new PasskeyError("Clé de la passkey absente.");
    const idLen = (data[53] << 8) | data[54];
    if (data.length < 55 + idLen) throw new PasskeyError("Identifiant de la passkey tronqué.");
    out.credentialId = data.slice(55, 55 + idLen);
    const rest = data.slice(55 + idLen);
    const { length } = cborDecode(rest);
    out.publicKey = rest.slice(0, length);
  }
  return out;
}

/* ---------- clés COSE et signatures ---------- */

export const COSE_ES256 = -7;
export const COSE_RS256 = -257;

interface CoseKey {
  alg: number;
  x?: Uint8Array;
  y?: Uint8Array;
  n?: Uint8Array;
  e?: Uint8Array;
}

export function parseCoseKey(bytes: Uint8Array): CoseKey {
  const { value } = cborDecode(bytes);
  if (!(value instanceof Map)) throw new PasskeyError("Clé publique illisible.");
  const kty = value.get(1);
  const alg = Number(value.get(3));
  if (kty === 2 && alg === COSE_ES256 && value.get(-1) === 1) {
    const x = value.get(-2);
    const y = value.get(-3);
    if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array) || x.length !== 32 || y.length !== 32) throw new PasskeyError("Clé P-256 invalide.");
    return { alg, x, y };
  }
  if (kty === 3 && alg === COSE_RS256) {
    const n = value.get(-1);
    const e = value.get(-2);
    if (!(n instanceof Uint8Array) || !(e instanceof Uint8Array) || n.length < 256) throw new PasskeyError("Clé RSA invalide.");
    return { alg, n, e };
  }
  throw new PasskeyError("Type de passkey non pris en charge (ES256 ou RS256 attendu).");
}

function toBigInt(bytes: Uint8Array): bigint {
  let v = BigInt(0);
  for (const b of bytes) v = (v << BigInt(8)) | BigInt(b);
  return v;
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = BigInt(1);
  let b = base % mod;
  let e = exp;
  const zero = BigInt(0);
  const one = BigInt(1);
  while (e > zero) {
    if (e & one) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= one;
  }
  return result;
}

// DigestInfo DER de SHA-256 (PKCS#1 v1.5).
const SHA256_PREFIX = [0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20];

function verifyRs256(key: CoseKey, message: Uint8Array, signature: Uint8Array): boolean {
  const n = toBigInt(key.n!);
  const k = key.n!.length;
  if (signature.length !== k) return false;
  const s = toBigInt(signature);
  if (s >= n) return false;
  let m = modPow(s, toBigInt(key.e!), n);
  const em = new Uint8Array(k);
  for (let i = k - 1; i >= 0; i--) {
    em[i] = Number(m & BigInt(255));
    m >>= BigInt(8);
  }
  const digest = sha256(message);
  const tLen = SHA256_PREFIX.length + digest.length;
  const expected = new Uint8Array(k);
  expected[0] = 0;
  expected[1] = 1;
  for (let i = 2; i < k - tLen - 1; i++) expected[i] = 0xff;
  expected[k - tLen - 1] = 0;
  expected.set(SHA256_PREFIX, k - tLen);
  expected.set(digest, k - digest.length);
  return sameBytes(em, expected);
}

export function verifySignature(coseKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
  const key = parseCoseKey(coseKey);
  if (key.alg === COSE_ES256) {
    const point = concat(new Uint8Array([4]), key.x!, key.y!);
    try {
      return p256.verify(signature, sha256(message), point, { format: "der", lowS: false });
    } catch {
      return false;
    }
  }
  return verifyRs256(key, message, signature);
}

/* ---------- cérémonies ---------- */

export interface ClientData {
  type: string;
  challenge: string;
  origin: string;
}

function readClientData(b64: string): { raw: Uint8Array; data: ClientData } {
  const raw = b64urlDecode(b64);
  let data: ClientData;
  try {
    data = JSON.parse(utf8Decode(raw));
  } catch {
    throw new PasskeyError("Réponse du navigateur illisible.");
  }
  return { raw, data };
}

/** Défi renvoyé par le navigateur, pour retrouver la cérémonie côté serveur. */
export function clientChallenge(clientDataJSON: string): string {
  return String(readClientData(clientDataJSON).data.challenge ?? "");
}

export interface CeremonyContext {
  /** Défi attendu (base64url) : celui que le serveur a émis. */
  challenge: string;
  rpId: string;
  origins: string[];
}

function checkClientData(data: ClientData, type: string, ctx: CeremonyContext) {
  if (data.type !== type) throw new PasskeyError("Type de réponse inattendu.");
  if (data.challenge !== ctx.challenge) throw new PasskeyError("Défi expiré ou invalide : réessaie.");
  if (!ctx.origins.includes(data.origin)) throw new PasskeyError(`Origine non autorisée (${data.origin}).`);
}

function checkAuthData(auth: AuthData, ctx: CeremonyContext) {
  if (!sameBytes(auth.rpIdHash, sha256(utf8Encode(ctx.rpId)))) throw new PasskeyError("Passkey créée pour un autre site.");
  if (!auth.userPresent) throw new PasskeyError("Présence de l'utilisateur non confirmée.");
}

export interface RegistrationInput {
  clientDataJSON: string;
  attestationObject: string;
}

export interface RegisteredPasskey {
  credentialId: string;
  publicKey: string;
  alg: number;
  signCount: number;
  userVerified: boolean;
}

/** Inscription : contrôle le défi, l'origine et le site, puis extrait la clé publique. */
export function verifyRegistration(input: RegistrationInput, ctx: CeremonyContext): RegisteredPasskey {
  const { data } = readClientData(input.clientDataJSON);
  checkClientData(data, "webauthn.create", ctx);
  const { value } = cborDecode(b64urlDecode(input.attestationObject));
  if (!(value instanceof Map)) throw new PasskeyError("Attestation illisible.");
  const authBytes = value.get("authData");
  if (!(authBytes instanceof Uint8Array)) throw new PasskeyError("Attestation sans données.");
  const auth = parseAuthData(authBytes);
  checkAuthData(auth, ctx);
  if (!auth.credentialId || !auth.publicKey) throw new PasskeyError("La passkey n'a pas fourni sa clé.");
  const key = parseCoseKey(auth.publicKey);
  return { credentialId: b64urlEncode(auth.credentialId), publicKey: b64urlEncode(auth.publicKey), alg: key.alg, signCount: auth.signCount, userVerified: auth.userVerified };
}

export interface AssertionInput {
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
}

/** Connexion : signature de authenticatorData ‖ SHA-256(clientDataJSON) par la clé enregistrée. */
export function verifyAssertion(input: AssertionInput, ctx: CeremonyContext, publicKey: string, storedCount: number): { signCount: number; userVerified: boolean } {
  const { raw, data } = readClientData(input.clientDataJSON);
  checkClientData(data, "webauthn.get", ctx);
  const authBytes = b64urlDecode(input.authenticatorData);
  const auth = parseAuthData(authBytes);
  checkAuthData(auth, ctx);
  const signed = concat(authBytes, sha256(raw));
  if (!verifySignature(b64urlDecode(publicKey), signed, b64urlDecode(input.signature))) throw new PasskeyError("Signature de la passkey invalide.");
  // Compteur : les passkeys synchronisées restent à 0 ; sinon il doit augmenter (clé clonée).
  if (auth.signCount > 0 || storedCount > 0) {
    if (auth.signCount <= storedCount) throw new PasskeyError("Passkey refusée (compteur incohérent).");
  }
  return { signCount: auth.signCount, userVerified: auth.userVerified };
}

/** Nom affiché d'une passkey : texte court, sans retour à la ligne. */
export function cleanPasskeyName(raw: unknown): string {
  const name = String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, PASSKEY_RULES.nameMax);
  return name || "Passkey";
}

/** Défi aléatoire : 32 octets fournis par l'appelant (crypto du serveur). */
export function challengeFromBytes(bytes: Uint8Array): string {
  if (bytes.length < 16) throw new PasskeyError("Défi trop court.");
  return b64urlEncode(bytes);
}
