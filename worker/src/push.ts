/**
 * Web Push (RFC 8291 / VAPID) implemented on the Web Crypto API.
 *
 * Why hand-rolled: the usual `web-push` library depends on Node crypto and
 * doesn't run on Cloudflare Workers. This uses only primitives the Workers
 * runtime provides, so it deploys with no polyfills.
 *
 * Push is what makes alerts arrive with the app CLOSED — the missing piece a
 * static page can never provide.
 */

const b64urlToBytes = (s: string): Uint8Array => {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const bytesToB64url = (b: ArrayBuffer | Uint8Array): string => {
  const arr = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  for (const byte of arr) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const concat = (...parts: Uint8Array[]): Uint8Array => {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

export interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Signed VAPID JWT proving who is sending the push. */
async function vapidAuth(audience: string, subject: string, privateKeyB64: string, publicKeyB64: string) {
  const header = bytesToB64url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  })));
  const unsigned = `${header}.${payload}`;

  const pub = b64urlToBytes(publicKeyB64);       // 65-byte uncompressed point
  const priv = b64urlToBytes(privateKeyB64);     // 32-byte scalar
  const jwk: JsonWebKey = {
    kty: "EC", crv: "P-256",
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    d: bytesToB64url(priv),
    ext: true,
  };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsigned));
  return `vapid t=${unsigned}.${bytesToB64url(sig)}, k=${publicKeyB64}`;
}

/** aes128gcm payload encryption, per RFC 8291. */
async function encrypt(payload: string, p256dhB64: string, authB64: string) {
  const clientPub = b64urlToBytes(p256dhB64);
  const authSecret = b64urlToBytes(authB64);

  const localKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeys.publicKey));

  const clientKey = await crypto.subtle.importKey("raw", clientPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, localKeys.privateKey, 256));

  const hkdf = async (salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number) => {
    const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, len * 8));
  };

  const enc = new TextEncoder();
  const prkInfo = concat(enc.encode("WebPush: info\0"), clientPub, localPubRaw);
  const ikm = await hkdf(authSecret, shared, prkInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const body = concat(enc.encode(payload), new Uint8Array([0x02])); // 0x02 = final record
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, body));

  // Header: salt(16) | recordSize(4) | keyIdLen(1) | keyId
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  return concat(salt, rs, new Uint8Array([localPubRaw.length]), localPubRaw, ciphertext);
}

export async function sendPush(
  sub: PushSubscription,
  payload: string,
  env: { VAPID_PUBLIC: string; VAPID_PRIVATE: string; VAPID_SUBJECT: string }
): Promise<{ ok: boolean; status: number; gone: boolean }> {
  const url = new URL(sub.endpoint);
  const [auth, bodyBytes] = await Promise.all([
    vapidAuth(url.origin, env.VAPID_SUBJECT, env.VAPID_PRIVATE, env.VAPID_PUBLIC),
    encrypt(payload, sub.keys.p256dh, sub.keys.auth),
  ]);

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
    },
    body: bodyBytes,
  });

  // 404/410 mean the subscription is dead and should be dropped.
  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
}
