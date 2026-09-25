import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
dotenv.config();

import { 
  connectToMongoDB, 
  loadAllFromMongo, 
  seedMongoIfEmpty, 
  syncCollectionToMongo, 
  syncAllToMongo, 
  getMongoStatus, 
  isMongoConnected,
  CollectionName 
} from './server/mongodb';

interface BOMItem {
  materialId: string;
  quantity: number;
}

interface PhotoLinkConfig {
  paperSize: string;
  paperMaterialId: string;
  photosPerSheet: number;
  inkMaterialId: string;
  inkYieldPhotos: number;
  inkPerPhotoMl?: number;
  pricePerPhoto: number;
}

interface ServiceItem {
  id: string;
  name: string;
  itemType: 'direct_sale' | 'custom_photo_service' | 'standard_service';
  category: string;
  buyCost: number;
  price: number;
  currentStock?: number;
  minThreshold?: number;
  description: string;
  imageIcon: string;
  imageUrl?: string;
  bom: BOMItem[];
  photoConfig?: PhotoLinkConfig;
  estimatedLaborMinutes: number;
  popular?: boolean;
  storeId?: string;
  storeName?: string;
}

interface Store {
  id: string;
  name: string;
  arabicName: string;
  code: string;
  managerName: string;
  managerId: string;
  phone: string;
  address: string;
  currency: string;
  themeColor: string;
  active: boolean;
  openingCashBalance?: number;
  lastCashInHandUpdate?: string;
  cashInHandNotes?: string;
}

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  unitCost: number;
  supplier?: string;
  sku: string;
  storeId?: string;
  storeName?: string;
}

interface CartItem {
  service: ServiceItem;
  quantity: number;
  customNotes?: string;
  customPrice?: number;
  calculatedCost?: number;
  calculatedProfit?: number;
}

interface Order {
  id: string;
  ticketNumber: string;
  storeId?: string;
  storeName?: string;
  customerName: string;
  customerPhone?: string;
  createdAt: string;
  estimatedPickupAt?: string;
  staffId: string;
  staffName: string;
  shiftId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentMethod: string;
  status: string;
  notes?: string;
  totalBOMCost?: number;
  netProfit?: number;
  materialsDeducted: {
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    cost: number;
  }[];
}

interface WasteRecord {
  id: string;
  storeId?: string;
  storeName?: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  reason: string;
  costLoss: number;
  staffId: string;
  staffName: string;
  createdAt: string;
  notes?: string;
}

interface Staff {
  id: string;
  name: string;
  role: 'manager' | 'worker';
  password?: string;
  storeId?: string;
  storeName?: string;
  assignedStores?: string[];
  workSchedule?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  workingDays?: string[];
  hourlyRate?: number;
  dailyRate?: number;
  monthlySalaryBase?: number;
  overtimeHourlyRate?: number;
  phone: string;
  avatar: string;
  active: boolean;
}

interface AttendanceRecord {
  id: string;
  storeId?: string;
  storeName?: string;
  staffId: string;
  staffName: string;
  clockIn: string;
  clockOut?: string;
  date: string;
  status: 'clocked_in' | 'clocked_out';
  totalMinutes?: number;
  salesGenerated?: number;
  hourlyRateApplied?: number;
  earnedPay?: number;
  notes?: string;
}

interface Shift {
  id: string;
  storeId?: string;
  storeName?: string;
  staffId: string;
  staffName: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  openingCash: number;
  cashSales: number;
  expenses: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  notes?: string;
  ordersCount: number;
}

interface Expense {
  id: string;
  storeId?: string;
  storeName?: string;
  title: string;
  amount: number;
  category: string;
  staffId: string;
  staffName: string;
  createdAt: string;
  notes?: string;
}

interface SalaryPayment {
  id: string;
  storeId?: string;
  storeName?: string;
  staffId: string;
  staffName: string;
  paymentType: 'monthly' | 'daily' | 'advance' | 'bonus' | 'custom';
  periodDate: string;
  paymentDate: string;
  baseAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  netPaidAmount: number;
  paymentMethod: 'cash' | 'baridimob' | 'ccp' | 'bank';
  paidByStaffId: string;
  paidByStaffName: string;
  receiptNumber: string;
  notes?: string;
  createdAt: string;
}

interface DatabaseSchema {
  stores: Store[];
  materials: Material[];
  services: ServiceItem[];
  staff: Staff[];
  shifts: Shift[];
  orders: Order[];
  wasteRecords: WasteRecord[];
  expenses: Expense[];
  attendanceLogs: AttendanceRecord[];
  salaryPayments: SalaryPayment[];
}

