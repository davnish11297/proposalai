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
export declare class EmailService {
    private isConfigured;
    constructor();
    private testSendGridConnection;
    private generateAccessCode;
    private cleanMarkdown;
    private generateEmailHTML;
    sendProposalEmail(proposal: IProposal, recipientEmail: string, pdfBuffer?: Buffer, pdfUrl?: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
        trackingId?: string;
        accessCode?: string;
    }>;
    verifyConnection(): Promise<boolean>;
    sendAccessRequestEmail(data: {
        to: string;
        proposalTitle: string;
        requesterName: string;
        requesterEmail: string;
        requesterCompany: string;
        reason: string;
        proposalId: string;
        accessCode?: string;
    }): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    sendOwnerNotificationEmail(data: {
        to: string;
        proposalTitle: string;
        proposalId: string;
        type: 'opened' | 'comment' | 'approved' | 'rejected';
        clientName?: string;
        clientEmail?: string;
        commentContent?: string;
        feedbackComment?: string;
    }): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    sendClientReplyNotificationEmail(data: {
        to: string;
        proposalTitle: string;
        proposalId: string;
        ownerName: string;
        replyContent: string;
        accessCode: string;
    }): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=emailService.d.ts.map