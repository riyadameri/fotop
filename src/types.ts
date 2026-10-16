export type Currency = 'DZD' | 'SAR' | 'USD' | 'EUR';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'credit';

export type OrderStatus = 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';

export interface Store {
  id: string; // 'store_sidiamer' | 'store_labhour'
  name: string; // 'fotop sidiamer' | 'fotop labhour'
  arabicName: string; // 'استوديو فوتوب - سيدي عامر' | 'استوديو فوتوب - الأبحور'
  code: string; // 'sidiamer' | 'labhour'
  managerName: string; // 'fouad'
  managerId: string; // 'staff_fouad'
  phone: string;
  address: string;
  currency: Currency;
  themeColor: string; // #E31C2B (سيدي عامر) | #2563EB (الأبحور)
  active: boolean;
  openingCashBalance?: number; // الرصيد الافتتاحي اليومي للصندوق (Cash In Hand) المحدد من فؤاد
  lastCashInHandUpdate?: string; // تاريخ آخر تحديث للرصيد الافتتاحي (ISO أو YYYY-MM-DD)
  cashInHandNotes?: string; // تفاصيل الفكة وملاحظات الرصيد الافتتاحي
}

export const DEFAULT_STORES: Store[] = [
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
    cashInHandNotes: 'فكة نقدية معتمدة لبداية اليوم (فئات 200 دج و 500 دج و 1000 دج)'
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
    cashInHandNotes: 'فكة نقدية معتمدة لبداية اليوم (فئات 100 دج و 200 دج و 500 دج)'
  }
];

export interface BOMItem {
  materialId: string;
  quantity: number; // e.g. 1 sheet, 0.4 ml
}

export interface PhotoLinkConfig {
  paperSize: 'A4' | 'A3' | '10x15' | '13x18' | 'custom';
  paperMaterialId: string; // مادة الورق
  photosPerSheet: number;  // عدد الصور في الورقة الواحدة (مثلاً 1 صورة لـ A4، أو 4 صور لـ 10x15)
  inkMaterialId: string;   // مادة الحبر
  inkYieldPhotos: number;  // عدد الصور الإجمالي الذي تطبعه عبوة الحبر (مثلاً 600 صورة)
  inkPerPhotoMl?: number;  // استهلاك الحبر بالميللتر لكل صورة
  pricePerPhoto: number;   // سعر بيع الصورة الواحدة
  // ربط الكادر / الإطار والتغليف الحراري (عنصر ارتباطي متكامل: ورق + حبر + كادر)
  frameMaterialId?: string; // مادة الكادر أو البرواز من المخزن
  framePerPhoto?: number;   // عدد الكوادر لكل وحدة (افتراضياً 1)
  laminationMaterialId?: string; // مادة التغليف الحراري (اختياري)
}

// التصنيفات الرسمية المعتمدة لاستوديو التصوير
export type OfficialServiceCategory = 
  | 'id_and_regular_photos'   // 1. اخراج الصور الشمسية والعادية
  | 'frames_and_enlargements' // 2. كوادر وتكبير الصور
  | 'goods_and_accessories'   // 3. سلع وإكسسوارات
  | 'printing_services'       // 4. خدمات الطباعة
  | 'studio_sessions';        // 5. جلسة تصوير داخل الاستديو

export type ServiceCategory = 
  | OfficialServiceCategory
  // القيم السابقة للتوافق العكسي التام
  | 'id_photos'
  | 'prints'
  | 'frames'
  | 'lamination'
  | 'digital'
  | 'packages'
  | 'retail_goods'
  | 'photo_printing'
  | 'document_printing'
  | 'id_photo'
  | 'custom';

export const OFFICIAL_SERVICE_CATEGORIES: { id: OfficialServiceCategory; label: string; icon: string }[] = [
  { id: 'id_and_regular_photos', label: '1. اخراج الصور الشمسية والعادية', icon: 'UserCheck' },
  { id: 'frames_and_enlargements', label: '2. كوادر وتكبير الصور', icon: 'Frame' },
  { id: 'goods_and_accessories', label: '3. سلع وإكسسوارات', icon: 'ShoppingBag' },
  { id: 'printing_services', label: '4. خدمات الطباعة', icon: 'Printer' },
  { id: 'studio_sessions', label: '5. جلسة تصوير داخل الاستديو', icon: 'Smile' },
];