const DEFAULT_DB_DATA: DatabaseSchema = {
  stores: [
    {
      id: 'store_sidiamer',
      name: 'fotop sidiamer',
      arabicName: 'فوتوب سيدي عامر (Fotop Sidi Amer)',
      code: 'sidiamer',
      managerName: 'fouad',
      managerId: 'staff_fouad',
      phone: '05 63 89 83 95',
      address: 'سيدي عامر (Sidi Amer)',
      currency: 'DZD',
      themeColor: '#E31C2B',
      active: true,
      openingCashBalance: 5000,
      lastCashInHandUpdate: '2026-09-14',
      cashInHandNotes: 'فكة نقدية معتمدة لبداية اليوم (فئات 200 دج و 500 دج و 1000 دج)',
    },
    {
      id: 'store_labhour',
      name: 'fotop labhour',
      arabicName: 'فوتوب الأبحور (Fotop Labhour)',
      code: 'labhour',
      managerName: 'fouad',
      managerId: 'staff_fouad',
      phone: '05 63 89 83 95',
      address: 'الأبحور (Labhour)',
      currency: 'DZD',
      themeColor: '#2563EB',
      active: true,
      openingCashBalance: 3000,
      lastCashInHandUpdate: '2026-09-14',
      cashInHandNotes: 'فكة نقدية معتمدة لبداية اليوم (فئات 100 دج و 200 دج و 500 دج)',
    },
  ],
  materials: [],
  services: [],
  staff: [
    {
      id: 'staff_fouad',
      name: 'فؤاد (fouad)',
      role: 'manager',
      password: 'fouad26911',
      assignedStores: ['store_sidiamer', 'store_labhour'],
      workSchedule: 'إدارة عامة وإشراف على كلا المتجرين (دوام مرن)',
      shiftStartTime: '08:30',
      shiftEndTime: '18:00',
      workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      hourlyRate: 500,
      dailyRate: 4000,
      monthlySalaryBase: 75000,
      phone: '05 63 89 83 95',
      avatar: '👔',
      active: true,
    },
    // عمال متجر fotop sidiamer (سيدي عامر)
    {
      id: 'staff_amine',
      name: 'أمين (Amine - سيدي عامر)',
      role: 'worker',
      password: '123',
      storeId: 'store_sidiamer',
      storeName: 'fotop sidiamer',
      workSchedule: '08:30 - 17:00 (سيدي عامر)',
      shiftStartTime: '08:30',
      shiftEndTime: '17:00',
      workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      hourlyRate: 250,
      dailyRate: 2000,
      monthlySalaryBase: 45000,
      phone: '05 50 11 22 33',
      avatar: '📸',
      active: true,
    },
    {
      id: 'staff_karim',
      name: 'كريم (Karim - سيدي عامر)',
      role: 'worker',
      password: '123',
      storeId: 'store_sidiamer',
      storeName: 'fotop sidiamer',
      workSchedule: '09:00 - 18:00 (سيدي عامر)',
      shiftStartTime: '09:00',
      shiftEndTime: '18:00',
      workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      hourlyRate: 250,
      dailyRate: 2000,
      monthlySalaryBase: 45000,
      phone: '05 50 22 33 44',
      avatar: '🖨️',
      active: true,
    },
    // عمال متجر fotop labhour (الأبحور)
    {
      id: 'staff_yassine',
      name: 'ياسين (Yassine - الأبحور)',
      role: 'worker',
      password: '123',
      storeId: 'store_labhour',
      storeName: 'fotop labhour',
      workSchedule: '08:30 - 17:00 (الأبحور)',
      shiftStartTime: '08:30',
      shiftEndTime: '17:00',
      workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      hourlyRate: 250,
      dailyRate: 2000,
      monthlySalaryBase: 45000,
      phone: '06 60 44 55 66',
      avatar: '📷',
      active: true,
    },
    {
      id: 'staff_souhaib',
      name: 'صهيب (Souhaib - الأبحور)',
      role: 'worker',
      password: '123',
      storeId: 'store_labhour',
      storeName: 'fotop labhour',
      workSchedule: '09:00 - 18:00 (الأبحور)',
      shiftStartTime: '09:00',
      shiftEndTime: '18:00',
      workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      hourlyRate: 250,
      dailyRate: 2000,
      monthlySalaryBase: 45000,
      phone: '06 60 77 88 99',
      avatar: '💻',
      active: true,
    },
  ],
  shifts: [],
  orders: [],
  wasteRecords: [],
  expenses: [],
  attendanceLogs: [],
  salaryPayments: [],
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);

      // Merge default staff if missing workers
      let loadedStaff = parsed.staff && parsed.staff.length > 0 ? parsed.staff : DEFAULT_DB_DATA.staff;
      if (loadedStaff.length <= 1) {
        // Upgrade single-user to multi-store staff
        loadedStaff = DEFAULT_DB_DATA.staff;
      }

      return {
        stores: parsed.stores && parsed.stores.length > 0 ? parsed.stores : DEFAULT_DB_DATA.stores,
        materials: parsed.materials || [],
        services: parsed.services || [],
        staff: loadedStaff,
        shifts: parsed.shifts || [],
        orders: parsed.orders || [],
        wasteRecords: parsed.wasteRecords || [],
        expenses: parsed.expenses || [],
        attendanceLogs: parsed.attendanceLogs || [],
        salaryPayments: parsed.salaryPayments || [],
      };
    }
  } catch (err) {
    console.error('Error loading database file, falling back to default:', err);
  }
  // Initialize file
  saveDatabase(DEFAULT_DB_DATA);
  return JSON.parse(JSON.stringify(DEFAULT_DB_DATA));
}

