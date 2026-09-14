import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign, 
  Layers, 
  AlertOctagon, 
  Plus, 
  Calendar, 
  FileSpreadsheet, 
  PieChart as PieIcon,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Clock,
  KeyRound,
  ShieldCheck,
  Lock,
  UserCheck,
  CheckCircle2,
  Filter,
  UserPlus,
  Edit2,
  Trash2,
  Download,
  Receipt,
  Timer,
  Activity,
  Award,
  Zap,
  Calculator,
  Printer
} from 'lucide-react';
import { StaffPerformanceDashboard, getOrderTurnaroundMinutes } from './StaffPerformanceDashboard';
import { PayrollCalculator } from './PayrollCalculator';
import { ProfitBreakdownView } from './ProfitBreakdownView';
import { AccountingReportPDFModal } from './AccountingReportPDFModal';
import { HumanResourcesView } from '../HR/HumanResourcesView';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Order, Material, WasteRecord, Expense, Staff, Shift, AttendanceRecord, SalaryPayment, Store } from '../../types';
import { formatCurrency, formatDate, formatTime, exportToCSV, getItemUnitCost } from '../../utils/formatters';

interface AccountingViewProps {
  orders: Order[];
  materials: Material[];
  wasteRecords: WasteRecord[];
  expenses: Expense[];
  shifts: Shift[];
  currentStaff: Staff;
  allStaff?: Staff[];
  attendanceLogs?: AttendanceRecord[];
  salaryPayments?: SalaryPayment[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onAddStaff?: (newStaff: Staff) => void;
  onUpdateStaff?: (updated: Staff) => void;
  onDeleteStaff?: (staffId: string) => void;
  onAddManualAttendance?: (record: Partial<AttendanceRecord>) => void;
  onDeleteAttendance?: (id: string) => void;
  onAddSalaryPayment?: (payment: Partial<SalaryPayment> & { recordAsStudioExpense?: boolean }) => Promise<void>;
  onUpdateSalaryPayment?: (id: string, payment: Partial<SalaryPayment>) => Promise<void>;
  onDeleteSalaryPayment?: (id: string) => Promise<void>;
  currentStoreId?: string;
  stores?: Store[];
}

const getOrderTotalCost = (o: Order, mats: Material[] = []): number => {
  if (typeof o.totalBOMCost === 'number' && o.totalBOMCost > 0) {
    return o.totalBOMCost;
  }
  if (o.materialsDeducted && o.materialsDeducted.length > 0) {
    const sum = o.materialsDeducted.reduce((acc, m) => acc + (m.cost || 0), 0);
    if (sum > 0) return sum;
  }
  if (o.items && o.items.length > 0) {
    return o.items.reduce((acc, it) => {
      const unitCost = getItemUnitCost(it.service, mats);
      return acc + (unitCost * it.quantity);
    }, 0);
  }
  return 0;
};

export const AccountingView: React.FC<AccountingViewProps> = ({
  orders = [],
  materials = [],
  wasteRecords = [],
  expenses = [],
  shifts = [],
  currentStaff,
  allStaff = [],
  attendanceLogs = [],
  salaryPayments = [],
  onAddExpense,
  onAddStaff,
  onUpdateStaff = (_updated: Staff) => {},
  onDeleteStaff,
  onAddManualAttendance,
  onDeleteAttendance,
  onAddSalaryPayment = async () => {},
  onUpdateSalaryPayment = async () => {},
  onDeleteSalaryPayment = async () => {},
  currentStoreId,
  stores = [],
}) => {
  const isManager = currentStaff.role === 'manager';

  // Manager sub-tabs
  const [managerTab, setManagerTab] = useState<'financial' | 'profit_breakdown' | 'payroll' | 'performance' | 'workers' | 'attendance' | 'expenses'>('financial');

  // Filter states
  const [periodPreset, setPeriodPreset] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('all');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customStartTime, setCustomStartTime] = useState<string>('00:00');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [customEndTime, setCustomEndTime] = useState<string>('23:59');

  // Modal states
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [showPDFReportModal, setShowPDFReportModal] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // New Expense form state
  const [expenseTitle, setExpenseTitle] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('materials');
  const [expenseNotes, setExpenseNotes] = useState<string>('');

  // New Staff form state (With rich Work Schedule, Store assignment & Hourly Rate Builder)
  const defaultWorkerStore = (currentStoreId && currentStoreId !== 'all') ? currentStoreId : 'store_sidiamer';
  const [newWorkerStoreId, setNewWorkerStoreId] = useState<string>(defaultWorkerStore);
  const [newWorkerName, setNewWorkerName] = useState<string>('');
  const [newWorkerPhone, setNewWorkerPhone] = useState<string>('');
  const [newWorkerHourlyRate, setNewWorkerHourlyRate] = useState<string>('250');
  const [newWorkerShiftStart, setNewWorkerShiftStart] = useState<string>('08:30');
  const [newWorkerShiftEnd, setNewWorkerShiftEnd] = useState<string>('17:00');
  const [newWorkerDays, setNewWorkerDays] = useState<string[]>([
    'السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'
  ]);
  const [newWorkerSchedulePreset, setNewWorkerSchedulePreset] = useState<string>('full_time');
  const [newWorkerPassword, setNewWorkerPassword] = useState<string>('123');

  // Sync newWorkerStoreId with currentStoreId
  React.useEffect(() => {
    if (currentStoreId && currentStoreId !== 'all') {
      setNewWorkerStoreId(currentStoreId);
    }
  }, [currentStoreId]);

  // Date filters helper
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Helper to test if a record date matches the selected period
  const matchesDateRange = (isoString: string) => {
    const recordDate = new Date(isoString);
    if (periodPreset === 'today') {
      return isoString.startsWith(todayStr);
    }
    if (periodPreset === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return recordDate >= oneWeekAgo;
    }
    if (periodPreset === 'month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return recordDate >= oneMonthAgo;
    }
    if (periodPreset === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      const start = customStartDate ? new Date(`${customStartDate}T${customStartTime}:00`) : new Date(0);
      const end = customEndDate ? new Date(`${customEndDate}T${customEndTime}:59`) : new Date(8640000000000000);
      return recordDate >= start && recordDate <= end;
    }
    return true; // 'all'
  };

  // Filtered Orders for the manager
  const filteredOrders = useMemo(() => {
    return (orders || []).filter(o => {
      const matchesDate = matchesDateRange(o.createdAt);
      const matchesWorker = selectedStaffFilter === 'all' || o.staffId === selectedStaffFilter;
      return matchesDate && matchesWorker;
    });
  }, [orders, periodPreset, selectedStaffFilter, customStartDate, customStartTime, customEndDate, customEndTime]);

  // Worker-specific today's data (For worker view)
  const workerTodayOrders = useMemo(() => {
    return (orders || []).filter(o => o.staffId === currentStaff.id && o.createdAt.startsWith(todayStr));
  }, [orders, currentStaff.id, todayStr]);

  const workerTodayRevenue = useMemo(() => {
    return workerTodayOrders.reduce((sum, o) => sum + o.total, 0);
  }, [workerTodayOrders]);

  const workerTodayBOMCost = useMemo(() => {
    return workerTodayOrders.reduce((sum, o) => {
      return sum + getOrderTotalCost(o, materials);
    }, 0);
  }, [workerTodayOrders, materials]);

  const workerTodayNetProfit = useMemo(() => {
    return Math.max(0, workerTodayRevenue - workerTodayBOMCost);
  }, [workerTodayRevenue, workerTodayBOMCost]);

