export declare class NotificationService {
    static notifyProposalOpened(proposalId: string, clientName?: string, clientEmail?: string): Promise<void>;
    static notifyNewClientComment(proposalId: string, commentId: string, clientName: string, commentContent: string): Promise<void>;
    static notifyClientReply(proposalId: string, clientName: string, commentContent: string): Promise<void>;
    static notifyProposalApproved(proposalId: string, clientName?: string, comment?: string): Promise<void>;
    static notifyProposalFeedback(proposalId: string, action: string, clientName?: string, comment?: string): Promise<void>;
    static notifyAccessRequest(proposalId: string, requesterName: string, requesterEmail: string, company?: string): Promise<void>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notificationService.d.ts.map