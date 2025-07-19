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
    private cleanMarkdown;
    constructor(config?: EmailConfig);
    private generateEmailHTML;
    sendProposalEmail(proposal: IProposal, recipientEmail: string, pdfBuffer?: Buffer, pdfUrl?: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
    verifyConnection(): Promise<boolean>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=emailService.d.ts.map