// lib/verifySession.ts
// Lightweight decoder for a JWT (no signature verification), suitable for your custom cookie.
// Extracts { id, username } from the payload where "sub" is the UUID user id.

export type SessionIdentity = { id?: string; username?: string; role?: string };

function base64urlToJson<T = any>(b64url: string): T {
  // normalize base64url → base64
  const pad = (s: string) => s + '==='.slice((s.length + 3) % 4);
  const b64 = pad(b64url).replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(b64, 'base64').toString('utf8');
  return JSON.parse(json);
}

function stripWrapperQuotes(s: string) {
  // handle cases where the cookie is accidentally stored with surrounding quotes
  return s.replace(/^"+|"+$/g, '').replace(/^Bearer\s+/i, '');
}

export function decodeSessionToken(rawToken: string | undefined | null): SessionIdentity | null {
  if (!rawToken) return null;
  try {
    const token = stripWrapperQuotes(rawToken);
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = base64urlToJson<any>(parts[1]);

    const id = payload?.sub ?? payload?.id ?? undefined;
    const username = payload?.username ?? payload?.email ?? undefined;
    const role = payload?.role ?? undefined;

    if (!id && !username) return null;
    return { id, username, role };
  } catch {
    return null;
  }
}

// Backward-compatible alias if you previously imported this name:
export const verifySessionToken = decodeSessionToken;
