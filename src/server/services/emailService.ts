import nodemailer from 'nodemailer';
import { IProposal } from '../types';

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
  private transporter: nodemailer.Transporter;

  private cleanMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert bold to HTML
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert italic to HTML
      .replace(/`(.*?)`/g, '<code>$1</code>') // Convert code to HTML
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/\n\s*[-*+]\s/g, '\n• ') // Normalize list markers
      .replace(/\n\s*\d+\.\s/g, '\n1. '); // Normalize numbered lists
  }

  constructor(config?: EmailConfig) {
    if (config) {
      // Production configuration
      this.transporter = nodemailer.createTransport({
        host: config.host || 'smtp.gmail.com',
        port: config.port || 587,
        secure: config.secure || false,
        auth: config.auth
      });
    } else {
      // Use environment variables for email configuration
      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      
      if (smtpUser && smtpPass) {
        // Check if using Resend
        if (smtpHost.includes('resend') || smtpUser.includes('resend') || smtpPass.startsWith('re_')) {
          // Resend configuration
          this.transporter = nodemailer.createTransport({
            host: 'smtp.resend.com',
            port: 587,
            secure: false,
            auth: {
              user: 'resend',
              pass: smtpPass // This should be your Resend API key
            }
          });
        } else {
          // Gmail or other SMTP configuration
          this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: false, // true for 465, false for other ports
            auth: {
              user: smtpUser,
              pass: smtpPass
            },
            // Additional options for better compatibility
            tls: {
              rejectUnauthorized: false
            }
          });
        }
      } else {
        // Fallback to Ethereal for testing
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: 'test@ethereal.email',
            pass: 'test123'
          }
        });
      }
    }
  }

  private generateEmailHTML(proposal: IProposal, pdfUrl?: string): string {
    // Parse content if it's a string
    let content: any;
    try {
      content = typeof proposal.content === 'string' ? JSON.parse(proposal.content) : proposal.content;
    } catch (error) {
      content = {};
    }
    
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
            <h3>Next Steps</h3>
            <p>Please review the attached proposal in detail. We're available to discuss any questions or concerns you may have.</p>
            <p>To schedule a follow-up call or request modifications, please reply to this email or contact us directly.</p>
          </div>
          
          ${pdfUrl ? `
          <div style="text-align: center;">
            <a href="${pdfUrl}" class="cta-button">View Full Proposal</a>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Best regards,<br>The ProposalAI Team</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendProposalEmail(
    proposal: IProposal,
    recipientEmail: string,
    pdfBuffer?: Buffer,
    pdfUrl?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@proposalai.com',
        to: recipientEmail,
        subject: `Proposal: ${proposal.title}`,
        html: this.generateEmailHTML(proposal, pdfUrl),
        attachments: pdfBuffer ? [
          {
            filename: `${proposal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_proposal.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ] : undefined
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId
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
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

// Create email service instance
export const emailService = new EmailService(); 