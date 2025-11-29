import { NextFunction, Request, Response } from 'express';
import { adminAuth, DecodedIdToken } from '../lib/firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

/**
 * Express middleware to verify Firebase ID token from Authorization: Bearer <token>.
 * Attaches decoded token to req.user on success.
 */
export async function checkAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing Authorization header' });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
