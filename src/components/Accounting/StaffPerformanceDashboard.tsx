import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  Timer, 
  Zap, 
  TrendingUp, 
  Award, 
  FileSpreadsheet, 
  Receipt, 
  Coins, 
  CheckCircle2, 
  Filter, 
  Layers, 
  Eye,
  Activity,
  Calendar,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Order, Staff, Material, WasteRecord } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';

interface StaffPerformanceDashboardProps {
  orders: Order[];
  allStaff: Staff[];
  materials?: Material[];
  wasteRecords?: WasteRecord[];
}

export interface StaffPerformanceStats {
  staffId: string;
  staffName: string;
  role: 'manager' | 'worker';
  avatar: string;
  workSchedule?: string;
  ordersCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgCompletionMinutes: number;
  fastestCompletionMinutes: number;
  slowestCompletionMinutes: number;
  completedOrdersCount: number;
  pendingOrdersCount: number;
  totalNetProfit: number;
  efficiencyScore: number; // 0 to 100
  speedBadge: {
    label: string;
    color: string;
    bg: string;
  };
  categoryTimes: Record<string, { count: number; totalMinutes: number; avgMinutes: number }>;
}

/**
 * Calculates turnaround/completion time for a specific order in minutes
 */
export const getOrderTurnaroundMinutes = (order: Order): number => {
  // 1. If explicit duration was recorded
  if (typeof order.serviceDurationMinutes === 'number' && order.serviceDurationMinutes > 0) {
    return order.serviceDurationMinutes;
  }

  // 2. If completedAt timestamp is available
  if (order.completedAt && order.createdAt) {
    const diffMs = new Date(order.completedAt).getTime() - new Date(order.createdAt).getTime();
    if (diffMs > 0) {
      const mins = Math.round(diffMs / (1000 * 60));
      if (mins >= 1 && mins <= 480) return mins;
    }
  }

  // 3. If estimatedPickupAt is set
  if (order.estimatedPickupAt && order.createdAt) {
    const diffMs = new Date(order.estimatedPickupAt).getTime() - new Date(order.createdAt).getTime();
    if (diffMs > 0) {
      const mins = Math.round(diffMs / (1000 * 60));
      if (mins >= 1 && mins <= 360) return mins;
    }
  }

  // 4. Calculate from service estimated labor minutes
  if (order.items && order.items.length > 0) {
    const laborSum = order.items.reduce((sum, it) => {
      const itemLabor = it.service.estimatedLaborMinutes || 10;
      return sum + (itemLabor * it.quantity);
    }, 0);
    if (laborSum > 0) return laborSum;
  }

  // Fallback default
  return 12;
};

