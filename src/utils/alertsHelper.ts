import { Material, ServiceItem, Shift, Staff, Expense, Order, AttendanceRecord } from '../types';
import { TabType } from '../components/Navigation';

export type AlertType = 
  | 'low_stock'              // 1. نقص في المخزون
  | 'cash_discrepancy'       // 2. فرق في الصندوق
  | 'absent_worker'          // 3. عامل غائب
  | 'unusual_expense'        // 4. مصروف غير معتاد
  | 'incomplete_order'       // 5. عملية غير مكتملة
  | 'abnormal_revenue_drop'; // 6. انخفاض غير طبيعي في المداخيل

export interface StudioAlert {
  id: string;
  type: AlertType;
  typeLabel: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp?: string;
  actionTab: TabType;
  actionLabel: string;
  value?: string | number;
}

export interface AlertFilterCategory {
  id: 'all' | AlertType;
  label: string;
  iconName: string;
  count: number;
}

/**
 * Calculates active alerts across the 6 official studio operational domains.
 */
export function computeStudioAlerts({
  materials = [],
  services = [],
  shifts = [],
  allStaff = [],
  expenses = [],
  orders = [],
  attendanceLogs = [],
  effectiveStoreId = 'all'
}: {
  materials?: Material[];
  services?: ServiceItem[];
  shifts?: Shift[];
  allStaff?: Staff[];
  expenses?: Expense[];
  orders?: Order[];
  attendanceLogs?: AttendanceRecord[];
  effectiveStoreId?: string;
}): StudioAlert[] {
  const alerts: StudioAlert[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentHour = now.getHours();

  // Filter items matching effective store if store-isolated
  const matchStore = (storeId?: string) => {
    if (!storeId || effectiveStoreId === 'all') return true;
    return storeId === effectiveStoreId;
  };

  // 1. نقص في المخزون (Low Stock)
  const lowMaterials = materials.filter(m => matchStore(m.storeId) && m.currentStock <= m.minThreshold);
  lowMaterials.forEach(m => {
    alerts.push({
      id: `alert_stock_mat_${m.id}`,
      type: 'low_stock',
      typeLabel: 'نقص في المخزون',
      title: `مادة خام منخفضة: ${m.name}`,
      description: `الرصيد المتبقي ${m.currentStock} ${m.unit === 'sheet' ? 'ورقة' : m.unit === 'ml' ? 'ملل' : 'قطعة'} (حد الأمان المطلوب: ${m.minThreshold}). يرجى إعادة التموين.`,
      severity: m.currentStock <= 0 ? 'critical' : 'warning',
      actionTab: 'inventory',
      actionLabel: 'تموين المادة',
      value: m.currentStock
    });
  });

  const lowProducts = services.filter(s => matchStore(s.storeId) && s.itemType === 'direct_sale' && typeof s.currentStock === 'number' && s.currentStock <= (s.minThreshold || 3));
  lowProducts.forEach(s => {
    alerts.push({
      id: `alert_stock_prod_${s.id}`,
      type: 'low_stock',
      typeLabel: 'نقص في المخزون',
      title: `سلعة أوشكت على النفاد: ${s.name}`,
      description: `الرصيد الحالي بالمحل: ${s.currentStock} قطعة فقط (حد الأمان: ${s.minThreshold || 3}).`,
      severity: (s.currentStock || 0) <= 0 ? 'critical' : 'warning',
      actionTab: 'inventory',
      actionLabel: 'إدارة المخزون',
      value: s.currentStock
    });
  });

  // 2. فرق في الصندوق (Cash register discrepancy)
  const relevantShifts = shifts.filter(s => matchStore(s.storeId));
  relevantShifts.forEach(s => {
    if (s.difference !== undefined && s.difference !== 0) {
      const isDeficit = s.difference < 0;
      alerts.push({
        id: `alert_shift_diff_${s.id}`,
        type: 'cash_discrepancy',
        typeLabel: 'فرق في الصندوق',
        title: `فرق نقدي في وردية ${s.staffName}`,
        description: `يوجد ${isDeficit ? 'عجز' : 'فائض'} بقيمة ${Math.abs(s.difference)} دج (المفترض: ${s.expectedCash} دج، الفعلي: ${s.actualCash ?? 'غير مسجل'} دج).`,
        severity: 'critical',
        actionTab: 'shifts',
        actionLabel: 'مراجعة الصندوق',
        value: s.difference
      });
    }
  });

  // 3. عامل غائب (Absent worker)
  // Check workers scheduled to work today who haven't clocked in after 10:00 AM
  const workers = allStaff.filter(st => st.role === 'worker' && st.active !== false && matchStore(st.storeId));
  if (currentHour >= 10) {
    workers.forEach(w => {
      const hasClockedInToday = attendanceLogs.some(a => a.staffId === w.id && a.date === todayStr);
      if (!hasClockedInToday) {
        alerts.push({
          id: `alert_absent_${w.id}_${todayStr}`,
          type: 'absent_worker',
          typeLabel: 'عامل غائب',
          title: `غياب العامل: ${w.name}`,
          description: `العامل لم يسجل دخوله أو حضوره لدوام اليوم (${w.workSchedule || 'دوام قياسي'}).`,
          severity: 'warning',
          actionTab: 'hr',
          actionLabel: 'سجل الحضور',
          value: w.name
        });
      }
    });
  }

  // 4. مصروف غير معتاد (Unusual / Abnormal Expense)
  const recentExpenses = expenses.filter(e => matchStore(e.storeId));
  // Calculate average expense in the studio
  const totalExp = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExp = recentExpenses.length > 0 ? totalExp / recentExpenses.length : 1000;
  // An expense is flagged as unusual if > 5,000 DZD or > 3x average
  const threshold = Math.max(5000, avgExp * 3);

  recentExpenses.forEach(e => {
    const isToday = e.createdAt && e.createdAt.startsWith(todayStr);
    if (e.amount >= threshold && isToday) {
      alerts.push({
        id: `alert_unusual_exp_${e.id}`,
        type: 'unusual_expense',
        typeLabel: 'مصروف غير معتاد',
        title: `مصروف مرتفع غير معتاد: ${e.title}`,
        description: `تم تسجيل مصروف استثنائي بمبلغ ${e.amount} دج بواسطة ${e.staffName} (يتجاوز سقف ${threshold.toFixed(0)} دج).`,
        severity: 'warning',
        actionTab: 'accounting',
        actionLabel: 'فحص المصروفات',
        value: e.amount
      });
    }
  });

  // 5. عملية غير مكتملة (Incomplete Order)
  const storeOrders = orders.filter(o => matchStore(o.storeId));
  storeOrders.forEach(o => {
    if (o.status === 'pending' || o.status === 'processing') {
      const orderTime = new Date(o.createdAt).getTime();
      const diffHours = (now.getTime() - orderTime) / (1000 * 60 * 60);
      // If order is pending/processing for more than 4 hours
      if (diffHours >= 4) {
        alerts.push({
          id: `alert_incomplete_order_${o.id}`,
          type: 'incomplete_order',
          typeLabel: 'عملية غير مكتملة',
          title: `طلب معلق لم يكتمل: ${o.ticketNumber}`,
          description: `طلب الزبون (${o.customerName}) قيد الانتظار منذ ${Math.round(diffHours)} ساعات بإجمالي ${o.total} دج دون تسليم.`,
          severity: diffHours >= 12 ? 'critical' : 'warning',
          actionTab: 'orders',
          actionLabel: 'متابعة الطلب',
          value: o.ticketNumber
        });
      }
    }
  });

  // 6. انخفاض غير طبيعي في المداخيل (Abnormal Revenue Drop)
  // If active shift is open for more than 3 hours with 0 or abnormally low sales (< 1,000 DZD)
  const activeShift = shifts.find(s => s.status === 'open' && matchStore(s.storeId));
  if (activeShift) {
    const shiftStart = new Date(activeShift.startTime).getTime();
    const hoursOpen = (now.getTime() - shiftStart) / (1000 * 60 * 60);
    if (hoursOpen >= 3 && activeShift.cashSales < 1000) {
      alerts.push({
        id: `alert_rev_drop_shift_${activeShift.id}`,
        type: 'abnormal_revenue_drop',
        typeLabel: 'انخفاض في المداخيل',
        title: `حركة مبيعات منخفضة في الصندوق`,
        description: `الوردية مفتوحة منذ ${hoursOpen.toFixed(1)} ساعات ولم تسجل سوى ${activeShift.cashSales} دج من المبيعات.`,
        severity: 'info',
        actionTab: 'dashboard',
        actionLabel: 'تحليل المبيعات',
        value: activeShift.cashSales
      });
    }
  }

  return alerts;
}
