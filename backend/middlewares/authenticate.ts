import type { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import { verifyAccessToken } from '../services/jwt.service';

// Gate for every endpoint that requires a logged-in user. It verifies the access token and
// publishes the caller's identity on `req.user` for the middleware and controllers behind it.

// Reads the `Authorization: Bearer <token>` header, verifies the signature and expiry, and
// attaches `{ id, role }` to `req.user` before calling `next`. A missing header, a wrong
// scheme, a tampered signature or an expired token all fail the same way — 401 with code
// `UNAUTHENTICATED` — so an attacker cannot tell from the response which part was wrong.
// The 401 also matters to the frontend: `authFetch` treats exactly that status as "access
// token expired" and silently refreshes, so returning 403 here would break auto-refresh.
// `payload.sub` holds the user id because that is the registered JWT claim for subject.
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Missing access token'));
  }

  try {
    const payload = verifyAccessToken(token) as { sub: string; role: string };
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Access token is invalid or expired'));
  }
}

export default authenticate;
