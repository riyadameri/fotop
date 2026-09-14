import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const DEFAULT_URI = "mongodb://riyadammmeri:OmGe6UeG1Q0hVJEq@ac-ujqhcf3-shard-00-00.7xu8hz3.mongodb.net:27017,ac-ujqhcf3-shard-00-01.7xu8hz3.mongodb.net:27017,ac-ujqhcf3-shard-00-02.7xu8hz3.mongodb.net:27017/?ssl=true&replicaSet=atlas-3anew8-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

/**
 * Extract and clean MongoDB URI from environment or config, stripping prefixes or quotes
 */
export function getCleanMongoUri(): string {
  let uri = process.env.MONGODB_URI || '';
  
  if (!uri) {
    try {
      const envExPath = path.join(process.cwd(), '.env.example');
      if (fs.existsSync(envExPath)) {
        const content = fs.readFileSync(envExPath, 'utf-8');
        const m = content.match(/MONGODB_URI\s*=\s*(.+)/);
        if (m && m[1]) {
          uri = m[1].trim();
        }
      }
    } catch {}
  }

  if (!uri) {
    uri = DEFAULT_URI;
  }

  // Strip prefix like "MONGODB_URI = mongodb://..." if passed literally
  if (uri.startsWith('MONGODB_URI')) {
    const eqIdx = uri.indexOf('=');
    if (eqIdx !== -1) {
      uri = uri.substring(eqIdx + 1).trim();
    }
  }

  // Strip wrapping single or double quotes and spaces
  uri = uri.replace(/^["'\s]+|["'\s]+$/g, '').trim();

  return uri || DEFAULT_URI;
}

const DB_NAME = 'fotop_studio';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnected = false;
let isConnecting = false;
let lastError: string | null = null;

export const COLLECTIONS = [
  'stores',
  'materials',
  'services',
  'staff',
  'shifts',
  'orders',
  'wasteRecords',
  'expenses',
  'attendanceLogs',
  'salaryPayments'
] as const;

export type CollectionName = typeof COLLECTIONS[number];

/**
 * Connect to MongoDB Atlas with graceful fallback and clean URI parsing
 */
export async function connectToMongoDB(): Promise<boolean> {
  if (isConnected && dbInstance) return true;
  if (isConnecting) return false;

  isConnecting = true;
  try {
    const uri = getCleanMongoUri();
    console.log('[MongoDB] Connecting to MongoDB Atlas Cluster...');
    
    if (client) {
      try {
        await client.close();
      } catch {}
    }

    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    dbInstance = client.db(DB_NAME);

    // Verify connection with a ping
    await dbInstance.command({ ping: 1 });

    isConnected = true;
    lastError = null;
    console.log(`[MongoDB] Successfully connected to database: "${DB_NAME}"`);
    return true;
  } catch (err: any) {
    isConnected = false;
    lastError = err?.message || String(err);
    console.warn('[MongoDB] Connection warning (running in hybrid local-cache mode):', lastError);
    return false;
  } finally {
    isConnecting = false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && dbInstance !== null;
}

export async function getMongoStatus() {
  if (!isConnected || !dbInstance) {
    // Attempt one quick reconnection
    await connectToMongoDB();
  }

  if (!isConnected || !dbInstance) {
    return {
      connected: false,
      database: DB_NAME,
      error: lastError,
      message: 'غير متصل (تأكد من تفعيل الوصول لكل الآيبيهات 0.0.0.0/0 في إعدادات Network Access بـ MongoDB Atlas)'
    };
  }

  try {
    const counts: Record<string, number> = {};
    for (const colName of COLLECTIONS) {
      counts[colName] = await dbInstance.collection(colName).countDocuments();
    }
    return {
      connected: true,
      database: DB_NAME,
      counts,
      message: 'متصل بنجاح بقاعدة بيانات MongoDB Atlas'
    };
  } catch (err: any) {
    return {
      connected: false,
      database: DB_NAME,
      error: err?.message || String(err)
    };
  }
}

/**
 * Load all collections from MongoDB
 */
export async function loadAllFromMongo(): Promise<Record<CollectionName, any[]> | null> {
  if (!isConnected || !dbInstance) {
    const ok = await connectToMongoDB();
    if (!ok || !dbInstance) return null;
  }

  try {
    const result: Record<CollectionName, any[]> = {
      stores: [],
      materials: [],
      services: [],
      staff: [],
      shifts: [],
      orders: [],
      wasteRecords: [],
      expenses: [],
      attendanceLogs: [],
      salaryPayments: []
    };
    let totalDocs = 0;

    for (const colName of COLLECTIONS) {
      const docs = await dbInstance.collection(colName).find({}).toArray();
      totalDocs += docs.length;
      result[colName] = docs.map(doc => {
        const { _id, ...rest } = doc;
        return { ...rest, id: rest.id || _id?.toString() };
      });
    }

    console.log(`[MongoDB] Loaded ${totalDocs} total documents across ${COLLECTIONS.length} collections from MongoDB Atlas.`);
    return result;
  } catch (err) {
    console.error('[MongoDB] Error loading data from MongoDB:', err);
    return null;
  }
}

/**
 * Seed all collections in MongoDB if empty
 */
export async function seedMongoIfEmpty(data: Record<CollectionName, any[]>): Promise<void> {
  if (!isConnected || !dbInstance) {
    const ok = await connectToMongoDB();
    if (!ok || !dbInstance) return;
  }

  try {
    for (const colName of COLLECTIONS) {
      const items = data[colName];
      if (Array.isArray(items) && items.length > 0) {
        const count = await dbInstance.collection(colName).countDocuments();
        if (count === 0) {
          const docs = items.map(item => {
            const copy = { ...item };
            delete (copy as any)._id;
            return copy;
          });
          await dbInstance.collection(colName).insertMany(docs);
          console.log(`[MongoDB] Seeded collection "${colName}" with ${docs.length} records.`);
        }
      }
    }
  } catch (err) {
    console.error('[MongoDB] Error seeding initial data:', err);
  }
}

/**
 * Synchronize a specific collection to MongoDB
 */
export async function syncCollectionToMongo(collectionName: CollectionName, items: any[]): Promise<void> {
  if (!isConnected || !dbInstance) {
    const ok = await connectToMongoDB();
    if (!ok || !dbInstance) return;
  }

  try {
    const col = dbInstance.collection(collectionName);
    
    // 1. Remove deleted items
    const currentIds = items.map(i => i.id).filter(Boolean);
    if (currentIds.length > 0) {
      await col.deleteMany({ id: { $nin: currentIds } });
    } else {
      await col.deleteMany({});
    }

    // 2. Upsert current items
    if (items.length > 0) {
      const operations = items.map(item => {
        const doc = { ...item };
        delete (doc as any)._id;
        return {
          replaceOne: {
            filter: { id: item.id },
            replacement: doc,
            upsert: true
          }
        };
      });
      await col.bulkWrite(operations, { ordered: false });
    }
    console.log(`[MongoDB] Synced collection "${collectionName}" (${items.length} items) to MongoDB Atlas.`);
  } catch (err) {
    console.error(`[MongoDB] Error syncing collection "${collectionName}":`, err);
  }
}

/**
 * Synchronize all collections to MongoDB
 */
export async function syncAllToMongo(data: Record<CollectionName, any[]>): Promise<void> {
  if (!isConnected || !dbInstance) {
    const ok = await connectToMongoDB();
    if (!ok || !dbInstance) return;
  }

  for (const colName of COLLECTIONS) {
    if (Array.isArray(data[colName])) {
      await syncCollectionToMongo(colName, data[colName]);
    }
  }
}

