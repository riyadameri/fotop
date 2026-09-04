import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Layers, 
  Wallet, 
  AlertOctagon, 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  Sparkles, 
  PieChart as PieIcon, 
  BarChart3, 
  Receipt,
  Eye,
  Percent,
  Calculator
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { Order, Material, WasteRecord, Expense, Staff } from '../../types';
import { formatCurrency, formatDate, formatTime, exportToCSV, getItemUnitCost } from '../../utils/formatters';

interface ProfitBreakdownViewProps {
  orders: Order[];
  materials: Material[];
  wasteRecords: WasteRecord[];
  expenses: Expense[];
  allStaff?: Staff[];
  onAddExpense?: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export const getOrderTotalBOMCost = (o: Order, mats: Material[] = []): number => {
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

export const ProfitBreakdownView: React.FC<ProfitBreakdownViewProps> = ({
  orders = [],
  materials = [],
  wasteRecords = [],
  expenses = [],
  allStaff = []
}) => {
  // Mode: Daily vs Monthly
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  // Selected date for daily detailed breakdown
  const todayISO = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  // Selected month for monthly breakdown (format: YYYY-MM)
  const currentMonthISO = todayISO.substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthISO);

  // Filter for specific staff if manager wants to inspect a single worker or all
  const [staffFilter, setStaffFilter] = useState<string>('all');

  // Active detail modal for inspecting single day details
  const [inspectDayDate, setInspectDayDate] = useState<string | null>(null);

  // =========================================================================
  // 1. DAILY CALCULATIONS FOR THE SELECTED DATE
  // =========================================================================
  const dailyData = useMemo(() => {
    const dayOrders = orders.filter(o => {
      const matchesDate = o.createdAt.startsWith(selectedDate);
      const matchesStaff = staffFilter === 'all' || o.staffId === staffFilter;
      return matchesDate && matchesStaff;
    });

    const dayExpenses = expenses.filter(e => {
      const matchesDate = e.createdAt.startsWith(selectedDate);
      const matchesStaff = staffFilter === 'all' || e.staffId === staffFilter;
      return matchesDate && matchesStaff;
    });

    const dayWaste = wasteRecords.filter(w => {
      const matchesDate = w.createdAt.startsWith(selectedDate);
      const matchesStaff = staffFilter === 'all' || w.staffId === staffFilter;
      return matchesDate && matchesStaff;
    });

    const grossRevenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
    const bomCost = dayOrders.reduce((sum, o) => sum + getOrderTotalBOMCost(o, materials), 0);
    const expensesTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const wasteLoss = dayWaste.reduce((sum, w) => sum + w.costLoss, 0);
    const netProfit = grossRevenue - bomCost - expensesTotal - wasteLoss;
    const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

    // Materials consumed breakdown
    const matUsageMap: Record<string, { materialName: string; quantity: number; unit: string; totalCost: number }> = {};
    for (const o of dayOrders) {
      if (o.materialsDeducted && o.materialsDeducted.length > 0) {
        for (const m of o.materialsDeducted) {
          if (!matUsageMap[m.materialId]) {
            const matObj = materials.find(x => x.id === m.materialId);
            matUsageMap[m.materialId] = {
              materialName: m.materialName || matObj?.name || 'مادة مستهلكة',
              quantity: 0,
              unit: m.unit || matObj?.unit || 'وحدة',
              totalCost: 0
            };
          }
          matUsageMap[m.materialId].quantity += m.quantity;
          matUsageMap[m.materialId].totalCost += m.cost;
        }
      }
    }

    return {
      orders: dayOrders,
      expenses: dayExpenses,
      waste: dayWaste,
      ordersCount: dayOrders.length,
      grossRevenue,
      bomCost,
      expensesTotal,
      wasteLoss,
      netProfit,
      profitMargin,
      materialsConsumed: Object.values(matUsageMap)
    };
  }, [orders, expenses, wasteRecords, materials, selectedDate, staffFilter]);

  // =========================================================================
  // 2. MONTHLY CALCULATIONS FOR THE SELECTED MONTH
  // =========================================================================
  const monthlyData = useMemo(() => {
    const monthOrders = orders.filter(o => {
      const matchesMonth = o.createdAt.startsWith(selectedMonth);
      const matchesStaff = staffFilter === 'all' || o.staffId === staffFilter;
      return matchesMonth && matchesStaff;
    });

    const monthExpenses = expenses.filter(e => {
      const matchesMonth = e.createdAt.startsWith(selectedMonth);
      const matchesStaff = staffFilter === 'all' || e.staffId === staffFilter;
      return matchesMonth && matchesStaff;
    });

    const monthWaste = wasteRecords.filter(w => {
      const matchesMonth = w.createdAt.startsWith(selectedMonth);
      const matchesStaff = staffFilter === 'all' || w.staffId === staffFilter;
      return matchesMonth && matchesStaff;
    });

    const grossRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0);
    const bomCost = monthOrders.reduce((sum, o) => sum + getOrderTotalBOMCost(o, materials), 0);
    const expensesTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const wasteLoss = monthWaste.reduce((sum, w) => sum + w.costLoss, 0);
    const netProfit = grossRevenue - bomCost - expensesTotal - wasteLoss;
    const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

    return {
      orders: monthOrders,
      expenses: monthExpenses,
      waste: monthWaste,
      ordersCount: monthOrders.length,
      grossRevenue,
      bomCost,
      expensesTotal,
      wasteLoss,
      netProfit,
      profitMargin
    };
  }, [orders, expenses, wasteRecords, materials, selectedMonth, staffFilter]);

