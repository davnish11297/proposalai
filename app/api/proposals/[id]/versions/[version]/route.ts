import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import { VersionManager } from '@/lib/services/versionManager';

// GET specific version content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; version: string } }
) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const version = parseInt(params.version);
    if (isNaN(version) || version < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid version number' },
        { status: 400 }
      );
    }

    await connectDB();

    const versionContent = await VersionManager.getVersionContent(params.id, version);

    return NextResponse.json({
      success: true,
      data: versionContent,
    });

  } catch (error) {
    console.error('Get version content error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch version content' },
      { status: 500 }
    );
  }
}