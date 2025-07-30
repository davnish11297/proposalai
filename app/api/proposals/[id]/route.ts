import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import { VersionManager } from '@/lib/services/versionManager';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET proposal with ID:', params.id);
    
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

    await connectDB();

    const proposal = await Proposal.findOne({
      _id: params.id,
      organizationId: userAuth.organizationId
    });

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
      data: proposal
    });

  } catch (error) {
    console.error('Get proposal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get proposal'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT proposal with ID:', params.id);
    
    // Validate proposal ID
    if (!params.id || params.id === 'undefined' || params.id === 'null') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid proposal ID'
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
          error: 'Invalid proposal ID format'
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
    const { title, description, content, status, type, clientName, createNewVersion } = body;

    await connectDB();

    // Get current proposal
    const currentProposal = await Proposal.findOne({
      _id: params.id,
      organizationId: userAuth.organizationId
    });

    if (!currentProposal) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proposal not found'
        },
        { status: 404 }
      );
    }

    // Check if content has actually changed
    const contentChanged = content && await VersionManager.hasContentChanged(params.id, content);
    let newVersion = currentProposal.version;

    // Create new version if content changed or explicitly requested
    if ((contentChanged || createNewVersion) && content) {
      console.log('Content changed, creating new version');
      
      newVersion = await VersionManager.createVersionSnapshot(
        params.id,
        content,
        title || currentProposal.title,
        description || currentProposal.description,
        userAuth.userId,
        'content_edit'
      );
    }
    
    // Build update data (excluding version-related fields handled by VersionManager)
    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(status && { status }),
      ...(type && { type }),
      ...(clientName && { 'clientInfo.name': clientName }),
      updatedAt: new Date(),
      hasUnsavedChanges: false
    };

    // Update proposal
    const proposal = await Proposal.findOneAndUpdate(
      {
        _id: params.id,
        organizationId: userAuth.organizationId
      },
      updateData,
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

    const responseMessage = contentChanged 
      ? `Proposal updated successfully (new version ${newVersion})`
      : 'Proposal updated successfully';

    return NextResponse.json({
      success: true,
      data: proposal,
      message: responseMessage,
      version: newVersion,
      versionCreated: contentChanged
    });

  } catch (error) {
    console.error('Update proposal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update proposal'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE proposal with ID:', params.id);
    
    // Validate proposal ID
    if (!params.id || params.id === 'undefined' || params.id === 'null') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid proposal ID'
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
          error: 'Invalid proposal ID format'
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

    await connectDB();

    const proposal = await Proposal.findOneAndDelete({
      _id: params.id,
      organizationId: userAuth.organizationId
    });

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
      message: 'Proposal deleted successfully'
    });

  } catch (error) {
    console.error('Delete proposal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete proposal'
      },
      { status: 500 }
    );
  }
}