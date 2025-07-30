import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './auth';
import connectDB from './mongodb';
import User from '@/models/User';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

export async function authenticateToken(request: NextRequest): Promise<any> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader || undefined);

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    
    // Connect to database and get user details
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      organizationId: user.organizationId.toString(),
      role: user.role,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function createAuthResponse(message: string, status: number = 401) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}