import { MongoClient, Db } from 'mongodb';
export declare function connectDatabase(): Promise<{
    client: MongoClient;
    db: Db;
}>;
export declare function getDb(): Promise<Db>;
export declare function closeConnection(): Promise<void>;
export declare function getCollection(collectionName: string): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getUsersCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getProposalsCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getClientsCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getCommentsCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getOrganizationsCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getNotificationsCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getCaseStudiesCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getTemplatesCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getSnippetsCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getPricingModelsCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getTeamMembersCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getAccessRequestsCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getActivitiesCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getTeamsCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare function getEmailTrackingCollection(): Promise<import("mongodb").Collection<import("bson").Document>>;
export declare const prisma: {
    user: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args?: any) => Promise<any[]>;
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        upsert: (args: any) => Promise<any>;
        delete: (args: any) => Promise<import("mongodb").DeleteResult>;
        count: (args: any) => Promise<number>;
    };
    proposal: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args?: any) => Promise<any[]>;
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<{
            count: number;
        }>;
        count: (args: any) => Promise<number>;
        groupBy: (args: any) => Promise<{
            [x: number]: any;
            _count: {
                [x: number]: any;
            };
        }[]>;
    };
    client: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<import("mongodb").DeleteResult>;
        count: (args: any) => Promise<number>;
    };
    comment: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<{
            count: number;
        }>;
        deleteMany: (args: any) => Promise<{
            count: number;
        }>;
        count: (args: any) => Promise<number>;
    };
    organization: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args?: any) => Promise<any[]>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        upsert: (args: any) => Promise<any>;
        delete: (args: any) => Promise<import("mongodb").DeleteResult>;
        count: (args: any) => Promise<number>;
    };
    notification: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        updateMany: (args: any) => Promise<import("mongodb").UpdateResult<import("bson").Document>>;
        delete: (args: any) => Promise<import("mongodb").DeleteResult>;
        count: (args: any) => Promise<number>;
    };
    caseStudy: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<import("mongodb").DeleteResult>;
    };
    template: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<{
            count: number;
        }>;
        count: (args: any) => Promise<number>;
    };
    snippet: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<import("mongodb").DeleteResult>;
    };
    pricingModel: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<import("mongodb").DeleteResult>;
    };
    teamMember: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<{
            count: number;
        }>;
        count: (args: any) => Promise<number>;
    };
    accessRequest: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<import("mongodb").DeleteResult>;
    };
    activity: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<import("mongodb").DeleteResult>;
        deleteMany: (args: any) => Promise<import("mongodb").DeleteResult>;
    };
    team: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<{
            count: number;
        }>;
        count: (args: any) => Promise<number>;
    };
    emailTracking: {
        findUnique: (args: any) => Promise<any>;
        findMany: (args: any) => Promise<any[]>;
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
        delete: (args: any) => Promise<{
            count: number;
        }>;
        count: (args: any) => Promise<number>;
    };
    $transaction: (operations: any[]) => Promise<void>;
    $disconnect: () => Promise<void>;
};
//# sourceMappingURL=database.d.ts.map