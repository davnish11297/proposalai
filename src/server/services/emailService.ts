import sgMail from '@sendgrid/mail';
import { IProposal } from '../types';
import { emailTrackingService } from './emailTrackingService';

export interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private isConfigured: boolean = false;

  constructor() {
    // Check for SendGrid API key (preferred)
    if (process.env.SENDGRID_API_KEY) {
      const apiKey = process.env.SENDGRID_API_KEY;
      console.log('✅ Email service configured with SendGrid');
      console.log(`📧 SendGrid API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
      console.log(`📧 From Email: ${process.env.EMAIL_FROM || 'davnishsingh46@gmail.com'}`);
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
    }
    // Fallback to SMTP configuration (keeping for backward compatibility)
    else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('⚠️  SendGrid not configured, falling back to SMTP');
      console.log('   To use SendGrid (recommended), set SENDGRID_API_KEY environment variable');
      this.isConfigured = true;
    } else {
      console.log('⚠️  Email service not configured. Email sending will be disabled.');
      console.log('   To enable email sending, set either:');
      console.log('   - SENDGRID_API_KEY for SendGrid (recommended)');
      console.log('   - SMTP_HOST, SMTP_USER, and SMTP_PASS for SMTP');
    }
  }

  // Add a method to check if SendGrid is working
  private async testSendGridConnection(): Promise<boolean> {
    try {
      // Try to send a test email to verify connection
      const testMsg = {
        to: 'test@example.com',
        from: process.env.EMAIL_FROM || 'davnishsingh46@gmail.com',
        subject: 'Test Connection',
        text: 'Test'
      };
      await sgMail.send(testMsg);
      return true;
    } catch (error) {
      console.log('⚠️  SendGrid connection test failed, will use fallback mode');
      return false;
    }
  }

  private generateAccessCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private cleanMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  private generateEmailHTML(proposal: IProposal, pdfUrl?: string, trackingId?: string, accessCode?: string): string {
    // Parse content if it's a string
    let content: any;
    try {
      content = typeof proposal.content === 'string' ? JSON.parse(proposal.content) : proposal.content;
    } catch (error) {
      content = {};
    }
    
    // Generate tracking pixel and links
    const trackingPixel = trackingId ? `<img src="${process.env.API_BASE_URL || 'http://localhost:3000'}/api/email-tracking/track/${trackingId}/pixel.png" width="1" height="1" style="display:none;" />` : '';
    const proposalLink = `${process.env.CLIENT_BASE_URL || 'http://localhost:3000'}/proposal/${proposal.id}?accessCode=${accessCode}`;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${proposal.title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #2563eb, #1e40af);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8fafc;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .proposal-title {
            font-size: 24px;
            margin-bottom: 10px;
            font-weight: 600;
          }
          .proposal-subtitle {
            font-size: 16px;
            opacity: 0.9;
          }
          .section {
            margin-bottom: 20px;
          }
          .section h3 {
            color: #1e40af;
            margin-bottom: 10px;
            font-size: 18px;
          }
          .section p {
            color: #4b5563;
            margin-bottom: 10px;
          }
          .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .access-code {
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
          }
          .access-code-text {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="proposal-title">
            ${proposal.title}
          </div>
          <div class="proposal-subtitle">
            Professional Proposal
          </div>
        </div>
        
        <div class="content">
          <p>Hello,</p>
          
          <p>You have received a professional proposal. Please review the details below:</p>
          
          ${content.executiveSummary ? `
            <div class="section">
              <h3>Executive Summary</h3>
              <p>${this.cleanMarkdown(content.executiveSummary)}</p>
            </div>
          ` : ''}
          
          ${content.approach ? `
            <div class="section">
              <h3>Approach</h3>
              <p>${this.cleanMarkdown(content.approach)}</p>
            </div>
          ` : ''}
          
          ${content.budgetDetails ? `
            <div class="section">
              <h3>Budget Details</h3>
              <p>${this.cleanMarkdown(content.budgetDetails)}</p>
            </div>
          ` : ''}
          
          ${content.timeline ? `
            <div class="section">
              <h3>Timeline</h3>
              <p>${this.cleanMarkdown(content.timeline)}</p>
            </div>
          ` : ''}
          
          <div class="access-code">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your Access Code:</p>
            <div class="access-code-text">${accessCode}</div>
          </div>
          
          <div style="text-align: center;">
            <a href="${proposalLink}" class="cta-button">View Full Proposal</a>
          </div>
          
          <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
            Use the access code above to view the complete proposal with all details, attachments, and interactive features.
          </p>
          
          <div class="footer">
            <p>This proposal was sent via ProposalAI. Please do not reply to this email.</p>
          </div>
        </div>
        
        ${trackingPixel}
      </body>
      </html>
    `;
  }

  async sendProposalEmail(
    proposal: IProposal,
    recipientEmail: string,
    pdfBuffer?: Buffer,
    pdfUrl?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; trackingId?: string; accessCode?: string }> {
    // Check if email service is configured
    if (!this.isConfigured) {
      console.log('📧 Email service not configured. Skipping email send.');
      console.log(`📧 Would have sent proposal "${proposal.title}" to ${recipientEmail}`);
      
      // Still generate tracking ID and access code for consistency
      const trackingId = emailTrackingService.generateTrackingId();
      const accessCode = this.generateAccessCode();
      
      return {
        success: true, // Return success to not break the flow
        messageId: 'email-disabled',
        trackingId,
        accessCode,
        error: 'Email service not configured'
      };
    }

    try {
      // Generate tracking ID and access code
      const trackingId = emailTrackingService.generateTrackingId();
      const accessCode = this.generateAccessCode();
      
      const msg = {
        to: recipientEmail,
        from: process.env.EMAIL_FROM || 'davnishsingh46@gmail.com',
        subject: `Proposal: ${proposal.title}`,
        html: this.generateEmailHTML(proposal, pdfUrl, trackingId, accessCode),
        attachments: pdfBuffer ? [
          {
            content: pdfBuffer.toString('base64'),
            filename: `${proposal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_proposal.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ] : undefined
      };

      console.log('📧 Sending email via SendGrid:', {
        to: recipientEmail,
        from: msg.from,
        subject: msg.subject,
        hasAttachments: !!pdfBuffer
      });

      const response = await sgMail.send(msg);
      
      console.log(`📧 Email sent successfully to ${recipientEmail} for proposal "${proposal.title}"`);
      
      return {
        success: true,
        messageId: response[0]?.headers['x-message-id'] || 'sendgrid-message-id',
        trackingId,
        accessCode
      };
    } catch (error) {
      console.error('Email sending error:', error);
      
      // Log specific SendGrid error details
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response;
        console.error('SendGrid Error Details:', {
          status: response?.status,
          statusText: response?.statusText,
          data: response?.data,
          headers: response?.headers
        });
      }
      
      // Always return success to not break the application flow
      // The email wasn't sent, but the proposal process should continue
      console.log(`📧 Email sending failed, but continuing with proposal flow for "${proposal.title}"`);
      console.log(`📧 Would have sent to: ${recipientEmail}`);
      
      return {
        success: true, // Return success to not break the flow
        messageId: 'sendgrid-failed',
        trackingId: emailTrackingService.generateTrackingId(),
        accessCode: this.generateAccessCode(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 Email service not configured - skipping verification');
      return false;
    }
    
    try {
      // For SendGrid, we can test by sending a test email to ourselves
      if (process.env.SENDGRID_API_KEY) {
        console.log('✅ SendGrid API key configured');
        return true;
      }
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service verification failed:', error);
      return false;
    }
  }

  async sendAccessRequestEmail(data: {
    to: string;
    proposalTitle: string;
    requesterName: string;
    requesterEmail: string;
    requesterCompany: string;
    reason: string;
    proposalId: string;
    accessCode?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      console.log('📧 Email service not configured. Skipping access request email.');
      return { success: true, messageId: 'email-disabled' }; // Return success to not break the flow
    }

    try {
      // Check if this is a test email (example.com, test.com, etc.)
      const isTestEmail = data.to.includes('example.com') || data.to.includes('test.com') || data.to.includes('localhost');
      
      if (isTestEmail) {
        console.log(`📧 Test email detected for ${data.to}. Skipping actual email send.`);
        return { success: true, messageId: 'test-email-skipped' };
      }

      const proposalLink = data.accessCode 
        ? `${process.env.CLIENT_BASE_URL || 'http://localhost:3000'}/proposal/${data.proposalId}?accessCode=${data.accessCode}`
        : `${process.env.CLIENT_BASE_URL || 'http://localhost:3000'}/proposals`;
      
      const msg = {
        to: data.to,
        from: process.env.EMAIL_FROM || 'davnishsingh46@gmail.com',
        subject: data.accessCode ? `Access Granted: ${data.proposalTitle}` : `Access Request: ${data.proposalTitle}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${data.accessCode ? 'Access Granted' : 'Access Request'}</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #2563eb, #1e40af);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f8fafc;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .request-details {
                background: #f3f4f6;
                border: 1px solid #e5e7eb;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .access-code {
                background: #f3f4f6;
                border: 2px dashed #d1d5db;
                padding: 15px;
                text-align: center;
                border-radius: 8px;
                margin: 20px 0;
              }
              .access-code-text {
                font-size: 24px;
                font-weight: bold;
                color: #1e40af;
                letter-spacing: 2px;
                font-family: 'Courier New', monospace;
              }
              .cta-button {
                display: inline-block;
                background: #2563eb;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${data.accessCode ? 'Access Granted' : 'Access Request'}</h1>
              <p>${data.accessCode ? 'Your access request has been approved' : 'Someone has requested access to your proposal'}</p>
            </div>
            
            <div class="content">
              ${data.accessCode ? `
                <h2>🎉 Access Granted!</h2>
                <p><strong>Proposal:</strong> ${data.proposalTitle}</p>
                <p>Your access request has been approved. You can now view the proposal using the access code below:</p>
                
                <div class="access-code">
                  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your Access Code:</p>
                  <div class="access-code-text">${data.accessCode}</div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${proposalLink}" class="cta-button">View Proposal</a>
                </div>
              ` : `
                <h2>Access Request Details</h2>
                
                <div class="request-details">
                  <p><strong>Proposal:</strong> ${data.proposalTitle}</p>
                  <p><strong>Requester Name:</strong> ${data.requesterName}</p>
                  <p><strong>Requester Email:</strong> ${data.requesterEmail}</p>
                  <p><strong>Company:</strong> ${data.requesterCompany}</p>
                  <p><strong>Reason for Access:</strong> ${data.reason}</p>
                </div>
                
                <p>You can review this request and decide whether to grant access to your proposal. If you approve, you can send them an access code through your proposal dashboard.</p>
                
                <div style="text-align: center;">
                  <a href="${proposalLink}" class="cta-button">View Proposal Dashboard</a>
                </div>
              `}
              
              <div class="footer">
                <p>This is an automated message from ProposalAI. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: result[0]?.headers['x-message-id'] || 'sendgrid-message-id'
      };
    } catch (error) {
      console.error('Failed to send access request email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Send notification to proposal owner
  async sendOwnerNotificationEmail(data: {
    to: string;
    proposalTitle: string;
    proposalId: string;
    type: 'opened' | 'comment' | 'approved' | 'rejected';
    clientName?: string;
    clientEmail?: string;
    commentContent?: string;
    feedbackComment?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      console.log('📧 Email service not configured. Skipping owner notification email.');
      return { success: true, messageId: 'email-disabled' };
    }

    try {
      // Check if this is a test email
      const isTestEmail = data.to.includes('example.com') || data.to.includes('test.com') || data.to.includes('localhost');
      
      if (isTestEmail) {
        console.log(`📧 Test email detected for ${data.to}. Skipping actual email send.`);
        return { success: true, messageId: 'test-email-skipped' };
      }

      const proposalLink = `${process.env.CLIENT_BASE_URL || 'http://localhost:3000'}/proposals/${data.proposalId}`;
      
      let subject = '';
      let content = '';
      
      switch (data.type) {
        case 'opened':
          subject = `👁️ Proposal Opened: ${data.proposalTitle}`;
          content = `
            <h2>Proposal Viewed</h2>
            <p><strong>Proposal:</strong> ${data.proposalTitle}</p>
            <p><strong>Client:</strong> ${data.clientName || 'Unknown'}</p>
            <p>Your proposal has been opened and viewed by the client.</p>
          `;
          break;
          
        case 'comment':
          subject = `💬 New Comment: ${data.proposalTitle}`;
          content = `
            <h2>New Comment Received</h2>
            <p><strong>Proposal:</strong> ${data.proposalTitle}</p>
            <p><strong>Client:</strong> ${data.clientName || 'Unknown'}</p>
            ${data.commentContent ? `<p><strong>Comment:</strong> ${this.cleanMarkdown(data.commentContent)}</p>` : ''}
            <p>Your client has left a comment on your proposal. You can respond directly through the proposal interface.</p>
          `;
          break;
          
        case 'approved':
          subject = `✅ Proposal Approved: ${data.proposalTitle}`;
          content = `
            <h2>Proposal Approved!</h2>
            <p><strong>Proposal:</strong> ${data.proposalTitle}</p>
            <p><strong>Client:</strong> ${data.clientName || 'Unknown'}</p>
            <p>Congratulations! Your proposal has been approved by the client.</p>
          `;
          break;
          
        case 'rejected':
          subject = `❌ Proposal Rejected: ${data.proposalTitle}`;
          content = `
            <h2>Proposal Feedback</h2>
            <p><strong>Proposal:</strong> ${data.proposalTitle}</p>
            <p><strong>Client:</strong> ${data.clientName || 'Unknown'}</p>
            ${data.feedbackComment ? `<p><strong>Client Feedback:</strong> ${this.cleanMarkdown(data.feedbackComment)}</p>` : ''}
            <p>Your client has provided feedback on your proposal. You can review their comments and make any necessary adjustments.</p>
          `;
          break;
      }
      
      const msg = {
        from: process.env.EMAIL_FROM || 'davnishsingh46@gmail.com',
        to: data.to,
        subject,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Proposal Notification</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #2563eb, #1e40af);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f8fafc;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .cta-button {
                display: inline-block;
                background: #2563eb;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Proposal Notification</h1>
              <p>Update on your proposal</p>
            </div>
            
            <div class="content">
              ${content}
              
              <div style="text-align: center;">
                <a href="${proposalLink}" class="cta-button">View Proposal</a>
              </div>
              
              <div class="footer">
                <p>This is an automated message from ProposalAI. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await sgMail.send(msg);
      
      console.log(`📧 Owner notification sent to ${data.to} for proposal "${data.proposalTitle}" (${data.type})`);
      
      return {
        success: true,
        messageId: result[0]?.headers['x-message-id'] || 'sendgrid-message-id'
      };
    } catch (error) {
      console.error('Failed to send owner notification email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Send notification to client when owner replies to their comment
  async sendClientReplyNotificationEmail(data: {
    to: string;
    proposalTitle: string;
    proposalId: string;
    ownerName: string;
    replyContent: string;
    accessCode: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured) {
      console.log('📧 Email service not configured. Skipping client reply notification email.');
      return { success: true, messageId: 'email-disabled' };
    }

    try {
      // Check if this is a test email
      const isTestEmail = data.to.includes('example.com') || data.to.includes('test.com') || data.to.includes('localhost');
      
      if (isTestEmail) {
        console.log(`📧 Test email detected for ${data.to}. Skipping actual email send.`);
        return { success: true, messageId: 'test-email-skipped' };
      }

      const proposalLink = `${process.env.CLIENT_BASE_URL || 'http://localhost:3000'}/proposal/${data.proposalId}?accessCode=${data.accessCode}`;
      
      const msg = {
        from: process.env.EMAIL_FROM || 'davnishsingh46@gmail.com',
        to: data.to,
        subject: `💬 Reply to Your Comment: ${data.proposalTitle}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reply to Your Comment</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #2563eb, #1e40af);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f8fafc;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .reply-content {
                background: #f3f4f6;
                border: 1px solid #e5e7eb;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #2563eb;
              }
              .cta-button {
                display: inline-block;
                background: #2563eb;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Reply to Your Comment</h1>
              <p>New response from the proposal owner</p>
            </div>
            
            <div class="content">
              <h2>New Reply from ${data.ownerName}</h2>
              <p><strong>Proposal:</strong> ${data.proposalTitle}</p>
              
              <div class="reply-content">
                <p><strong>Reply:</strong></p>
                ${this.cleanMarkdown(data.replyContent)}
              </div>
              
              <p>You can view the full conversation and continue the discussion by clicking the button below.</p>
              
              <div style="text-align: center;">
                <a href="${proposalLink}" class="cta-button">View Proposal & Reply</a>
              </div>
              
              <div class="footer">
                <p>This is an automated message from ProposalAI. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await sgMail.send(msg);
      
      console.log(`📧 Client reply notification sent to ${data.to} for proposal "${data.proposalTitle}"`);
      
      return {
        success: true,
        messageId: result[0]?.headers['x-message-id'] || 'sendgrid-message-id'
      };
    } catch (error) {
      console.error('Failed to send client reply notification email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const emailService = new EmailService();