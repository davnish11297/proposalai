import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint only available in development' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    openRouterKeyPrefix: process.env.OPENROUTER_API_KEY?.substring(0, 10) || 'Not found',
    hasMongoUri: !!process.env.MONGODB_URI_DEV,
    hasSendGridKey: !!process.env.SENDGRID_API_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set',
    availableEnvVars: Object.keys(process.env).filter(key => 
      key.startsWith('MONGODB_') || 
      key.startsWith('OPENROUTER_') || 
      key.startsWith('SENDGRID_') || 
      key.startsWith('JWT_') ||
      key.startsWith('NEXTAUTH_')
    )
  });
}