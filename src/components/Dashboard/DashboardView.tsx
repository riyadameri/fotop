import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Wallet, 
  Receipt, 
  Layers, 
  AlertOctagon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Plus, 
  PlusCircle,
  ChevronRight, 
  BarChart3, 
  Calendar,
  AlertTriangle,
  Bell,
  BellRing,
  Package,
  ShieldCheck,
  Eye,
  X,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Order, Material, WasteRecord, Expense, Shift, Staff, AttendanceRecord } from '../../types';
import { TabType } from '../Navigation';
import { formatCurrency, formatNumber, formatDate, formatTime, getItemUnitCost } from '../../utils/formatters';

interface DashboardViewProps {
  orders: Order[];
  materials: Material[];
  wasteRecords: WasteRecord[];
  expenses: Expense[];
  shifts: Shift[];
  currentStaff: Staff;
  allStaff: Staff[];
  attendanceLogs: AttendanceRecord[];
  onNavigateTab: (tab: TabType) => void;
  onNavigateToInventory?: (materialId?: string, materialName?: string) => void;
  onOpenQuickExpense?: () => void;
  onOpenQuickWaste?: () => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all';

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders = [],
  materials = [],
  wasteRecords = [],
  expenses = [],
  shifts = [],
  currentStaff,
  allStaff = [],
  attendanceLogs = [],
  onNavigateTab,
  onNavigateToInventory,
  onOpenQuickExpense,
  onOpenQuickWaste
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('today');
  const [stockAlertFilter, setStockAlertFilter] = useState<'all' | 'out_of_stock' | 'critical' | 'warning'>('all');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Helper to filter by date
  const matchesPeriod = (isoDate: string) => {
    if (!isoDate) return false;
    if (period === 'today') {
      return isoDate.startsWith(todayStr);
    }
    const d = new Date(isoDate);
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }
    if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return d >= monthAgo;
    }
    return true;
  };

  // Filtered dataset
  const filteredOrders = useMemo(() => {
    return orders.filter(o => matchesPeriod(o.createdAt));
  }, [orders, period]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => matchesPeriod(e.createdAt));
  }, [expenses, period]);

  const filteredWaste = useMemo(() => {
    return wasteRecords.filter(w => matchesPeriod(w.createdAt));
  }, [wasteRecords, period]);

  // Core metrics
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [filteredOrders]);

  const totalBOMCost = useMemo(() => {
    return filteredOrders.reduce((sum, o) => {
      if (typeof o.totalBOMCost === 'number' && o.totalBOMCost > 0) {
        return sum + o.totalBOMCost;
      }
      if (o.items && o.items.length > 0) {
        const cost = o.items.reduce((acc, it) => acc + (getItemUnitCost(it.service, materials) * it.quantity), 0);
        return sum + cost;
      }
      return sum;
    }, 0);
  }, [filteredOrders, materials]);

  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const totalWasteLoss = useMemo(() => {
    return filteredWaste.reduce((sum, w) => sum + (w.costLoss || 0), 0);
  }, [filteredWaste]);

  const netProfit = totalRevenue - totalBOMCost - totalExpensesAmount - totalWasteLoss;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Stock alerts
  const criticalMaterials = useMemo(() => {
    return materials.filter(m => m.currentStock <= m.minThreshold);
  }, [materials]);

  const outOfStockMaterials = useMemo(() => {
    return criticalMaterials.filter(m => m.currentStock <= 0);
  }, [criticalMaterials]);

  const severelyLowMaterials = useMemo(() => {
    return criticalMaterials.filter(m => m.currentStock > 0 && m.currentStock <= (m.minThreshold * 0.5));
  }, [criticalMaterials]);

  const warningMaterials = useMemo(() => {
    return criticalMaterials.filter(m => m.currentStock > (m.minThreshold * 0.5));
  }, [criticalMaterials]);

  const filteredAlertMaterials = useMemo(() => {
    if (stockAlertFilter === 'out_of_stock') return outOfStockMaterials;
    if (stockAlertFilter === 'critical') return severelyLowMaterials;
    if (stockAlertFilter === 'warning') return warningMaterials;
    return criticalMaterials;
  }, [stockAlertFilter, criticalMaterials, outOfStockMaterials, severelyLowMaterials, warningMaterials]);

  const getUnitLabel = (unit: Material['unit']) => {
    switch (unit) {
      case 'sheet': return 'ورقة';
      case 'ml': return 'مل';
      case 'piece': return 'قطعة';
      case 'roll': return 'رول';
      case 'box': return 'علبة';
      default: return unit;
    }
  };

  const getCategoryBadge = (category: Material['category']) => {
    switch (category) {
      case 'paper': return { label: 'أوراق وطباعة', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'ink': return { label: 'أحبار طابعات', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'frame': return { label: 'كوادر وبراويز', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'lamination': return { label: 'تغليف حراري', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'packaging': return { label: 'أكياس وتغليف', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default: return { label: 'مستلزمات عامة', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const handleMaterialClick = (material?: Material) => {
    if (material) {
      if (onNavigateToInventory) {
        onNavigateToInventory(material.id, material.name);
      } else {
        onNavigateTab('inventory');
      }
    } else {
      if (onNavigateToInventory) {
        onNavigateToInventory();
      } else {
        onNavigateTab('inventory');
      }
    }
  };

  // Active shift info
  const activeShift = useMemo(() => {
    return shifts.find(s => s.status === 'open');
  }, [shifts]);

  // Clocked-in staff right now
  const activeStaffMembers = useMemo(() => {
    return attendanceLogs.filter(l => l.date === todayStr && !l.clockOut);
  }, [attendanceLogs, todayStr]);

  // Top services in period
  const topServices = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    filteredOrders.forEach(o => {
      o.items?.forEach(item => {
        const current = map.get(item.service.name) || { name: item.service.name, count: 0, revenue: 0 };
        current.count += item.quantity;
        current.revenue += (item.customPrice ?? item.service.price) * item.quantity;
        map.set(item.service.name, current);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // Chart data: Last 7 days trend
  const trendChartData = useMemo(() => {
    const days: { dateLabel: string; revenue: number; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dStr = d.toISOString().split('T')[0];
      const dayOrders = orders.filter(o => o.createdAt.startsWith(dStr));
      const dayRev = dayOrders.reduce((sum, o) => sum + o.total, 0);
      const dayBOM = dayOrders.reduce((sum, o) => {
        if (typeof o.totalBOMCost === 'number') return sum + o.totalBOMCost;
        return sum + (o.items?.reduce((acc, it) => acc + (getItemUnitCost(it.service, materials) * it.quantity), 0) || 0);
      }, 0);
      const dayExp = expenses.filter(e => e.createdAt.startsWith(dStr)).reduce((s, e) => s + e.amount, 0);
      const dayWst = wasteRecords.filter(w => w.createdAt.startsWith(dStr)).reduce((s, w) => s + w.costLoss, 0);
      const dayNet = dayRev - dayBOM - dayExp - dayWst;

      const dateLabel = d.toLocaleDateString('ar-DZ', { weekday: 'short', day: 'numeric' });
      days.push({
        dateLabel,
        revenue: dayRev,
        profit: Math.max(0, dayNet)
      });
    }
    return days;
  }, [orders, materials, expenses, wasteRecords]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Executive Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#292A34] text-white">
              <LayoutDashboard className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#292A34]">لوحة التحكم والقيادة التنفيذية</h1>
                <span className="bg-[#E31C2B] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  /dashboard
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                نظرة شاملة ولحظية على المداخيل، الأرباح الصافية، المخزون، والورديات
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-[#F0F0F0] p-1.5 rounded-xl self-start md:self-auto">
          {[
            { id: 'today', label: 'اليوم' },
            { id: 'week', label: 'آخر 7 أيام' },
            { id: 'month', label: 'هذا الشهر' },
            { id: 'all', label: 'الكل' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as PeriodFilter)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === p.id
                  ? 'bg-white text-[#292A34] shadow-xs'
                  : 'text-slate-600 hover:text-[#292A34]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row (5 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Gross Revenue Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي المداخيل</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#292A34] font-mono">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{filteredOrders.length} طلبات مسجلة</span>
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">صافي الربح الفعلي</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
              {formatCurrency(netProfit)}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              هامش ربح تقديري: <span className="font-mono text-emerald-600 font-black">{profitMargin}%</span>
            </div>
          </div>
        </div>

        {/* Petty Cash Expenses Card (المصروفات النثرية والتشغيلية) */}
        <div 
          onClick={() => {
            const el = document.getElementById('dashboard-petty-expenses');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 cursor-pointer transition-all group"
          title="انقر للانتقال لسجل المصروفات النثرية"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المصروفات النثرية</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
              {formatCurrency(totalExpensesAmount)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 mt-1">
              <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
              <span>{filteredExpenses.length} سند صرف نثري</span>
            </div>
          </div>
        </div>

        {/* Cash in Drawer / Shift */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">السيولة بالصندوق</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#292A34] font-mono">
              {formatCurrency(activeShift?.calculatedCash || activeShift?.startingCash || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mt-1 truncate">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate">{activeShift ? `وردية (${activeShift.openedBy})` : 'لا توجد وردية'}</span>
            </div>
          </div>
        </div>

        {/* Critical Stock Alert */}
        <div 
          onClick={() => {
            const el = document.getElementById('dashboard-stock-alerts');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              handleMaterialClick();
            }
          }}
          className="bg-white border border-slate-200 hover:border-red-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">نواقص المخزن</span>
            <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${criticalMaterials.length > 0 ? 'bg-rose-50 text-[#E31C2B] animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#292A34] font-mono flex items-baseline gap-1.5">
              <span>{criticalMaterials.length}</span>
              <span className="text-[10px] font-normal text-slate-500">مواد تحت الحد</span>
            </div>
            <div className="text-[11px] font-bold text-[#E31C2B] group-hover:underline flex items-center gap-1 mt-1">
              <span>عرض النواقص</span>
              <ChevronRight className="w-3 h-3 rotate-180" />
            </div>
          </div>
        </div>

      </div>

      {/* Prominent Stock Alerts System Section */}
      <div id="dashboard-stock-alerts" className="scroll-mt-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${criticalMaterials.length > 0 ? 'bg-rose-600 text-white shadow-md' : 'bg-emerald-50 text-emerald-600'}`}>
              {criticalMaterials.length > 0 ? (
                <BellRing className="w-5 h-5 animate-bounce" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-[#292A34]">
                  نظام تنبيهات المخزون والمواد الحرجة
                </h2>
                {criticalMaterials.length > 0 ? (
                  <span className="bg-rose-100 text-[#E31C2B] border border-rose-200 text-xs font-black px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                    <span>{criticalMaterials.length} مواد تستدعي التوريد الفوري</span>
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                    المخزون مكتمل 100%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                متابعة دقيقة لمستوى استهلاك الأوراق والأحبار والكوادر تفادياً لتوقف عمليات الاستوديو والطباعة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleMaterialClick()}
              className="w-full sm:w-auto bg-[#292A34] hover:bg-[#373946] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Package className="w-4 h-4 text-amber-400" />
              <span>إدارة المخزن وإعادة التموين</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {criticalMaterials.length === 0 ? (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 text-center space-y-2.5">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-emerald-900">
              المخزون في حالة ممتازة ومكتملة
            </h3>
            <p className="text-xs text-emerald-700 max-w-lg mx-auto">
              جميع المواد والأوراق والأحبار والكوادر تفوق الحد الأدنى المحدد للمخزون في كلا الفرعين. لا توجد أي نواقص تشغيلية حالياً.
            </p>
            <div className="pt-1">
              <button
                onClick={() => onNavigateTab('inventory')}
                className="text-xs font-bold text-emerald-800 bg-white border border-emerald-300 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs"
              >
                فحص جرد المخزن بالكامل
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStockAlertFilter('all')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  stockAlertFilter === 'all'
                    ? 'bg-[#292A34] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                الكل ({criticalMaterials.length})
              </button>
              {outOfStockMaterials.length > 0 && (
                <button
                  onClick={() => setStockAlertFilter('out_of_stock')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    stockAlertFilter === 'out_of_stock'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>نفذت بالكامل ({outOfStockMaterials.length})</span>
                </button>
              )}
              {severelyLowMaterials.length > 0 && (
                <button
                  onClick={() => setStockAlertFilter('critical')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    stockAlertFilter === 'critical'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  حرجة جداً ({severelyLowMaterials.length})
                </button>
              )}
              {warningMaterials.length > 0 && (
                <button
                  onClick={() => setStockAlertFilter('warning')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    stockAlertFilter === 'warning'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  تحت الحد ({warningMaterials.length})
                </button>
              )}
            </div>

            {/* Alert Cards Grid with Touch-Optimized Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAlertMaterials.map((mat) => {
                const deficit = Math.max(0, mat.minThreshold - mat.currentStock);
                const estCost = deficit * (mat.unitCost || 0);
                const isOut = mat.currentStock <= 0;
                const isCritical = !isOut && mat.currentStock <= (mat.minThreshold * 0.5);
                const unitLabel = getUnitLabel(mat.unit);
                const categoryBadge = getCategoryBadge(mat.category);
                const percentage = Math.min(100, Math.max(0, Math.round((mat.currentStock / (mat.minThreshold || 1)) * 100)));

                return (
                  <div
                    key={mat.id}
                    onClick={() => handleMaterialClick(mat)}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer text-right group ${
                      isOut
                        ? 'bg-rose-50/70 border-rose-300 hover:border-rose-500 hover:shadow-md'
                        : isCritical
                        ? 'bg-amber-50/60 border-amber-300 hover:border-amber-500 hover:shadow-md'
                        : 'bg-white border-slate-200 hover:border-red-400 hover:shadow-md'
                    }`}
                  >
                    {/* Top status bar */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mb-1 ${categoryBadge.bg}`}>
                          {categoryBadge.label}
                        </span>
                        <h4 className="text-sm font-black text-[#292A34] truncate group-hover:text-[#E31C2B] transition-colors">
                          {mat.name}
                        </h4>
                        {mat.sku && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            SKU: {mat.sku}
                          </span>
                        )}
                      </div>

                      {isOut ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-black text-rose-700 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-full whitespace-nowrap shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                          <span>نفذ بالكامل</span>
                        </span>
                      ) : isCritical ? (
                        <span className="text-[11px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full whitespace-nowrap">
                          حرج جداً
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          تحت الحد
                        </span>
                      )}
                    </div>

                    {/* Stock Meter & Numbers */}
                    <div className="space-y-2 mt-3 pt-2.5 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold">المخزون الحالي:</span>
                        <span className={`font-mono font-black ${isOut ? 'text-rose-600' : 'text-[#292A34]'}`}>
                          {formatNumber(mat.currentStock)} {unitLabel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-500">
                        <span>الحد الأدنى المطلوب:</span>
                        <span className="font-mono font-bold text-slate-700">
                          {formatNumber(mat.minThreshold)} {unitLabel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between font-bold">
                        <span className="text-rose-600">العجز المطلوب توريده:</span>
                        <span className="font-mono font-black text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-md">
                          {formatNumber(deficit)} {unitLabel}
                        </span>
                      </div>

                      {/* Stock Level Bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOut
                              ? 'bg-rose-600'
                              : isCritical
                              ? 'bg-amber-500'
                              : 'bg-yellow-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {estCost > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>تكلفة التوريد المقدرة:</span>
                          <span className="font-mono font-bold text-slate-800">{formatCurrency(estCost)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action link */}
                    <div className="mt-3.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#E31C2B] group-hover:underline">
                      <span>انتقال للمخزن وتوريد المادة</span>
                      <ChevronLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-[#292A34] text-white rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="text-sm font-black">إجراءات سريعة وفورية:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('pos')}
            className="bg-[#E31C2B] hover:bg-[#c91422] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>نقطة البيع (POS)</span>
          </button>

          <button
            onClick={() => onNavigateTab('orders')}
            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>الطلبات والتذاكر</span>
          </button>

          {onOpenQuickExpense && (
            <button
              onClick={onOpenQuickExpense}
              className="bg-slate-700 hover:bg-slate-600 text-amber-300 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل مصروف</span>
            </button>
          )}

          {onOpenQuickWaste && (
            <button
              onClick={onOpenQuickWaste}
              className="bg-slate-700 hover:bg-slate-600 text-rose-300 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>تسجيل تالف</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('accounting')}
            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>المحاسبة والتقارير</span>
          </button>
        </div>
      </div>

      {/* Charts & Top Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 7-Day Revenue & Profit Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#E31C2B]" />
              <h2 className="text-sm font-black text-[#292A34]">تطور المداخيل وصافي الربح (آخر 7 أيام)</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">بالدينار الجزائري</span>
          </div>

          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    formatCurrency(Number(value)), 
                    name === 'revenue' ? 'المداخيل' : 'صافي الربح'
                  ]}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" name="المداخيل" fill="#292A34" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit" name="صافي الربح" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Services in Period */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#292A34]">الخدمات الأكثر طلباً</h2>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>

          {topServices.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              لا توجد مبيعات مسجلة في هذه الفترة
            </div>
          ) : (
            <div className="space-y-3">
              {topServices.map((svc, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#292A34] truncate max-w-[180px]">{svc.name}</span>
                    <span className="font-mono font-black text-[#E31C2B]">{formatCurrency(svc.revenue)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#292A34] h-full rounded-full" 
                      style={{ width: `${Math.min(100, Math.round((svc.revenue / (totalRevenue || 1)) * 100))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 text-left font-mono">
                    {svc.count} معاملة
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Grid: Recent Orders & On-Duty Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders List (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#292A34]" />
              <h2 className="text-sm font-black text-[#292A34]">آخر التذاكر والطلبات المسجلة</h2>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#E31C2B] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>عرض السجل الكامل</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          {/* Mobile Compact Orders Card View */}
          <div className="sm:hidden space-y-2.5">
            {orders.slice(0, 5).map(o => (
              <div
                key={o.id}
                onClick={() => setSelectedOrderForModal(o)}
                className="bg-slate-50/90 hover:bg-slate-100 p-3 rounded-xl border border-slate-200/80 transition-all cursor-pointer space-y-2 shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs bg-slate-200 px-2 py-0.5 rounded-md text-[#292A34]">
                      #{o.ticketNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatTime(o.createdAt)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    o.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-700'
                      : o.status === 'ready'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {o.status === 'delivered' ? 'تم التسليم' : o.status === 'ready' ? 'جاهز' : 'قيد المعالجة'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs font-bold text-slate-700 truncate max-w-[170px]">
                    {o.customerName || 'عميل نقدي'}
                    <span className="text-[10px] text-slate-400 font-normal mr-1.5">
                      ({o.items?.length || 0} بنود)
                    </span>
                  </div>
                  <div className="font-mono font-black text-sm text-[#292A34]">
                    {formatCurrency(o.total)}
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-[#E31C2B] font-bold">
                  <span>انقر لعرض تفاصيل التذكرة</span>
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto table-responsive-container">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold">
                  <th className="pb-2.5">رقم التذكرة</th>
                  <th className="pb-2.5">العميل</th>
                  <th className="pb-2.5">الوقت</th>
                  <th className="pb-2.5">المبلغ</th>
                  <th className="pb-2.5">الحالة</th>
                  <th className="pb-2.5 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map(o => (
                  <tr 
                    key={o.id} 
                    onClick={() => setSelectedOrderForModal(o)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 font-mono font-bold text-[#292A34]">
                      #{o.ticketNumber}
                    </td>
                    <td className="py-2.5 font-bold text-slate-700">
                      {o.customerName || 'عميل نقدي'}
                    </td>
                    <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                      {formatTime(o.createdAt)}
                    </td>
                    <td className="py-2.5 font-mono font-black text-[#292A34]">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-700'
                          : o.status === 'ready'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {o.status === 'delivered' ? 'تم التسليم' : o.status === 'ready' ? 'جاهز' : 'قيد المعالجة'}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderForModal(o);
                        }}
                        className="p-1 rounded-md text-slate-400 group-hover:text-[#E31C2B] group-hover:bg-red-50 transition-colors"
                        title="عرض تفاصيل التذكرة"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* On Duty Staff Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#292A34]" />
              <h2 className="text-sm font-black text-[#292A34]">طاقم العمل الحاضر</h2>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
              {activeStaffMembers.length} مداومين
            </span>
          </div>

          <div className="space-y-2.5">
            {allStaff.map(st => {
              const activeLog = attendanceLogs.find(l => l.staffId === st.id && l.date === todayStr && !l.clockOut);
              return (
                <div 
                  key={st.id} 
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">
                      {st.avatar || '👤'}
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#292A34]">{st.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {st.role === 'manager' ? 'مدير الاستوديو' : 'مصور ومسؤول طباعة'}
                      </div>
                    </div>
                  </div>

                  <div>
                    {activeLog ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>منذ {formatTime(activeLog.clockIn)}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        غير حاضر
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onNavigateTab('hr')}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors text-center block cursor-pointer"
          >
            إدارة الدوام وساعات العمل
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* DEDICATED PETTY CASH LEDGER SECTION (سجل المصروفات النثرية والتشغيلية)   */}
      {/* ========================================================================= */}
      <div id="dashboard-petty-expenses" className="scroll-mt-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#292A34]">سجل المصروفات النثرية والتشغيلية</h2>
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-md">
                  Petty Cash
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة وتوثيق كافة المصروفات النقدية المسحوبة من الصندوق والدرج لليوم والفترات السابقة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenQuickExpense && (
              <button
                onClick={onOpenQuickExpense}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="تسجيل مصروف نثري جديد"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ تسجيل مصروف نثري</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('accounting')}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="عرض التفاصيل في قسم المحاسبة والتقارير المالية"
            >
              <span>تفاصيل المحاسبة</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills & Summary Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#F9FAFB] p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'materials', label: 'مواد ومستلزمات' },
              { id: 'tea_coffee', label: 'ضيافة وشاي' },
              { id: 'maintenance', label: 'صيانة ونظافة' },
              { id: 'salary', label: 'سلف ورواتب' },
              { id: 'other', label: 'نثريات أخرى' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setExpenseCategoryFilter(cat.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  expenseCategoryFilter === cat.id
                    ? 'bg-[#292A34] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-[#292A34] border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 self-end md:self-auto">
            <span>
              إجمالي المعروض: <strong className="font-mono text-[#E31C2B] text-sm font-black">{formatCurrency(
                filteredExpenses
                  .filter(e => expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter)
                  .reduce((sum, e) => sum + (e.amount || 0), 0)
              )}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] font-mono">
              {filteredExpenses.filter(e => expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter).length} سند
            </span>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto table-responsive-container">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50/50">
                <th className="py-2.5 px-3">التاريخ والوقت</th>
                <th className="py-2.5 px-3">بيان المصروف النثري</th>
                <th className="py-2.5 px-3">التصنيف</th>
                <th className="py-2.5 px-3">المسؤول عن الصرف</th>
                <th className="py-2.5 px-3">الفرع</th>
                <th className="py-2.5 px-3">المبلغ (دج)</th>
                <th className="py-2.5 px-3">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses
                .filter(e => expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter)
                .length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-xs">لا توجد مصروفات نثرية مسجلة لهذه الفترة أو التصنيف.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses
                  .filter(e => expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter)
                  .map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDate(exp.createdAt)}
                      </td>
                      <td className="py-3 px-3 font-black text-slate-800">
                        {exp.title}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                          exp.category === 'materials'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : exp.category === 'tea_coffee'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : exp.category === 'maintenance'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : exp.category === 'salary'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {exp.category === 'materials' ? 'مواد ومستلزمات' : exp.category === 'tea_coffee' ? 'شاي وقهوة' : exp.category === 'maintenance' ? 'صيانة ونظافة' : exp.category === 'salary' ? 'رواتب' : 'نثريات عامة'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-700 whitespace-nowrap">
                        {exp.staffName || 'طاقم العمل'}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {exp.storeName || (exp.storeId === 'store_labhour' ? 'الأبحور' : 'سيدي عامر')}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-[#E31C2B] text-sm whitespace-nowrap">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[200px] truncate">
                        {exp.notes || '-'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal for Mobile Touch & Quick Inspection */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-slate-100 rounded-xl text-[#292A34]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#292A34]">
                    تفاصيل التذكرة #{selectedOrderForModal.ticketNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formatDate(selectedOrderForModal.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Status Bar */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">العميل:</span>
                <span className="font-bold text-slate-800">{selectedOrderForModal.customerName || 'عميل نقدي'}</span>
                {selectedOrderForModal.customerPhone && (
                  <span className="block text-[11px] font-mono text-slate-500 mt-0.5">
                    {selectedOrderForModal.customerPhone}
                  </span>
                )}
              </div>
              <div className="text-left">
                <span className="text-slate-400 block text-[10px]">حالة التذكرة:</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                  selectedOrderForModal.status === 'delivered'
                    ? 'bg-emerald-100 text-emerald-700'
                    : selectedOrderForModal.status === 'ready'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {selectedOrderForModal.status === 'delivered' ? 'تم التسليم' : selectedOrderForModal.status === 'ready' ? 'جاهز للتسليم' : 'قيد المعالجة'}
                </span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-600">الخدمات والسلع المشمولة ({selectedOrderForModal.items?.length || 0}):</h4>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {selectedOrderForModal.items?.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-black text-slate-800">{item.service.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.quantity} × {formatCurrency(item.customPrice ?? item.service.price)}
                      </div>
                    </div>
                    <div className="font-mono font-black text-[#292A34]">
                      {formatCurrency((item.customPrice ?? item.service.price) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Payment */}
            <div className="p-3.5 rounded-xl bg-[#292A34] text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 block">الإجمالي الكلي للتذكرة:</span>
                <span className="text-xs text-slate-400">
                  طريقة الدفع: {selectedOrderForModal.paymentMethod === 'cash' ? 'نقداً' : selectedOrderForModal.paymentMethod === 'card' ? 'بطاقة بنكية' : 'تحويل'}
                </span>
              </div>
              <div className="text-xl font-mono font-black text-amber-300">
                {formatCurrency(selectedOrderForModal.total)}
              </div>
            </div>

            {selectedOrderForModal.notes && (
              <div className="text-xs text-slate-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-800">ملاحظات: </span>
                {selectedOrderForModal.notes}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedOrderForModal(null);
                  onNavigateTab('orders');
                }}
                className="flex-1 py-2.5 bg-[#E31C2B] hover:bg-[#c91422] text-white text-xs font-bold rounded-xl transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Receipt className="w-4 h-4" />
                <span>فتح في شاشة الطلبات</span>
              </button>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
