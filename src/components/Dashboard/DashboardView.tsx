import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
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
  ChevronRight, 
  BarChart3, 
  Calendar,
  AlertTriangle
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
import { formatCurrency, formatDate, formatTime, getItemUnitCost } from '../../utils/formatters';

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
  onOpenQuickExpense,
  onOpenQuickWaste
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('today');

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

      {/* KPI Cards Row (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي المداخيل</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#292A34] font-mono">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{filteredOrders.length} طلبات مسجلة</span>
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">صافي الربح الفعلي</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {formatCurrency(netProfit)}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1">
              هامش ربح تقديري: <span className="font-mono text-emerald-600 font-black">{profitMargin}%</span>
            </div>
          </div>
        </div>

        {/* Cash in Drawer / Shift */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">السيولة الحالية بالصندوق</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#292A34] font-mono">
              {formatCurrency(activeShift?.calculatedCash || activeShift?.startingCash || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mt-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{activeShift ? `وردية مفتوحة (${activeShift.openedBy})` : 'لا توجد وردية مفتوحة'}</span>
            </div>
          </div>
        </div>

        {/* Critical Stock Alert */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">تنبيهات المخزن والورق</span>
            <div className={`p-2 rounded-xl ${criticalMaterials.length > 0 ? 'bg-rose-50 text-[#E31C2B] animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#292A34] font-mono">
              {criticalMaterials.length} <span className="text-xs font-normal text-slate-500">مواد حرجة</span>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-[11px] font-bold text-[#E31C2B] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
            >
              <span>فتح شاشة المخزون وإعادة التموين</span>
              <ChevronRight className="w-3 h-3 rotate-180" />
            </button>
          </div>
        </div>

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

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold">
                  <th className="pb-2.5">رقم التذكرة</th>
                  <th className="pb-2.5">العميل</th>
                  <th className="pb-2.5">الوقت</th>
                  <th className="pb-2.5">المبلغ</th>
                  <th className="pb-2.5">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
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

    </div>
  );
};
