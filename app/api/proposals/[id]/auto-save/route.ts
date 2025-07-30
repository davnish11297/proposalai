import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import Proposal from '@/models/Proposal';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Auto-save proposal with ID:', params.id);
    
    // Validate proposal ID
    if (!params.id || params.id === 'undefined') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid proposal ID'
        },
        { status: 400 }
      );
    }

    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, title, description } = body;

    await connectDB();

    // Only save draft data (lightweight save)
    const proposal = await Proposal.findOneAndUpdate(
      {
        _id: params.id,
        organizationId: userAuth.organizationId
      },
      {
        ...(content && { content }),
        ...(title && { title }),
        ...(description && { description }),
        lastAutoSave: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!proposal) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proposal not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auto-save error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Auto-save failed'
      },
      { status: 500 }
    );
  }
}