export type Currency = 'DZD' | 'SAR' | 'USD' | 'EUR';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'credit';

export type OrderStatus = 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';

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
}

export interface ServiceItem {
  id: string;
  name: string;
  itemType: 'direct_sale' | 'custom_photo_service' | 'standard_service';
  category: 'id_photos' | 'prints' | 'frames' | 'lamination' | 'digital' | 'packages' | 'retail_goods';
  buyCost: number; // سعر الشراء / تكلفة الوحدة المباشرة (للبيع المباشر أو التكلفة الأساسية)
  price: number; // سعر البيع
  currentStock?: number; // للمنتجات والسلع المادية المباعة مباشرة
  minThreshold?: number;
  description: string;
  imageIcon: string;
  bom: BOMItem[]; // Raw materials consumed
  photoConfig?: PhotoLinkConfig; // إعدادات الربط الآلي بين الورق والحبر والصور
  estimatedLaborMinutes: number;
  popular?: boolean;
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

export interface Staff {
  id: string;
  name: string;
  role: 'manager' | 'worker'; // عمال ومدير
  password?: string; // كلمة سر العامل أو المدير
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

