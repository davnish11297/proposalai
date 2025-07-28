import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class OrganizationController {
    static getBrandSettings(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateBrandSettings(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    static getCurrentOrganization(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=organizationController.d.ts.map