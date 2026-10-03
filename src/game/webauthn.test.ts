import { describe, expect, it } from "vitest";
import { createHash, generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import { b64urlDecode, b64urlEncode, cborDecode, utf8Decode, utf8Encode, verifyAssertion, verifyRegistration, type CeremonyContext } from "./webauthn";

/* Authentificateur simulé : mêmes octets qu'un vrai navigateur (CBOR,
   authenticatorData, clientDataJSON), signés par des clés Node. */

function cbor(v: unknown): Uint8Array {
  const head = (major: number, n: number): number[] => {
    if (n < 24) return [(major << 5) | n];
    if (n < 256) return [(major << 5) | 24, n];
    return [(major << 5) | 25, n >> 8, n & 255];
  };
  if (typeof v === "number") return new Uint8Array(v >= 0 ? head(0, v) : head(1, -1 - v));
  if (typeof v === "string") {
    const b = utf8Encode(v);
    return new Uint8Array([...head(3, b.length), ...b]);
  }
  if (v instanceof Uint8Array) return new Uint8Array([...head(2, v.length), ...v]);
  if (v instanceof Map) {
    const parts = [...v].flatMap(([k, val]) => [...cbor(k), ...cbor(val)]);
    return new Uint8Array([...head(5, v.size), ...parts]);
  }
  throw new Error("type non géré");
}

const sha = (b: Uint8Array) => new Uint8Array(createHash("sha256").update(b).digest());
const RP = "empire.fs0ciety.org";
const ORIGIN = "https://empire.fs0ciety.org";

function makeAuthenticator(kind: "es256" | "rs256") {
  const { privateKey, publicKey } = kind === "es256" ? generateKeyPairSync("ec", { namedCurve: "P-256" }) : generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" });
  const cose =
    kind === "es256"
      ? cbor(new Map<number, unknown>([[1, 2], [3, -7], [-1, 1], [-2, b64urlDecode(jwk.x!)], [-3, b64urlDecode(jwk.y!)]]))
      : cbor(new Map<number, unknown>([[1, 3], [3, -257], [-1, b64urlDecode(jwk.n!)], [-2, b64urlDecode(jwk.e!)]]));
  const credId = new Uint8Array(16).map((_, i) => i + 7);
  let counter = 0;
  const authData = (flags: number, withKey: boolean, rp = RP) => {
    counter++;
    const head = [...sha(utf8Encode(rp)), flags, (counter >>> 24) & 255, (counter >> 16) & 255, (counter >> 8) & 255, counter & 255];
    if (!withKey) return new Uint8Array(head);
    return new Uint8Array([...head, ...new Uint8Array(16), 0, credId.length, ...credId, ...cose]);
  };
  const clientData = (type: string, challenge: string, origin = ORIGIN) => utf8Encode(JSON.stringify({ type, challenge, origin, crossOrigin: false }));
  return {
    credId,
    register(challenge: string, opts: { rp?: string; origin?: string } = {}) {
      const att = cbor(new Map<string, unknown>([["fmt", "none"], ["attStmt", new Map()], ["authData", authData(0x45, true, opts.rp)]]));
      return { clientDataJSON: b64urlEncode(clientData("webauthn.create", challenge, opts.origin)), attestationObject: b64urlEncode(att) };
    },
    login(challenge: string, opts: { tamper?: boolean; key?: KeyObject } = {}) {
      const ad = authData(0x05, false);
      const cd = clientData("webauthn.get", challenge);
      const msg = new Uint8Array([...ad, ...sha(cd)]);
      const sig = new Uint8Array(kind === "es256" ? sign("sha256", msg, { key: opts.key ?? privateKey, dsaEncoding: "der" }) : sign("sha256", msg, opts.key ?? privateKey));
      if (opts.tamper) ad[ad.length - 1] ^= 1;
      return { clientDataJSON: b64urlEncode(cd), authenticatorData: b64urlEncode(ad), signature: b64urlEncode(sig) };
    },
  };
}

const ctx = (challenge: string): CeremonyContext => ({ challenge, rpId: RP, origins: [ORIGIN] });

describe("encodages", () => {
  it("round-trips base64url and UTF-8", () => {
    const bytes = new Uint8Array([0, 1, 250, 251, 252, 253, 254, 255, 62, 63]);
    expect(b64urlDecode(b64urlEncode(bytes))).toEqual(bytes);
    expect(b64urlEncode(new Uint8Array(Buffer.from("héllo ✨")))).toBe(Buffer.from("héllo ✨").toString("base64url"));
    expect(utf8Decode(utf8Encode("Commandant Ω 🚀"))).toBe("Commandant Ω 🚀");
  });

  it("decodes CBOR maps with negative keys and byte strings", () => {
    const { value } = cborDecode(cbor(new Map<number, unknown>([[1, 2], [-2, new Uint8Array([9, 8])]])));
    expect(value).toBeInstanceOf(Map);
    expect((value as Map<number, unknown>).get(-2)).toEqual(new Uint8Array([9, 8]));
  });
});

for (const kind of ["es256", "rs256"] as const) {
  describe(`passkey ${kind}`, () => {
    it("registers, then logs in with an increasing counter", () => {
      const a = makeAuthenticator(kind);
      const reg = verifyRegistration(a.register("defi-1"), ctx("defi-1"));
      expect(reg.credentialId).toBe(b64urlEncode(a.credId));
      expect(reg.alg).toBe(kind === "es256" ? -7 : -257);
      const out = verifyAssertion(a.login("defi-2"), ctx("defi-2"), reg.publicKey, reg.signCount);
      expect(out.signCount).toBeGreaterThan(reg.signCount);
      expect(out.userVerified).toBe(true);
    });

    it("rejects a tampered assertion, a foreign key and a replayed counter", () => {
      const a = makeAuthenticator(kind);
      const reg = verifyRegistration(a.register("d"), ctx("d"));
      expect(() => verifyAssertion(a.login("x", { tamper: true }), ctx("x"), reg.publicKey, 0)).toThrow(/Signature|site/);
      const other = kind === "es256" ? generateKeyPairSync("ec", { namedCurve: "P-256" }) : generateKeyPairSync("rsa", { modulusLength: 2048 });
      expect(() => verifyAssertion(a.login("y", { key: other.privateKey }), ctx("y"), reg.publicKey, 0)).toThrow(/Signature/);
      const ok = a.login("z");
      expect(() => verifyAssertion(ok, ctx("z"), reg.publicKey, 999)).toThrow(/compteur/);
    });
  });
}

describe("contrôles de la cérémonie", () => {
  it("rejects a wrong challenge, origin, site or type", () => {
    const a = makeAuthenticator("es256");
    expect(() => verifyRegistration(a.register("bon"), ctx("autre"))).toThrow(/Défi/);
    expect(() => verifyRegistration(a.register("c", { origin: "https://evil.example" }), ctx("c"))).toThrow(/Origine/);
    expect(() => verifyRegistration(a.register("c", { rp: "evil.example" }), ctx("c"))).toThrow(/autre site/);
    const reg = verifyRegistration(a.register("r"), ctx("r"));
    const asCreate = { ...a.login("t"), clientDataJSON: a.register("t").clientDataJSON };
    expect(() => verifyAssertion(asCreate, ctx("t"), reg.publicKey, 0)).toThrow(/Type/);
  });
});