/**
 * Normalizes any category string into one of the 5 official studio categories.
 */
export function normalizeServiceCategory(cat?: string, name?: string): OfficialServiceCategory {
  // If explicitly provided as one of the 5 official categories, respect it directly!
  if (cat) {
    const c = cat.toLowerCase().trim();
    if (c === 'id_and_regular_photos') return 'id_and_regular_photos';
    if (c === 'frames_and_enlargements') return 'frames_and_enlargements';
    if (c === 'goods_and_accessories') return 'goods_and_accessories';
    if (c === 'printing_services') return 'printing_services';
    if (c === 'studio_sessions') return 'studio_sessions';
    
    // Legacy category mappings
    if (c === 'id_photos' || c === 'id_photo') return 'id_and_regular_photos';
    if (c === 'frames' || c === 'prints' || c === 'photo_printing') return 'frames_and_enlargements';
    if (c === 'retail_goods') return 'goods_and_accessories';
    if (c === 'lamination' || c === 'digital' || c === 'document_printing') return 'printing_services';
    if (c === 'packages') return 'studio_sessions';
  }

  // Fallback to name-based heuristic only if category was unspecified or unrecognized
  if (name) {
    const n = name.toLowerCase();
    if (n.includes('كادر') || n.includes('إطار') || n.includes('برواز') || n.includes('تكبير') || n.includes('cadre') || n.includes('frame')) {
      return 'frames_and_enlargements';
    }
    if (n.includes('شمسية') || n.includes('هوية') || n.includes('جواز') || n.includes('شمسيه') || n.includes('id photo')) {
      return 'id_and_regular_photos';
    }
    if (n.includes('جلسة') || n.includes('جلسه') || n.includes('استوديو') || n.includes('عرس') || n.includes('جلسات')) {
      return 'studio_sessions';
    }
    if (n.includes('طباعة مستند') || n.includes('فوطوكوبي') || n.includes('فوتوكوبي') || n.includes('تغليف حراري')) {
      return 'printing_services';
    }
  }

  return 'goods_and_accessories';
}

export interface ServiceItem {
  id: string;
  name: string;
  itemType: 'direct_sale' | 'custom_photo_service' | 'standard_service';
  category: ServiceCategory;
  buyCost: number; // سعر الشراء / تكلفة الوحدة المباشرة (للبيع المباشر أو التكلفة الأساسية)
  price: number; // سعر البيع
  currentStock?: number; // للمنتجات والسلع المادية المباعة مباشرة
  minThreshold?: number;
  description: string;
  imageIcon: string;
  imageUrl?: string; // رابط أو كود Base64 لصورة المنتج
  bom: BOMItem[]; // Raw materials consumed
  photoConfig?: PhotoLinkConfig; // إعدادات الربط الآلي بين الورق والحبر والصور والكادر
  estimatedLaborMinutes: number;
  popular?: boolean;
  storeId?: string; // معرف المتجر: 'store_sidiamer' | 'store_labhour'
  storeName?: string; // اسم المتجر: 'fotop sidiamer' | 'fotop labhour'
}

export interface Material {
  id: string;
  name: string;
  category: 'paper' | 'ink' | 'frame' | 'lamination' | 'packaging' | 'other';
  unit: 'sheet' | 'ml' | 'piece' | 'roll' | 'box';
  currentStock: number;
  minThreshold: number; // Low stock alert limit
  unitCost: number; // Cost price in currency
  supplier?: string;
  sku: string;
  storeId?: string; // معرف المتجر (اختياري، في حال تخصيص مخزون مستقل لكل متجر)
  storeName?: string;
}

