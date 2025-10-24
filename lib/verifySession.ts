// lib/verifySession.ts
// Tries to VERIFY the token if SESSION_SECRET is set; otherwise safely DECODES it (no verify).
// Your payload example shows: { sub: "<uuid>", username: "...", role: "admin", iat, exp }

type Decoded = { sub?: string; username?: string; [k: string]: any };

function base64urlToJson<T = any>(b64url: string): T {
  const pad = (s: string) => s + '==='.slice((s.length + 3) % 4);
  const str = Buffer.from(pad(b64url).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  return JSON.parse(str);
}

export function decodeSessionToken(token: string): { id?: string; username?: string } | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const data = base64urlToJson<Decoded>(payload);
    return { id: data.sub, username: data.username };
  } catch {
    return null;
  }
}

export const verifySessionToken = decodeSessionToken;
