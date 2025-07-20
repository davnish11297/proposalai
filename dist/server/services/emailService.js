"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const emailTrackingService_1 = require("./emailTrackingService");
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    cleanMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
    generateEmailHTML(proposal, pdfUrl, trackingId, accessCode) {
        let content;
        try {
            content = typeof proposal.content === 'string' ? JSON.parse(proposal.content) : proposal.content;
        }
        catch (error) {
            content = {};
        }
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
    generateAccessCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    async sendProposalEmail(proposal, recipientEmail, pdfBuffer, pdfUrl) {
        try {
            const trackingId = emailTrackingService_1.emailTrackingService.generateTrackingId();
            const accessCode = this.generateAccessCode();
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@proposalai.com',
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
            return {
                success: true,
                messageId: info.messageId,
                trackingId,
                accessCode
            };
        }
        catch (error) {
            console.error('Email sending error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async verifyConnection() {
        try {
            await this.transporter.verify();
            return true;
        }
        catch (error) {
            console.error('Email service verification failed:', error);
            return false;
        }
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=emailService.js.map