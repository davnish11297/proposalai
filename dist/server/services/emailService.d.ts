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
    private transporter;
    constructor();
    private cleanMarkdown;
    private generateEmailHTML;
    private generateAccessCode;
    sendProposalEmail(proposal: IProposal, recipientEmail: string, pdfBuffer?: Buffer, pdfUrl?: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
        trackingId?: string;
        accessCode?: string;
    }>;
    verifyConnection(): Promise<boolean>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=emailService.d.ts.map