  // =========================================================================
  // 3. DAILY LEDGER MATRIX (Days of Selected Month breakdown)
  // =========================================================================
  const monthDailyMatrix = useMemo(() => {
    // Generate days in selectedMonth
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-12
    const daysInMonth = new Date(year, month, 0).getDate();

    const daysList = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayFormatted = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      
      const dayOrders = orders.filter(o => {
        const match = o.createdAt.startsWith(dayFormatted);
        const matchStaff = staffFilter === 'all' || o.staffId === staffFilter;
        return match && matchStaff;
      });

      const dayExpenses = expenses.filter(e => {
        const match = e.createdAt.startsWith(dayFormatted);
        const matchStaff = staffFilter === 'all' || e.staffId === staffFilter;
        return match && matchStaff;
      });

      const dayWaste = wasteRecords.filter(w => {
        const match = w.createdAt.startsWith(dayFormatted);
        const matchStaff = staffFilter === 'all' || w.staffId === staffFilter;
        return match && matchStaff;
      });

      const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
      const bom = dayOrders.reduce((sum, o) => sum + getOrderTotalBOMCost(o, materials), 0);
      const exp = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      const wst = dayWaste.reduce((sum, w) => sum + w.costLoss, 0);
      const net = revenue - bom - exp - wst;
      const margin = revenue > 0 ? Math.round((net / revenue) * 100) : 0;

      const dateObj = new Date(`${dayFormatted}T12:00:00`);
      const dayName = dateObj.toLocaleDateString('ar-DZ', { weekday: 'short' });

      daysList.push({
        date: dayFormatted,
        dayNum: day,
        dayName,
        label: `${dayName} ${day}/${month}`,
        ordersCount: dayOrders.length,
        revenue,
        bomCost: bom,
        expenses: exp,
        waste: wst,
        netProfit: net,
        margin
      });
    }

    return daysList;
  }, [selectedMonth, orders, expenses, wasteRecords, materials, staffFilter]);

  // Chart data for daily matrix (filter out days with 0 activity if desired or show full range)
  const chartDailyData = useMemo(() => {
    return monthDailyMatrix.map(d => ({
      name: `${d.dayNum}`,
      fullDate: d.label,
      'المبيعات': d.revenue,
      'تكلفة المواد': d.bomCost,
      'المصاريف': d.expenses,
      'صافي الربح': d.netProfit
    }));
  }, [monthDailyMatrix]);

  // =========================================================================
  // 4. HISTORICAL MONTHLY MATRIX (Last 12 Months Comparison)
  // =========================================================================
  const historicalMonthsMatrix = useMemo(() => {
    const list = [];
    const curr = new Date();
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(curr.getFullYear(), curr.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mLabel = d.toLocaleDateString('ar-DZ', { month: 'long', year: 'numeric' });

      const mOrders = orders.filter(o => {
        const match = o.createdAt.startsWith(mStr);
        const matchStaff = staffFilter === 'all' || o.staffId === staffFilter;
        return match && matchStaff;
      });

      const mExpenses = expenses.filter(e => {
        const match = e.createdAt.startsWith(mStr);
        const matchStaff = staffFilter === 'all' || e.staffId === staffFilter;
        return match && matchStaff;
      });

      const mWaste = wasteRecords.filter(w => {
        const match = w.createdAt.startsWith(mStr);
        const matchStaff = staffFilter === 'all' || w.staffId === staffFilter;
        return match && matchStaff;
      });

      const revenue = mOrders.reduce((sum, o) => sum + o.total, 0);
      const bom = mOrders.reduce((sum, o) => sum + getOrderTotalBOMCost(o, materials), 0);
      const exp = mExpenses.reduce((sum, e) => sum + e.amount, 0);
      const wst = mWaste.reduce((sum, w) => sum + w.costLoss, 0);
      const net = revenue - bom - exp - wst;
      const margin = revenue > 0 ? Math.round((net / revenue) * 100) : 0;

      list.push({
        monthStr: mStr,
        monthLabel: mLabel,
        ordersCount: mOrders.length,
        revenue,
        bomCost: bom,
        expenses: exp,
        waste: wst,
        netProfit: net,
        margin
      });
    }

    return list;
  }, [orders, expenses, wasteRecords, materials, staffFilter]);

  // Historical Chart data
  const chartMonthlyData = useMemo(() => {
    return [...historicalMonthsMatrix].reverse().map(m => ({
      name: m.monthLabel.split(' ')[0], // Month name
      'المبيعات': m.revenue,
      'تكلفة المواد': m.bomCost,
      'المصاريف': m.expenses,
      'صافي الربح': m.netProfit
    }));
  }, [historicalMonthsMatrix]);

  // =========================================================================
  // EXPORT TO CSV HANDLERS
  // =========================================================================
  const handleExportDailyMatrixCSV = () => {
    const data = monthDailyMatrix.map(d => ({
      'التاريخ': d.date,
      'اليوم': d.dayName,
      'عدد الطلبات': d.ordersCount,
      'إجمالي المبيعات (دج)': d.revenue,
      'تكلفة المواد المستهلكة آلياً BOM (دج)': d.bomCost,
      'المصروفات التشغيلية (دج)': d.expenses,
      'خسائر التالف (دج)': d.waste,
      'صافي الربح اليومي (دج)': d.netProfit,
      'هامش الربح (%)': `${d.margin}%`
    }));
    exportToCSV(`تقرير_صافي_الأرباح_اليومية_${selectedMonth}`, data);
  };

  const handleExportMonthlyMatrixCSV = () => {
    const data = historicalMonthsMatrix.map(m => ({
      'الشهر': m.monthLabel,
      'الرمز': m.monthStr,
      'عدد الطلبات': m.ordersCount,
      'إجمالي مبيعات الشهر (دج)': m.revenue,
      'تكلفة المواد المستهلكة آلياً (دج)': m.bomCost,
      'المصروفات التشغيلية (دج)': m.expenses,
      'خسائر التالف (دج)': m.waste,
      'صافي الربح الشهري (دج)': m.netProfit,
      'هامش الربح (%)': `${m.margin}%`
    }));
    exportToCSV(`تقرير_صافي_الأرباح_الشهرية_${new Date().getFullYear()}`, data);
  };

  // Inspect day details helper
  const inspectedDayDetails = useMemo(() => {
    if (!inspectDayDate) return null;
    return monthDailyMatrix.find(d => d.date === inspectDayDate) || null;
  }, [inspectDayDate, monthDailyMatrix]);

  return (
    <div className="space-y-6">
      
      {/* =====================================================================
          HEADER & TOGGLE BAR: DAILY VS MONTHLY
      ===================================================================== */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#292A34] flex items-center gap-2">
                  <span>لوحة صافي الأرباح اليومية والشهرية</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                    حساب آلي دقيق لـ BOM والمصاريف
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  معادلة المحاسبة الآلية: <strong className="text-[#292A34]">صافي الربح = إجمالي المبيعات - تكلفة المواد المستهلكة (BOM) - إجمالي المصاريف التشغيلية - التالف</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-[#F0F0F0] p-1.5 rounded-2xl border border-slate-200 self-start lg:self-auto">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'daily'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-700 hover:text-[#292A34] hover:bg-white/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>الأرباح اليومية (Daily Net Profit)</span>
            </button>

            <button
              onClick={() => setViewMode('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-700 hover:text-[#292A34] hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>الأرباح الشهرية (Monthly Net Profit)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {viewMode === 'daily' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#E31C2B]" /> اختر اليوم:
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-[#292A34] font-mono font-bold focus:outline-none focus:border-emerald-600 cursor-pointer"
                />
                <button
                  onClick={() => setSelectedDate(todayISO)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold cursor-pointer"
                >
                  اليوم الحالي
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> اختر الشهر:
                </span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-[#292A34] font-mono font-bold focus:outline-none focus:border-emerald-600 cursor-pointer"
                />
                <button
                  onClick={() => setSelectedMonth(currentMonthISO)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold cursor-pointer"
                >
                  الشهر الحالي
                </button>
              </div>
            )}

            {/* Staff Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">تصفية بالعامل:</span>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-[#292A34] font-bold focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="all">جميع العمال والمدير (الكل)</option>
                {allStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role === 'manager' ? 'مدير' : 'عامل'})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={viewMode === 'daily' ? handleExportDailyMatrixCSV : handleExportMonthlyMatrixCSV}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>تصدير {viewMode === 'daily' ? 'الأرباح اليومية' : 'الأرباح الشهرية'} Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION A: DAILY BREAKDOWN VIEW (الأرباح اليومية)
      ===================================================================== */}
      {viewMode === 'daily' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Main Equation & Summary for the Selected Day */}
          <div className="bg-gradient-to-br from-[#292A34] to-[#1c1d24] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="relative z-10 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                    ملخص صافي أرباح يوم: {selectedDate}
                  </span>
                  <h3 className="text-xl font-black mt-2">
                    تفصيل الحساب الرياضي لصافي الربح اليومي
                  </h3>
                </div>
                
                <div className="text-left bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                  <span className="text-[10px] text-slate-300 block">الطلبات المنجزة في اليوم</span>
                  <span className="text-lg font-black text-white font-mono">{dailyData.ordersCount} طلبات</span>
                </div>
              </div>

              {/* 5-Step Equation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                
                {/* 1. Gross Revenue */}
                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-sky-400" /> إجمالي مبيعات الطلبات
                    </span>
                    <div className="text-xl font-black text-white mt-1 font-mono">
                      +{formatCurrency(dailyData.grossRevenue)}
                    </div>
                  </div>
                  <span className="text-[10px] text-sky-300 font-medium mt-2">دخل الاستوديو الإجمالي</span>
                </div>

                {/* 2. Materials BOM */}
                <div className="bg-rose-950/40 p-4 rounded-2xl border border-rose-500/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-rose-400" /> (-) تكلفة المواد المستهلكة
                    </span>
                    <div className="text-xl font-black text-rose-300 mt-1 font-mono">
                      -{formatCurrency(dailyData.bomCost)}
                    </div>
                  </div>
                  <span className="text-[10px] text-rose-200/70 font-medium mt-2">حساب آلي للورق والأحبار (BOM)</span>
                </div>

                {/* 3. Expenses */}
                <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-500/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-amber-400" /> (-) المصروفات اليومية
                    </span>
                    <div className="text-xl font-black text-amber-300 mt-1 font-mono">
                      -{formatCurrency(dailyData.expensesTotal)}
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-200/70 font-medium mt-2">{dailyData.expenses.length} مصروفات مسجلة</span>
                </div>

                {/* 4. Waste Loss */}
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5 text-amber-500" /> (-) خسائر التالف
                    </span>
                    <div className="text-xl font-black text-slate-300 mt-1 font-mono">
                      -{formatCurrency(dailyData.wasteLoss)}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2">هدر طباعة وقص اليوم</span>
                </div>

                {/* 5. NET PROFIT */}
                <div className="bg-emerald-950/80 p-4 rounded-2xl border-2 border-emerald-400 flex flex-col justify-between shadow-lg shadow-emerald-950/50">
                  <div>
                    <span className="text-[11px] font-black text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> (=) صافي الربح اليومي
                    </span>
                    <div className={`text-2xl font-black mt-1 font-mono tracking-tight ${dailyData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {dailyData.netProfit >= 0 ? '+' : ''}{formatCurrency(dailyData.netProfit)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-300">هامش الربح:</span>
                    <span className="font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded font-mono">
                      %{dailyData.profitMargin}
                    </span>
                  </div>
                </div>

              </div>

              {/* Automatic BOM Material Consumption Inspector for Selected Day */}
              {dailyData.materialsConsumed.length > 0 && (
                <div className="bg-black/30 rounded-2xl p-4 border border-white/10 space-y-2">
                  <div className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>المواد الخام المستهلكة آلياً في طلبات اليوم المحددة ({dailyData.materialsConsumed.length} أصناف):</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {dailyData.materialsConsumed.map((m, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs">
                        <div className="font-bold text-white truncate">{m.materialName}</div>
                        <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                          {m.quantity.toFixed(1)} {m.unit}
                        </div>
                        <div className="text-[10px] text-rose-300 font-mono font-bold mt-0.5">
                          -{formatCurrency(m.totalCost)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Daily Trend Chart over the Month */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-[#292A34]">منحنى الأرباح والمبيعات اليومية خلال شهر ({selectedMonth})</h3>
                <p className="text-xs text-slate-500">متابعة يومية لتطور المبيعات مقابل تكلفة المواد والمصاريف وصافي الربح</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl font-mono">
                {monthDailyMatrix.length} يوماً في الشهر
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartDailyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} دج`} />
                  <Tooltip 
                    formatter={(val: any) => [`${formatCurrency(Number(val))}`, '']}
                    contentStyle={{ backgroundColor: '#292A34', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="المبيعات" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="تكلفة المواد" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="المصاريف" fill="#d97706" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="صافي الربح" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Ledger Matrix Table (Days of the Month) */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#292A34]">
                  سجل الأرباح اليومية التفصيلي لشهر ({selectedMonth})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  جدول يوم بيوم يوضح مبيعات كل يوم، المواد المستهلكة، المصاريف، وصافي الربح المحقق
                </p>
              </div>

              <button
                onClick={handleExportDailyMatrixCSV}
                className="px-3 py-1.5 bg-[#F0F0F0] hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>تصدير السجل اليومي كملف Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 z-10 bg-[#292A34] text-white font-bold">
                  <tr>
                    <th className="p-3 rounded-r-xl">اليوم والتاريخ</th>
                    <th className="p-3 text-center">الطلبات</th>
                    <th className="p-3">إجمالي المبيعات</th>
                    <th className="p-3">تكلفة المواد (BOM)</th>
                    <th className="p-3">المصاريف التشغيلية</th>
                    <th className="p-3">التالف والهدر</th>
                    <th className="p-3 text-center">صافي الربح اليومي</th>
                    <th className="p-3 text-center">الهامش (%)</th>
                    <th className="p-3 text-center rounded-l-xl">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {monthDailyMatrix.map(d => {
                    const isSelected = d.date === selectedDate;
                    const isToday = d.date === todayISO;
                    return (
                      <tr 
                        key={d.date} 
                        className={`transition-colors ${
                          isSelected 
                            ? 'bg-emerald-50/90 font-bold border-r-4 border-emerald-600' 
                            : isToday 
                              ? 'bg-sky-50/50 hover:bg-sky-50' 
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3 font-bold text-[#292A34]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-700">{d.date}</span>
                            <span className="text-[11px] text-slate-500 font-normal">({d.dayName})</span>
                            {isToday && (
                              <span className="bg-sky-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                                اليوم
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-[#292A34]">
                          {d.ordersCount > 0 ? (
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg">
                              {d.ordersCount} طلب
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-black text-[#292A34]">
                          {d.revenue > 0 ? formatCurrency(d.revenue) : <span className="text-slate-300">0 دج</span>}
                        </td>
                        <td className="p-3 font-mono text-rose-600 font-bold">
                          {d.bomCost > 0 ? `-${formatCurrency(d.bomCost)}` : <span className="text-slate-300">0 دج</span>}
                        </td>
                        <td className="p-3 font-mono text-amber-600 font-bold">
                          {d.expenses > 0 ? `-${formatCurrency(d.expenses)}` : <span className="text-slate-300">0 دج</span>}
                        </td>
                        <td className="p-3 font-mono text-slate-500 font-bold">
                          {d.waste > 0 ? `-${formatCurrency(d.waste)}` : <span className="text-slate-300">0 دج</span>}
                        </td>
                        <td className="p-3 text-center font-mono font-black">
                          {d.revenue > 0 || d.expenses > 0 ? (
                            <span className={`px-2.5 py-1 rounded-xl text-xs inline-block font-mono ${
                              d.netProfit >= 0 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {d.netProfit >= 0 ? '+' : ''}{formatCurrency(d.netProfit)}
                            </span>
                          ) : (
                            <span className="text-slate-300">0 دج</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          {d.revenue > 0 ? (
                            <span className={`text-[11px] ${d.margin >= 50 ? 'text-emerald-600' : d.margin >= 20 ? 'text-amber-600' : 'text-rose-600'}`}>
                              %{d.margin}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedDate(d.date);
                              setInspectDayDate(d.date);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1 mx-auto"
                          >
                            <Eye className="w-3 h-3 text-emerald-600" />
                            <span>عرض وتحديد</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =====================================================================
          SECTION B: MONTHLY BREAKDOWN VIEW (الأرباح الشهرية)
      ===================================================================== */}
      {viewMode === 'monthly' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Main Equation & Summary for the Selected Month */}
          <div className="bg-gradient-to-br from-[#1a2e26] to-[#0f1f1a] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border-2 border-emerald-600/50">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="relative z-10 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-black text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                    ملخص صافي أرباح شهر: {selectedMonth}
                  </span>
                  <h3 className="text-xl font-black mt-2">
                    تفصيل الحساب الرياضي لصافي الربح الشهري
                  </h3>
                </div>
                
                <div className="text-left bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                  <span className="text-[10px] text-slate-300 block">إجمالي طلبات الشهر</span>
                  <span className="text-lg font-black text-emerald-300 font-mono">{monthlyData.ordersCount} طلبات</span>
                </div>
              </div>

              {/* 5-Step Equation Cards for Month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                
                {/* 1. Gross Revenue */}
                <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-sky-400" /> إجمالي مبيعات طلبات الشهر
                    </span>
                    <div className="text-xl font-black text-white mt-1 font-mono">
                      +{formatCurrency(monthlyData.grossRevenue)}
                    </div>
                  </div>
                  <span className="text-[10px] text-sky-300 font-medium mt-2">مجموع دخل كافة طلبات الشهر</span>
                </div>

                {/* 2. Materials BOM */}
                <div className="bg-rose-950/40 p-4 rounded-2xl border border-rose-500/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-rose-400" /> (-) تكلفة المواد المستهلكة للشهر
                    </span>
                    <div className="text-xl font-black text-rose-300 mt-1 font-mono">
                      -{formatCurrency(monthlyData.bomCost)}
                    </div>
                  </div>
                  <span className="text-[10px] text-rose-200/70 font-medium mt-2">حساب آلي لجميع المواد (BOM)</span>
                </div>

                {/* 3. Expenses */}
                <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-500/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-amber-400" /> (-) المصروفات الشهرية الكلية
                    </span>
                    <div className="text-xl font-black text-amber-300 mt-1 font-mono">
                      -{formatCurrency(monthlyData.expensesTotal)}
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-200/70 font-medium mt-2">{monthlyData.expenses.length} مصروفات مسجلة</span>
                </div>

                {/* 4. Waste Loss */}
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5 text-amber-500" /> (-) خسائر التالف والهدر
                    </span>
                    <div className="text-xl font-black text-slate-300 mt-1 font-mono">
                      -{formatCurrency(monthlyData.wasteLoss)}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-2">هدر وتالف الشهر</span>
                </div>

                {/* 5. NET PROFIT */}
                <div className="bg-emerald-900/90 p-4 rounded-2xl border-2 border-emerald-400 flex flex-col justify-between shadow-xl shadow-emerald-950/60">
                  <div>
                    <span className="text-[11px] font-black text-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> (=) صافي الربح الشهري الفعلي
                    </span>
                    <div className={`text-2xl font-black mt-1 font-mono tracking-tight ${monthlyData.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                      {monthlyData.netProfit >= 0 ? '+' : ''}{formatCurrency(monthlyData.netProfit)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-200">هامش الربح الشهري:</span>
                    <span className="font-bold text-emerald-200 bg-emerald-950/80 px-2 py-0.5 rounded font-mono">
                      %{monthlyData.profitMargin}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Historical Monthly Comparison Chart */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-[#292A34]">مقارنة تطور صافي الأرباح الشهرية (آخر 12 شهراً)</h3>
                <p className="text-xs text-slate-500">تحليل مقارن للمبيعات، التكاليف، وصافي الأرباح شهراً بشهر</p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartMonthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} دج`} />
                  <Tooltip 
                    formatter={(val: any) => [`${formatCurrency(Number(val))}`, '']}
                    contentStyle={{ backgroundColor: '#292A34', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="المبيعات" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="تكلفة المواد" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="المصاريف" fill="#d97706" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="صافي الربح" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historical Monthly Comparison Table */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#292A34]">
                  جدول مقارنة الأرباح الشهرية (Monthly Historical Ledger)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  جدول مقارنة شامل لكل شهر: المبيعات، تكلفة المواد، المصاريف التشغيلية، وصافي الربح الشهري المحقق
                </p>
              </div>

              <button
                onClick={handleExportMonthlyMatrixCSV}
                className="px-3 py-1.5 bg-[#F0F0F0] hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>تصدير السجل الشهري كملف Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#292A34] text-white font-bold">
                  <tr>
                    <th className="p-3 rounded-r-xl">الشهر والسنة</th>
                    <th className="p-3 text-center">الطلبات المنجزة</th>
                    <th className="p-3">إجمالي مبيعات الشهر</th>
                    <th className="p-3">تكلفة المواد (BOM)</th>
                    <th className="p-3">المصروفات الشهرية</th>
                    <th className="p-3">خسائر التالف</th>
                    <th className="p-3 text-center">صافي الربح الشهري</th>
                    <th className="p-3 text-center">هامش الربح (%)</th>
                    <th className="p-3 text-center rounded-l-xl">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {historicalMonthsMatrix.map(m => {
                    const isSelected = m.monthStr === selectedMonth;
                    return (
                      <tr 
                        key={m.monthStr} 
                        className={`transition-colors ${
                          isSelected 
                            ? 'bg-emerald-50/90 font-bold border-r-4 border-emerald-600' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3 font-bold text-[#292A34]">
                          <div className="flex items-center gap-2">
                            <span>{m.monthLabel}</span>
                            <span className="font-mono text-xs text-slate-500">({m.monthStr})</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-[#292A34]">
                          {m.ordersCount > 0 ? (
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg">
                              {m.ordersCount} طلب
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-black text-[#292A34]">
                          {m.revenue > 0 ? formatCurrency(m.revenue) : <span className="text-slate-300">0 دج</span>}
                        </td>
                        <td className="p-3 font-mono text-rose-600 font-bold">
                          {m.bomCost > 0 ? `-${formatCurrency(m.bomCost)}` : <span className="text-slate-300">0 دج</span>}
                        </td>
                        <td className="p-3 font-mono text-amber-600 font-bold">
                          {m.expenses > 0 ? `-${formatCurrency(m.expenses)}` : <span className="text-slate-300">0 دج</span>}
                        </td>
                        <td className="p-3 font-mono text-slate-500 font-bold">
                          {m.waste > 0 ? `-${formatCurrency(m.waste)}` : <span className="text-slate-300">0 دج</span>}
                        </td>
                        <td className="p-3 text-center font-mono font-black">
                          {m.revenue > 0 || m.expenses > 0 ? (
                            <span className={`px-2.5 py-1 rounded-xl text-xs inline-block font-mono ${
                              m.netProfit >= 0 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {m.netProfit >= 0 ? '+' : ''}{formatCurrency(m.netProfit)}
                            </span>
                          ) : (
                            <span className="text-slate-300">0 دج</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          {m.revenue > 0 ? (
                            <span className={`text-[11px] ${m.margin >= 50 ? 'text-emerald-600' : m.margin >= 20 ? 'text-amber-600' : 'text-rose-600'}`}>
                              %{m.margin}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedMonth(m.monthStr)}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1 mx-auto"
                          >
                            <Calendar className="w-3 h-3 text-emerald-600" />
                            <span>اختيار الشهر</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
