export declare class EmailTrackingService {
    generateTrackingId(): string;
    updateEmailTracking(proposalId: string, trackingData: {
        emailSentAt?: Date;
        emailRecipient?: string;
        emailMessageId?: string;
        emailTrackingId?: string;
    }): Promise<void>;
    trackEmailOpen(trackingId: string): Promise<{
        success: boolean;
        proposalId?: string;
    }>;
    trackEmailClick(trackingId: string, linkType?: string): Promise<{
        success: boolean;
        proposalId?: string;
    }>;
    trackEmailReply(trackingId: string): Promise<{
        success: boolean;
        proposalId?: string;
    }>;
    getEmailTrackingStats(proposalId: string): Promise<{
        emailSentAt?: Date;
        emailRecipient?: string;
        emailOpenedAt?: Date;
        emailRepliedAt?: Date;
        emailClickedAt?: Date;
        emailStatus?: string;
        timeToOpen?: number;
        timeToReply?: number;
        timeToClick?: number;
    }>;
    getOrganizationEmailStats(organizationId: string): Promise<{
        totalSent: number;
        totalOpened: number;
        totalReplied: number;
        totalClicked: number;
        openRate: number;
        replyRate: number;
        clickRate: number;
        averageTimeToOpen: number;
        averageTimeToReply: number;
    }>;
}
export declare const emailTrackingService: EmailTrackingService;
//# sourceMappingURL=emailTrackingService.d.ts.map