import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Layers, 
  AlertOctagon, 
  Calendar,
  Building2,
  ShieldCheck,
  UserCheck,
  Filter
} from 'lucide-react';
import { Order, Material, WasteRecord, Expense, Staff } from '../../types';
import { formatCurrency, formatDate, formatTime, getItemUnitCost } from '../../utils/formatters';

interface AccountingReportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  materials: Material[];
  wasteRecords: WasteRecord[];
  expenses: Expense[];
  allStaff: Staff[];
  currentStaff: Staff;
  initialStartDate?: string;
  initialEndDate?: string;
}

export const AccountingReportPDFModal: React.FC<AccountingReportPDFModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  materials = [],
  wasteRecords = [],
  expenses = [],
  allStaff = [],
  currentStaff,
  initialStartDate,
  initialEndDate
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // Timeframe presets
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [periodPreset, setPeriodPreset] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('month');
  const [startDate, setStartDate] = useState<string>(initialStartDate || todayStr.substring(0, 7) + '-01');
  const [endDate, setEndDate] = useState<string>(initialEndDate || todayStr);

  // Display toggles
  const [includeExpensesList, setIncludeExpensesList] = useState(true);
  const [includeStaffBreakdown, setIncludeStaffBreakdown] = useState(true);
  const [includeWasteLoss, setIncludeWasteLoss] = useState(true);

  // Studio Settings from LocalStorage
  const customLogo = typeof window !== 'undefined' ? localStorage.getItem('fotop_custom_studio_logo') : null;
  const studioName = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_name')) || 'Fotop Studio';
  const studioTagline = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_tagline')) || 'استوديو التصوير الاحترافي والطباعة الفنية';
  const studioPhone = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_phone')) || '05 63 89 83 95';
  const studioAddress = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_address')) || 'الشارع التجاري الرئيسي، الجزائر';

  // Preset Handlers
  const handlePreset = (preset: 'today' | 'week' | 'month' | 'custom' | 'all') => {
    setPeriodPreset(preset);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'week') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(lastWeek.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (preset === 'month') {
      setStartDate(today.substring(0, 7) + '-01');
      setEndDate(today);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate(today);
    }
  };

  const matchesDateRange = (dateStr: string) => {
    if (!dateStr) return false;
    const d = dateStr.split('T')[0];
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  // Helper for BOM cost
  const getOrderTotalCost = (o: Order): number => {
    if (typeof o.totalBOMCost === 'number' && o.totalBOMCost > 0) return o.totalBOMCost;
    if (o.materialsDeducted && o.materialsDeducted.length > 0) {
      const sum = o.materialsDeducted.reduce((acc, m) => acc + (m.cost || 0), 0);
      if (sum > 0) return sum;
    }
    if (o.items && o.items.length > 0) {
      return o.items.reduce((acc, it) => acc + (getItemUnitCost(it.service, materials) * it.quantity), 0);
    }
    return 0;
  };

  // Filtered Data
  const filteredOrders = useMemo(() => orders.filter(o => matchesDateRange(o.createdAt)), [orders, startDate, endDate]);
  const filteredExpenses = useMemo(() => expenses.filter(e => matchesDateRange(e.createdAt)), [expenses, startDate, endDate]);
  const filteredWaste = useMemo(() => wasteRecords.filter(w => matchesDateRange(w.createdAt)), [wasteRecords, startDate, endDate]);

  // Aggregate Financial Figures
  const grossRevenue = useMemo(() => filteredOrders.reduce((sum, o) => sum + o.total, 0), [filteredOrders]);
  const totalBOMCost = useMemo(() => filteredOrders.reduce((sum, o) => sum + getOrderTotalCost(o), 0), [filteredOrders, materials]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
  const totalWasteLoss = useMemo(() => filteredWaste.reduce((sum, w) => sum + w.costLoss, 0), [filteredWaste]);
  const netProfit = grossRevenue - totalBOMCost - totalExpenses - totalWasteLoss;
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  // Staff breakdown
  const staffBreakdown = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number; cost: number; net: number }> = {};
    for (const o of filteredOrders) {
      const sid = o.staffId || 'unknown';
      if (!map[sid]) {
        map[sid] = { name: o.staffName || 'غير محدد', count: 0, revenue: 0, cost: 0, net: 0 };
      }
      map[sid].count += 1;
      map[sid].revenue += o.total;
      const c = getOrderTotalCost(o);
      map[sid].cost += c;
      map[sid].net += (o.total - c);
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, materials]);

  // Expense by category
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filteredExpenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  // Unique report code
  const reportCode = useMemo(() => {
    const datePart = todayStr.replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `REP-FIN-${datePart}-${rand}`;
  }, [todayStr]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    if (!reportRef.current) return;
    const content = reportRef.current.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>تقرير الأرباح والمصروفات - ${studioName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    body { font-family: 'Cairo', sans-serif; background: #fff; color: #292A34; padding: 25px; margin: 0; direction: rtl; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; }
    th { background: #292A34; color: #fff; font-weight: bold; }
    tr:nth-child(even) { background: #f8fafc; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .kpi-card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; background: #f8fafc; }
    .kpi-title { font-size: 11px; color: #64748b; font-weight: bold; }
    .kpi-val { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E31C2B; padding-bottom: 15px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fotop_Financial_Report_${startDate}_to_${endDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-['Cairo',sans-serif]">
      
      {/* Container Dialog */}
      <div className="bg-white border border-slate-300 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
        
        {/* Top Action Toolbar (Hidden during browser print) */}
        <div className="no-print px-5 py-3.5 bg-[#292A34] text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black flex items-center gap-2">
                <span>تصدير تقرير الأرباح والمصروفات كـ PDF</span>
                <span className="text-[10px] bg-rose-600 px-2 py-0.5 rounded-full font-bold">المدير العام</span>
              </div>
              <p className="text-[11px] text-slate-300">معاينة التقرير الرسمي الشامل والطباعة المباشرة بصيغة A4</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#E31C2B] hover:bg-[#c91422] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer transition-all"
              title="طباعة التقرير فوراً أو الحفظ كـ PDF"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وحفظ كـ PDF</span>
            </button>

            <button
              onClick={handleDownloadHTML}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              title="تحميل كملف مستند HTML مستقل للأرشفة"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">أرشفة رقمية (HTML)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (Hidden during print) */}
        <div className="no-print bg-slate-50 border-b border-slate-200 p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-500 ml-1">الفترة الزمنية:</span>
            <button
              onClick={() => handlePreset('today')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                periodPreset === 'today' ? 'bg-[#292A34] text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => handlePreset('week')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                periodPreset === 'week' ? 'bg-[#292A34] text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => handlePreset('month')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                periodPreset === 'month' ? 'bg-[#292A34] text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => handlePreset('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                periodPreset === 'all' ? 'bg-[#292A34] text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              كامل السجل
            </button>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Section Toggles */}
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={includeExpensesList}
                onChange={(e) => setIncludeExpensesList(e.target.checked)}
                className="rounded text-red-600 focus:ring-0"
              />
              <span>جدول المصروفات</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={includeStaffBreakdown}
                onChange={(e) => setIncludeStaffBreakdown(e.target.checked)}
                className="rounded text-red-600 focus:ring-0"
              />
              <span>مساهمة العمال</span>
            </label>
          </div>
        </div>

        {/* Scrollable Document Preview Area */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex justify-center">
          
          {/* A4 Paper Document Container */}
          <div 
            ref={reportRef}
            className="print-document bg-white text-[#292A34] w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 shadow-lg border border-slate-200 font-sans"
          >
            
            {/* 1. Official Header */}
            <div className="header border-b-2 border-[#E31C2B] pb-4 mb-6">
              <div className="flex items-start justify-between">
                
                {/* Right: Studio Brand & Details */}
                <div className="flex items-center gap-3">
                  {customLogo ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#E31C2B] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                      📸
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-black text-[#292A34]">{studioName}</h1>
                    <p className="text-xs font-bold text-slate-600">{studioTagline}</p>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                      <span>📞 {studioPhone}</span>
                      <span>📍 {studioAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Left: Report Identification */}
                <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 min-w-[200px]">
                  <div className="text-xs font-black text-[#E31C2B]">كشف المركز المالي والأرباح</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">رقم المرجع: {reportCode}</div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    تاريخ الإصدار: <strong>{formatDate(todayStr)}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    أصدره: <strong>{currentStaff.name} ({currentStaff.role === 'manager' ? 'المدير العام' : 'موظف'})</strong>
                  </div>
                </div>

              </div>

              {/* Selected Period Banner */}
              <div className="mt-4 bg-slate-50 border-r-4 border-[#292A34] px-4 py-2 flex items-center justify-between text-xs">
                <span className="font-bold text-[#292A34]">
                  فترة التقرير المالي المعتمدة: من <strong className="font-mono text-[#E31C2B]">{formatDate(startDate)}</strong> إلى <strong className="font-mono text-[#E31C2B]">{formatDate(endDate)}</strong>
                </span>
                <span className="text-slate-500 font-medium">
                  إجمالي العمليات المشمولة: <strong>{filteredOrders.length} طلب بيع</strong> • <strong>{filteredExpenses.length} سند صرف</strong>
                </span>
              </div>
            </div>

            {/* 2. Executive Financial Summary Cards (KPIs) */}
            <div className="mb-6">
              <h2 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>الخلاصة المالية والمؤشرات الرئيسية (دج)</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Gross Revenue */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-500">إجمالي المبيعات (Gross)</span>
                  <div className="text-lg font-black text-[#292A34] font-mono mt-1">
                    {formatCurrency(grossRevenue)}
                  </div>
                  <span className="text-[9px] text-slate-400">عبر {filteredOrders.length} معاملة منجزة</span>
                </div>

                {/* Materials BOM */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-500">تكلفة المواد والسلع (BOM)</span>
                  <div className="text-lg font-black text-[#E31C2B] font-mono mt-1">
                    {formatCurrency(totalBOMCost)}
                  </div>
                  <span className="text-[9px] text-slate-400">ورق صور + أحبار مستهلكة</span>
                </div>

                {/* Operating Expenses */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-500">المصروفات التشغيلية</span>
                  <div className="text-lg font-black text-amber-700 font-mono mt-1">
                    {formatCurrency(totalExpenses)}
                  </div>
                  <span className="text-[9px] text-slate-400">{filteredExpenses.length} مصاريف نثرية وإيجار</span>
                </div>

                {/* Net Profit */}
                <div className="border-2 border-emerald-500 rounded-xl p-3 bg-emerald-50/60">
                  <span className="text-[10px] font-black text-emerald-800">صافي الربح الفعلي المحقق</span>
                  <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                    {formatCurrency(netProfit)}
                  </div>
                  <span className="text-[9px] font-bold text-emerald-800">
                    هامش الربح: {profitMargin}% من المبيعات
                  </span>
                </div>

              </div>

              {/* Secondary losses callout if waste exists */}
              {totalWasteLoss > 0 && (
                <div className="mt-2 text-[11px] bg-red-50 border border-red-200 text-red-700 p-2 rounded-lg flex items-center justify-between">
                  <span>خسائر التالف والهدر في الورق والمواد خلال هذه الفترة:</span>
                  <strong className="font-mono">-{formatCurrency(totalWasteLoss)}</strong>
                </div>
              )}
            </div>

            {/* 3. Staff Performance Table (If Toggled) */}
            {includeStaffBreakdown && staffBreakdown.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-black text-slate-700 mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#292A34]" />
                  <span>توزيع المبيعات وصافي الأرباح بحسب فريق العمل</span>
                </h2>
                
                <table className="print-table w-full text-right text-xs">
                  <thead className="bg-[#292A34] text-white font-bold">
                    <tr>
                      <th className="p-2">الموظف / المنفذ</th>
                      <th className="p-2 text-center">الطلبات المنجزة</th>
                      <th className="p-2">إجمالي المبيعات</th>
                      <th className="p-2">تكلفة المواد</th>
                      <th className="p-2 text-center">صافي المساهمة في الربح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {staffBreakdown.map((st, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-2 font-bold text-[#292A34]">{st.name}</td>
                        <td className="p-2 text-center font-mono">{st.count}</td>
                        <td className="p-2 font-mono font-bold">{formatCurrency(st.revenue)}</td>
                        <td className="p-2 font-mono text-slate-500">{formatCurrency(st.cost)}</td>
                        <td className="p-2 text-center font-mono font-black text-emerald-700">
                          +{formatCurrency(st.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Operating Expenses Itemized Breakdown (If Toggled) */}
            {includeExpensesList && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-[#E31C2B]" />
                    <span>سجل المصروفات التشغيلية والنثرية ({filteredExpenses.length} سند صرف)</span>
                  </h2>
                  <span className="text-[11px] font-mono font-bold text-slate-600">
                    المجموع: {formatCurrency(totalExpenses)}
                  </span>
                </div>

                {filteredExpenses.length === 0 ? (
                  <div className="p-4 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                    لا توجد مصروفات مسجلة خلال الفترة المحددة.
                  </div>
                ) : (
                  <table className="print-table w-full text-right text-xs">
                    <thead className="bg-slate-800 text-white font-bold">
                      <tr>
                        <th className="p-2">التاريخ</th>
                        <th className="p-2">بيان المصروف</th>
                        <th className="p-2">الفئة</th>
                        <th className="p-2">المسجل</th>
                        <th className="p-2 text-left">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredExpenses.map((exp, idx) => (
                        <tr key={exp.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-2 font-mono text-slate-600">{formatDate(exp.createdAt)}</td>
                          <td className="p-2 font-bold text-[#292A34]">{exp.title}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                              {exp.category}
                            </span>
                          </td>
                          <td className="p-2 text-slate-600 text-[11px]">{exp.staffName || 'المدير'}</td>
                          <td className="p-2 text-left font-mono font-black text-rose-700">
                            -{formatCurrency(exp.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 5. Official Stamp & Signatures */}
            <div className="signatures mt-10 pt-6 border-t-2 border-slate-300 flex justify-between items-end text-xs">
              <div className="text-center w-52">
                <p className="font-bold text-slate-600 mb-1">المحاسبة والتدقيق</p>
                <div className="h-16 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-[10px]">
                  توقيع المحاسب
                </div>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-2 border-emerald-700/60 p-1 flex flex-col items-center justify-center text-emerald-800 rotate-[-12deg] mx-auto">
                  <Building2 className="w-5 h-5 text-emerald-700" />
                  <span className="text-[10px] font-black uppercase mt-0.5">{studioName}</span>
                  <span className="text-[8px] font-bold">معتمد ومصادق عليه</span>
                  <span className="text-[7px] font-mono">{todayStr}</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-1">الختم الرسمي للمؤسسة</span>
              </div>

              <div className="text-center w-52">
                <p className="font-bold text-slate-600 mb-1">المدير العام والمشرف</p>
                <div className="h-16 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-[#292A34] text-[11px] font-bold bg-slate-50">
                  <span>{currentStaff.name}</span>
                  <span className="text-[9px] text-slate-400 font-normal">مصادقة الإدارة العامة</span>
                </div>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
              تم إنشاء هذا التقرير تلقائياً عبر منظومة Fotop ERP لإدارة استوديوهات التصوير • الصفحة 1 من 1 • كود التقرير: {reportCode}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
