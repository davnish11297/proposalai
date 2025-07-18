import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export interface JWTPayload {
  userId: string;
  email: string;
  organizationId?: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: IUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export function generatePublicUrl(proposalId: string): string {
  const baseUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
  return `${baseUrl}/proposal/${proposalId}`;
}

export function generateSecureToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  req.user = payload;
  next();
} 