import { IUser } from '../types';
export interface JWTPayload {
    userId: string;
    email: string;
    organizationId?: string;
    role: string;
}
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hashedPassword: string): Promise<boolean>;
export declare function generateToken(user: IUser): string;
export declare function verifyToken(token: string): JWTPayload | null;
export declare function extractTokenFromHeader(authHeader: string): string | null;
export declare function generatePublicUrl(proposalId: string): string;
export declare function generateSecureToken(): string;
export declare function authenticateToken(req: any, res: any, next: any): any;
//# sourceMappingURL=auth.d.ts.map