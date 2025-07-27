import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class ClientController {
    getClients(req: AuthenticatedRequest, res: Response): Promise<void>;
    getClient(req: AuthenticatedRequest, res: Response): Promise<void>;
    createClient(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateClient(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteClient(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const clientController: ClientController;
//# sourceMappingURL=clientController.d.ts.map