async function saveDatabase(data: DatabaseSchema, collectionToSync?: CollectionName): Promise<void> {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }

  // Ensure persistent sync to MongoDB Atlas URL Database
  try {
    if (collectionToSync) {
      await syncCollectionToMongo(collectionToSync, data[collectionToSync]);
    } else {
      await syncAllToMongo(data as any);
    }
  } catch (err) {
    console.error(`[MongoDB] Async sync error for collection "${collectionToSync || 'all'}":`, err);
  }
}

// In-memory runtime state
let db: DatabaseSchema = loadDatabase();

async function startServer() {
  const app = express();

  // Dynamic port resolution:
  // Inside Google AI Studio preview environment, port 3000 is required because port 8000 is reserved by internal control plane.
  // On external VPS, Docker, or production deployment, it defaults to port 8000 (or process.env.PORT).
  const isAIStudio = Boolean(process.env.APPLET_ID || process.env.CONTROL_PLANE_PORT);
  const PORT = isAIStudio ? 3000 : (process.env.PORT ? parseInt(process.env.PORT, 10) : 8000);

  // Enable trust proxy for custom domains like fotop.online behind Cloudflare, Nginx, or Cloud Run
  app.set('trust proxy', true);

  // CORS, Security & Frame Embedding Headers for fotop.online
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Allow iframe framing on fotop.online, subdomains, Google AI Studio preview, and Cloud Run
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://fotop.online https://*.fotop.online http://localhost:* https://*.run.app https://*.google.com;");

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json());

  // Static assets serving so user can place logo.png in either /assets or /public/assets
  const rootAssetsPath = path.join(process.cwd(), 'assets');
  const publicAssetsPath = path.join(process.cwd(), 'public', 'assets');
  if (fs.existsSync(rootAssetsPath)) {
    app.use('/assets', express.static(rootAssetsPath));
  }
  if (fs.existsSync(publicAssetsPath)) {
    app.use('/assets', express.static(publicAssetsPath));
  }

  // Initialize MongoDB Atlas connection & sync
  connectToMongoDB().then(async (connected) => {
    if (connected) {
      console.log('[MongoDB] Checking cloud collections for existing Fotop Studio data...');
      const cloudData = await loadAllFromMongo();
      if (cloudData) {
        // Merge cloud data into active db state
        db = {
          stores: (cloudData.stores && cloudData.stores.length > 0) ? cloudData.stores : (db.stores && db.stores.length > 0 ? db.stores : DEFAULT_DB_DATA.stores),
          materials: (cloudData.materials && cloudData.materials.length > 0) ? cloudData.materials : db.materials,
          services: (cloudData.services && cloudData.services.length > 0) ? cloudData.services : db.services,
          staff: (cloudData.staff && cloudData.staff.length > 1) ? cloudData.staff : db.staff,
          shifts: cloudData.shifts || db.shifts,
          orders: cloudData.orders || db.orders,
          wasteRecords: cloudData.wasteRecords || db.wasteRecords,
          expenses: cloudData.expenses || db.expenses,
          attendanceLogs: cloudData.attendanceLogs || db.attendanceLogs,
          salaryPayments: cloudData.salaryPayments || db.salaryPayments,
        };
        // Update local file cache
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
        } catch (e) {
          console.error('[MongoDB] Local cache write error:', e);
        }
        console.log('[MongoDB] Local ERP state successfully hydrated from MongoDB Atlas.');

        // Seed any empty collection from defaults
        await seedMongoIfEmpty(db as any);
      } else {
        // Collections are empty, seed them from local state
        console.log('[MongoDB] Cloud database is empty. Seeding MongoDB Atlas from local ERP database...');
        await seedMongoIfEmpty(db as any);
        console.log('[MongoDB] Initial cloud seeding complete.');
      }
    } else {
      console.log('[MongoDB] Operating with local JSON persistence until MongoDB Atlas connection is established.');
    }
  }).catch(err => {
    console.error('[MongoDB] Unexpected error during connection init:', err);
  });

  // === API ROUTES ===

  // Health check & DB Status
  app.get('/api/health', async (req, res) => {
    const mongoStatus = await getMongoStatus();
    res.json({ 
      status: 'ok', 
      server: 'Fotop Studio ERP Backend', 
      mongodb: mongoStatus,
      timestamp: new Date().toISOString() 
    });
  });

  // MongoDB Status API
  app.get('/api/mongodb/status', async (req, res) => {
    const status = await getMongoStatus();
    res.json(status);
  });

  // Force Sync with MongoDB Atlas
  app.post('/api/mongodb/sync', async (req, res) => {
    if (!isMongoConnected()) {
      const connected = await connectToMongoDB();
      if (!connected) {
        return res.status(503).json({ 
          success: false, 
          message: 'تعذر الاتصال بـ MongoDB Atlas. يرجى التحقق من إعدادات الشبكة وقائمة السماح بالآيبيهات في Atlas.' 
        });
      }
    }
    await syncAllToMongo(db as any);
    const status = await getMongoStatus();
    res.json({ success: true, message: 'تمت مزامنة جميع البيانات مع MongoDB Atlas بنجاح', status });
  });

  // Get all data (directly hydrated from MongoDB Atlas if connected)
  app.get('/api/data', async (req, res) => {
    if (isMongoConnected()) {
      try {
        const cloudData = await loadAllFromMongo();
        if (cloudData) {
          db = {
            stores: (cloudData.stores && cloudData.stores.length > 0) ? cloudData.stores : (db.stores && db.stores.length > 0 ? db.stores : DEFAULT_DB_DATA.stores),
            materials: (cloudData.materials && cloudData.materials.length > 0) ? cloudData.materials : db.materials,
            services: (cloudData.services && cloudData.services.length > 0) ? cloudData.services : db.services,
            staff: (cloudData.staff && cloudData.staff.length > 1) ? cloudData.staff : db.staff,
            shifts: cloudData.shifts || db.shifts,
            orders: cloudData.orders || db.orders,
            wasteRecords: cloudData.wasteRecords || db.wasteRecords,
            expenses: cloudData.expenses || db.expenses,
            attendanceLogs: cloudData.attendanceLogs || db.attendanceLogs,
            salaryPayments: cloudData.salaryPayments || db.salaryPayments,
          };
        }
      } catch (err) {
        console.warn('Error reading from MongoDB on /api/data:', err);
      }
    }
    res.json(db);
  });

  // === Stores API ===
  app.get('/api/stores', (req, res) => {
    res.json(db.stores || DEFAULT_DB_DATA.stores);
  });

  app.post('/api/stores', (req, res) => {
    const newStore: Store = {
      ...req.body,
      id: req.body.id || `store_${Date.now()}`,
    };
    db.stores = db.stores || [];
    const existingIndex = db.stores.findIndex(s => s.id === newStore.id);
    if (existingIndex >= 0) {
      db.stores[existingIndex] = newStore;
    } else {
      db.stores.push(newStore);
    }
    saveDatabase(db, 'stores');
    res.json(db.stores);
  });

  app.put('/api/stores/:id', (req, res) => {
    const { id } = req.params;
    const updated = req.body as Partial<Store>;
    db.stores = (db.stores || []).map(s => (s.id === id ? { ...s, ...updated } : s));
    saveDatabase(db, 'stores');
    res.json(db.stores);
  });

  // Reset database completely (wipe all data and keep only fouad manager)
  app.post('/api/reset', (req, res) => {
    db = JSON.parse(JSON.stringify(DEFAULT_DB_DATA));
    saveDatabase(db);
    res.json(db);
  });

  // === Materials API ===
  app.get('/api/materials', (req, res) => {
    res.json(db.materials);
  });

  app.post('/api/materials', (req, res) => {
    const newMat: Material = {
      ...req.body,
      id: req.body.id || `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    db.materials.push(newMat);
    saveDatabase(db);
    res.json(db.materials);
  });

  app.put('/api/materials/:id', (req, res) => {
    const { id } = req.params;
    const updated = req.body as Material;
    db.materials = db.materials.map(m => (m.id === id ? { ...updated, id } : m));
    saveDatabase(db);
    res.json(db.materials);
  });

  app.post('/api/materials/restock', (req, res) => {
    const { materialId, quantity, unitCost } = req.body;
    const qty = Number(quantity) || 0;
    const cost = unitCost !== undefined && Number(unitCost) > 0 ? Number(unitCost) : undefined;
    
    db.materials = db.materials.map(m => {
      if (m.id === materialId) {
        return {
          ...m,
          currentStock: m.currentStock + qty,
          unitCost: cost !== undefined ? cost : m.unitCost,
        };
      }
      return m;
    });
    saveDatabase(db);
    res.json(db.materials);
  });

  app.delete('/api/materials/:id', (req, res) => {
    const { id } = req.params;
    db.materials = db.materials.filter(m => m.id !== id);
    saveDatabase(db);
    res.json(db.materials);
  });

  // === Services API ===
  app.get('/api/services', (req, res) => {
    res.json(db.services);
  });

  app.post('/api/services', (req, res) => {
    const newService: ServiceItem = {
      ...req.body,
      id: req.body.id || `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    db.services.unshift(newService);
    saveDatabase(db);
    res.json(db.services);
  });

  app.put('/api/services/:id', (req, res) => {
    const { id } = req.params;
    const updated = req.body as ServiceItem;
    db.services = db.services.map(s => (s.id === id ? { ...updated, id } : s));
    saveDatabase(db);
    res.json(db.services);
  });

  app.delete('/api/services/:id', (req, res) => {
    const { id } = req.params;
    db.services = db.services.filter(s => s.id !== id);
    saveDatabase(db);
    res.json(db.services);
  });

  // === Staff API ===
  app.get('/api/staff', (req, res) => {
    res.json(db.staff);
  });

  app.post('/api/staff', (req, res) => {
    const newStaff: Staff = {
      ...req.body,
      id: req.body.id || `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    db.staff.push(newStaff);
    saveDatabase(db);
    res.json(db.staff);
  });

  app.put('/api/staff/:id', (req, res) => {
    const { id } = req.params;
    const updated = req.body as Staff;
    db.staff = db.staff.map(s => (s.id === id ? { ...updated, id } : s));
    saveDatabase(db);
    res.json(db.staff);
  });

  app.delete('/api/staff/:id', (req, res) => {
    const { id } = req.params;
    db.staff = db.staff.filter(s => s.id !== id);
    saveDatabase(db);
    res.json(db.staff);
  });

  // === Shifts API ===
  app.get('/api/shifts', (req, res) => {
    res.json(db.shifts);
  });

  app.post('/api/shifts/open', (req, res) => {
    const { staffId, staffName, openingCash, storeId, storeName } = req.body;
    const newShift: Shift = {
      id: `shf_${Date.now()}`,
      staffId,
      staffName,
      storeId: storeId || 'store_sidiamer',
      storeName: storeName || 'fotop sidiamer',
      startTime: new Date().toISOString(),
      openingCash: Number(openingCash) || 0,
      cashSales: 0,
      expenses: 0,
      expectedCash: Number(openingCash) || 0,
      ordersCount: 0,
      status: 'open',
    };
    db.shifts.unshift(newShift);
    saveDatabase(db);
    res.json(db.shifts);
  });

  app.post('/api/shifts/close', (req, res) => {
    const { shiftId, actualCash, notes } = req.body;
    const actCash = Number(actualCash) || 0;
    db.shifts = db.shifts.map(s => {
      if (s.id === shiftId) {
        const diff = actCash - s.expectedCash;
        return {
          ...s,
          endTime: new Date().toISOString(),
          actualCash: actCash,
          difference: diff,
          status: 'closed' as const,
          notes,
        };
      }
      return s;
    });
    saveDatabase(db);
    res.json(db.shifts);
  });

  // === Orders API with automatic BOM deduction and shift updates ===
  app.get('/api/orders', (req, res) => {
    res.json(db.orders);
  });

  app.post('/api/orders', (req, res) => {
    const orderData = req.body;
    const newId = `ord_${Date.now()}`;
    const nextTicketNum = 1000 + db.orders.length + 1;
    const ticketNumber = `FTP-${nextTicketNum}`;
    const createdAt = new Date().toISOString();

    const newOrder: Order = {
      ...orderData,
      id: newId,
      ticketNumber,
      createdAt,
    };

    // 1. Add order
    db.orders.unshift(newOrder);

    // 2. Automatically deduct materials from inventory
    if (newOrder.materialsDeducted && newOrder.materialsDeducted.length > 0) {
      db.materials = db.materials.map(mat => {
        const deduction = newOrder.materialsDeducted.find(d => d.materialId === mat.id);
        if (deduction) {
          const updatedStock = Math.max(0, Number((mat.currentStock - deduction.quantity).toFixed(2)));
          return { ...mat, currentStock: updatedStock };
        }
        return mat;
      });
    }

    // Deduct stock for direct sale services if applicable
    if (newOrder.items && newOrder.items.length > 0) {
      db.services = db.services.map(srv => {
        const cartMatch = newOrder.items.find(it => it.service.id === srv.id);
        if (cartMatch && srv.itemType === 'direct_sale' && typeof srv.currentStock === 'number') {
          return {
            ...srv,
            currentStock: Math.max(0, srv.currentStock - cartMatch.quantity),
          };
        }
        return srv;
      });
    }

    // 3. Update active shift finances for this specific store
    const activeShift = db.shifts.find(s => 
      s.status === 'open' && 
      (!newOrder.storeId || !s.storeId || s.storeId === newOrder.storeId)
    );
    if (activeShift) {
      db.shifts = db.shifts.map(s => {
        if (s.id === activeShift.id) {
          const isCash = newOrder.paymentMethod === 'cash';
          const cashAdded = isCash ? newOrder.paidAmount : 0;
          return {
            ...s,
            cashSales: s.cashSales + cashAdded,
            expectedCash: s.expectedCash + cashAdded,
            ordersCount: s.ordersCount + 1,
          };
        }
        return s;
      });
    }

    saveDatabase(db);
    res.json({
      order: newOrder,
      orders: db.orders,
      materials: db.materials,
      shifts: db.shifts,
      services: db.services,
    });
  });

  app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.orders = db.orders.map(o => (o.id === id ? { ...o, status } : o));
    saveDatabase(db);
    res.json(db.orders);
  });

  // === Waste API ===
  app.get('/api/waste', (req, res) => {
    res.json(db.wasteRecords);
  });

  app.post('/api/waste', (req, res) => {
    const newWaste: WasteRecord = {
      ...req.body,
      id: `wst_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.wasteRecords.unshift(newWaste);

    // Deduct stock from material
    db.materials = db.materials.map(m => {
      if (m.id === req.body.materialId) {
        return {
          ...m,
          currentStock: Math.max(0, Number((m.currentStock - req.body.quantity).toFixed(2))),
        };
      }
      return m;
    });

    saveDatabase(db);
    res.json({
      wasteRecords: db.wasteRecords,
      materials: db.materials,
    });
  });

  // === Expenses API ===
  app.get('/api/expenses', (req, res) => {
    res.json(db.expenses);
  });

  app.post('/api/expenses', (req, res) => {
    const newExp: Expense = {
      ...req.body,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.expenses.unshift(newExp);

    // Deduct from active shift if open for this specific store
    const activeShift = db.shifts.find(s => 
      s.status === 'open' && 
      (!newExp.storeId || !s.storeId || s.storeId === newExp.storeId)
    );
    if (activeShift) {
      db.shifts = db.shifts.map(s => {
        if (s.id === activeShift.id) {
          return {
            ...s,
            expenses: s.expenses + Number(newExp.amount),
            expectedCash: s.expectedCash - Number(newExp.amount),
          };
        }
        return s;
      });
    }

    saveDatabase(db);
    res.json({
      expenses: db.expenses,
      shifts: db.shifts,
    });
  });

  // === Attendance API ===
  app.get('/api/attendance', (req, res) => {
    res.json(db.attendanceLogs);
  });

  app.post('/api/attendance/auto-clock-in-all', (req, res) => {
    const { managerStaffId } = req.body;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const clockedInStaffNames: string[] = [];

    // Find all staff who are not currently clocked in today
    db.staff.forEach(member => {
      const alreadyClockedIn = db.attendanceLogs.some(
        att => att.staffId === member.id && att.date === todayStr && att.status === 'clocked_in'
      );
      if (!alreadyClockedIn) {
        const newRecord: AttendanceRecord = {
          id: `att_${Date.now()}_${member.id}`,
          staffId: member.id,
          staffName: member.name,
          clockIn: now.toISOString(),
          date: todayStr,
          status: 'clocked_in',
          hourlyRateApplied: member.hourlyRate || 250,
          notes: 'تسجيل دخول تلقائي لجميع العمال بواسطة المدير',
        };
        db.attendanceLogs.unshift(newRecord);
        clockedInStaffNames.push(member.name);
      }
    });

    saveDatabase(db);
    res.json({
      attendanceLogs: db.attendanceLogs,
      clockedInCount: clockedInStaffNames.length,
      clockedInStaffNames
    });
  });

  app.post('/api/attendance/auto-clock-out-all', (req, res) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let clockedOutCount = 0;

    db.attendanceLogs = db.attendanceLogs.map(att => {
      if (att.status === 'clocked_in' && att.date === todayStr) {
        const startTime = new Date(att.clockIn).getTime();
        const endTime = now.getTime();
        const totalMinutes = Math.max(1, Math.round((endTime - startTime) / (1000 * 60)));
        const staff = db.staff.find(s => s.id === att.staffId);
        const hourlyRateApplied = att.hourlyRateApplied || staff?.hourlyRate || 250;
        const earnedPay = Math.round((totalMinutes / 60) * hourlyRateApplied);
        clockedOutCount++;

        return {
          ...att,
          clockOut: now.toISOString(),
          status: 'clocked_out' as const,
          totalMinutes,
          hourlyRateApplied,
          earnedPay,
          notes: 'تسجيل خروج جماعي تلقائي بنهاية العمل بواسطة المدير',
        };
      }
      return att;
    });

    saveDatabase(db);
    res.json({
      attendanceLogs: db.attendanceLogs,
      clockedOutCount
    });
  });

  app.post('/api/attendance/clock-in', (req, res) => {
    const { staffId, staffName } = req.body;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const staff = db.staff.find(s => s.id === staffId);
    const hourlyRateApplied = staff?.hourlyRate || 250;

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      staffId,
      staffName,
      clockIn: now.toISOString(),
      date: todayStr,
      status: 'clocked_in',
      hourlyRateApplied,
      notes: 'تسجيل دخول وبداية الدوام',
    };
    db.attendanceLogs.unshift(newRecord);
    saveDatabase(db);
    res.json(db.attendanceLogs);
  });

  app.post('/api/attendance/clock-out', (req, res) => {
    const { staffId } = req.body;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const staff = db.staff.find(s => s.id === staffId);
    const rate = staff?.hourlyRate || 250;

    db.attendanceLogs = db.attendanceLogs.map(att => {
      if (att.staffId === staffId && att.status === 'clocked_in' && att.date === todayStr) {
        const startTime = new Date(att.clockIn).getTime();
        const endTime = now.getTime();
        const totalMinutes = Math.max(1, Math.round((endTime - startTime) / (1000 * 60)));
        const hourlyRateApplied = att.hourlyRateApplied || rate;
        const earnedPay = Math.round((totalMinutes / 60) * hourlyRateApplied);

        return {
          ...att,
          clockOut: now.toISOString(),
          status: 'clocked_out' as const,
          totalMinutes,
          hourlyRateApplied,
          earnedPay,
          notes: 'تسجيل خروج ونهاية الدوام',
        };
      }
      return att;
    });
    saveDatabase(db);
    res.json(db.attendanceLogs);
  });

  app.post('/api/attendance/manual', (req, res) => {
    const { staffId, staffName, date, clockIn, clockOut, totalMinutes, hourlyRateApplied, notes } = req.body;
    const staff = db.staff.find(s => s.id === staffId);
    const rate = Number(hourlyRateApplied) || staff?.hourlyRate || 250;
    const mins = Number(totalMinutes) || 0;
    const earnedPay = Math.round((mins / 60) * rate);

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      staffId,
      staffName: staffName || staff?.name || 'عامل',
      date: date || new Date().toISOString().split('T')[0],
      clockIn: clockIn || new Date().toISOString(),
      clockOut: clockOut || new Date().toISOString(),
      status: 'clocked_out',
      totalMinutes: mins,
      hourlyRateApplied: rate,
      earnedPay,
      notes: notes || 'سجل حضور يدوي موثق',
    };
    db.attendanceLogs.unshift(newRecord);
    saveDatabase(db);
    res.json(db.attendanceLogs);
  });

  app.delete('/api/attendance/:id', (req, res) => {
    const { id } = req.params;
    db.attendanceLogs = db.attendanceLogs.filter(a => a.id !== id);
    saveDatabase(db);
    res.json(db.attendanceLogs);
  });

  // === Human Resources & Salary Payments API ===
  app.get('/api/salary-payments', (req, res) => {
    res.json(db.salaryPayments || []);
  });

  app.post('/api/salary-payments', (req, res) => {
    const {
      staffId,
      staffName,
      paymentType,
      periodDate,
      paymentDate,
      baseAmount,
      bonusAmount,
      deductionAmount,
      netPaidAmount,
      paymentMethod,
      paidByStaffId,
      paidByStaffName,
      notes,
      recordAsStudioExpense = true
    } = req.body;

    const receiptNum = `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    
    const newPayment: SalaryPayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      staffId,
      staffName,
      paymentType: paymentType || 'monthly',
      periodDate: periodDate || new Date().toISOString().split('T')[0],
      paymentDate: paymentDate || new Date().toISOString(),
      baseAmount: Number(baseAmount) || 0,
      bonusAmount: Number(bonusAmount) || 0,
      deductionAmount: Number(deductionAmount) || 0,
      netPaidAmount: Number(netPaidAmount) || 0,
      paymentMethod: paymentMethod || 'cash',
      paidByStaffId: paidByStaffId || 'staff_fouad',
      paidByStaffName: paidByStaffName || 'المدير فؤاد',
      receiptNumber: receiptNum,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    if (!db.salaryPayments) db.salaryPayments = [];
    db.salaryPayments.unshift(newPayment);

    // If marked to record as studio expense & cash was paid from studio
    if (recordAsStudioExpense && Number(netPaidAmount) > 0) {
      const typeLabel = paymentType === 'monthly' ? 'راتب شهري' : paymentType === 'daily' ? 'يومية عمل' : paymentType === 'advance' ? 'تسبيق راتب' : 'مكافأة';
      const expenseTitle = `أجور (${typeLabel}): ${staffName} [${periodDate}]`;
      
      const newExp: Expense = {
        id: `exp_pay_${Date.now()}`,
        title: expenseTitle,
        amount: Number(netPaidAmount),
        category: 'salary',
        staffId: paidByStaffId || 'staff_fouad',
        staffName: paidByStaffName || 'المدير',
        createdAt: new Date().toISOString(),
        notes: `دفعة راتب رسمية رقم ${receiptNum} - طريقة الدفع: ${paymentMethod === 'cash' ? 'نقداً' : paymentMethod === 'baridimob' ? 'بريدي موب' : paymentMethod === 'ccp' ? 'CCP' : 'بنكي'}. ${notes || ''}`,
      };
      db.expenses.unshift(newExp);

      // Deduct from open shift if cash
      if (paymentMethod === 'cash') {
        const activeShift = db.shifts.find(s => s.status === 'open');
        if (activeShift) {
          db.shifts = db.shifts.map(s => {
            if (s.id === activeShift.id) {
              return {
                ...s,
                expenses: s.expenses + Number(netPaidAmount),
                expectedCash: s.expectedCash - Number(netPaidAmount),
              };
            }
            return s;
          });
        }
      }
    }

    saveDatabase(db);
    res.json({
      salaryPayments: db.salaryPayments,
      expenses: db.expenses,
      shifts: db.shifts
    });
  });

  app.put('/api/salary-payments/:id', (req, res) => {
    const { id } = req.params;
    const {
      paymentType,
      periodDate,
      baseAmount,
      bonusAmount,
      deductionAmount,
      netPaidAmount,
      paymentMethod,
      notes
    } = req.body;

    if (!db.salaryPayments) db.salaryPayments = [];
    
    db.salaryPayments = db.salaryPayments.map(p => {
      if (p.id === id) {
        return {
          ...p,
          paymentType: paymentType !== undefined ? paymentType : p.paymentType,
          periodDate: periodDate !== undefined ? periodDate : p.periodDate,
          baseAmount: baseAmount !== undefined ? Number(baseAmount) : p.baseAmount,
          bonusAmount: bonusAmount !== undefined ? Number(bonusAmount) : p.bonusAmount,
          deductionAmount: deductionAmount !== undefined ? Number(deductionAmount) : p.deductionAmount,
          netPaidAmount: netPaidAmount !== undefined ? Number(netPaidAmount) : p.netPaidAmount,
          paymentMethod: paymentMethod !== undefined ? paymentMethod : p.paymentMethod,
          notes: notes !== undefined ? notes : p.notes,
        };
      }
      return p;
    });

    saveDatabase(db);
    res.json({ salaryPayments: db.salaryPayments, expenses: db.expenses });
  });

  app.delete('/api/salary-payments/:id', (req, res) => {
    const { id } = req.params;
    if (!db.salaryPayments) db.salaryPayments = [];
    db.salaryPayments = db.salaryPayments.filter(p => p.id !== id);
    saveDatabase(db);
    res.json({ salaryPayments: db.salaryPayments, expenses: db.expenses });
  });

  app.get('/api/domain-info', (req, res) => {
    res.json({
      domain: 'fotop.online',
      status: 'ready',
      timestamp: new Date().toISOString(),
      mongoConnected: isMongoConnected(),
      app: 'Fotop Studio ERP',
      company: 'Redox Cloud Solutions'
    });
  });

  // === Vite Middleware Integration ===
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fotop Studio ERP server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