export interface CartItem {
  service: ServiceItem;
  quantity: number;
  customNotes?: string;
  customPrice?: number;
  calculatedCost?: number; // Real-time cost for this item
  calculatedProfit?: number; // Real-time profit for this item
}

export interface Order {
  id: string;
  ticketNumber: string; // e.g. FTP-1001
  storeId?: string; // 'store_sidiamer' | 'store_labhour'
  storeName?: string; // 'fotop sidiamer' | 'fotop labhour'
  customerName: string;
  customerPhone?: string;
  createdAt: string; // ISO
  estimatedPickupAt?: string;
  staffId: string;
  staffName: string;
  shiftId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  completedAt?: string; // وقت الانتهاء والتسليم الفعلي
  serviceDurationMinutes?: number; // زمن إنجاز الخدمة بالدقائق
  notes?: string;
  totalBOMCost?: number; // إجمالي تكلفة المواد الخام
  netProfit?: number;    // صافي الربح الفعلي من هذا الطلب
  materialsDeducted: {
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    cost: number;
  }[];
}

export type WasteReason = 
  | 'print_error'      // خطأ في الطباعة / تشويه ألوان
  | 'miscut'           // خطأ في القص
  | 'paper_jam'        // انحشار الورق في الساحب
  | 'ink_spill'        // هدر أو انسكاب حبر
  | 'expired'          // تلف مادة أثناء التخزين
  | 'other';           // أسباب أخرى

export interface WasteRecord {
  id: string;
  storeId?: string;
  storeName?: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  reason: WasteReason;
  costLoss: number;
  staffId: string;
  staffName: string;
  createdAt: string;
  notes?: string;
}

export interface StaffPermissions {
  canEditOrders: boolean;        // تعديل تفاصيل وأسعار الطلبات
  canDeleteOrders: boolean;      // حذف الطلبات
  canChangeOrderStatus: boolean; // تغيير حالة الطلب (انتظار، تجهيز، تسليم)
  canManageMaterials: boolean;   // إضافة وتعديل وحذف المواد الخام والمخزون
  canManageServices: boolean;    // إضافة وتعديل وحذف الخدمات والمنتجات
  canManageExpenses: boolean;    // تعديل وحذف المصروفات
  canManageWaste: boolean;       // تعديل وحذف سجلات التالف
  canManageShifts: boolean;      // فتح وإغلاق وتعديل الورديات والصندوق
  canManageStores: boolean;      // إضافة وتعديل الفروع
}

export const DEFAULT_WORKER_PERMISSIONS: StaffPermissions = {
  canEditOrders: true,
  canDeleteOrders: true,
  canChangeOrderStatus: true,
  canManageMaterials: true,
  canManageServices: true,
  canManageExpenses: true,
  canManageWaste: true,
  canManageShifts: true,
  canManageStores: true,
};

export function checkStaffPermission(
  staff: Staff | undefined | null,
  permission: keyof StaffPermissions
): boolean {
  if (!staff) return false;
  if (staff.role === 'manager') return true;
  if (staff.permissions && typeof staff.permissions[permission] === 'boolean') {
    return Boolean(staff.permissions[permission]);
  }
  return Boolean(DEFAULT_WORKER_PERMISSIONS[permission]);
}

export interface Staff {
  id: string;
  name: string;
  role: 'manager' | 'worker'; // عمال ومدير
  password?: string; // كلمة سر العامل أو المدير
  permissions?: Partial<StaffPermissions>; // صلاحيات مخصصة للعناصر
  storeId?: string; // معرف المتجر التابع له (store_sidiamer أو store_labhour)
  storeName?: string; // اسم المتجر التابع له (fotop sidiamer أو fotop labhour)
  assignedStores?: string[]; // للمدير فؤاد: صلاحية الوصول لكلا المتجرين ['store_sidiamer', 'store_labhour']
  workSchedule?: string; // مواقيت العمل (مثلاً 08:30 - 17:00)
  shiftStartTime?: string; // وقت بداية الدوام (مثلاً 08:30)
  shiftEndTime?: string; // وقت نهاية الدوام (مثلاً 17:00)
  workingDays?: string[]; // أيام العمل في الأسبوع
  hourlyRate?: number; // الأجر بالساعة بالدينار (مثلاً 250 دج/ساعة)
  dailyRate?: number; // الأجر باليوم (اليومية بالدينار مثلاً 2000 دج/يوم)
  monthlySalaryBase?: number; // الراتب الأساسي الشهري (مثلاً 45000 دج/شهر)
  overtimeHourlyRate?: number; // أجر الساعة الإضافية
  phone: string;
  avatar: string;
  active: boolean;
}

