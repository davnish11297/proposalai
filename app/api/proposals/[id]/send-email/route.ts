import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/middleware';
import connectDB from '@/lib/mongodb';
import Proposal from '@/models/Proposal';
import User from '@/models/User';
import Organization from '@/models/Organization';
import { ClientService } from '@/lib/services/clientService';
import { VersionManager } from '@/lib/services/versionManager';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { 
      recipientEmail, 
      clientName, 
      subject, 
      message, 
      sendCurrentVersion = true,
      forceNewVersion = false 
    } = body;

    if (!recipientEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipient email is required'
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Get proposal
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

    // Get user and organization details
    const [user, organization] = await Promise.all([
      User.findById(userAuth.userId),
      Organization.findById(userAuth.organizationId)
    ]);

    if (!user || !organization) {
      return NextResponse.json(
        {
          success: false,
          error: 'User or organization not found'
        },
        { status: 404 }
      );
    }

    // Ensure we have a version snapshot before sending
    let versionToSend = proposal.version;
    const hasUnsavedChanges = proposal.hasUnsavedChanges || false;
    
    // Check if we need to create a version snapshot before sending
    if (!proposal.versionSnapshots || proposal.versionSnapshots.length === 0 || hasUnsavedChanges || forceNewVersion) {
      console.log('Creating pre-send version snapshot');
      
      versionToSend = await VersionManager.createVersionSnapshot(
        params.id,
        proposal.content,
        proposal.title,
        proposal.description,
        userAuth.userId,
        'pre_send'
      );
    }

    // Generate proposal URL for viewing
    const proposalUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/public/proposals/${proposal.publicId || proposal._id}`;

    // Prepare email content
    const emailSubject = subject || `${proposal.title} - Proposal from ${organization.name}`;
    const customMessage = message || `Dear ${clientName || 'there'},\\n\\nPlease find attached our proposal for your review.`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${organization.name}</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Professional Proposal</p>
        </div>
        
        <div style="padding: 0 20px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">${proposal.title}</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-line;">${customMessage}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${proposalUrl}" 
               style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
                      color: white; 
                      text-decoration: none; 
                      padding: 15px 30px; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      display: inline-block; 
                      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">
              📄 View Proposal Online
            </a>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0369a1; margin-top: 0;">Proposal Details</h3>
            <ul style="color: #0369a1; padding-left: 20px;">
              <li><strong>Version:</strong> v${versionToSend}</li>
              <li><strong>Sent:</strong> ${new Date().toLocaleDateString()}</li>
              <li><strong>From:</strong> ${user.firstName} ${user.lastName}</li>
            </ul>
          </div>
          
          <p>If you have any questions or need clarification on any aspect of this proposal, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br>
          ${user.firstName} ${user.lastName}<br>
          ${organization.name}</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #9ca3af;">
            This proposal was sent from ProposalAI. 
            <a href="${proposalUrl}" style="color: #2563eb;">View online</a>
          </p>
        </div>
      </div>
    `;

    // Create or find client
    const client = await ClientService.findOrCreateClient(
      {
        name: clientName || 'Unknown Client',
        email: recipientEmail,
        company: 'Unknown Company'
      },
      userAuth
    );

    // Send email using SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const emailData = {
        to: recipientEmail,
        from: process.env.EMAIL_FROM || 'noreply@proposalai.com',
        subject: emailSubject,
        html: emailContent
      };

      await sgMail.send(emailData);
      console.log(`Email sent to ${recipientEmail} for proposal ${params.id} version ${versionToSend}`);
    } else {
      console.warn('SendGrid API key not configured, email not sent');
    }

    // Use VersionManager to record the send with immutable version data
    const sendRecord = await VersionManager.sendProposalVersion({
      proposalId: params.id,
      sentTo: recipientEmail,
      clientName: clientName || 'Unknown Client',
      subject: emailSubject,
      emailMessage: message,
      sentBy: userAuth.userId,
      sendMethod: 'EMAIL'
    });

    // Update proposal status and client info
    await Proposal.findByIdAndUpdate(proposal._id, {
      status: 'SENT',
      clientId: client._id,
      'clientInfo.name': clientName,
      'clientInfo.email': recipientEmail,
      emailSent: true,
      emailSentAt: new Date(),
      emailSentTo: [recipientEmail],
      emailSubject,
      emailMessage: message,
      sentAt: new Date(),
      hasUnsavedChanges: false
    });

    // Update client proposal statistics
    await ClientService.updateClientProposalStats(client._id, 'SENT');

    return NextResponse.json({
      success: true,
      message: `Proposal sent successfully as version ${versionToSend}`,
      data: {
        proposalUrl,
        sentTo: recipientEmail,
        version: versionToSend,
        sendId: sendRecord.sendId,
        versionLocked: true
      }
    });

  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email'
      },
      { status: 500 }
    );
  }
}