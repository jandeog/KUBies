import jwt from 'jsonwebtoken';

// Define the same secret used to sign the token in your /api/login
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';

export function verifySessionToken(token: string): { id?: string; username?: string } | null {
  try {
    const decoded = jwt.verify(token, SECRET) as any;
    return { id: decoded.id, username: decoded.username };
  } catch {
    return null;
  }
}
