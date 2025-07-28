import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class TeamController {
    getTeams(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getTeam(req: AuthenticatedRequest, res: Response): Promise<void>;
    createTeam(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateTeam(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteTeam(req: AuthenticatedRequest, res: Response): Promise<void>;
    addTeamMember(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateTeamMember(req: AuthenticatedRequest, res: Response): Promise<void>;
    removeTeamMember(req: AuthenticatedRequest, res: Response): Promise<void>;
    getTeamProposals(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const teamController: TeamController;
//# sourceMappingURL=teamController.d.ts.map