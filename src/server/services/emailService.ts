import nodemailer from 'nodemailer';
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
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    // Check for Resend.com API key first (preferred)
    if (process.env.RESEND_API_KEY) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 587,
        secure: false,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      });
      this.isConfigured = true;
      console.log('✅ Email service configured with Resend.com');
    }
    // Fallback to SMTP configuration
    else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.isConfigured = true;
      console.log('✅ Email service configured with SMTP');
    } else {
      console.log('⚠️  Email service not configured. Email sending will be disabled.');
      console.log('   To enable email sending, set either:');
      console.log('   - RESEND_API_KEY for Resend.com (recommended)');
      console.log('   - SMTP_HOST, SMTP_USER, and SMTP_PASS for SMTP');
    }
  }

  private cleanMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
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
          <div class="proposal-title">${proposal.title}</div>
          <div class="proposal-subtitle">Professional Proposal</div>
        </div>
        
        <div class="content">
          <div class="section">
            <h3>Dear ${proposal.clientName},</h3>
            <p>Thank you for your interest in our services. We are pleased to present you with a comprehensive proposal for your project.</p>
          </div>
          
          ${content?.executiveSummary ? `
          <div class="section">
            <h3>Executive Summary</h3>
            <p>${this.cleanMarkdown(content.executiveSummary.substring(0, 200))}${content.executiveSummary.length > 200 ? '...' : ''}</p>
          </div>
          ` : ''}
          
          ${content?.budget ? `
          <div class="section">
            <h3>Investment</h3>
            <p><strong>Total Investment:</strong> ${this.cleanMarkdown(content.budget)}</p>
          </div>
          ` : ''}
          
          <div class="section">
            <h3>Access Your Proposal</h3>
            <p>To view the complete proposal and provide your feedback, please use the access code below:</p>
            
            <div class="access-code">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your Access Code:</p>
              <div class="access-code-text">${accessCode}</div>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">This code is required to access your secure proposal portal.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${proposalLink}" class="cta-button">View Full Proposal</a>
          </div>
          
          <div class="section">
            <h3>Next Steps</h3>
            <p>Once you've reviewed the proposal, you can:</p>
            <ul style="color: #4b5563; margin-left: 20px;">
              <li>Approve the proposal</li>
              <li>Request modifications</li>
              <li>Reject the proposal</li>
              <li>Add comments or questions</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>The ProposalAI Team</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        ${trackingPixel}
      </body>
      </html>
    `;
  }

  // Generate a 6-digit alphanumeric access code
  private generateAccessCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async sendProposalEmail(
    proposal: IProposal,
    recipientEmail: string,
    pdfBuffer?: Buffer,
    pdfUrl?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; trackingId?: string; accessCode?: string }> {
    // Check if email service is configured
    if (!this.isConfigured || !this.transporter) {
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
      
      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.EMAIL_FROM || 'ProposalAI <onboarding@resend.dev>',
        to: recipientEmail,
        subject: `Proposal: ${proposal.title}`,
        html: this.generateEmailHTML(proposal, pdfUrl, trackingId, accessCode),
        attachments: pdfBuffer ? [
          {
            filename: `${proposal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_proposal.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ] : undefined
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Email sent successfully to ${recipientEmail} for proposal "${proposal.title}"`);
      
      return {
        success: true,
        messageId: info.messageId,
        trackingId,
        accessCode
      };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Email service not configured - skipping verification');
      return false;
    }
    
    try {
      await this.transporter.verify();
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
    if (!this.transporter || !this.isConfigured) {
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
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'ProposalAI <onboarding@resend.dev>',
        to: data.to,
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

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
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
    if (!this.transporter || !this.isConfigured) {
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
          subject = `📧 Proposal Opened: ${data.proposalTitle}`;
          content = `
            <h2>Your Proposal Has Been Opened</h2>
            <p><strong>Proposal:</strong> ${data.proposalTitle}</p>
            <p><strong>Client:</strong> ${data.clientName || 'Unknown'}</p>
            <p>Great news! Your client has opened the proposal you sent them. This is the first step towards getting their feedback.</p>
          `;
          break;
          
        case 'comment':
          subject = `💬 New Comment on Proposal: ${data.proposalTitle}`;
          content = `
            <h2>New Comment from Client</h2>
            <p><strong>Proposal:</strong> ${data.proposalTitle}</p>
            <p><strong>Client:</strong> ${data.clientName || 'Unknown'}</p>
            <p><strong>Comment:</strong></p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;">
              ${this.cleanMarkdown(data.commentContent || '')}
            </div>
          `;
          break;
          
        case 'approved':
          subject = `✅ Proposal Approved: ${data.proposalTitle}`;
          content = `
            <h2>🎉 Your Proposal Has Been Approved!</h2>
            <p><strong>Proposal:</strong> ${data.proposalTitle}</p>
            <p><strong>Client:</strong> ${data.clientName || 'Unknown'}</p>
            ${data.feedbackComment ? `<p><strong>Client Feedback:</strong> ${this.cleanMarkdown(data.feedbackComment)}</p>` : ''}
            <p>Congratulations! Your client has approved your proposal. You can now proceed with the project.</p>
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
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'ProposalAI <onboarding@resend.dev>',
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

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Owner notification sent to ${data.to} for proposal "${data.proposalTitle}" (${data.type})`);
      
      return {
        success: true,
        messageId: result.messageId
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
    if (!this.transporter || !this.isConfigured) {
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
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'ProposalAI <onboarding@resend.dev>',
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
              <p>${data.ownerName} has replied to your comment</p>
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

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Client reply notification sent to ${data.to} for proposal "${data.proposalTitle}"`);
      
      return {
        success: true,
        messageId: result.messageId
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