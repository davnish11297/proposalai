import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import User from '@/models/User';
import Organization from '@/models/Organization';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Find proposal by ID - this should be publicly accessible
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

    // Check if proposal allows public access (you might want to add this field)
    // For now, we'll allow access to all proposals
    
    // Get additional data
    const user = await User.findById(proposal.userId).select('firstName lastName');
    const organization = await Organization.findById(proposal.organizationId).select('name slug');

    // Don't expose sensitive data in public view
    const publicProposal = {
      _id: proposal._id,
      title: proposal.title,
      description: proposal.description,
      content: proposal.content,
      status: proposal.status,
      type: proposal.type,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      clientInfo: proposal.clientInfo,
      user: user ? {
        firstName: user.firstName,
        lastName: user.lastName
      } : null,
      organization: organization ? {
        name: organization.name,
        slug: organization.slug
      } : null
    };

    return NextResponse.json({
      success: true,
      data: publicProposal
    });

  } catch (error) {
    console.error('Get public proposal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get proposal'
      },
      { status: 500 }
    );
  }
}