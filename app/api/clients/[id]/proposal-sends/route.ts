import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import { ClientService } from '@/lib/services/clientService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET proposal sends for client with ID:', params.id);
    
    // Validate client ID
    if (!params.id || params.id === 'undefined') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid client ID'
        },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(params.id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid client ID format'
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

    const proposalSends = await ClientService.getClientProposalSendsGrouped(
      params.id,
      userAuth.organizationId
    );

    return NextResponse.json({
      success: true,
      data: proposalSends
    });

  } catch (error) {
    console.error('Get client proposal sends error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get client proposal sends'
      },
      { status: 500 }
    );
  }
}