import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    
    console.log('✅ MongoDB connected successfully');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export async function getDb(): Promise<Db> {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

export async function closeConnection() {
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
}

// Collection helpers
export async function getCollection(collectionName: string) {
  const db = await getDb();
  return db.collection(collectionName);
}

export async function getUsersCollection() {
  return getCollection('users');
}

export async function getProposalsCollection() {
  return getCollection('proposals');
}

export async function getClientsCollection() {
  return getCollection('clients');
}

export async function getCommentsCollection() {
  return getCollection('comments');
}

export async function getOrganizationsCollection() {
  return getCollection('organizations');
}

export async function getNotificationsCollection() {
  return getCollection('notifications');
} 