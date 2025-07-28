"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.getDb = getDb;
exports.closeConnection = closeConnection;
exports.getCollection = getCollection;
exports.getUsersCollection = getUsersCollection;
exports.getProposalsCollection = getProposalsCollection;
exports.getClientsCollection = getClientsCollection;
exports.getCommentsCollection = getCommentsCollection;
exports.getOrganizationsCollection = getOrganizationsCollection;
exports.getNotificationsCollection = getNotificationsCollection;
exports.getCaseStudiesCollection = getCaseStudiesCollection;
exports.getTemplatesCollection = getTemplatesCollection;
exports.getSnippetsCollection = getSnippetsCollection;
exports.getPricingModelsCollection = getPricingModelsCollection;
exports.getTeamMembersCollection = getTeamMembersCollection;
exports.getAccessRequestsCollection = getAccessRequestsCollection;
exports.getActivitiesCollection = getActivitiesCollection;
exports.getTeamsCollection = getTeamsCollection;
exports.getEmailTrackingCollection = getEmailTrackingCollection;
const mongodb_1 = require("mongodb");
let client;
let db;
async function connectDatabase() {
    if (client && db) {
        return { client, db };
    }
    const uri = process.env.DATABASE_URL;
    if (!uri) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    try {
        client = new mongodb_1.MongoClient(uri);
        await client.connect();
        db = client.db();
        console.log('✅ MongoDB connected successfully');
        return { client, db };
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}
async function getDb() {
    if (!db) {
        await connectDatabase();
    }
    return db;
}
async function closeConnection() {
    if (client) {
        await client.close();
        console.log('✅ MongoDB connection closed');
    }
}
async function getCollection(collectionName) {
    const db = await getDb();
    return db.collection(collectionName);
}
async function getUsersCollection() {
    return getCollection('users');
}
async function getProposalsCollection() {
    return getCollection('proposals');
}
async function getClientsCollection() {
    return getCollection('clients');
}
async function getCommentsCollection() {
    return getCollection('comments');
}
async function getOrganizationsCollection() {
    return getCollection('organizations');
}
async function getNotificationsCollection() {
    return getCollection('notifications');
}
async function getCaseStudiesCollection() {
    return getCollection('caseStudies');
}
async function getTemplatesCollection() {
    return getCollection('templates');
}
async function getSnippetsCollection() {
    return getCollection('snippets');
}
async function getPricingModelsCollection() {
    return getCollection('pricingModels');
}
async function getTeamMembersCollection() {
    return getCollection('teamMembers');
}
async function getAccessRequestsCollection() {
    return getCollection('accessRequests');
}
async function getActivitiesCollection() {
    return getCollection('activities');
}
async function getTeamsCollection() {
    return getCollection('teams');
}
async function getEmailTrackingCollection() {
    const db = await getDb();
    return db.collection('emailTracking');
}
function convertMongoDoc(doc) {
    if (!doc)
        return doc;
    const converted = { ...doc };
    if (converted._id) {
        converted.id = converted._id.toString();
        delete converted._id;
    }
    return converted;
}
function convertWhere(where) {
    if (!where)
        return {};
    const converted = { ...where };
    if (converted.id && typeof converted.id === 'string') {
        try {
            converted._id = new mongodb_1.ObjectId(converted.id);
            delete converted.id;
        }
        catch (e) {
        }
    }
    return converted;
}
exports.prisma = {
    user: {
        findUnique: async (args) => {
            const collection = await getUsersCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        findMany: async (args = {}) => {
            const collection = await getUsersCollection();
            const docs = await collection.find(convertWhere(args.where || {})).toArray();
            return docs.map(convertMongoDoc);
        },
        findFirst: async (args) => {
            const collection = await getUsersCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        create: async (args) => {
            const collection = await getUsersCollection();
            const result = await collection.insertOne(args.data);
            const doc = await collection.findOne({ _id: result.insertedId });
            return convertMongoDoc(doc);
        },
        update: async (args) => {
            const collection = await getUsersCollection();
            await collection.updateOne(convertWhere(args.where), { $set: args.data });
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        upsert: async (args) => {
            const collection = await getUsersCollection();
            const where = convertWhere(args.where);
            const existing = await collection.findOne(where);
            if (existing) {
                await collection.updateOne(where, { $set: args.update || args.create });
                const doc = await collection.findOne(where);
                return convertMongoDoc(doc);
            }
            else {
                const result = await collection.insertOne(args.create);
                const doc = await collection.findOne({ _id: result.insertedId });
                return convertMongoDoc(doc);
            }
        },
        delete: async (args) => {
            const collection = await getUsersCollection();
            return collection.deleteOne(convertWhere(args.where));
        },
        count: async (args) => {
            const collection = await getUsersCollection();
            return collection.countDocuments(convertWhere(args.where || {}));
        }
    },
    proposal: {
        findUnique: async (args) => {
            const collection = await getProposalsCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        findMany: async (args = {}) => {
            const collection = await getProposalsCollection();
            const where = args.where ? convertWhere(args.where) : {};
            const cursor = collection.find(where);
            if (args.orderBy) {
                cursor.sort(args.orderBy);
            }
            if (args.take) {
                cursor.limit(args.take);
            }
            if (args.skip) {
                cursor.skip(args.skip);
            }
            if (args.include) {
                const docs = await cursor.toArray();
                const result = [];
                for (const doc of docs) {
                    const converted = convertMongoDoc(doc);
                    if (args.include.user) {
                        const user = await exports.prisma.user.findUnique({ where: { id: converted.userId } });
                        converted.user = user;
                    }
                    if (args.include.organization) {
                        const org = await exports.prisma.organization.findUnique({ where: { id: converted.organizationId } });
                        converted.organization = org;
                    }
                    if (args.include.comments) {
                        const comments = await exports.prisma.comment.findMany({ where: { proposalId: converted.id } });
                        converted.comments = comments;
                    }
                    result.push(converted);
                }
                return result;
            }
            const docs = await cursor.toArray();
            return docs.map(convertMongoDoc);
        },
        findFirst: async (args) => {
            const collection = await getProposalsCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        create: async (args) => {
            const collection = await getProposalsCollection();
            const data = { ...args.data, _id: new mongodb_1.ObjectId() };
            await collection.insertOne(data);
            const doc = await collection.findOne({ _id: data._id });
            return doc ? convertMongoDoc(doc) : null;
        },
        update: async (args) => {
            const collection = await getProposalsCollection();
            const where = convertWhere(args.where);
            const data = { ...args.data, updatedAt: new Date() };
            await collection.updateOne(where, { $set: data });
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        delete: async (args) => {
            const collection = await getProposalsCollection();
            const where = convertWhere(args.where);
            const result = await collection.deleteOne(where);
            return { count: result.deletedCount };
        },
        count: async (args) => {
            const collection = await getProposalsCollection();
            const where = args.where ? convertWhere(args.where) : {};
            return await collection.countDocuments(where);
        },
        groupBy: async (args) => {
            const collection = await getProposalsCollection();
            const where = args.where ? convertWhere(args.where) : {};
            const pipeline = [
                { $match: where },
                { $group: { _id: `$${args.by[0]}`, _count: { [args.by[0]]: { $sum: 1 } } } }
            ];
            const result = await collection.aggregate(pipeline).toArray();
            return result.map(item => ({
                [args.by[0]]: item._id,
                _count: { [args.by[0]]: item._count[args.by[0]] }
            }));
        }
    },
    client: {
        findUnique: async (args) => {
            const collection = await getClientsCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        findMany: async (args) => {
            const collection = await getClientsCollection();
            const docs = await collection.find(convertWhere(args.where || {})).toArray();
            return docs.map(convertMongoDoc);
        },
        findFirst: async (args) => {
            const collection = await getClientsCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        create: async (args) => {
            const collection = await getClientsCollection();
            const result = await collection.insertOne(args.data);
            const doc = await collection.findOne({ _id: result.insertedId });
            return convertMongoDoc(doc);
        },
        update: async (args) => {
            const collection = await getClientsCollection();
            await collection.updateOne(convertWhere(args.where), { $set: args.data });
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        delete: async (args) => {
            const collection = await getClientsCollection();
            return collection.deleteOne(convertWhere(args.where));
        },
        count: async (args) => {
            const collection = await getClientsCollection();
            return collection.countDocuments(convertWhere(args.where || {}));
        }
    },
    comment: {
        findUnique: async (args) => {
            const collection = await getCommentsCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        findMany: async (args) => {
            const collection = await getCommentsCollection();
            const where = args.where ? convertWhere(args.where) : {};
            const cursor = collection.find(where);
            if (args.orderBy) {
                cursor.sort(args.orderBy);
            }
            const docs = await cursor.toArray();
            return docs.map(convertMongoDoc);
        },
        findFirst: async (args) => {
            const collection = await getCommentsCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        create: async (args) => {
            const collection = await getCommentsCollection();
            const data = { ...args.data, _id: new mongodb_1.ObjectId() };
            await collection.insertOne(data);
            const doc = await collection.findOne({ _id: data._id });
            return doc ? convertMongoDoc(doc) : null;
        },
        update: async (args) => {
            const collection = await getCommentsCollection();
            const where = convertWhere(args.where);
            const data = { ...args.data, updatedAt: new Date() };
            await collection.updateOne(where, { $set: data });
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        delete: async (args) => {
            const collection = await getCommentsCollection();
            const where = convertWhere(args.where);
            const result = await collection.deleteOne(where);
            return { count: result.deletedCount };
        },
        deleteMany: async (args) => {
            const collection = await getCommentsCollection();
            const where = convertWhere(args.where);
            const result = await collection.deleteMany(where);
            return { count: result.deletedCount };
        },
        count: async (args) => {
            const collection = await getCommentsCollection();
            const where = args.where ? convertWhere(args.where) : {};
            return await collection.countDocuments(where);
        }
    },
    organization: {
        findUnique: async (args) => {
            const collection = await getOrganizationsCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        findMany: async (args = {}) => {
            const collection = await getOrganizationsCollection();
            const docs = await collection.find(convertWhere(args.where || {})).toArray();
            return docs.map(convertMongoDoc);
        },
        create: async (args) => {
            const collection = await getOrganizationsCollection();
            const result = await collection.insertOne(args.data);
            const doc = await collection.findOne({ _id: result.insertedId });
            return convertMongoDoc(doc);
        },
        update: async (args) => {
            const collection = await getOrganizationsCollection();
            await collection.updateOne(convertWhere(args.where), { $set: args.data });
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        upsert: async (args) => {
            const collection = await getOrganizationsCollection();
            const where = convertWhere(args.where);
            const existing = await collection.findOne(where);
            if (existing) {
                await collection.updateOne(where, { $set: args.update || args.create });
                const doc = await collection.findOne(where);
                return convertMongoDoc(doc);
            }
            else {
                const result = await collection.insertOne(args.create);
                const doc = await collection.findOne({ _id: result.insertedId });
                return convertMongoDoc(doc);
            }
        },
        delete: async (args) => {
            const collection = await getOrganizationsCollection();
            return collection.deleteOne(convertWhere(args.where));
        },
        count: async (args) => {
            const collection = await getOrganizationsCollection();
            return collection.countDocuments(convertWhere(args.where || {}));
        }
    },
    notification: {
        findUnique: async (args) => {
            const collection = await getNotificationsCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        findMany: async (args) => {
            const collection = await getNotificationsCollection();
            const docs = await collection.find(convertWhere(args.where || {})).toArray();
            return docs.map(convertMongoDoc);
        },
        findFirst: async (args) => {
            const collection = await getNotificationsCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        create: async (args) => {
            const collection = await getNotificationsCollection();
            const result = await collection.insertOne(args.data);
            const doc = await collection.findOne({ _id: result.insertedId });
            return convertMongoDoc(doc);
        },
        update: async (args) => {
            const collection = await getNotificationsCollection();
            await collection.updateOne(convertWhere(args.where), { $set: args.data });
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        updateMany: async (args) => {
            const collection = await getNotificationsCollection();
            return collection.updateMany(convertWhere(args.where), { $set: args.data });
        },
        delete: async (args) => {
            const collection = await getNotificationsCollection();
            return collection.deleteOne(convertWhere(args.where));
        },
        count: async (args) => {
            const collection = await getNotificationsCollection();
            return collection.countDocuments(convertWhere(args.where || {}));
        }
    },
    caseStudy: {
        findUnique: async (args) => {
            const collection = await getCaseStudiesCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        findMany: async (args) => {
            const collection = await getCaseStudiesCollection();
            const docs = await collection.find(convertWhere(args.where || {})).toArray();
            return docs.map(convertMongoDoc);
        },
        create: async (args) => {
            const collection = await getCaseStudiesCollection();
            const result = await collection.insertOne(args.data);
            const doc = await collection.findOne({ _id: result.insertedId });
            return convertMongoDoc(doc);
        },
        update: async (args) => {
            const collection = await getCaseStudiesCollection();
            await collection.updateOne(convertWhere(args.where), { $set: args.data });
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        delete: async (args) => {
            const collection = await getCaseStudiesCollection();
            return collection.deleteOne(convertWhere(args.where));
        }
    },
    template: {
        findUnique: async (args) => {
            const collection = await getTemplatesCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        findMany: async (args) => {
            const collection = await getTemplatesCollection();
            const where = args.where ? convertWhere(args.where) : {};
            const cursor = collection.find(where);
            if (args.orderBy) {
                cursor.sort(args.orderBy);
            }
            const docs = await cursor.toArray();
            return docs.map(convertMongoDoc);
        },
        findFirst: async (args) => {
            const collection = await getTemplatesCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        create: async (args) => {
            const collection = await getTemplatesCollection();
            const data = { ...args.data, _id: new mongodb_1.ObjectId() };
            await collection.insertOne(data);
            const doc = await collection.findOne({ _id: data._id });
            return doc ? convertMongoDoc(doc) : null;
        },
        update: async (args) => {
            const collection = await getTemplatesCollection();
            const where = convertWhere(args.where);
            const data = { ...args.data, updatedAt: new Date() };
            await collection.updateOne(where, { $set: data });
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        delete: async (args) => {
            const collection = await getTemplatesCollection();
            const where = convertWhere(args.where);
            const result = await collection.deleteOne(where);
            return { count: result.deletedCount };
        },
        count: async (args) => {
            const collection = await getTemplatesCollection();
            const where = args.where ? convertWhere(args.where) : {};
            return await collection.countDocuments(where);
        }
    },
    snippet: {
        findUnique: async (args) => {
            const collection = await getSnippetsCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        findMany: async (args) => {
            const collection = await getSnippetsCollection();
            const docs = await collection.find(convertWhere(args.where || {})).toArray();
            return docs.map(convertMongoDoc);
        },
        findFirst: async (args) => {
            const collection = await getSnippetsCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        create: async (args) => {
            const collection = await getSnippetsCollection();
            const result = await collection.insertOne(args.data);
            const doc = await collection.findOne({ _id: result.insertedId });
            return convertMongoDoc(doc);
        },
        update: async (args) => {
            const collection = await getSnippetsCollection();
            await collection.updateOne(convertWhere(args.where), { $set: args.data });
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        delete: async (args) => {
            const collection = await getSnippetsCollection();
            return collection.deleteOne(convertWhere(args.where));
        }
    },
    pricingModel: {
        findUnique: async (args) => {
            const collection = await getPricingModelsCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        findMany: async (args) => {
            const collection = await getPricingModelsCollection();
            const docs = await collection.find(convertWhere(args.where || {})).toArray();
            return docs.map(convertMongoDoc);
        },
        create: async (args) => {
            const collection = await getPricingModelsCollection();
            const result = await collection.insertOne(args.data);
            const doc = await collection.findOne({ _id: result.insertedId });
            return convertMongoDoc(doc);
        },
        update: async (args) => {
            const collection = await getPricingModelsCollection();
            await collection.updateOne(convertWhere(args.where), { $set: args.data });
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        delete: async (args) => {
            const collection = await getPricingModelsCollection();
            return collection.deleteOne(convertWhere(args.where));
        }
    },
    teamMember: {
        findUnique: async (args) => {
            const collection = await getTeamMembersCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        findMany: async (args) => {
            const collection = await getTeamMembersCollection();
            const where = args.where ? convertWhere(args.where) : {};
            const cursor = collection.find(where);
            if (args.orderBy) {
                cursor.sort(args.orderBy);
            }
            const docs = await cursor.toArray();
            return docs.map(convertMongoDoc);
        },
        findFirst: async (args) => {
            const collection = await getTeamMembersCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        create: async (args) => {
            const collection = await getTeamMembersCollection();
            const data = { ...args.data, _id: new mongodb_1.ObjectId() };
            await collection.insertOne(data);
            const doc = await collection.findOne({ _id: data._id });
            return doc ? convertMongoDoc(doc) : null;
        },
        update: async (args) => {
            const collection = await getTeamMembersCollection();
            const where = convertWhere(args.where);
            const data = { ...args.data, updatedAt: new Date() };
            await collection.updateOne(where, { $set: data });
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        delete: async (args) => {
            const collection = await getTeamMembersCollection();
            const where = convertWhere(args.where);
            const result = await collection.deleteOne(where);
            return { count: result.deletedCount };
        },
        count: async (args) => {
            const collection = await getTeamMembersCollection();
            const where = args.where ? convertWhere(args.where) : {};
            return await collection.countDocuments(where);
        }
    },
    accessRequest: {
        findUnique: async (args) => {
            const collection = await getAccessRequestsCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        findMany: async (args) => {
            const collection = await getAccessRequestsCollection();
            const docs = await collection.find(convertWhere(args.where || {})).toArray();
            return docs.map(convertMongoDoc);
        },
        findFirst: async (args) => {
            const collection = await getAccessRequestsCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        create: async (args) => {
            const collection = await getAccessRequestsCollection();
            const result = await collection.insertOne(args.data);
            const doc = await collection.findOne({ _id: result.insertedId });
            return convertMongoDoc(doc);
        },
        update: async (args) => {
            const collection = await getAccessRequestsCollection();
            await collection.updateOne(convertWhere(args.where), { $set: args.data });
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        delete: async (args) => {
            const collection = await getAccessRequestsCollection();
            return collection.deleteOne(convertWhere(args.where));
        }
    },
    activity: {
        findUnique: async (args) => {
            const collection = await getActivitiesCollection();
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        findMany: async (args) => {
            const collection = await getActivitiesCollection();
            const docs = await collection.find(convertWhere(args.where || {})).toArray();
            return docs.map(convertMongoDoc);
        },
        create: async (args) => {
            const collection = await getActivitiesCollection();
            const result = await collection.insertOne(args.data);
            const doc = await collection.findOne({ _id: result.insertedId });
            return convertMongoDoc(doc);
        },
        update: async (args) => {
            const collection = await getActivitiesCollection();
            await collection.updateOne(convertWhere(args.where), { $set: args.data });
            const doc = await collection.findOne(convertWhere(args.where));
            return convertMongoDoc(doc);
        },
        delete: async (args) => {
            const collection = await getActivitiesCollection();
            return collection.deleteOne(convertWhere(args.where));
        },
        deleteMany: async (args) => {
            const collection = await getActivitiesCollection();
            return collection.deleteMany(convertWhere(args.where));
        }
    },
    team: {
        findUnique: async (args) => {
            const collection = await getTeamsCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        findMany: async (args) => {
            const collection = await getTeamsCollection();
            const where = args.where ? convertWhere(args.where) : {};
            const cursor = collection.find(where);
            if (args.orderBy) {
                cursor.sort(args.orderBy);
            }
            const docs = await cursor.toArray();
            return docs.map(convertMongoDoc);
        },
        findFirst: async (args) => {
            const collection = await getTeamsCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        create: async (args) => {
            const collection = await getTeamsCollection();
            const data = { ...args.data, _id: new mongodb_1.ObjectId() };
            await collection.insertOne(data);
            const doc = await collection.findOne({ _id: data._id });
            return doc ? convertMongoDoc(doc) : null;
        },
        update: async (args) => {
            const collection = await getTeamsCollection();
            const where = convertWhere(args.where);
            const data = { ...args.data, updatedAt: new Date() };
            await collection.updateOne(where, { $set: data });
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        delete: async (args) => {
            const collection = await getTeamsCollection();
            const where = convertWhere(args.where);
            const result = await collection.deleteOne(where);
            return { count: result.deletedCount };
        },
        count: async (args) => {
            const collection = await getTeamsCollection();
            const where = args.where ? convertWhere(args.where) : {};
            return await collection.countDocuments(where);
        }
    },
    emailTracking: {
        findUnique: async (args) => {
            const collection = await getEmailTrackingCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        findMany: async (args) => {
            const collection = await getEmailTrackingCollection();
            const where = args.where ? convertWhere(args.where) : {};
            const cursor = collection.find(where);
            if (args.orderBy) {
                cursor.sort(args.orderBy);
            }
            const docs = await cursor.toArray();
            return docs.map(convertMongoDoc);
        },
        findFirst: async (args) => {
            const collection = await getEmailTrackingCollection();
            const where = convertWhere(args.where);
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        create: async (args) => {
            const collection = await getEmailTrackingCollection();
            const data = { ...args.data, _id: new mongodb_1.ObjectId() };
            await collection.insertOne(data);
            const doc = await collection.findOne({ _id: data._id });
            return doc ? convertMongoDoc(doc) : null;
        },
        update: async (args) => {
            const collection = await getEmailTrackingCollection();
            const where = convertWhere(args.where);
            const data = { ...args.data, updatedAt: new Date() };
            await collection.updateOne(where, { $set: data });
            const doc = await collection.findOne(where);
            return doc ? convertMongoDoc(doc) : null;
        },
        delete: async (args) => {
            const collection = await getEmailTrackingCollection();
            const where = convertWhere(args.where);
            const result = await collection.deleteOne(where);
            return { count: result.deletedCount };
        },
        count: async (args) => {
            const collection = await getEmailTrackingCollection();
            const where = args.where ? convertWhere(args.where) : {};
            return await collection.countDocuments(where);
        }
    },
    $transaction: async (operations) => {
        const session = client.startSession();
        try {
            await session.withTransaction(async () => {
                for (const operation of operations) {
                    await operation;
                }
            });
        }
        finally {
            await session.endSession();
        }
    },
    $disconnect: async () => {
        if (client) {
            await client.close();
            console.log('✅ MongoDB connection closed');
        }
    }
};
//# sourceMappingURL=database.js.map