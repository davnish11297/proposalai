import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/auth';
import { prisma } from '../utils/database';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload & {
    organizationId?: string;
  };
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User account not found'
      });
      return;
    }

    // Cast the request to include the user property
    (req as AuthenticatedRequest).user = {
      ...payload,
      organizationId: user.organizationId
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authenticatedReq = req as AuthenticatedRequest;
    if (!authenticatedReq.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(authenticatedReq.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

export function requireOrganization(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authenticatedReq = req as AuthenticatedRequest;
  if (!authenticatedReq.user?.organizationId) {
    res.status(403).json({
      success: false,
      error: 'Organization membership required'
    });
    return;
  }

  next();
}

export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        (req as AuthenticatedRequest).user = payload;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
} 