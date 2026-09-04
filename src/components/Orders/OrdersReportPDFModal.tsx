import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ReceiptText, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Building2, 
  Layers, 
  Filter,
  UserCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Order, Material, Staff, OrderStatus } from '../../types';
import { formatCurrency, formatDate, formatTime, getItemUnitCost } from '../../utils/formatters';

interface OrdersReportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  materials?: Material[];
  allStaff?: Staff[];
  currentStaff?: Staff;
  initialStartDate?: string;
  initialEndDate?: string;
  initialStaffId?: string;
  initialStatus?: string;
}

export const OrdersReportPDFModal: React.FC<OrdersReportPDFModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  materials = [],
  allStaff = [],
  currentStaff,
  initialStartDate,
  initialEndDate,
  initialStaffId = 'all',
  initialStatus = 'all'
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [startDate, setStartDate] = useState<string>(initialStartDate || todayStr);
  const [endDate, setEndDate] = useState<string>(initialEndDate || todayStr);
  const [staffFilter, setStaffFilter] = useState<string>(initialStaffId);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [periodPreset, setPeriodPreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all'>('today');

  const isManager = currentStaff?.role === 'manager';

  // Studio Settings from LocalStorage
  const customLogo = typeof window !== 'undefined' ? localStorage.getItem('fotop_custom_studio_logo') : null;
  const studioName = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_name')) || 'Fotop Studio';
  const studioTagline = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_tagline')) || 'استوديو التصوير الاحترافي والمطبوعات';
  const studioPhone = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_phone')) || '05 63 89 83 95';
  const studioAddress = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_address')) || 'الشارع التجاري الرئيسي، الجزائر';

  // Preset Handlers
  const handlePreset = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all') => {
    setPeriodPreset(preset);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
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

  const getOrderCost = (o: Order): number => {
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

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Date filter
      const oDate = o.createdAt.split('T')[0];
      if (startDate && oDate < startDate) return false;
      if (endDate && oDate > endDate) return false;

      // Staff filter
      if (staffFilter !== 'all' && o.staffId !== staffFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, startDate, endDate, staffFilter, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalCost = filteredOrders.reduce((sum, o) => sum + getOrderCost(o), 0);
    const totalNetProfit = totalRevenue - totalCost;
    const totalPaid = filteredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const totalRemaining = totalRevenue - totalPaid;
    const margin = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;

    return { totalOrders, totalRevenue, totalCost, totalNetProfit, totalPaid, totalRemaining, margin };
  }, [filteredOrders, materials]);

  const reportCode = useMemo(() => {
    const dStr = todayStr.replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `REP-ORD-${dStr}-${rand}`;
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
  <title>كشف المعاملات والطلبات - ${studioName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    body { font-family: 'Cairo', sans-serif; background: #fff; color: #292A34; padding: 25px; margin: 0; direction: rtl; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; }
    th { background: #292A34; color: #fff; font-weight: bold; }
    tr:nth-child(even) { background: #f8fafc; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .kpi-card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; background: #f8fafc; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E31C2B; padding-bottom: 15px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
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
    link.download = `Fotop_Orders_Report_${startDate}_to_${endDate}.html`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'delivered': return 'تم التسليم';
      case 'ready': return 'جاهز للاستلام';
      case 'processing': return 'قيد التجهيز';
      default: return 'قيد الانتظار';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-['Cairo',sans-serif]">
      
      {/* Container */}
      <div className="bg-white border border-slate-300 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
        
        {/* Top Control Toolbar (Hidden in print) */}
        <div className="no-print px-5 py-3.5 bg-[#292A34] text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black flex items-center gap-2">
                <span>تصدير كشف المعاملات والطلبات كـ PDF</span>
                <span className="text-[10px] bg-[#E31C2B] px-2 py-0.5 rounded-full font-bold">كشف معتمد</span>
              </div>
              <p className="text-[11px] text-slate-300">تقرير رسمي شامل للطباعة على ورق A4 أو الحفظ كـ PDF للأرشفة الخارجية</p>
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

        {/* Filters Bar (Hidden in print) */}
        <div className="no-print bg-slate-50 border-b border-slate-200 p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-500 ml-1">الفترة:</span>
            <button
              onClick={() => handlePreset('today')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                periodPreset === 'today' ? 'bg-[#E31C2B] text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => handlePreset('yesterday')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                periodPreset === 'yesterday' ? 'bg-[#292A34] text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              أمس
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
              الكل
            </button>
          </div>

          {/* Dates & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
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

            {/* Staff Filter (if manager) */}
            {isManager && (
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
              >
                <option value="all">👤 جميع المنفذين</option>
                {allStaff.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
            >
              <option value="all">📋 جميع الحالات</option>
              <option value="delivered">تم التسليم</option>
              <option value="ready">جاهز للاستلام</option>
              <option value="processing">قيد التجهيز</option>
              <option value="pending">قيد الانتظار</option>
            </select>
          </div>

        </div>

        {/* Scrollable A4 Document Preview */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex justify-center">
          
          <div 
            ref={reportRef}
            className="print-document bg-white text-[#292A34] w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 shadow-lg border border-slate-200 font-sans"
          >
            
            {/* Header */}
            <div className="header border-b-2 border-[#E31C2B] pb-4 mb-6">
              <div className="flex items-start justify-between">
                
                {/* Brand */}
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

                {/* Identification Box */}
                <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 min-w-[200px]">
                  <div className="text-xs font-black text-[#E31C2B]">كشف سجل الطلبات والمعاملات</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">رقم المرجع: {reportCode}</div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    تاريخ الإصدار: <strong>{formatDate(todayStr)}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    المنفذ المستخرج: <strong>{currentStaff?.name || 'إدارة الاستوديو'}</strong>
                  </div>
                </div>

              </div>

              {/* Range Banner */}
              <div className="mt-4 bg-slate-50 border-r-4 border-[#292A34] px-4 py-2 flex items-center justify-between text-xs">
                <span className="font-bold text-[#292A34]">
                  فترة الكشف: من <strong className="font-mono text-[#E31C2B]">{formatDate(startDate)}</strong> إلى <strong className="font-mono text-[#E31C2B]">{formatDate(endDate)}</strong>
                </span>
                <span className="text-slate-500 font-medium">
                  العدد الإجمالي للمعاملات: <strong className="font-mono text-[#292A34]">{filteredOrders.length} معاملة</strong>
                </span>
              </div>
            </div>

            {/* KPIs */}
            <div className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-500">إجمالي المبيعات (دج)</span>
                  <div className="text-lg font-black text-[#292A34] font-mono mt-1">
                    {formatCurrency(metrics.totalRevenue)}
                  </div>
                  <span className="text-[9px] text-slate-400">عبر {metrics.totalOrders} طلب</span>
                </div>

                {isManager && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-500">تكلفة المواد والسلع (BOM)</span>
                    <div className="text-lg font-black text-[#E31C2B] font-mono mt-1">
                      {formatCurrency(metrics.totalCost)}
                    </div>
                    <span className="text-[9px] text-slate-400">ورق وأحبار مستهلكة</span>
                  </div>
                )}

                {isManager && (
                  <div className="border-2 border-emerald-500 rounded-xl p-3 bg-emerald-50/60">
                    <span className="text-[10px] font-black text-emerald-800">صافي أرباح الطلبات</span>
                    <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                      {formatCurrency(metrics.totalNetProfit)}
                    </div>
                    <span className="text-[9px] font-bold text-emerald-800">
                      هامش الربح: {metrics.margin}%
                    </span>
                  </div>
                )}

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-500">المحصل والمتبقي (دج)</span>
                  <div className="text-sm font-black text-emerald-700 font-mono mt-1">
                    محصل: {formatCurrency(metrics.totalPaid)}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-amber-700">
                    متبقي: {formatCurrency(metrics.totalRemaining)}
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="mb-6">
              <h2 className="text-xs font-black text-slate-700 mb-2 flex items-center justify-between">
                <span>جدول المعاملات المنفذة والمبيعات بالتفصيل</span>
                <span className="text-[10px] text-slate-400 font-normal">مرتبة بحسب وقت التسجيل</span>
              </h2>

              {filteredOrders.length === 0 ? (
                <div className="p-8 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  لا توجد طلبات مسجلة تطابق محددات البحث والفترة المختارة.
                </div>
              ) : (
                <table className="print-table w-full text-right text-xs">
                  <thead className="bg-[#292A34] text-white font-bold">
                    <tr>
                      <th className="p-2">التذكرة والوقت</th>
                      {isManager && <th className="p-2">المنفذ</th>}
                      <th className="p-2">الزبون والهاتف</th>
                      <th className="p-2">الخدمات والسلع</th>
                      <th className="p-2">المبلغ</th>
                      {isManager && <th className="p-2">التكلفة</th>}
                      {isManager && <th className="p-2">صافي الربح</th>}
                      <th className="p-2 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOrders.map((o, idx) => {
                      const cost = getOrderCost(o);
                      const profit = o.total - cost;
                      return (
                        <tr key={o.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-2 whitespace-nowrap">
                            <div className="font-mono font-bold text-[#E31C2B]">{o.ticketNumber}</div>
                            <div className="text-[10px] font-mono text-slate-500">{formatTime(o.createdAt)} • {formatDate(o.createdAt)}</div>
                          </td>
                          {isManager && (
                            <td className="p-2 font-bold text-slate-700 whitespace-nowrap">
                              {o.staffName || 'غير محدد'}
                            </td>
                          )}
                          <td className="p-2">
                            <div className="font-bold text-[#292A34]">{o.customerName}</div>
                            {o.customerPhone && (
                              <div className="text-[10px] font-mono text-slate-500">{o.customerPhone}</div>
                            )}
                          </td>
                          <td className="p-2 text-[11px] text-slate-700 max-w-[200px]">
                            {o.items.map(it => `${it.service.name} (x${it.quantity})`).join('، ')}
                          </td>
                          <td className="p-2 font-mono font-black text-[#292A34] whitespace-nowrap">
                            {formatCurrency(o.total)}
                          </td>
                          {isManager && (
                            <td className="p-2 font-mono text-slate-500 whitespace-nowrap">
                              {formatCurrency(cost)}
                            </td>
                          )}
                          {isManager && (
                            <td className="p-2 font-mono font-black text-emerald-700 whitespace-nowrap">
                              +{formatCurrency(profit)}
                            </td>
                          )}
                          <td className="p-2 text-center whitespace-nowrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {getStatusText(o.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Stamp & Signatures */}
            <div className="signatures mt-10 pt-6 border-t-2 border-slate-300 flex justify-between items-end text-xs">
              <div className="text-center w-52">
                <p className="font-bold text-slate-600 mb-1">الموظف المسؤول عن الكشف</p>
                <div className="h-16 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-500 text-[11px] font-bold bg-slate-50">
                  {currentStaff?.name || 'فريق الاستوديو'}
                </div>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-2 border-emerald-700/60 p-1 flex flex-col items-center justify-center text-emerald-800 rotate-[-12deg] mx-auto">
                  <Building2 className="w-5 h-5 text-emerald-700" />
                  <span className="text-[10px] font-black uppercase mt-0.5">{studioName}</span>
                  <span className="text-[8px] font-bold">كشف مالي معتمد</span>
                  <span className="text-[7px] font-mono">{todayStr}</span>
                </div>
                <span className="text-[9px] text-slate-400 block mt-1">ختم الأرشفة والمصادقة</span>
              </div>

              <div className="text-center w-52">
                <p className="font-bold text-slate-600 mb-1">مصادقة المدير العام</p>
                <div className="h-16 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-[#292A34] text-[11px] font-bold bg-slate-50">
                  <span>fouad (المدير العام)</span>
                  <span className="text-[9px] text-slate-400 font-normal">اعتماد وتدقيق نهائي</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
              تم استخراج التقرير بواسطة نظام Fotop Studio المتكامل • مرجع: {reportCode} • صفحة 1 من 1
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
