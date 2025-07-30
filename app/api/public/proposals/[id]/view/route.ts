import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Proposal from '@/models/Proposal';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { viewedAt, userAgent } = body;

    await connectDB();

    // Find proposal
    const proposal = await Proposal.findById(params.id);
    if (!proposal) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proposal not found'
        },
        { status: 404 }
      );
    }

    // Add view tracking
    const viewData = {
      viewedAt: new Date(viewedAt || Date.now()),
      viewerIP: request.ip || 'unknown',
      viewerUserAgent: userAgent || 'unknown'
    };

    await Proposal.findByIdAndUpdate(params.id, {
      $push: { views: viewData },
      viewedAt: new Date(),
      status: proposal.status === 'SENT' ? 'VIEWED' : proposal.status
    });

    return NextResponse.json({
      success: true,
      message: 'View tracked successfully'
    });

  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track view'
      },
      { status: 500 }
    );
  }
}