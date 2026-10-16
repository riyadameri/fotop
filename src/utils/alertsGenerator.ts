import { Material, ServiceItem, Shift, Staff, AttendanceRecord, Expense, Order, SystemAlert } from '../types';
import { formatCurrency, formatNumber } from './formatters';

export interface AlertsSummary {
  alerts: SystemAlert[];
  counts: {
    total: number;
    low_stock: number;
    cash_discrepancy: number;
    absent_worker: number;
    unusual_expense: number;
    incomplete_operation: number;
    revenue_drop: number;
  };
}

export function generateSystemAlerts({
  materials = [],
  services = [],
  shifts = [],
  allStaff = [],
  attendanceLogs = [],
  expenses = [],
  orders = [],
}: {
  materials?: Material[];
  services?: ServiceItem[];
  shifts?: Shift[];
  allStaff?: Staff[];
  attendanceLogs?: AttendanceRecord[];
  expenses?: Expense[];
  orders?: Order[];
}): AlertsSummary {
  const alerts: SystemAlert[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentHour = now.getHours();

  // 1. نقص في المخزون (Low Stock: Materials + Direct Sale Products)
  for (const mat of materials) {
    if (mat.currentStock <= mat.minThreshold) {
      const isZero = mat.currentStock <= 0;
      const unitLabel = mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'وحدة';
      alerts.push({
        id: `alert_stock_mat_${mat.id}`,
        type: 'low_stock',
        title: isZero ? `نفاد مادة: ${mat.name}` : `نقص حرج في المخزون: ${mat.name}`,
        description: `الرصيد المتبقي ${formatNumber(mat.currentStock)} ${unitLabel} فقط (حد الأمان الأدنى: ${mat.minThreshold} ${unitLabel}). يرجى تزويد المخزن فوراً.`,
        severity: isZero ? 'critical' : 'warning',
        timestamp: new Date().toISOString(),
        entityId: mat.id,
        entityName: mat.name,
        actionTab: 'inventory',
        actionLabel: 'تزويد المادة',
      });
    }
  }

  for (const s of services) {
    if (s.itemType === 'direct_sale' && typeof s.currentStock === 'number') {
      const threshold = s.minThreshold || 3;
      if (s.currentStock <= threshold) {
        const isZero = s.currentStock <= 0;
        alerts.push({
          id: `alert_stock_srv_${s.id}`,
          type: 'low_stock',
          title: isZero ? `نفاد سلعة: ${s.name}` : `نقص سلعة بالمحل: ${s.name}`,
          description: `المتبقي في المحل ${s.currentStock} قطع فقط (حد الأمان: ${threshold}).`,
          severity: isZero ? 'critical' : 'warning',
          timestamp: new Date().toISOString(),
          entityId: s.id,
          entityName: s.name,
          actionTab: 'inventory',
          actionLabel: 'إعادة تعبئة السلعة',
        });
      }
    }
  }

  // 2. فرق في الصندوق (Cash Drawer Discrepancy / Difference)
  for (const shift of shifts) {
    if (shift.difference !== undefined && shift.difference !== 0) {
      const isShortage = shift.difference < 0;
      alerts.push({
        id: `alert_diff_shift_${shift.id}`,
        type: 'cash_discrepancy',
        title: isShortage ? `عجز في الصندوق: ${formatCurrency(Math.abs(shift.difference))}` : `فائض في الصندوق: +${formatCurrency(shift.difference)}`,
        description: `وردية ${shift.staffName}: المتوقع في الدرج ${formatCurrency(shift.expectedCash)} بينما الفعلي ${formatCurrency(shift.actualCash || 0)} (فارق ${formatCurrency(shift.difference)}).`,
        severity: isShortage ? 'critical' : 'warning',
        timestamp: shift.endTime || shift.startTime,
        entityId: shift.id,
        entityName: shift.staffName,
        actionTab: 'shifts',
        actionLabel: 'فحص الوردية',
      });
    }
  }

  // 3. عامل غائب (Absent Worker: scheduled or registered workers not clocked in today)
  const todayClockedStaffIds = new Set(
    attendanceLogs.filter(a => a.date === todayStr).map(a => a.staffId)
  );

  // If after morning start time (e.g. after 9:30 AM), check active workers who have not clocked in
  if (currentHour >= 9) {
    const workers = allStaff.filter(s => s.role !== 'manager' && s.active !== false);
    for (const w of workers) {
      if (!todayClockedStaffIds.has(w.id)) {
        alerts.push({
          id: `alert_absent_${w.id}_${todayStr}`,
          type: 'absent_worker',
          title: `عامل غائب: ${w.name}`,
          description: `لم يقم بتسجيل الحضور وبداية الدوام اليوم (${w.workSchedule || 'دوام قياسي'}).`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          entityId: w.id,
          entityName: w.name,
          actionTab: 'hr',
          actionLabel: 'متابعة سجل الحضور',
        });
      }
    }
  }

  // 4. مصروف غير معتاد (Unusual Expense: high amount or abnormal expense)
  const UNUSUAL_EXPENSE_THRESHOLD = 5000; // 5,000 DZD
  for (const exp of expenses) {
    if (exp.amount >= UNUSUAL_EXPENSE_THRESHOLD) {
      alerts.push({
        id: `alert_expense_${exp.id}`,
        type: 'unusual_expense',
        title: `مصروف مرتفع / غير معتاد: ${formatCurrency(exp.amount)}`,
        description: `بيان: "${exp.title}" مسجل بواسطة ${exp.staffName}. المبلغ يتجاوز سقف المصروفات النثرية المعتادة.`,
        severity: exp.amount >= 15000 ? 'critical' : 'warning',
        timestamp: exp.createdAt,
        entityId: exp.id,
        entityName: exp.title,
        actionTab: 'accounting',
        actionLabel: 'مراجعة المصروف',
      });
    }
  }

  // 5. عملية غير مكتملة (Incomplete Operation: pending, processing, or unpaid balance)
  for (const order of orders) {
    const isUnfinished = order.status === 'pending' || order.status === 'processing';
    const isUnderpaid = order.paidAmount < order.total;
    if (isUnfinished || isUnderpaid) {
      const remaining = Math.max(0, order.total - order.paidAmount);
      alerts.push({
        id: `alert_order_${order.id}`,
        type: 'incomplete_operation',
        title: isUnderpaid && isUnfinished 
          ? `معاملة غير مكتملة: تذكرة #${order.ticketNumber} (${order.customerName})`
          : isUnfinished 
          ? `طلب قيد التجهيز: تذكرة #${order.ticketNumber}` 
          : `مبلغ غير مكتمل: تذكرة #${order.ticketNumber}`,
        description: isUnderpaid 
          ? `متبقي للدفع ${formatCurrency(remaining)} (المسجل: ${order.staffName} ─ الحالة: ${order.status === 'delivered' ? 'مستلم بدون اكتمال الدفع' : 'قيد الانتظار'}).`
          : `طلب للزبون ${order.customerName} لم يتم تسليمه بعد (منفذ بواسطة ${order.staffName}).`,
        severity: isUnderpaid ? 'warning' : 'info',
        timestamp: order.createdAt,
        entityId: order.id,
        entityName: order.ticketNumber,
        actionTab: 'orders',
        actionLabel: 'فتح المعاملة',
      });
    }
  }

  // 6. انخفاض غير طبيعي في المداخيل (Abnormal Revenue Drop)
  // Calculate average daily revenue from past 7 days (excluding today)
  const pastDaysRevenue: number[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dStr = d.toISOString().split('T')[0];
    const dayTotal = orders
      .filter(o => o.createdAt && o.createdAt.startsWith(dStr))
      .reduce((sum, o) => sum + o.total, 0);
    if (dayTotal > 0) pastDaysRevenue.push(dayTotal);
  }

  const todayRevenue = orders
    .filter(o => o.createdAt && o.createdAt.startsWith(todayStr))
    .reduce((sum, o) => sum + o.total, 0);

  if (pastDaysRevenue.length >= 2 && currentHour >= 14) {
    const avgDailyRevenue = pastDaysRevenue.reduce((a, b) => a + b, 0) / pastDaysRevenue.length;
    // If today's revenue is less than 35% of the average daily revenue during afternoon/evening
    if (todayRevenue < avgDailyRevenue * 0.35) {
      alerts.push({
        id: `alert_rev_drop_${todayStr}`,
        type: 'revenue_drop',
        title: 'تنبيه: انخفاض غير طبيعي في المداخيل اليومية',
        description: `إجمالي مداخيل اليوم حتى الآن ${formatCurrency(todayRevenue)} وهو أقل بكثير من المتوسط اليومي المعتاد (${formatCurrency(Math.round(avgDailyRevenue))}). يرجى مراجعة نشاط الاستوديو والورديات.`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
        actionTab: 'accounting',
        actionLabel: 'تقرير التدفق المالي',
      });
    }
  }

  // Counts by type
  const counts = {
    total: alerts.length,
    low_stock: alerts.filter(a => a.type === 'low_stock').length,
    cash_discrepancy: alerts.filter(a => a.type === 'cash_discrepancy').length,
    absent_worker: alerts.filter(a => a.type === 'absent_worker').length,
    unusual_expense: alerts.filter(a => a.type === 'unusual_expense').length,
    incomplete_operation: alerts.filter(a => a.type === 'incomplete_operation').length,
    revenue_drop: alerts.filter(a => a.type === 'revenue_drop').length,
  };

  return { alerts, counts };
}
