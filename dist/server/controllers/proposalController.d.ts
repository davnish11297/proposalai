import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class ProposalController {
    getProposals(req: AuthenticatedRequest, res: Response): Promise<void>;
    getProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    createProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    getAccessRequests(req: AuthenticatedRequest, res: Response): Promise<void>;
    grantAccessRequest(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    generateProposal(req: AuthenticatedRequest, res: Response): Promise<void>;
    publishProposal(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getPublicProposal(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    duplicateProposal(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    sendProposalEmail(req: Request, res: Response): Promise<void>;
    downloadPDF(req: Request, res: Response): Promise<void>;
}
export declare const proposalController: ProposalController;
//# sourceMappingURL=proposalController.d.ts.map