export const StaffPerformanceDashboard: React.FC<StaffPerformanceDashboardProps> = ({
  orders = [],
  allStaff = [],
  materials = [],
  wasteRecords = []
}) => {
  // Filter states
  const [periodPreset, setPeriodPreset] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison_charts' | 'detailed_table'>('overview');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Date Filter Helper
  const matchesDateRange = (isoString: string) => {
    if (!isoString) return false;
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
      const start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : new Date(0);
      const end = customEndDate ? new Date(`${customEndDate}T23:59:59`) : new Date(8640000000000000);
      return recordDate >= start && recordDate <= end;
    }
    return true; // 'all'
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return (orders || []).filter(o => {
      const dateMatch = matchesDateRange(o.createdAt);
      const staffMatch = selectedStaffId === 'all' || o.staffId === selectedStaffId;
      return dateMatch && staffMatch;
    });
  }, [orders, periodPreset, selectedStaffId, customStartDate, customEndDate, todayStr]);

  // Compute Performance Statistics for each staff member
  const staffStatsList = useMemo<StaffPerformanceStats[]>(() => {
    const map: Record<string, {
      staff: Staff;
      orders: Order[];
      durations: number[];
      revenue: number;
      bomCost: number;
      wasteCost: number;
      categoryTimes: Record<string, { count: number; totalMinutes: number; avgMinutes: number }>;
    }> = {};

    // Initialize map with all staff members
    for (const st of (allStaff || [])) {
      map[st.id] = {
        staff: st,
        orders: [],
        durations: [],
        revenue: 0,
        bomCost: 0,
        wasteCost: 0,
        categoryTimes: {}
      };
    }

    // Filter relevant orders in selected time period
    const periodOrders = (orders || []).filter(o => matchesDateRange(o.createdAt));

    for (const ord of periodOrders) {
      if (!map[ord.staffId]) {
        map[ord.staffId] = {
          staff: {
            id: ord.staffId,
            name: ord.staffName || 'عامل استوديو',
            role: 'worker',
            phone: '',
            avatar: '👤',
            active: true
          },
          orders: [],
          durations: [],
          revenue: 0,
          bomCost: 0,
          wasteCost: 0,
          categoryTimes: {}
        };
      }

      const stData = map[ord.staffId];
      stData.orders.push(ord);
      stData.revenue += ord.total;

      const duration = getOrderTurnaroundMinutes(ord);
      stData.durations.push(duration);

      // BOM cost calculation
      const bom = (ord.materialsDeducted && ord.materialsDeducted.length > 0)
        ? ord.materialsDeducted.reduce((sum, m) => sum + (m.cost || 0), 0)
        : (ord.totalBOMCost || 0);
      stData.bomCost += bom;

      // Category turnaround breakdown
      for (const item of ord.items) {
        const cat = item.service.category || 'other';
        const catName = 
          cat === 'id_photos' ? 'صور شمسية وهوية' :
          cat === 'prints' ? 'طباعة وتكبير' :
          cat === 'frames' ? 'إطارات وبراويز' :
          cat === 'lamination' ? 'تغليف حراري' :
          cat === 'digital' ? 'خدمات رقمية' :
          cat === 'retail_goods' ? 'سلع مباشرة' : 'خدمات أخرى';

        if (!stData.categoryTimes[catName]) {
          stData.categoryTimes[catName] = { count: 0, totalMinutes: 0, avgMinutes: 0 };
        }
        const itemTime = (item.service.estimatedLaborMinutes || 10) * item.quantity;
        stData.categoryTimes[catName].count += item.quantity;
        stData.categoryTimes[catName].totalMinutes += itemTime;
      }
    }

    // Include waste in cost
    const periodWaste = (wasteRecords || []).filter(w => matchesDateRange(w.createdAt));
    for (const w of periodWaste) {
      if (map[w.staffId]) {
        map[w.staffId].wasteCost += w.costLoss;
      }
    }

    // Build the final stats array
    const result: StaffPerformanceStats[] = Object.values(map).map(entry => {
      const { staff, orders: staffOrders, durations, revenue, bomCost, wasteCost, categoryTimes } = entry;
      const count = staffOrders.length;
      const avgOrderValue = count > 0 ? Math.round(revenue / count) : 0;

      const avgCompletionMinutes = durations.length > 0
        ? Number((durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1))
        : 0;

      const fastestCompletionMinutes = durations.length > 0
        ? Math.min(...durations)
        : 0;

      const slowestCompletionMinutes = durations.length > 0
        ? Math.max(...durations)
        : 0;

      const completedOrdersCount = staffOrders.filter(o => o.status === 'ready' || o.status === 'delivered').length;
      const pendingOrdersCount = staffOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;
      const totalNetProfit = Math.max(0, revenue - bomCost - wasteCost);

      // Finalize category times
      for (const k in categoryTimes) {
        if (categoryTimes[k].count > 0) {
          categoryTimes[k].avgMinutes = Number((categoryTimes[k].totalMinutes / categoryTimes[k].count).toFixed(1));
        }
      }

      // Efficiency Score: based on order count and completion speed (lower turnaround time = higher speed)
      let efficiencyScore = 80;
      if (count > 0) {
        if (avgCompletionMinutes <= 10) efficiencyScore = 98;
        else if (avgCompletionMinutes <= 15) efficiencyScore = 92;
        else if (avgCompletionMinutes <= 25) efficiencyScore = 85;
        else if (avgCompletionMinutes <= 40) efficiencyScore = 78;
        else efficiencyScore = 70;
      } else {
        efficiencyScore = 0;
      }

      // Speed Badge
      let speedBadge = { label: 'قياسي ممتاز ⚡', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
      if (avgCompletionMinutes > 0 && avgCompletionMinutes <= 10) {
        speedBadge = { label: 'فائق السرعة 🚀', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' };
      } else if (avgCompletionMinutes > 25) {
        speedBadge = { label: 'خدمات متأنية / إطارات ⏳', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
      } else if (count === 0) {
        speedBadge = { label: 'لا توجد عمليات', color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200' };
      }

      return {
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        avatar: staff.avatar || '👤',
        workSchedule: staff.workSchedule,
        ordersCount: count,
        totalRevenue: revenue,
        avgOrderValue,
        avgCompletionMinutes,
        fastestCompletionMinutes,
        slowestCompletionMinutes,
        completedOrdersCount,
        pendingOrdersCount,
        totalNetProfit,
        efficiencyScore,
        speedBadge,
        categoryTimes
      };
    });

    // If selected specific staff
    if (selectedStaffId !== 'all') {
      return result.filter(s => s.staffId === selectedStaffId);
    }

    return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [allStaff, orders, wasteRecords, periodPreset, customStartDate, customEndDate, selectedStaffId, todayStr]);

  // Macro Aggregate Metrics across filtered set
  const macroStats = useMemo(() => {
    const totalOrders = staffStatsList.reduce((sum, s) => sum + s.ordersCount, 0);
    const totalRevenue = staffStatsList.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalProfit = staffStatsList.reduce((sum, s) => sum + s.totalNetProfit, 0);

    const validAverages = staffStatsList.filter(s => s.ordersCount > 0 && s.avgCompletionMinutes > 0);
    const overallAvgMinutes = validAverages.length > 0
      ? Number((validAverages.reduce((sum, s) => sum + s.avgCompletionMinutes, 0) / validAverages.length).toFixed(1))
      : 0;

    // Top performer
    const topPerformer = staffStatsList.length > 0
      ? [...staffStatsList].sort((a, b) => b.totalRevenue - a.totalRevenue)[0]
      : null;

    // Fastest performer
    const fastestPerformer = validAverages.length > 0
      ? [...validAverages].sort((a, b) => a.avgCompletionMinutes - b.avgCompletionMinutes)[0]
      : null;

    return {
      totalOrders,
      totalRevenue,
      totalProfit,
      overallAvgMinutes,
      topPerformer,
      fastestPerformer
    };
  }, [staffStatsList]);

  // Chart Data for Orders & Revenue Comparison
  const comparisonChartData = useMemo(() => {
    return staffStatsList.map(s => ({
      name: s.staffName.split(' ')[0],
      fullName: s.staffName,
      'عدد الطلبات': s.ordersCount,
      'إجمالي المبيعات (دج)': s.totalRevenue,
      'متوسط زمن الإنجاز (دقيقة)': s.avgCompletionMinutes,
      'صافي الربح': s.totalNetProfit
    }));
  }, [staffStatsList]);

  // Global Category Time Breakdown
  const categoryTimeData = useMemo(() => {
    const map: Record<string, { totalTime: number; totalCount: number }> = {};
    for (const st of staffStatsList) {
      for (const catName in st.categoryTimes) {
        if (!map[catName]) map[catName] = { totalTime: 0, totalCount: 0 };
        map[catName].totalTime += st.categoryTimes[catName].totalMinutes;
        map[catName].totalCount += st.categoryTimes[catName].count;
      }
    }
    return Object.entries(map).map(([name, data]) => ({
      name,
      'متوسط الزمن (دقائق)': data.totalCount > 0 ? Number((data.totalTime / data.totalCount).toFixed(1)) : 0,
      'الكمية المنجزة': data.totalCount
    }));
  }, [staffStatsList]);

  // Export Performance Report to CSV
  const handleExportPerformanceCSV = () => {
    const periodLabel = 
      periodPreset === 'today' ? 'اليوم' :
      periodPreset === 'week' ? 'آخر 7 أيام' :
      periodPreset === 'month' ? 'الشهر الحالي' :
      periodPreset === 'custom' ? `مخصص (${customStartDate} إلى ${customEndDate})` : 'كامل السجلات';

    const rows = staffStatsList.map(s => ({
      'اسم الموظف': s.staffName,
      'الصفة': s.role === 'manager' ? 'مدير عام' : 'عامل استوديو',
      'الفترة': periodLabel,
      'عدد الطلبات المنجزة': s.ordersCount,
      'إجمالي المبيعات المحققة (دج)': s.totalRevenue,
      'متوسط قيمة الطلب الواحد (دج)': s.avgOrderValue,
      'متوسط زمن إنجاز الخدمة (بالدقائق)': s.avgCompletionMinutes,
      'أسرع طلب منجز (بالدقائق)': s.fastestCompletionMinutes,
      'صافي الربح المحقق للاستوديو (دج)': s.totalNetProfit,
      'تقييم السرعة والكفاءة': s.speedBadge.label
    }));

    exportToCSV(`Fotop_Staff_Performance_Statistics_${periodPreset}`, rows);
  };

  const periodLabel = 
    periodPreset === 'today' ? 'اليوم' :
    periodPreset === 'week' ? 'آخر 7 أيام' :
    periodPreset === 'month' ? 'الشهر الحالي' :
    periodPreset === 'custom' ? `الفترة المخصصة` : 'كامل السجلات';

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls Bar */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#E31C2B] text-white text-[11px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                <span>إحصائيات الأداء وكفاءة الخدمات</span>
              </span>
              <span className="text-xs text-slate-500 font-bold">| قسم المحاسبة والتقارير الإدارية</span>
            </div>
            <h2 className="text-lg font-black text-[#292A34] mt-1.5 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#E31C2B]" />
              <span>لوحة أداء الموظفين ومتوسط أزمنة الإنجاز ({periodLabel})</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              متابعة دقيقة لعدد الطلبات المنجزة من قبل كل موظف، إجمالي المبيعات المحققة، ومتوسط الوقت المستغرق في تنفيذ وتسليم الخدمات
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportPerformanceCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير إحصائيات الأداء (Excel)</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          
          {/* Period Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#E31C2B]" />
              <span>الفترة:</span>
            </span>

            <button
              onClick={() => setPeriodPreset('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                periodPreset === 'today' ? 'bg-[#292A34] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              اليوم
            </button>

            <button
              onClick={() => setPeriodPreset('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                periodPreset === 'week' ? 'bg-[#292A34] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              آخر 7 أيام
            </button>

            <button
              onClick={() => setPeriodPreset('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                periodPreset === 'month' ? 'bg-[#292A34] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الشهر الحالي
            </button>

            <button
              onClick={() => setPeriodPreset('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                periodPreset === 'custom' ? 'bg-[#E31C2B] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              مخصص (من ─ إلى)
            </button>

            <button
              onClick={() => setPeriodPreset('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                periodPreset === 'all' ? 'bg-[#292A34] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              كامل السجلات
            </button>
          </div>

          {/* Filter by Staff */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">الموظف:</span>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B] cursor-pointer"
            >
              <option value="all">👥 جميع الموظفين</option>
              {allStaff.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.role === 'manager' ? 'مدير' : 'عامل'})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Custom Date Pickers */}
        {periodPreset === 'custom' && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
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
              <label className="text-slate-600 block mb-1 font-bold">إلى تاريخ:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4 Macro KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Orders Completed */}
        <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">إجمالي الطلبات المنجزة</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Receipt className="w-4 h-4 text-[#E31C2B]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#292A34] mt-1 font-mono">
            {macroStats.totalOrders} <span className="text-xs font-normal text-slate-500">طلب</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">
            موزعة على {staffStatsList.length} موظفين في {periodLabel}
          </div>
        </div>

        {/* Total Revenue Generated */}
        <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">إجمالي المبيعات المحققة</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            {formatCurrency(macroStats.totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>صافي الربح: +{formatCurrency(macroStats.totalProfit)}</span>
          </div>
        </div>

        {/* Average Service Completion Time (PRIMARY METRIC) */}
        <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden bg-linear-to-br from-white to-sky-50/50">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-sky-900">متوسط زمن إنجاز الخدمة</span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-800 mt-1 font-mono flex items-baseline gap-1.5">
            <span>{macroStats.overallAvgMinutes}</span>
            <span className="text-xs font-bold text-slate-600">دقيقة / طلب</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>سرعة تسليم الخدمات للزبائن</span>
          </div>
        </div>

        {/* Top Performer Star Card */}
        <div className="bg-[#292A34] text-white p-5 rounded-2xl shadow-md border-b-2 border-amber-400 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>الموظف الأكثر إنجازاً</span>
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-white mt-1 truncate">
            {macroStats.topPerformer ? macroStats.topPerformer.staffName : '─'}
          </div>
          <div className="text-[11px] text-slate-300 mt-2 font-mono flex items-center justify-between">
            <span>{macroStats.topPerformer ? `${macroStats.topPerformer.ordersCount} طلبات` : ''}</span>
            <span className="text-amber-300 font-bold">
              {macroStats.topPerformer ? formatCurrency(macroStats.topPerformer.totalRevenue) : ''}
            </span>
          </div>
        </div>

      </div>

      {/* Sub-Tabs View Switcher */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-[#292A34] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-200/60'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>بطاقات ومؤشرات أداء كل موظف</span>
        </button>

        <button
          onClick={() => setActiveTab('detailed_table')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'detailed_table'
              ? 'bg-[#292A34] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-200/60'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>جدول الإحصائيات الشامل والمقارنة</span>
        </button>

        <button
          onClick={() => setActiveTab('comparison_charts')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'comparison_charts'
              ? 'bg-[#292A34] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-200/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>الرسوم البيانية ومقارنة الأزمنة والمبيعات</span>
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: INDIVIDUAL EMPLOYEE PERFORMANCE CARDS (OVERVIEW)
      ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffStatsList.map(st => (
              <div 
                key={st.staffId}
                className="bg-white border-2 border-slate-200 hover:border-[#292A34] rounded-2xl p-5 shadow-sm space-y-4 transition-all"
              >
                {/* Employee Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#292A34] text-white flex items-center justify-center font-black text-xl shadow-xs">
                      {st.avatar || '👤'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#292A34]">{st.staffName}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          st.role === 'manager' ? 'bg-[#E31C2B] text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {st.role === 'manager' ? 'مدير عام' : 'عامل استوديو'}
                        </span>
                        {st.workSchedule && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {st.workSchedule}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${st.speedBadge.bg} ${st.speedBadge.color}`}>
                    {st.speedBadge.label}
                  </span>
                </div>

                {/* 3 Core Performance Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  
                  {/* Metric 1: Orders Completed */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">الطلبات</span>
                    <span className="font-mono font-black text-base text-[#292A34]">{st.ordersCount}</span>
                    <span className="text-[9px] text-slate-400 block">طلب منجز</span>
                  </div>

                  {/* Metric 2: Total Revenue */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">المبيعات</span>
                    <span className="font-mono font-black text-xs text-emerald-700 block mt-0.5 truncate">
                      {formatCurrency(st.totalRevenue)}
                    </span>
                    <span className="text-[9px] text-slate-400 block">إجمالي الإيراد</span>
                  </div>

                  {/* Metric 3: Average Completion Time */}
                  <div>
                    <span className="text-[10px] text-sky-800 font-bold block">متوسط الزمن</span>
                    <span className="font-mono font-black text-base text-sky-700">{st.avgCompletionMinutes}</span>
                    <span className="text-[9px] text-sky-800 font-bold block">دقيقة / خدمة</span>
                  </div>

                </div>

                {/* Turnaround & Service Speed Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      أسرع طلب منجز:
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {st.fastestCompletionMinutes > 0 ? `${st.fastestCompletionMinutes} دقيقة` : '─'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Coins className="w-3.5 h-3.5 text-slate-400" />
                      متوسط قيمة المعاملة:
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      {formatCurrency(st.avgOrderValue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      صافي الربح المحقق للاستوديو:
                    </span>
                    <span className="font-mono font-black text-emerald-700">
                      +{formatCurrency(st.totalNetProfit)}
                    </span>
                  </div>
                </div>

                {/* Category Breakdown (Top Services Time by this staff) */}
                {Object.keys(st.categoryTimes).length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1.5">
                      أزمنة الإنجاز حسب الخدمة:
                    </span>
                    <div className="space-y-1">
                      {Object.entries(st.categoryTimes as Record<string, { count: number; totalMinutes: number; avgMinutes: number }>).slice(0, 3).map(([catName, catData]) => (
                        <div key={catName} className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                          <span className="truncate">{catName} ({catData.count})</span>
                          <span className="font-mono font-bold text-sky-800 shrink-0">~{catData.avgMinutes} دقيقة</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: DETAILED PERFORMANCE & COMPARISON TABLE
      ========================================================================= */}
      {activeTab === 'detailed_table' && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-[#292A34]">
                جدول إحصائيات الأداء والمبيعات وسرعة الإنجاز لجميع الموظفين
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                مقارنة دقيقة لكل موظف: عدد الطلبات، إجمالي المبيعات، ومتوسط زمن تنفيذ الخدمة
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#292A34] text-white font-bold rounded-xl">
                  <th className="p-3.5 rounded-r-xl">الموظف</th>
                  <th className="p-3.5 text-center">عدد الطلبات المنجزة</th>
                  <th className="p-3.5">إجمالي المبيعات المحققة</th>
                  <th className="p-3.5">متوسط قيمة الطلب</th>
                  <th className="p-3.5 text-center">متوسط زمن إنجاز الخدمة</th>
                  <th className="p-3.5 text-center">أسرع إنجاز</th>
                  <th className="p-3.5">صافي الربح للاستوديو</th>
                  <th className="p-3.5 text-center rounded-l-xl">مؤشر الكفاءة والسرعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {staffStatsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400 font-bold">
                      لا توجد بيانات مطابقة للفترة المحددة
                    </td>
                  </tr>
                ) : (
                  staffStatsList.map(st => (
                    <tr key={st.staffId} className="hover:bg-slate-50 transition-colors">
                      
                      {/* Staff Name & Role */}
                      <td className="p-3.5 font-bold text-[#292A34]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-base font-black">
                            {st.avatar || '👤'}
                          </div>
                          <div>
                            <div>{st.staffName}</div>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {st.role === 'manager' ? 'مدير عام (fouad)' : 'عامل استوديو'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td className="p-3.5 text-center font-mono font-black text-sm text-[#292A34]">
                        <div className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span>{st.ordersCount}</span>
                        </div>
                      </td>

                      {/* Total Gross Sales Revenue */}
                      <td className="p-3.5 font-mono font-black text-sm text-emerald-700">
                        {formatCurrency(st.totalRevenue)}
                      </td>

                      {/* Avg Order Value */}
                      <td className="p-3.5 font-mono text-slate-600 font-bold">
                        {formatCurrency(st.avgOrderValue)}
                      </td>

                      {/* Average Completion Time (Minutes) */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-xl font-mono font-black text-xs">
                          <Timer className="w-3.5 h-3.5 text-sky-600" />
                          <span>{st.avgCompletionMinutes} دقيقة</span>
                        </div>
                      </td>

                      {/* Fastest Order Time */}
                      <td className="p-3.5 text-center font-mono text-xs text-slate-600">
                        {st.fastestCompletionMinutes > 0 ? (
                          <span className="text-emerald-700 font-bold">{st.fastestCompletionMinutes} دقيقة</span>
                        ) : '─'}
                      </td>

                      {/* Net Profit */}
                      <td className="p-3.5 font-mono font-black text-xs text-emerald-700">
                        +{formatCurrency(st.totalNetProfit)}
                      </td>

                      {/* Speed Badge */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full border ${st.speedBadge.bg} ${st.speedBadge.color}`}>
                          {st.speedBadge.label}
                        </span>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
              {staffStatsList.length > 0 && (
                <tfoot className="bg-slate-100 font-black text-xs text-[#292A34] border-t-2 border-slate-300">
                  <tr>
                    <td className="p-3.5">الإجمالي والمتوسط العام:</td>
                    <td className="p-3.5 text-center font-mono">{macroStats.totalOrders} طلب</td>
                    <td className="p-3.5 font-mono text-emerald-800">{formatCurrency(macroStats.totalRevenue)}</td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {macroStats.totalOrders > 0 ? formatCurrency(Math.round(macroStats.totalRevenue / macroStats.totalOrders)) : '0 دج'}
                    </td>
                    <td className="p-3.5 text-center font-mono text-sky-800">
                      {macroStats.overallAvgMinutes} دقيقة
                    </td>
                    <td className="p-3.5 text-center font-mono">─</td>
                    <td className="p-3.5 font-mono text-emerald-800">+{formatCurrency(macroStats.totalProfit)}</td>
                    <td className="p-3.5 text-center">أداء جماعي</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: COMPARISON CHARTS & TURNAROUND TIME ANALYSIS
      ========================================================================= */}
      {activeTab === 'comparison_charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Orders and Revenue Comparison */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#292A34]">مقارنة عدد الطلبات والمبيعات لكل موظف</h3>
                <p className="text-xs text-slate-500">حجم الإنتاجية وإجمالي المداخيل المحققة</p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis yAxisId="left" stroke="#292A34" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} دج`} />
                  <Tooltip 
                    formatter={(val: any, name: any) => [
                      name.includes('مبيعات') ? formatCurrency(Number(val)) : val,
                      name
                    ]}
                    contentStyle={{ backgroundColor: '#292A34', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="عدد الطلبات" fill="#292A34" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="right" dataKey="إجمالي المبيعات (دج)" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Average Completion Time per Employee (Minutes) */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#292A34]">متوسط زمن إنجاز الخدمة لكل موظف (بالدقائق)</h3>
                <p className="text-xs text-slate-500">السرعة والوقت المستغرق في تنفيذ الطلبات</p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis stroke="#0284c7" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} د`} />
                  <Tooltip 
                    formatter={(val: any) => [`${val} دقيقة`, 'متوسط زمن الخدمة']}
                    contentStyle={{ backgroundColor: '#292A34', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="متوسط زمن الإنجاز (دقيقة)" fill="#0284c7" radius={[6, 6, 0, 0]}>
                    {comparisonChartData.map((entry, idx) => (
                      <Cell 
                        key={`cell-${idx}`} 
                        fill={entry['متوسط زمن الإنجاز (دقيقة)'] <= 12 ? '#10b981' : entry['متوسط زمن الإنجاز (دقيقة)'] <= 25 ? '#0284c7' : '#f59e0b'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Average Completion Time per Service Category */}
          <div className="lg:col-span-2 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#292A34]">متوسط زمن إنجاز الخدمات حسب نوع وفئة العمل</h3>
                <p className="text-xs text-slate-500">مقارنة أزمنة التنفيذ بين الصور الشمسية، الطباعة، التغليف، والبراويز</p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              {categoryTimeData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                  لا توجد خدمات مسجلة في الفترة المحددة
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryTimeData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} د`} />
                    <Tooltip 
                      formatter={(val: any, name: any) => [name.includes('الزمن') ? `${val} دقيقة` : val, name]}
                      contentStyle={{ backgroundColor: '#292A34', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="متوسط الزمن (دقائق)" fill="#E31C2B" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="الكمية المنجزة" fill="#64748b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
