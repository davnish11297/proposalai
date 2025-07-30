import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import { VersionManager } from '@/lib/services/versionManager';

// GET all versions for a proposal
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

    const versionHistory = await VersionManager.getVersionHistory(params.id);

    return NextResponse.json({
      success: true,
      data: versionHistory,
    });

  } catch (error) {
    console.error('Get versions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch version history' },
      { status: 500 }
    );
  }
}

// POST create new version
export async function POST(
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

    const body = await request.json();
    const { content, title, description, changeType } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const newVersion = await VersionManager.createVersionSnapshot(
      params.id,
      content,
      title || '',
      description || '',
      userAuth.userId,
      changeType || 'content_edit'
    );

    return NextResponse.json({
      success: true,
      data: { version: newVersion },
      message: `Created version ${newVersion}`,
    });

  } catch (error) {
    console.error('Create version error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create version' },
      { status: 500 }
    );
  }
}