  // Manager Financial calculations (Aggregated)
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.total, 0);
  }, [filteredOrders]);

  const totalBOMCost = useMemo(() => {
    return filteredOrders.reduce((sum, o) => {
      return sum + getOrderTotalCost(o, materials);
    }, 0);
  }, [filteredOrders, materials]);

  const filteredWaste = useMemo(() => {
    return (wasteRecords || []).filter(w => {
      const matchesDate = matchesDateRange(w.createdAt);
      const matchesWorker = selectedStaffFilter === 'all' || w.staffId === selectedStaffFilter;
      return matchesDate && matchesWorker;
    });
  }, [wasteRecords, periodPreset, selectedStaffFilter, customStartDate, customEndDate]);

  const totalWasteLoss = useMemo(() => {
    return filteredWaste.reduce((sum, w) => sum + w.costLoss, 0);
  }, [filteredWaste]);

  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter(e => {
      const matchesDate = matchesDateRange(e.createdAt);
      const matchesWorker = selectedStaffFilter === 'all' || e.staffId === selectedStaffFilter;
      return matchesDate && matchesWorker;
    });
  }, [expenses, periodPreset, selectedStaffFilter, customStartDate, customEndDate]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Net Profit Formula: Revenue - BOM - Waste - Expenses
  const netProfit = useMemo(() => {
    return totalRevenue - totalBOMCost - totalWasteLoss - totalExpenses;
  }, [totalRevenue, totalBOMCost, totalWasteLoss, totalExpenses]);

  const profitMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Automated Today's Net Profit Calculations (Deducting BOM Materials + Expenses)
  const todayMetrics = useMemo(() => {
    const tOrders = (orders || []).filter(o => o.createdAt.startsWith(todayStr));
    const gross = tOrders.reduce((sum, o) => sum + o.total, 0);
    const bom = tOrders.reduce((sum, o) => sum + getOrderTotalCost(o, materials), 0);
    const exp = (expenses || []).filter(e => e.createdAt.startsWith(todayStr)).reduce((sum, e) => sum + e.amount, 0);
    const wst = (wasteRecords || []).filter(w => w.createdAt.startsWith(todayStr)).reduce((sum, w) => sum + w.costLoss, 0);
    const net = gross - bom - exp - wst;
    const margin = gross > 0 ? Math.round((net / gross) * 100) : 0;
    return { count: tOrders.length, gross, bom, exp, wst, net, margin };
  }, [orders, materials, expenses, wasteRecords, todayStr]);

  // Automated This Month's Net Profit Calculations (Deducting BOM Materials + Expenses)
  const currentMonthStr = todayStr.substring(0, 7);
  const monthMetrics = useMemo(() => {
    const mOrders = (orders || []).filter(o => o.createdAt.startsWith(currentMonthStr));
    const gross = mOrders.reduce((sum, o) => sum + o.total, 0);
    const bom = mOrders.reduce((sum, o) => sum + getOrderTotalCost(o, materials), 0);
    const exp = (expenses || []).filter(e => e.createdAt.startsWith(currentMonthStr)).reduce((sum, e) => sum + e.amount, 0);
    const wst = (wasteRecords || []).filter(w => w.createdAt.startsWith(currentMonthStr)).reduce((sum, w) => sum + w.costLoss, 0);
    const net = gross - bom - exp - wst;
    const margin = gross > 0 ? Math.round((net / gross) * 100) : 0;
    return { count: mOrders.length, gross, bom, exp, wst, net, margin };
  }, [orders, materials, expenses, wasteRecords, currentMonthStr]);

  // Breakdown per Worker (Income and Net Profit per Worker)
  const staffFinancialSummary = useMemo(() => {
    const map: Record<string, {
      staff: Staff;
      ordersCount: number;
      revenue: number;
      bomCost: number;
      wasteCost: number;
      netProfit: number;
      durations: number[];
      avgCompletionMinutes: number;
    }> = {};

    // Initialize map with all staff
    for (const st of (allStaff || [])) {
      map[st.id] = {
        staff: st,
        ordersCount: 0,
        revenue: 0,
        bomCost: 0,
        wasteCost: 0,
        netProfit: 0,
        durations: [],
        avgCompletionMinutes: 0
      };
    }

    // Tally orders within selected timeframe
    for (const o of (orders || []).filter(ord => matchesDateRange(ord.createdAt))) {
      if (!map[o.staffId]) {
        map[o.staffId] = {
          staff: { id: o.staffId, name: o.staffName, role: 'worker', phone: '', avatar: '👤', active: true },
          ordersCount: 0,
          revenue: 0,
          bomCost: 0,
          wasteCost: 0,
          netProfit: 0,
          durations: [],
          avgCompletionMinutes: 0
        };
      }
      map[o.staffId].ordersCount += 1;
      map[o.staffId].revenue += o.total;
      const orderBOM = getOrderTotalCost(o, materials);
      map[o.staffId].bomCost += orderBOM;
      map[o.staffId].durations.push(getOrderTurnaroundMinutes(o));
    }

    // Tally waste
    for (const w of filteredWaste) {
      if (map[w.staffId]) {
        map[w.staffId].wasteCost += w.costLoss;
      }
    }

    // Calculate net profit & avg completion time
    for (const id in map) {
      map[id].netProfit = map[id].revenue - map[id].bomCost - map[id].wasteCost;
      const durs = map[id].durations;
      map[id].avgCompletionMinutes = durs.length > 0
        ? Number((durs.reduce((a, b) => a + b, 0) / durs.length).toFixed(1))
        : 0;
    }

    return Object.values(map);
  }, [allStaff, orders, materials, filteredWaste, periodPreset, customStartDate, customEndDate]);

  // Chart: Financial Summary Bar
  const financialSummaryData = [
    { name: 'إجمالي المبيعات', amount: totalRevenue, fill: '#292A34' },
    { name: 'تكلفة المواد (BOM)', amount: totalBOMCost, fill: '#E31C2B' },
    { name: 'خسائر التالف', amount: totalWasteLoss, fill: '#f97316' },
    { name: 'المصروفات النثرية', amount: totalExpenses, fill: '#64748b' },
    { name: 'صافي الربح الفعلي', amount: Math.max(0, netProfit), fill: '#10b981' }
  ];

  // Chart: Category Breakdown
  const categoryRevenueData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of filteredOrders) {
      for (const item of o.items) {
        const cat = item.service.category;
        const catName = 
          cat === 'id_photos' ? 'صور شمسية وهوية' :
          cat === 'prints' ? 'طباعة وتكبير' :
          cat === 'frames' ? 'إطارات وبراويز' :
          cat === 'lamination' ? 'تغليف حراري' :
          cat === 'digital' ? 'خدمات رقمية' : 
          cat === 'retail_goods' ? 'سلع بيع مباشر' : 'جلسات استوديو';
        const itemRev = (item.customPrice ?? item.service.price) * item.quantity;
        map[catName] = (map[catName] || 0) + itemRev;
      }
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const PIE_COLORS = ['#E31C2B', '#292A34', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Handle Create Worker
  const handleCreateWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim() || !onAddStaff) return;

    const formattedSchedule = `${newWorkerShiftStart} - ${newWorkerShiftEnd} (${newWorkerDays.length === 7 ? 'طوال أيام الأسبوع' : newWorkerDays.join('، ')})`;
    const targetStoreId = newWorkerStoreId || ((currentStoreId && currentStoreId !== 'all') ? currentStoreId : 'store_sidiamer');
    const targetStoreName = targetStoreId === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer';

    onAddStaff({
      id: `staff_${Date.now()}`,
      name: newWorkerName.trim(),
      role: 'worker',
      storeId: targetStoreId,
      storeName: targetStoreName,
      phone: newWorkerPhone.trim() || '05 00000000',
      workSchedule: formattedSchedule,
      shiftStartTime: newWorkerShiftStart,
      shiftEndTime: newWorkerShiftEnd,
      workingDays: newWorkerDays,
      hourlyRate: parseFloat(newWorkerHourlyRate) || 250,
      monthlySalaryBase: (parseFloat(newWorkerHourlyRate) || 250) * 8 * 24,
      password: newWorkerPassword.trim() || '123',
      avatar: '👤',
      active: true
    });

    setShowAddStaffModal(false);
    setNewWorkerName('');
    setNewWorkerPhone('');
    setNewWorkerHourlyRate('250');
    setNewWorkerShiftStart('08:30');
    setNewWorkerShiftEnd('17:00');
    setNewWorkerDays(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']);
    setNewWorkerPassword('123');
  };

  // Handle Edit Worker
  const handleEditWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !onUpdateStaff) return;
    
    // Recalculate workSchedule string if start/end times exist
    let updatedStaff = { ...editingStaff };
    if (updatedStaff.shiftStartTime && updatedStaff.shiftEndTime) {
      const daysStr = updatedStaff.workingDays && updatedStaff.workingDays.length > 0
        ? (updatedStaff.workingDays.length === 7 ? 'طوال أيام الأسبوع' : updatedStaff.workingDays.join('، '))
        : 'السبت إلى الخميس';
      updatedStaff.workSchedule = `${updatedStaff.shiftStartTime} - ${updatedStaff.shiftEndTime} (${daysStr})`;
    }
    if (updatedStaff.storeId) {
      updatedStaff.storeName = updatedStaff.storeId === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer';
    }

    onUpdateStaff(updatedStaff);
    setEditingStaff(null);
  };

  // Handle Create Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;

    onAddExpense({
      title: expenseTitle.trim(),
      amount: Number(expenseAmount),
      category: expenseCategory,
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      notes: expenseNotes.trim()
    });

    setShowExpenseModal(false);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseNotes('');
  };

  // Export Financial Summary to CSV (Manager)
  const handleExportStatement = () => {
    const periodLabel = 
      periodPreset === 'today' ? 'اليوم' :
      periodPreset === 'week' ? 'آخر 7 أيام' :
      periodPreset === 'month' ? 'الشهر الحالي' :
      periodPreset === 'custom' ? `فترة مخصصة (${customStartDate} إلى ${customEndDate})` : 'كامل السجلات';

    const rows = [
      { 'التقرير': `ملخص الحسابات والأرباح - استوديو Fotop (${periodLabel})`, 'القيمة': '' },
      { 'التقرير': '---------------------------------------------------', 'القيمة': '' },
      { 'التقرير': 'إجمالي إيرادات المبيعات (Gross Sales)', 'القيمة': `${formatCurrency(totalRevenue)}` },
      { 'التقرير': 'تكلفة المواد الخام المستهلكة (BOM Costs)', 'القيمة': `-${formatCurrency(totalBOMCost)}` },
      { 'التقرير': 'خسائر وتلف المواد (Waste Loss)', 'القيمة': `-${formatCurrency(totalWasteLoss)}` },
      { 'التقرير': 'المصروفات التشغيلية والنثرية (Petty Expenses)', 'القيمة': `-${formatCurrency(totalExpenses)}` },
      { 'التقرير': 'صافي الأرباح المحققة (Net Studio Profit)', 'القيمة': `+${formatCurrency(netProfit)}` },
      { 'التقرير': 'هامش الربح الصافي %', 'القيمة': `%${profitMarginPercent}` },
      { 'التقرير': '---------------------------------------------------', 'القيمة': '' },
      { 'التقرير': 'دخل وأرباح كل عامل في هذه الفترة:', 'القيمة': '' }
    ];

    staffFinancialSummary.forEach(st => {
      rows.push({
        'التقرير': `العامل: ${st.staff.name} (${st.staff.workSchedule || 'دوام قياسي'}) ─ طلبات: ${st.ordersCount}`,
        'القيمة': `مبيعات: ${formatCurrency(st.revenue)} | صافي الربح: ${formatCurrency(st.netProfit)}`
      });
    });

    exportToCSV(`Fotop_Financial_Summary_${periodPreset}`, rows);
  };

  // Export Detailed Worker Income Breakdown
  const handleExportWorkerIncomeCSV = () => {
    const rows = staffFinancialSummary.map(st => ({
      'اسم العامل': st.staff.name,
      'مواقيت العمل': st.staff.workSchedule || 'غير محدد',
      'الصفة': st.staff.role === 'manager' ? 'مدير عام (fouad)' : 'عامل استوديو',
      'عدد العمليات المنجزة': st.ordersCount,
      'إجمالي مبيعات العامل (دج)': st.revenue,
      'تكلفة المواد المستهلكة (دج)': st.bomCost,
      'خسائر التالف المسجلة (دج)': st.wasteCost,
      'صافي ربح العامل للاستوديو (دج)': st.netProfit
    }));
    exportToCSV('Fotop_Workers_Income_Profit_Report', rows);
  };

  // =========================================================================
  // VIEW 1: WORKER VIEW (Restricted to daily net profit only)
  // =========================================================================
  if (!isManager) {
    return (
      <div className="space-y-6">
        
        {/* Worker Header Banner */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#292A34] text-white flex items-center justify-center font-black text-xl shadow-md">
              {currentStaff.avatar || '👤'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-[#292A34]">{currentStaff.name}</h2>
                <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  عامل استوديو
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                  currentStaff.storeId === 'store_labhour'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  📍 {currentStaff.storeId === 'store_labhour' ? 'فرع الأبحور (fotop labhour)' : 'فرع سيدي عامر (fotop sidiamer)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                مواقيت دوامك: <strong className="text-[#292A34]">{currentStaff.workSchedule || '08:30 إلى 17:00'}</strong> • تاريخ اليوم: {formatDate(todayStr)}
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>نظام احتساب صافي الربح اليومي التلقائي مفعّل</span>
          </div>
        </div>

        {/* Worker 3 Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Daily Net Profit Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-xs font-bold text-emerald-100">صافي ربحك اليومي المحقق (اليوم)</span>
              <div className="text-3xl font-black mt-2 font-mono tracking-tight">
                +{formatCurrency(workerTodayNetProfit)}
              </div>
              <p className="text-[11px] text-emerald-100 mt-2">
                محسوب تلقائياً (المبيعات ─ تكلفة ورق وحبر الصور والسلع)
              </p>
            </div>
            <div className="absolute -left-3 -bottom-3 text-white/10">
              <TrendingUp className="w-28 h-28" />
            </div>
          </div>

          {/* Daily Gross Sales */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-500">إجمالي مبيعاتك اليومية</span>
            <div className="text-2xl font-black text-[#292A34] mt-2 font-mono">
              {formatCurrency(workerTodayRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-2 font-medium">
              تكلفة المواد المستهلكة: <strong className="text-[#E31C2B] font-mono">{formatCurrency(workerTodayBOMCost)}</strong>
            </div>
          </div>

          {/* Daily Orders Count */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-500">الطلبات المنجزة اليوم</span>
            <div className="text-2xl font-black text-[#292A34] mt-2 font-mono">
              {workerTodayOrders.length} طلبات
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              تم تسليمها للزبائن وتسجيل استهلاكها بالمخزن
            </p>
          </div>

        </div>

        {/* Worker Today Transactions Table */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#292A34]">سجل عملياتك ومبيعاتك اليوم ({formatDate(todayStr)})</h3>
              <p className="text-xs text-slate-500">تفاصيل كل معاملة مع بيان صافي الربح المحقق منها</p>
            </div>
          </div>

          {workerTodayOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-500 space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold">لم تقم بإتمام أي طلبات بيع بعد لهذا اليوم.</p>
              <p className="text-[11px] text-slate-400">ستظهر أرباحك وعملياتك هنا بمجرد إتمام أول عملية بيع من شاشة الكاشير.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-[#292A34] text-white font-bold rounded-xl">
                      <th className="p-3 rounded-r-xl">رقم الإيصال</th>
                      <th className="p-3">الوقت</th>
                      <th className="p-3">الزبون والخدمات</th>
                      <th className="p-3">سعر البيع</th>
                      <th className="p-3">تكلفة المواد</th>
                      <th className="p-3 text-center rounded-l-xl">صافي الربح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {workerTodayOrders.map(o => {
                      const orderBOM = o.materialsDeducted?.reduce((acc, m) => acc + m.cost, 0) || 0;
                      const orderProfit = Math.max(0, o.total - orderBOM);

                      return (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-700">{o.ticketNumber}</td>
                          <td className="p-3 font-mono text-slate-500">{formatTime(o.createdAt)}</td>
                          <td className="p-3 font-bold text-[#292A34]">
                            <div>{o.customerName}</div>
                            <div className="text-[10px] text-slate-500 font-normal">
                              {o.items.map(i => `${i.quantity}x ${i.service.name}`).join('، ')}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-black text-[#292A34]">{formatCurrency(o.total)}</td>
                          <td className="p-3 font-mono text-[#E31C2B] font-bold">-{formatCurrency(orderBOM)}</td>
                          <td className="p-3 text-center font-mono font-black text-emerald-600 bg-emerald-50/50">
                            +{formatCurrency(orderProfit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards (No Horizontal Scroll) */}
              <div className="md:hidden space-y-3">
                {workerTodayOrders.map(o => {
                  const orderBOM = o.materialsDeducted?.reduce((acc, m) => acc + m.cost, 0) || 0;
                  const orderProfit = Math.max(0, o.total - orderBOM);

                  return (
                    <div key={o.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#E31C2B]">{o.ticketNumber}</span>
                          <span className="text-[11px] font-mono text-slate-400">{formatTime(o.createdAt)}</span>
                        </div>
                        <span className="font-mono font-black text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                          صافي: +{formatCurrency(orderProfit)}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-[#292A34]">
                        <div>{o.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {o.items.map(i => `${i.quantity}x ${i.service.name}`).join('، ')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 font-mono text-[11px]">
                          تكلفة: -{formatCurrency(orderBOM)}
                        </span>
                        <span className="font-mono font-black text-sm text-[#292A34]">
                          {formatCurrency(o.total)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Privacy Notice for Worker */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              🔒 ملاحظة: التقارير المالية العامة الشاملة، ملخصات بقية الأيام والشهور، وإدارة الفريق مخصصة للمدير العام (fouad) فقط.
            </span>
          </div>
        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MANAGER (fouad) FULL POWER HUB
  // =========================================================================
  return (
    <div className="space-y-6">
      
      {/* Top Manager Master Bar */}
      <div className="bg-[#292A34] text-white p-5 rounded-2xl shadow-md border-b-2 border-[#E31C2B] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#E31C2B] text-white text-[11px] font-black px-2 py-0.5 rounded-md">
              لوحة تحكم المدير العام fouad
            </span>
            <span className="text-xs text-slate-300 font-medium">| إدارة الحسابات، الأرباح، والعمال</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">المركز المالي وإدارة استوديو Fotop</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            الاطلاع على دخل وصافي ربح كل عامل في كل يوم وكل فترة مع تحميل الملخصات
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPDFReportModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shadow-rose-600/30 cursor-pointer transition-all"
            title="تصدير تقرير الأرباح والمصروفات كـ PDF للطباعة أو الأرشفة"
          >
            <Printer className="w-4 h-4" />
            <span>تصدير كـ PDF (الأرباح والمصاريف)</span>
          </button>

          <button
            onClick={handleExportStatement}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            title="تحميل الملخص المالي الشامل للفترة المحددة"
          >
            <Download className="w-4 h-4" />
            <span>تحميل التقرير المالي (Excel/CSV)</span>
          </button>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-4 py-2 bg-[#E31C2B] hover:bg-[#c91422] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shadow-[#E31C2B]/30 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مصروف</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs for Manager */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setManagerTab('financial')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            managerTab === 'financial'
              ? 'bg-[#292A34] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>التقارير المالية والأرباح العامة</span>
        </button>

        <button
          onClick={() => setManagerTab('profit_breakdown')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            managerTab === 'profit_breakdown'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-50'
          }`}
        >
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span>صافي الأرباح (يومي / شهري)</span>
          <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">آلي BOM</span>
        </button>

        <button
          onClick={() => setManagerTab('payroll')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            managerTab === 'payroll'
              ? 'bg-[#292A34] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>الموارد البشرية والرواتب (HR)</span>
          <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">دفع حر</span>
        </button>

        <button
          onClick={() => setManagerTab('performance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            managerTab === 'performance'
              ? 'bg-[#E31C2B] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>إحصائيات وكفاءة أداء الموظفين</span>
          <span className="bg-amber-400 text-[#292A34] text-[9px] font-black px-1.5 py-0.2 rounded-full">جديد</span>
        </button>

        <button
          onClick={() => setManagerTab('workers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            managerTab === 'workers'
              ? 'bg-[#292A34] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة العمال ومواقيت العمل والـ PIN ({allStaff.length})</span>
        </button>

        <button
          onClick={() => setManagerTab('attendance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            managerTab === 'attendance'
              ? 'bg-[#292A34] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>سجل دوام وحضور العمال ({attendanceLogs.length})</span>
        </button>

        <button
          onClick={() => setManagerTab('expenses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            managerTab === 'expenses'
              ? 'bg-[#292A34] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>المصروفات النثرية ({expenses.length})</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: FINANCIAL OVERVIEW & WORKER INCOME REPORT
      ===================================================================== */}
      {managerTab === 'financial' && (
        <div className="space-y-6">
          
          {/* Universal Dynamic Period & Worker Filter Bar */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              
              {/* Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-[#E31C2B]" />
                  <span>الفترة الزمنية:</span>
                </span>

                <button
                  onClick={() => setPeriodPreset('today')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    periodPreset === 'today' ? 'bg-[#292A34] text-white' : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  اليوم
                </button>

                <button
                  onClick={() => setPeriodPreset('week')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    periodPreset === 'week' ? 'bg-[#292A34] text-white' : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  آخر 7 أيام (الأسبوع)
                </button>

                <button
                  onClick={() => setPeriodPreset('month')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    periodPreset === 'month' ? 'bg-[#292A34] text-white' : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  الشهر الحالي
                </button>

                <button
                  onClick={() => setPeriodPreset('custom')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    periodPreset === 'custom' ? 'bg-[#E31C2B] text-white' : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  توقيت مخصص (من ─ إلى)
                </button>

                <button
                  onClick={() => setPeriodPreset('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    periodPreset === 'all' ? 'bg-[#292A34] text-white' : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  كامل السجلات
                </button>
              </div>

              {/* Worker Filter Dropdown */}
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">العامل:</span>
                <select
                  value={selectedStaffFilter}
                  onChange={(e) => setSelectedStaffFilter(e.target.value)}
                  className="bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B] cursor-pointer"
                >
                  <option value="all">جميع العمال والمدير</option>
                  {allStaff.map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.role === 'manager' ? 'مدير' : 'عامل'})</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Custom Range Inputs (Shown when preset is 'custom') */}
            {periodPreset === 'custom' && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                <div>
                  <label className="text-slate-600 block mb-1 font-bold">من تاريخ:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-bold">من توقيت:</label>
                  <input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-bold">إلى تاريخ:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-bold">إلى توقيت:</label>
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* LIVE NET PROFIT SNAPSHOT: TODAY vs THIS MONTH (AUTO BOM & EXPENSES DEDUCTION) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TODAY'S NET PROFIT WIDGET */}
            <div className="bg-gradient-to-br from-[#292A34] to-[#1c1d24] text-white p-5 rounded-2xl shadow-md border-r-4 border-emerald-500 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>صافي أرباح اليوم ({todayStr})</span>
                  </span>
                  <button
                    onClick={() => setManagerTab('profit_breakdown')}
                    className="text-[11px] font-bold text-emerald-300 hover:text-white flex items-center gap-0.5 cursor-pointer underline underline-offset-4"
                  >
                    <span>تفصيل الحساب الكامل</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-emerald-300">
                    {todayMetrics.net >= 0 ? '+' : ''}{formatCurrency(todayMetrics.net)}
                  </span>
                  <span className="text-xs text-slate-300 font-bold">
                    (هامش الربح: %{todayMetrics.margin})
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 mt-1">
                  معادلة اليوم: <span className="font-mono font-bold text-white">{formatCurrency(todayMetrics.gross)}</span> مبيعات - <span className="font-mono text-rose-300">-{formatCurrency(todayMetrics.bom)}</span> مواد مستهلكة - <span className="font-mono text-amber-300">-{formatCurrency(todayMetrics.exp)}</span> مصاريف
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                <span>{todayMetrics.count} طلبات منفذة اليوم</span>
                <span className="text-emerald-400 font-bold">خصم آلي دقيق للمواد</span>
              </div>
            </div>

            {/* THIS MONTH'S NET PROFIT WIDGET */}
            <div className="bg-gradient-to-br from-[#1a2e26] to-[#0f1f1a] text-white p-5 rounded-2xl shadow-md border-r-4 border-emerald-400 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-300 bg-emerald-950/90 px-2.5 py-1 rounded-full border border-emerald-400/40 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>صافي أرباح الشهر الحالي ({currentMonthStr})</span>
                  </span>
                  <button
                    onClick={() => setManagerTab('profit_breakdown')}
                    className="text-[11px] font-bold text-emerald-300 hover:text-white flex items-center gap-0.5 cursor-pointer underline underline-offset-4"
                  >
                    <span>جدول حركة الشهور</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-emerald-200">
                    {monthMetrics.net >= 0 ? '+' : ''}{formatCurrency(monthMetrics.net)}
                  </span>
                  <span className="text-xs text-slate-300 font-bold">
                    (هامش الربح الشهري: %{monthMetrics.margin})
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 mt-1">
                  معادلة الشهر: <span className="font-mono font-bold text-white">{formatCurrency(monthMetrics.gross)}</span> مبيعات - <span className="font-mono text-rose-300">-{formatCurrency(monthMetrics.bom)}</span> مواد مستهلكة - <span className="font-mono text-amber-300">-{formatCurrency(monthMetrics.exp)}</span> مصاريف
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                <span>{monthMetrics.count} طلبات هذا الشهر</span>
                <span className="text-emerald-300 font-bold">صافي أرباح تراكمية موثقة</span>
              </div>
            </div>
          </div>

          {/* 5 Financial KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Total Revenue */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-500">إجمالي المبيعات</span>
              <div className="text-xl font-black text-[#292A34] mt-1 font-mono">{formatCurrency(totalRevenue)}</div>
              <span className="text-[10px] text-slate-400">إجمالي دخل الاستوديو</span>
            </div>

            {/* Total BOM */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-500">تكلفة المواد (BOM)</span>
              <div className="text-xl font-black text-[#E31C2B] mt-1 font-mono">-{formatCurrency(totalBOMCost)}</div>
              <span className="text-[10px] text-slate-400">ورق وأحبار مستهلكة</span>
            </div>

            {/* Waste Loss */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-500">خسائر التالف والهدر</span>
              <div className="text-xl font-black text-amber-600 mt-1 font-mono">-{formatCurrency(totalWasteLoss)}</div>
              <span className="text-[10px] text-slate-400">أخطاء طباعة وقص</span>
            </div>

            {/* Petty Expenses */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-500">المصروفات النثرية</span>
              <div className="text-xl font-black text-slate-700 mt-1 font-mono">-{formatCurrency(totalExpenses)}</div>
              <span className="text-[10px] text-slate-400">نفقات تشغيلية</span>
            </div>

            {/* Net Studio Profit */}
            <div className="bg-[#292A34] text-white p-4 rounded-2xl shadow-md border-b-2 border-emerald-400">
              <span className="text-xs font-bold text-emerald-400">صافي الأرباح الكلية</span>
              <div className="text-xl font-black text-emerald-300 mt-1 font-mono tracking-tight">+{formatCurrency(netProfit)}</div>
              <span className="text-[10px] text-slate-300">هامش الربح الصافي: %{profitMarginPercent}</span>
            </div>

          </div>

          {/* PRIMARY REQUIREMENT: INCOME & NET PROFIT PER WORKER TABLE */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#292A34]">
                  تقرير دخل وأرباح كل عامل في الفترة المحددة ({periodPreset === 'today' ? 'اليوم' : periodPreset === 'week' ? 'الأسبوع' : periodPreset === 'month' ? 'الشهر' : 'مخصص'})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  بيان دقيق لمبيعات كل عامل، تكلفة المواد المستهلكة من طرفه، وصافي ربحه المحقق للاستوديو
                </p>
              </div>

              <button
                onClick={handleExportWorkerIncomeCSV}
                className="px-3 py-1.5 bg-[#F0F0F0] hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>تصدير دخل العمال كملف Excel</span>
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#292A34] text-white font-bold rounded-xl">
                    <th className="p-3 rounded-r-xl">العامل</th>
                    <th className="p-3">مواقيت العمل</th>
                    <th className="p-3 text-center">العمليات المنجزة</th>
                    <th className="p-3">إجمالي المبيعات (الدخل)</th>
                    <th className="p-3 text-center">متوسط زمن إنجاز الخدمة</th>
                    <th className="p-3">تكلفة المواد (BOM)</th>
                    <th className="p-3">التالف المسجل</th>
                    <th className="p-3 text-center rounded-l-xl">صافي الربح للاستوديو</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {staffFinancialSummary.map(st => (
                    <tr key={st.staff.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-[#292A34]">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm">
                            {st.staff.avatar || '👤'}
                          </span>
                          <div>
                            <div>{st.staff.name}</div>
                            <span className="text-[10px] text-slate-500 font-normal">
                              {st.staff.role === 'manager' ? 'مدير عام (fouad)' : 'عامل استوديو'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-600 font-bold">
                        {st.staff.workSchedule || '08:30 - 17:00'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#292A34]">
                        {st.ordersCount} طلبات
                      </td>
                      <td className="p-3 font-mono font-black text-[#292A34]">
                        {formatCurrency(st.revenue)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-lg font-mono font-bold text-[11px]">
                          <Timer className="w-3 h-3 text-sky-600" />
                          <span>{st.avgCompletionMinutes} دقيقة</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[#E31C2B] font-bold">
                        -{formatCurrency(st.bomCost)}
                      </td>
                      <td className="p-3 font-mono text-amber-600 font-bold">
                        -{formatCurrency(st.wasteCost)}
                      </td>
                      <td className="p-3 text-center font-mono font-black text-emerald-600 bg-emerald-50/60">
                        +{formatCurrency(st.netProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (No Horizontal Scroll on Phones) */}
            <div className="md:hidden space-y-3">
              {staffFinancialSummary.map(st => (
                <div key={st.staff.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shadow-2xs">
                        {st.staff.avatar || '👤'}
                      </span>
                      <div>
                        <div className="font-black text-sm text-[#292A34]">{st.staff.name}</div>
                        <span className="text-[10px] text-slate-500">
                          {st.staff.role === 'manager' ? 'مدير عام (fouad)' : 'عامل استوديو'} • {st.staff.workSchedule || '08:30 - 17:00'}
                        </span>
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <div className="text-[10px] text-slate-400 font-bold">صافي الربح</div>
                      <div className="text-emerald-600 font-black text-xs">
                        +{formatCurrency(st.netProfit)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-slate-200">
                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">المبيعات</span>
                      <span className="font-mono font-black text-[#292A34]">{formatCurrency(st.revenue)}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">تكلفة المواد</span>
                      <span className="font-mono font-bold text-[#E31C2B]">-{formatCurrency(st.bomCost)}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">الطلبات / السرعة</span>
                      <span className="font-mono font-bold text-slate-700">{st.ordersCount} ط • {st.avgCompletionMinutes}د</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Charts: Financial Flow + Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart 1: Bar Chart of Cash Flow (7 cols) */}
            <div className="lg:col-span-7 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#292A34]">تحليل التدفقات المالية وصافي الأرباح</h3>
                  <p className="text-xs text-slate-500">مقارنة بصرية بين الإيرادات، تكاليف المواد، والمصاريف</p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialSummaryData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} دج`} />
                    <Tooltip 
                      formatter={(val: any) => [`${formatCurrency(Number(val))}`, 'المبلغ']}
                      contentStyle={{ backgroundColor: '#292A34', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Revenue Breakdown (5 cols) */}
            <div className="lg:col-span-5 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div>
                <h3 className="text-sm font-black text-[#292A34]">توزيع الإيرادات حسب نوع الخدمة</h3>
                <p className="text-xs text-slate-500">نسبة مساهمة كل فئة في المبيعات</p>
              </div>

              <div className="h-64 w-full">
                {categoryRevenueData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                    لا توجد بيانات مبيعات في الفترة المحددة
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryRevenueData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryRevenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => [`${formatCurrency(Number(val))}`, 'الإيراد']}
                        contentStyle={{ backgroundColor: '#292A34', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =====================================================================
          TAB: DAILY & MONTHLY NET PROFIT BREAKDOWN WITH AUTO BOM & EXPENSES
      ===================================================================== */}
      {managerTab === 'profit_breakdown' && (
        <ProfitBreakdownView
          orders={orders}
          materials={materials}
          wasteRecords={wasteRecords}
          expenses={expenses}
          allStaff={allStaff}
          onAddExpense={onAddExpense}
        />
      )}

      {/* =====================================================================
          TAB: HUMAN RESOURCES & SALARY PAYMENTS (HR)
      ===================================================================== */}
      {managerTab === 'payroll' && (
        <HumanResourcesView
          allStaff={allStaff}
          salaryPayments={salaryPayments}
          attendanceLogs={attendanceLogs}
          currentStaff={currentStaff}
          onUpdateStaff={onUpdateStaff}
          onAddSalaryPayment={onAddSalaryPayment}
          onUpdateSalaryPayment={onUpdateSalaryPayment}
          onDeleteSalaryPayment={onDeleteSalaryPayment}
          onAddExpense={onAddExpense}
          onAddManualAttendance={onAddManualAttendance}
          onDeleteAttendance={onDeleteAttendance}
        />
      )}

      {/* =====================================================================
          TAB: STAFF PERFORMANCE & SPEED DASHBOARD (NEW)
      ===================================================================== */}
      {managerTab === 'performance' && (
        <StaffPerformanceDashboard
          orders={orders}
          allStaff={allStaff}
          materials={materials}
          wasteRecords={wasteRecords}
        />
      )}

      {/* =====================================================================
          TAB 2: WORKER MANAGEMENT & SCHEDULES & PIN CREATION (FOUAD)
      ===================================================================== */}
      {managerTab === 'workers' && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-[#292A34]">إدارة وتعيين عمال الاستوديو وجداول العمل والأجور</h3>
              <p className="text-xs text-slate-500 font-medium">
                إضافة عمال، تحديد جدول ومواقيت العمل الرسمية، تعيين الأجر بالساعة (دج/ساعة)، وكلمات السر (PIN)
              </p>
            </div>

            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2 bg-[#E31C2B] hover:bg-[#c91422] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shadow-[#E31C2B]/30 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة عامل وجدول عمل جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStaff.map(st => (
              <div key={st.id} className="bg-[#F9FAFB] border border-slate-200 rounded-2xl p-4 space-y-3 relative hover:border-[#292A34] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#292A34] text-white flex items-center justify-center text-lg">
                      {st.avatar || '👤'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#292A34]">{st.name}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          st.role === 'manager' ? 'bg-[#E31C2B] text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {st.role === 'manager' ? 'المدير العام (fouad)' : 'عامل استوديو'}
                        </span>
                        {st.role !== 'manager' && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            st.storeId === 'store_labhour' 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {st.storeId === 'store_labhour' ? 'فرع الأبحور' : 'فرع سيدي عامر'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {st.role !== 'manager' && onDeleteStaff && (
                    <button
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف العامل ${st.name}؟`)) {
                          onDeleteStaff(st.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="حذف العامل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#E31C2B]" /> جدول ومواقيت العمل:
                    </span>
                    <span className="font-mono font-bold text-[#292A34] text-left">{st.workSchedule || '08:30 - 17:00'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-bold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> الأجر بالساعة:
                    </span>
                    <span className="font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {formatCurrency(st.hourlyRate || 250)}/ساعة
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-bold flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-500" /> كلمة السر (PIN):
                    </span>
                    <span className="font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      {st.password || '123'}
                    </span>
                  </div>

                  {st.phone && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-bold">رقم الهاتف:</span>
                      <span className="font-mono font-medium text-slate-700">{st.phone}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setEditingStaff(st)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#292A34] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>تعديل الجدول والأجر</span>
                  </button>

                  <button
                    onClick={() => setManagerTab('payroll')}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                    <span>حساب الراتب</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* =====================================================================
          TAB 3: ATTENDANCE TRACKER (Clock-in / Clock-out Logs)
      ===================================================================== */}
      {managerTab === 'attendance' && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-[#292A34]">سجل حضور وانصراف وساعات دوام العمال</h3>
              <p className="text-xs text-slate-500 font-medium">متابعة دقيقة لمواقيت بداية ونهاية دوام كل عامل يومياً</p>
            </div>

            <button
              onClick={() => {
                const rows = attendanceLogs.map(a => ({
                  'اسم العامل': a.staffName,
                  'التاريخ': a.date,
                  'وقت الحضور (Clock-In)': a.clockIn ? formatTime(a.clockIn) : '',
                  'وقت الانصراف (Clock-Out)': a.clockOut ? formatTime(a.clockOut) : 'دوام نشط',
                  'إجمالي ساعات العمل': a.totalMinutes ? `${(a.totalMinutes / 60).toFixed(1)} ساعة` : '',
                  'الحالة': a.status === 'clocked_in' ? 'حاضر (في العمل)' : 'أنهى دوامه'
                }));
                exportToCSV('Fotop_Staff_Attendance_Log', rows);
              }}
              className="px-3 py-1.5 bg-[#F0F0F0] hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>تصدير كشف الحضور</span>
            </button>
          </div>

          {attendanceLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-bold">
              لا توجد سجلات حضور مسجلة بعد. يقوم العمال بتسجيل الدوام مباشرة عبر شريط النظام العلوي.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-[#292A34] text-white font-bold rounded-xl">
                      <th className="p-3 rounded-r-xl">اسم العامل</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">وقت بداية الدوام</th>
                      <th className="p-3">وقت نهاية الدوام</th>
                      <th className="p-3 text-center">المدة المنقضية</th>
                      <th className="p-3 text-center rounded-l-xl">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {attendanceLogs.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-[#292A34]">{a.staffName}</td>
                        <td className="p-3 font-mono text-slate-600">{formatDate(a.date)}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">{formatTime(a.clockIn)}</td>
                        <td className="p-3 font-mono font-bold text-rose-700">
                          {a.clockOut ? formatTime(a.clockOut) : '─'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700">
                          {a.totalMinutes ? `${Math.floor(a.totalMinutes / 60)} س و ${a.totalMinutes % 60} د` : 'مستمر'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            a.status === 'clocked_in' 
                              ? 'bg-emerald-100 text-emerald-800 animate-pulse' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {a.status === 'clocked_in' ? 'دوام نشط' : 'أنهى الدوام'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-2.5">
                {attendanceLogs.map(a => (
                  <div key={a.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="font-bold text-xs text-[#292A34]">{a.staffName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        a.status === 'clocked_in' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {a.status === 'clocked_in' ? 'دوام نشط' : 'أنهى الدوام'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[9px]">بداية الدوام:</span>
                        <span className="font-mono font-bold text-emerald-700">{formatTime(a.clockIn)}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[9px]">نهاية الدوام:</span>
                        <span className="font-mono font-bold text-rose-700">{a.clockOut ? formatTime(a.clockOut) : 'مستمر'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 font-mono">
                      <span>التاريخ: {formatDate(a.date)}</span>
                      <span className="font-bold text-slate-700">المدة: {a.totalMinutes ? `${Math.floor(a.totalMinutes / 60)}س ${a.totalMinutes % 60}د` : 'جارٍ'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: PETTY EXPENSES LOG
      ===================================================================== */}
      {managerTab === 'expenses' && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-[#292A34]">سجل المصروفات والنفقات النثرية</h3>
              <p className="text-xs text-slate-500 font-medium">تسجيل الفواتير، الصيانة، ومصاريف الاستوديو اليومية</p>
            </div>

            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3.5 py-2 bg-[#E31C2B] hover:bg-[#c91422] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة مصروف</span>
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#292A34] text-white font-bold rounded-xl">
                  <th className="p-3 rounded-r-xl">التاريخ والوقت</th>
                  <th className="p-3">بيان المصروف</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">العامل / المسجل</th>
                  <th className="p-3 text-center rounded-l-xl">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500">{formatDate(e.createdAt)} {formatTime(e.createdAt)}</td>
                    <td className="p-3 font-bold text-[#292A34]">
                      <div>{e.title}</div>
                      {e.notes && <span className="text-[10px] text-slate-400 font-normal">{e.notes}</span>}
                    </td>
                    <td className="p-3">
                      <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                        {e.category === 'materials' ? 'شراء مواد' :
                         e.category === 'maintenance' ? 'صيانة طابعات' :
                         e.category === 'tea_coffee' ? 'ضيافة وشاي' : 'أخرى'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{e.staffName}</td>
                    <td className="p-3 text-center font-mono font-black text-rose-600">
                      -{formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {expenses.map(e => (
              <div key={e.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="font-bold text-xs text-[#292A34]">{e.title}</span>
                  <span className="font-mono font-black text-xs text-rose-600">
                    -{formatCurrency(e.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold text-[10px]">
                    {e.category === 'materials' ? 'شراء مواد' :
                     e.category === 'maintenance' ? 'صيانة طابعات' :
                     e.category === 'tea_coffee' ? 'ضيافة وشاي' : 'أخرى'}
                  </span>
                  <span className="text-slate-500">{e.staffName}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {formatDate(e.createdAt)} {formatTime(e.createdAt)}
                </div>
                {e.notes && (
                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                    {e.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD NEW WORKER WITH WORK SCHEDULE & HOURLY RATE (FOUAD MANAGER)
      ===================================================================== */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-300 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#292A34] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#E31C2B]">
              <div className="flex items-center gap-2 font-black text-sm">
                <UserPlus className="w-5 h-5 text-[#E31C2B]" />
                <span>إضافة عامل جديد وتعيين جدول العمل والأجر بالساعة</span>
              </div>
              <button 
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkerSubmit} className="p-5 space-y-4 text-xs font-medium max-h-[80vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">اسم العامل الكامل <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    placeholder="مثال: يوسف بن عمارة"
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">رقم الهاتف</label>
                  <input
                    type="text"
                    value={newWorkerPhone}
                    onChange={(e) => setNewWorkerPhone(e.target.value)}
                    placeholder="05 50000000"
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
              </div>

              {/* Branch Assignment */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <label className="text-slate-800 font-bold block">
                  الفرع المخصص لهذا العامل <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewWorkerStoreId('store_sidiamer')}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newWorkerStoreId === 'store_sidiamer'
                        ? 'bg-rose-50 border-[#E31C2B] text-[#E31C2B] ring-2 ring-[#E31C2B]/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E31C2B]"></span>
                    <span>فرع سيدي عامر (fotop sidiamer)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewWorkerStoreId('store_labhour')}
                    className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newWorkerStoreId === 'store_labhour'
                        ? 'bg-blue-50 border-blue-600 text-blue-600 ring-2 ring-blue-600/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>فرع الأبحور (fotop labhour)</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  عند تسجيل دخول العامل، سيعرض النظام بيانات وسلع ومحاسبة هذا الفرع فقط ولن يتمكن من تغيير الفرع.
                </p>
              </div>

              {/* Schedule Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-black flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#E31C2B]" />
                    <span>جدول ومواقيت العمل الرسمية (Shift Schedule)</span>
                  </label>
                </div>

                {/* Presets */}
                <div>
                  <label className="text-slate-600 block mb-1 text-[11px] font-bold">نماذج دوام سريعة:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNewWorkerShiftStart('08:30');
                        setNewWorkerShiftEnd('17:00');
                        setNewWorkerDays(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']);
                        setNewWorkerSchedulePreset('full_time');
                      }}
                      className={`p-1.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                        newWorkerShiftStart === '08:30' && newWorkerShiftEnd === '17:00'
                          ? 'bg-[#292A34] text-white border-[#292A34]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      دوام كامل (08:30-17:00)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewWorkerShiftStart('08:00');
                        setNewWorkerShiftEnd('14:00');
                        setNewWorkerDays(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']);
                        setNewWorkerSchedulePreset('morning');
                      }}
                      className={`p-1.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                        newWorkerShiftStart === '08:00' && newWorkerShiftEnd === '14:00'
                          ? 'bg-[#292A34] text-white border-[#292A34]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      دوام صباحي (08:00-14:00)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewWorkerShiftStart('14:00');
                        setNewWorkerShiftEnd('21:00');
                        setNewWorkerDays(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']);
                        setNewWorkerSchedulePreset('evening');
                      }}
                      className={`p-1.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                        newWorkerShiftStart === '14:00' && newWorkerShiftEnd === '21:00'
                          ? 'bg-[#292A34] text-white border-[#292A34]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      دوام مسائي (14:00-21:00)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewWorkerShiftStart('08:30');
                        setNewWorkerShiftEnd('18:30');
                        setNewWorkerDays(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']);
                        setNewWorkerSchedulePreset('extended');
                      }}
                      className={`p-1.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                        newWorkerShiftStart === '08:30' && newWorkerShiftEnd === '18:30'
                          ? 'bg-[#292A34] text-white border-[#292A34]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      دوام مطول (08:30-18:30)
                    </button>
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1 font-bold">ساعة الدخول (البداية):</label>
                    <input
                      type="time"
                      required
                      value={newWorkerShiftStart}
                      onChange={(e) => setNewWorkerShiftStart(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-[#E31C2B]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-bold">ساعة الخروج (النهاية):</label>
                    <input
                      type="time"
                      required
                      value={newWorkerShiftEnd}
                      onChange={(e) => setNewWorkerShiftEnd(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-[#E31C2B]"
                    />
                  </div>
                </div>

                {/* Days of week */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 font-bold">أيام العمل الأسبوعية:</label>
                    <div className="flex gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setNewWorkerDays(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'])}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        كل الأيام
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => setNewWorkerDays(['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'])}
                        className="text-slate-600 hover:underline font-bold"
                      >
                        السبت إلى الخميس
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => {
                      const isSelected = newWorkerDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (newWorkerDays.length > 1) {
                                setNewWorkerDays(newWorkerDays.filter(d => d !== day));
                              }
                            } else {
                              setNewWorkerDays([...newWorkerDays, day]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-[#E31C2B] text-white border-[#E31C2B] shadow-xs'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Hourly Rate & Compensation */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-emerald-950 font-black flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>الأجر بالساعة لحساب الراتب الآلي</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    يستخدم في حاسبة الرواتب
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-emerald-800 block mb-1 font-bold">الأجر بالساعة (دج / ساعة) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        required
                        value={newWorkerHourlyRate}
                        onChange={(e) => setNewWorkerHourlyRate(e.target.value)}
                        placeholder="250"
                        className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-emerald-950 font-mono font-black text-sm focus:outline-none focus:border-emerald-600"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-emerald-700 font-bold">دج/ساعة</span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 space-y-0.5">
                    <div className="font-bold">التقدير الشهري (8 س/يوم × 24 يوم):</div>
                    <div className="font-mono font-black text-sm text-emerald-700">
                      ~{formatCurrency((parseFloat(newWorkerHourlyRate) || 0) * 8 * 24)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password PIN */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">رمز الدخول السري (PIN) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newWorkerPassword}
                    onChange={(e) => setNewWorkerPassword(e.target.value)}
                    placeholder="مثال: 1234 أو fotop2025"
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-black focus:outline-none focus:border-[#E31C2B]"
                  />
                  <span className="text-[10px] text-slate-500">يدخله العامل لتسجيل الدخول وتسجيل الحضور والانصراف.</span>
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500 font-bold">معاينة جدول العمل المعتمد:</div>
                <div className="font-mono font-bold text-[#292A34]">
                  {newWorkerShiftStart} - {newWorkerShiftEnd} ({newWorkerDays.length === 7 ? 'طوال أيام الأسبوع' : newWorkerDays.join('، ')})
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-black shadow-md shadow-[#E31C2B]/30 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ العامل واعتماد جدول العمل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EDIT WORKER SCHEDULE & HOURLY RATE & PIN (FOUAD MANAGER)
      ===================================================================== */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-300 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#292A34] text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2 font-black text-sm">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <span>تعديل جدول العمل والأجر بالساعة: {editingStaff.name}</span>
              </div>
              <button 
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditWorkerSubmit} className="p-5 space-y-4 text-xs font-medium max-h-[80vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">اسم العامل</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">رقم الهاتف</label>
                  <input
                    type="text"
                    value={editingStaff.phone || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
              </div>

              {/* Branch Assignment for Worker */}
              {editingStaff.role !== 'manager' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <label className="text-slate-800 font-bold block">
                    الفرع المعين للعامل:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingStaff({
                        ...editingStaff,
                        storeId: 'store_sidiamer',
                        storeName: 'fotop sidiamer'
                      })}
                      className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        editingStaff.storeId !== 'store_labhour'
                          ? 'bg-rose-50 border-[#E31C2B] text-[#E31C2B] ring-2 ring-[#E31C2B]/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E31C2B]"></span>
                      <span>فرع سيدي عامر (fotop sidiamer)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingStaff({
                        ...editingStaff,
                        storeId: 'store_labhour',
                        storeName: 'fotop labhour'
                      })}
                      className={`p-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        editingStaff.storeId === 'store_labhour'
                          ? 'bg-blue-50 border-blue-600 text-blue-600 ring-2 ring-blue-600/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <span>فرع الأبحور (fotop labhour)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Schedule Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <label className="text-slate-800 font-black flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#E31C2B]" />
                  <span>تعديل جدول ومواقيت العمل الرسمية (Shift Times)</span>
                </label>

                {/* Quick Presets */}
                <div>
                  <label className="text-slate-600 block mb-1 text-[11px] font-bold">تطبيق نموذج دوام جاهز:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingStaff({
                        ...editingStaff,
                        shiftStartTime: '08:30',
                        shiftEndTime: '17:00',
                        workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
                      })}
                      className="p-1.5 rounded-lg border text-[10px] font-bold text-center bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                    >
                      دوام كامل (08:30-17:00)
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingStaff({
                        ...editingStaff,
                        shiftStartTime: '08:00',
                        shiftEndTime: '14:00',
                        workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
                      })}
                      className="p-1.5 rounded-lg border text-[10px] font-bold text-center bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                    >
                      دوام صباحي (08:00-14:00)
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingStaff({
                        ...editingStaff,
                        shiftStartTime: '14:00',
                        shiftEndTime: '21:00',
                        workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
                      })}
                      className="p-1.5 rounded-lg border text-[10px] font-bold text-center bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                    >
                      دوام مسائي (14:00-21:00)
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingStaff({
                        ...editingStaff,
                        shiftStartTime: '08:30',
                        shiftEndTime: '18:30',
                        workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
                      })}
                      className="p-1.5 rounded-lg border text-[10px] font-bold text-center bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                    >
                      دوام مطول (08:30-18:30)
                    </button>
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1 font-bold">ساعة الدخول (البداية):</label>
                    <input
                      type="time"
                      value={editingStaff.shiftStartTime || '08:30'}
                      onChange={(e) => setEditingStaff({ ...editingStaff, shiftStartTime: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-[#E31C2B]"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-bold">ساعة الخروج (النهاية):</label>
                    <input
                      type="time"
                      value={editingStaff.shiftEndTime || '17:00'}
                      onChange={(e) => setEditingStaff({ ...editingStaff, shiftEndTime: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-[#E31C2B]"
                    />
                  </div>
                </div>

                {/* Days of week */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 font-bold">أيام العمل الأسبوعية:</label>
                    <div className="flex gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setEditingStaff({
                          ...editingStaff,
                          workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
                        })}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        كل الأيام
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => setEditingStaff({
                          ...editingStaff,
                          workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
                        })}
                        className="text-slate-600 hover:underline font-bold"
                      >
                        السبت إلى الخميس
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => {
                      const currentDays = editingStaff.workingDays || ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
                      const isSelected = currentDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (currentDays.length > 1) {
                                setEditingStaff({
                                  ...editingStaff,
                                  workingDays: currentDays.filter(d => d !== day)
                                });
                              }
                            } else {
                              setEditingStaff({
                                ...editingStaff,
                                workingDays: [...currentDays, day]
                              });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            isSelected
                              ? 'bg-[#E31C2B] text-white border-[#E31C2B] shadow-xs'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Hourly Rate & Compensation */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-emerald-950 font-black flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>تعديل الأجر بالساعة (دج / ساعة)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-emerald-800 block mb-1 font-bold">الأجر المعتمد بالساعة</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={editingStaff.hourlyRate || 250}
                        onChange={(e) => setEditingStaff({
                          ...editingStaff,
                          hourlyRate: parseFloat(e.target.value) || 0,
                          monthlySalaryBase: (parseFloat(e.target.value) || 0) * 8 * 24
                        })}
                        className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-emerald-950 font-mono font-black text-sm focus:outline-none focus:border-emerald-600"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-emerald-700 font-bold">دج/ساعة</span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 space-y-0.5">
                    <div className="font-bold">التقدير الشهري:</div>
                    <div className="font-mono font-black text-sm text-emerald-700">
                      ~{formatCurrency((editingStaff.hourlyRate || 250) * 8 * 24)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password PIN */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">كلمة السر (PIN)</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.password || '123'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-black focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#292A34] hover:bg-[#373946] text-white font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>حفظ التعديلات واعتماد الجدول الجديد</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD EXPENSE
      ===================================================================== */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <Wallet className="w-5 h-5 text-amber-400" />
                <span>تسجيل مصروف أو نفقة نثرية</span>
              </div>
              <button 
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-3.5 text-xs font-medium">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">بيان المصروف</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء، شراء شاي وضيافة، صيانة طابعة..."
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">المبلغ (دج)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="مثال: 500 دج"
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-black focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">التصنيف</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  >
                    <option value="materials">شراء مواد خام</option>
                    <option value="maintenance">صيانة أجهزة وطابعات</option>
                    <option value="utilities">فواتير وكهرباء وإنترنت</option>
                    <option value="tea_coffee">ضيافة وشاي</option>
                    <option value="other">مصاريف أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">ملاحظات إضافية (اختياري)</label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="رقم الوصل أو المحل..."
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-black shadow-md shadow-[#E31C2B]/30 cursor-pointer"
                >
                  تسجيل وخصم المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Report Export Modal */}
      <AccountingReportPDFModal
        isOpen={showPDFReportModal}
        onClose={() => setShowPDFReportModal(false)}
        orders={orders}
        materials={materials}
        wasteRecords={wasteRecords}
        expenses={expenses}
        allStaff={allStaff}
        currentStaff={currentStaff}
        initialStartDate={periodPreset === 'custom' ? customStartDate : undefined}
        initialEndDate={periodPreset === 'custom' ? customEndDate : undefined}
      />

    </div>
  );
};
