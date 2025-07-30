import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import Client from '@/models/Client';
import { FollowUpService } from '@/lib/services/followUpService';
import { ClientService } from '@/lib/services/clientService';

// POST execute one-click action
export async function POST(request: NextRequest) {
  try {
    const userAuth = await authenticateToken(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, proposalId, clientId, emailTemplate, data } = body;

    await connectDB();

    let result;

    switch (action) {
      case 'send-follow-up':
        result = await handleSendFollowUp(proposalId, userAuth, emailTemplate);
        break;
      
      case 'create-proposal':
        result = await handleCreateProposal(clientId, userAuth, data);
        break;
      
      case 'update-status':
        result = await handleUpdateStatus(proposalId, userAuth, data.status);
        break;
      
      case 'download-pdf':
        result = await handleDownloadPdf(proposalId, userAuth);
        break;
      
      case 'send-quick-email':
        result = await handleSendQuickEmail(proposalId, userAuth, data);
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action type' },
          { status: 400 }
        );
    }

    // Log action for audit trail
    await logAction(userAuth.userId, action, { proposalId, clientId, data });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Action executed successfully',
    });

  } catch (error) {
    console.error('One-click action error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}

// Handle send follow-up action
async function handleSendFollowUp(proposalId: string, userAuth: any, emailTemplate?: any) {
  const proposal = await Proposal.findOne({
    _id: proposalId,
    organizationId: userAuth.organizationId,
  }).populate('clientId userId');

  if (!proposal) {
    throw new Error('Proposal not found');
  }

  if (emailTemplate) {
    // Send custom follow-up email immediately
    const emailSent = await FollowUpService.sendFollowUpEmail(
      proposal,
      { emailTemplate },
      { _id: 'quick-action' }
    );
    
    if (!emailSent) {
      throw new Error('Failed to send follow-up email');
    }

    // Update proposal send history
    proposal.sendHistory.push({
      sentAt: new Date(),
      sentTo: proposal.clientId?.email || proposal.clientInfo?.email,
      clientName: proposal.clientId?.name || proposal.clientInfo?.name,
      subject: emailTemplate.subject,
      status: 'SENT',
      version: proposal.version || 1,
    });
    await proposal.save();

    return { emailSent: true, type: 'immediate' };
  } else {
    // Trigger automated follow-up sequence
    await FollowUpService.autoTriggerForProposal(proposalId);
    return { emailSent: true, type: 'sequence' };
  }
}

// Handle create proposal action
async function handleCreateProposal(clientId: string, userAuth: any, data: any) {
  const client = await Client.findOne({
    _id: clientId,
    organizationId: userAuth.organizationId,
  });

  if (!client) {
    throw new Error('Client not found');
  }

  // Create new proposal with client pre-filled
  const proposal = await Proposal.create({
    title: data?.title || 'New Proposal for ' + client.name,
    content: data?.content || '',
    description: data?.description || '',
    status: 'DRAFT',
    type: 'PROPOSAL',
    userId: userAuth.userId,
    organizationId: userAuth.organizationId,
    clientId: client._id,
    clientInfo: {
      name: client.name,
      email: client.email,
      company: client.company,
      phone: client.phone,
    },
  });

  return {
    proposalId: proposal._id,
    proposalUrl: `/proposals/${proposal._id}`,
  };
}

// Handle update status action
async function handleUpdateStatus(proposalId: string, userAuth: any, status: string) {
  const proposal = await Proposal.findOneAndUpdate(
    {
      _id: proposalId,
      organizationId: userAuth.organizationId,
    },
    {
      status,
      updatedAt: new Date(),
      ...(status === 'SENT' && { sentAt: new Date() }),
      ...(status === 'VIEWED' && { viewedAt: new Date() }),
      ...(status === 'ACCEPTED' && { respondedAt: new Date() }),
      ...(status === 'REJECTED' && { respondedAt: new Date() }),
    },
    { new: true }
  );

  if (!proposal) {
    throw new Error('Proposal not found');
  }

  // Update client statistics if status changed to ACCEPTED
  if (status === 'ACCEPTED' && proposal.clientId) {
    await ClientService.updateClientProposalStats(proposal.clientId.toString(), status);
  }

  return { updated: true, newStatus: status };
}

// Handle download PDF action
async function handleDownloadPdf(proposalId: string, userAuth: any) {
  const proposal = await Proposal.findOne({
    _id: proposalId,
    organizationId: userAuth.organizationId,
  });

  if (!proposal) {
    throw new Error('Proposal not found');
  }

  // Return PDF generation URL (the frontend will handle the actual download)
  return {
    downloadUrl: `/api/proposals/${proposalId}/download-pdf`,
    proposalTitle: proposal.title,
  };
}

// Handle send quick email action
async function handleSendQuickEmail(proposalId: string, userAuth: any, emailData: any) {
  const proposal = await Proposal.findOne({
    _id: proposalId,
    organizationId: userAuth.organizationId,
  }).populate('clientId userId');

  if (!proposal) {
    throw new Error('Proposal not found');
  }

  // Use the existing send-email endpoint logic
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/proposals/${proposalId}/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userAuth.token}`,
    },
    body: JSON.stringify({
      recipientEmail: emailData.recipientEmail,
      clientName: emailData.clientName,
      subject: emailData.subject,
      message: emailData.message,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  return { emailSent: true };
}

// Log action for audit trail
async function logAction(userId: string, action: string, metadata: any) {
  try {
    // You could create an ActionLog model for this, but for now just console log
    console.log('Action executed:', {
      userId,
      action,
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error logging action:', error);
  }
}