export interface AttendanceRecord {
  id: string;
  storeId?: string;
  storeName?: string;
  staffId: string;
  staffName: string;
  clockIn: string; // ISO
  clockOut?: string; // ISO
  date: string; // YYYY-MM-DD
  status: 'clocked_in' | 'clocked_out';
  totalMinutes?: number;
  hourlyRateApplied?: number; // أجر الساعة عند التسجيل
  earnedPay?: number; // المستحق المالي المحسوب بالدينار
  salesGenerated?: number;
  notes?: string;
}

export interface Shift {
  id: string;
  storeId?: string;
  storeName?: string;
  staffId: string;
  staffName: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  openingCash: number;  // الرصيد الافتتاحي
  cashSales: number;    // مبيعات نقدية
  expenses: number;     // مصاريف نقدية من الدرج
  expectedCash: number; // الرصيد المفترض في الدرج
  actualCash?: number;  // النقد الفعلي عند الإغلاق
  difference?: number;  // الفائض أو العجز (+ أو -)
  notes?: string;
  ordersCount: number;
}

export interface Expense {
  id: string;
  storeId?: string;
  storeName?: string;
  title: string;
  amount: number;
  category: 'materials' | 'maintenance' | 'utilities' | 'tea_coffee' | 'salary' | 'other';
  staffId: string;
  staffName: string;
  createdAt: string;
  notes?: string;
}

export type SalaryPaymentType = 'monthly' | 'daily' | 'advance' | 'bonus' | 'custom';
export type SalaryPaymentMethod = 'cash' | 'baridimob' | 'ccp' | 'bank';

export interface SalaryPayment {
  id: string;
  storeId?: string;
  storeName?: string;
  staffId: string;
  staffName: string;
  paymentType: SalaryPaymentType; // دفع شهري، دفع باليوم (يومية)، تسبيق، مكافأة، مخصص
  periodDate: string; // اليوم المحدد (YYYY-MM-DD) أو الشهر (YYYY-MM)
  paymentDate: string; // تاريخ وساعة تنفيذ الدفع (ISO)
  baseAmount: number; // المبلغ الأساسي المحدد من قبل المدير
  bonusAmount: number; // مكافآت أو علاوات إضافية
  deductionAmount: number; // خصومات أو اقتطاعات
  netPaidAmount: number; // المبلغ الصافي النهائي المدفوع للموظف
  paymentMethod: SalaryPaymentMethod; // نقداً من الصندوق، بريدي موب، CCP، تحويل بنكي
  paidByStaffId: string;
  paidByStaffName: string;
  receiptNumber: string; // رقم وصل الدفع (مثلاً HR-PAY-2026-001)
  notes?: string;
  createdAt: string;
}

// =========================================================================
// 6 INTELLIGENT SYSTEM ALERTS (التنبيهات والرقابة الذكية)
// =========================================================================
export type SystemAlertType = 
  | 'low_stock'            // نقص في المخزون
  | 'cash_discrepancy'     // فرق في الصندوق
  | 'absent_worker'        // عامل غائب
  | 'unusual_expense'      // مصروف غير معتاد
  | 'incomplete_operation' // عملية غير مكتملة
  | 'revenue_drop';        // انخفاض غير طبيعي في المداخيل

export interface SystemAlert {
  id: string;
  type: SystemAlertType;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
  actionTab?: 'inventory' | 'shifts' | 'hr' | 'accounting' | 'orders' | 'pos';
  actionLabel?: string;
}

