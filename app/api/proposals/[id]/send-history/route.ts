import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import { VersionManager } from '@/lib/services/versionManager';

// GET enhanced send history with version details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const sendHistory = await VersionManager.getEnhancedSendHistory(params.id);

    return NextResponse.json({
      success: true,
      data: sendHistory,
    });

  } catch (error) {
    console.error('Get send history error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch send history' },
      { status: 500 }
    );
  }
}