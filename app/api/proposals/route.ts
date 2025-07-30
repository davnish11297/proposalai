import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import Proposal from '@/models/Proposal';

export async function GET(request: NextRequest) {
  try {
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

    await connectDB();

    const proposals = await Proposal.find({ 
      organizationId: userAuth.organizationId 
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: proposals
    });

  } catch (error) {
    console.error('Get proposals error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get proposals'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { title, description, content, status = 'DRAFT', type = 'PROPOSAL', clientName } = body;

    if (!title || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and content are required'
        },
        { status: 400 }
      );
    }

    await connectDB();

    const proposal = await Proposal.create({
      title,
      description,
      content,
      status,
      type,
      userId: userAuth.userId,
      organizationId: userAuth.organizationId,
      clientInfo: clientName ? { name: clientName } : undefined
    });

    return NextResponse.json({
      success: true,
      data: proposal,
      message: 'Proposal created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create proposal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create proposal'
      },
      { status: 500 }
    );
  }
}