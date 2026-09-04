import React, { useState, useMemo } from 'react';
import { 
  ReceiptText, 
  Search, 
  Clock, 
  CheckCircle2, 
  Printer, 
  Eye, 
  Layers, 
  FileSpreadsheet, 
  Phone, 
  User, 
  CreditCard, 
  Coins, 
  Sparkles,
  ArrowRight,
  Calendar,
  Filter,
  TrendingUp,
  UserCheck,
  Package,
  ShoppingBag,
  DollarSign,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import { Order, OrderStatus, Staff, Material, Expense, WasteRecord } from '../../types';
import { formatCurrency, formatDate, formatTime, exportToCSV, getItemUnitCost } from '../../utils/formatters';
import { StaffActivityJournal } from './StaffActivityJournal';

interface OrdersViewProps {
  orders: Order[];
  allStaff?: Staff[];
  currentStaff?: Staff;
  materials?: Material[];
  expenses?: Expense[];
  wasteRecords?: WasteRecord[];
  onSelectOrderForPrint: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

type PeriodFilterPreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';
type OrdersViewMode = 'orders_table' | 'staff_journal';

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders = [],
  allStaff = [],
  currentStaff,
  materials = [],
  expenses = [],
  wasteRecords = [],
  onSelectOrderForPrint,
  onUpdateOrderStatus
}) => {
  const isManager = currentStaff?.role === 'manager';

  // View Mode: General Orders or Worker Detailed Journal
  const [viewMode, setViewMode] = useState<OrdersViewMode>('orders_table');

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>(isManager ? 'all' : (currentStaff?.id || 'all'));
  const [periodPreset, setPeriodPreset] = useState<PeriodFilterPreset>('today');
  
  // Custom Date Range State (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Selected Order Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Status Filter Options
  const statusOptions: { id: string; label: string }[] = [
    { id: 'all', label: 'جميع الحالات' },
    { id: 'delivered', label: 'تم التسليم' },
    { id: 'ready', label: 'جاهز للاستلام' },
    { id: 'processing', label: 'قيد التجهيز' },
    { id: 'pending', label: 'قيد الانتظار' }
  ];

  // Quick Preset Handlers
  const handlePresetChange = (preset: PeriodFilterPreset) => {
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
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Helper to compute total cost of an order
  const getOrderCost = (o: Order): number => {
    if (typeof o.totalBOMCost === 'number' && o.totalBOMCost > 0) {
      return o.totalBOMCost;
    }
    if (o.materialsDeducted && o.materialsDeducted.length > 0) {
      const sum = o.materialsDeducted.reduce((acc, m) => acc + (m.cost || 0), 0);
      if (sum > 0) return sum;
    }
    if (o.items && o.items.length > 0) {
      return o.items.reduce((acc, it) => {
        const unitCost = getItemUnitCost(it.service, materials);
        return acc + (unitCost * it.quantity);
      }, 0);
    }
    return 0;
  };

  // Helper to compute net profit of an order
  const getOrderNetProfit = (o: Order): number => {
    if (typeof o.netProfit === 'number') {
      return o.netProfit;
    }
    const cost = getOrderCost(o);
    return Math.max(0, o.total - cost);
  };

  // Filtered Orders Calculation
  const filteredOrders = useMemo(() => {
    return (orders || []).filter(order => {
      // 1. Worker Role Restriction: Worker only ever sees their own transactions
      if (!isManager && currentStaff) {
        const isSelf = order.staffId === currentStaff.id || order.staffName === currentStaff.name;
        if (!isSelf) return false;
      }

      // 2. Date filter (من - إلى)
      if (periodPreset !== 'all') {
        const orderDateStr = order.createdAt ? order.createdAt.split('T')[0] : '';
        if (startDate && orderDateStr < startDate) return false;
        if (endDate && orderDateStr > endDate) return false;
      }

      // 3. Staff filter (من قام بها) - For manager view
      if (isManager && staffFilter !== 'all' && order.staffId !== staffFilter && order.staffName !== staffFilter) {
        return false;
      }

      // 4. Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTicket = order.ticketNumber.toLowerCase().includes(q);
        const matchCust = order.customerName.toLowerCase().includes(q);
        const matchPhone = order.customerPhone ? order.customerPhone.includes(q) : false;
        const matchStaff = isManager ? order.staffName.toLowerCase().includes(q) : false;
        const matchItems = order.items.some(it => it.service.name.toLowerCase().includes(q));
        if (!matchTicket && !matchCust && !matchPhone && !matchStaff && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [orders, periodPreset, startDate, endDate, staffFilter, statusFilter, searchQuery, isManager, currentStaff]);

  // Aggregate Metrics for the Filtered Period
  const periodMetrics = useMemo(() => {
    const totalTransactions = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalCost = filteredOrders.reduce((sum, o) => sum + getOrderCost(o), 0);
    const totalNetProfit = Math.max(0, totalRevenue - totalCost);
    const profitMargin = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;
    const totalPaid = filteredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const totalRemaining = Math.max(0, totalRevenue - totalPaid);

    // Grouping by Staff (من قام بالمعاملات في هذه الفترة)
    const staffBreakdown: Record<string, { staffId: string; staffName: string; count: number; revenue: number; profit: number }> = {};

    for (const o of filteredOrders) {
      const sId = o.staffId || 'unknown';
      const sName = o.staffName || 'غير محدد';

      if (!staffBreakdown[sId]) {
        staffBreakdown[sId] = {
          staffId: sId,
          staffName: sName,
          count: 0,
          revenue: 0,
          profit: 0
        };
      }

      staffBreakdown[sId].count += 1;
      staffBreakdown[sId].revenue += o.total;
      staffBreakdown[sId].profit += getOrderNetProfit(o);
    }

    return {
      totalTransactions,
      totalRevenue,
      totalCost,
      totalNetProfit,
      profitMargin,
      totalPaid,
      totalRemaining,
      staffList: Object.values(staffBreakdown).sort((a, b) => b.revenue - a.revenue)
    };
  }, [filteredOrders, materials]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> تم التسليم</span>;
      case 'ready':
        return <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 animate-pulse"><Sparkles className="w-3 h-3 text-amber-600" /> جاهز للاستلام</span>;
      case 'processing':
        return <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 font-bold text-[11px] flex items-center gap-1"><Clock className="w-3 h-3 text-sky-600" /> قيد التجهيز</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-[11px]">قيد الانتظار</span>;
    }
  };

  const handleExportCSV = () => {
    const rows = filteredOrders.map(o => {
      const cost = getOrderCost(o);
      const profit = getOrderNetProfit(o);
      return {
        'رقم التذكرة': o.ticketNumber,
        'تاريخ ووقت المعاملة': formatDate(o.createdAt),
        'من قام بها (المنفذ)': o.staffName,
        'اسم الزبون': o.customerName,
        'رقم الهاتف': o.customerPhone || '',
        'المبلغ الإجمالي (دج)': o.total,
        'تكلفة المواد والسلع (دج)': cost,
        'صافي الربح المحقق (دج)': profit,
        'المبلغ المدفوع (دج)': o.paidAmount,
        'طريقة الدفع': o.paymentMethod === 'cash' ? 'نقداً' : 'بطاقة CIB',
        'حالة الطلب': o.status,
        'موعد الاستلام': o.estimatedPickupAt || 'فوري',
        'الخدمات والسلع': o.items.map(i => `${i.service.name} (x${i.quantity})`).join(' + ')
      };
    });
    const filename = `Fotop_Transactions_${startDate || 'all'}_to_${endDate || 'all'}`;
    exportToCSV(filename, rows);
  };

  // Human title for current period
  const periodLabel = useMemo(() => {
    if (periodPreset === 'today') return 'معاملات اليوم';
    if (periodPreset === 'yesterday') return 'معاملات يوم أمس';
    if (periodPreset === 'week') return 'معاملات آخر 7 أيام';
    if (periodPreset === 'month') return 'معاملات هذا الشهر';
    if (periodPreset === 'all') return 'جميع المعاملات (كامل السجل)';
    return `المعاملات من ${startDate} إلى ${endDate}`;
  }, [periodPreset, startDate, endDate]);

  return (
    <div className="space-y-5">
      
      {/* 1. Date Range & Preset Filtering Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#E31C2B]">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#292A34] flex items-center gap-2">
                <span>سجل المعاملات والطلبات</span>
                <span className="text-xs font-bold text-[#E31C2B] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                  {periodLabel}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                تصفية المعاملات بحسب الفترة (من - إلى)، ومتابعة من قام بكل عملية ومستوى الأرباح
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                periodPreset === 'today'
                  ? 'bg-[#E31C2B] text-white shadow-sm shadow-red-500/20'
                  : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>معاملات اليوم</span>
            </button>

            <button
              onClick={() => handlePresetChange('yesterday')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'yesterday'
                  ? 'bg-[#292A34] text-white'
                  : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
              }`}
            >
              أمس
            </button>

            <button
              onClick={() => handlePresetChange('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'week'
                  ? 'bg-[#292A34] text-white'
                  : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
              }`}
            >
              آخر 7 أيام
            </button>

            <button
              onClick={() => handlePresetChange('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'month'
                  ? 'bg-[#292A34] text-white'
                  : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
              }`}
            >
              هذا الشهر
            </button>

            <button
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodPreset === 'all'
                  ? 'bg-[#292A34] text-white'
                  : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
              }`}
            >
              الكل
            </button>
          </div>

        </div>

        {/* Date Inputs (من - إلى) + Staff + Status + Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Search Box */}
          <div className="lg:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالتذكرة، الزبون، الهاتف، الموظف..."
              className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
            />
          </div>

          {/* Date Picker: من تاريخ (From) */}
          <div className="lg:col-span-2">
            <div className="relative">
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none">
                من:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl pr-8 pl-2 py-1.5 text-xs font-mono font-bold text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
              />
            </div>
          </div>

          {/* Date Picker: إلى تاريخ (To) */}
          <div className="lg:col-span-2">
            <div className="relative">
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none">
                إلى:
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl pr-8 pl-2 py-1.5 text-xs font-mono font-bold text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
              />
            </div>
          </div>

          {/* Staff Filter (من قام بها) - Manager only */}
          {isManager ? (
            <div className="lg:col-span-2">
              <div className="relative">
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#292A34] focus:outline-none focus:border-[#E31C2B] cursor-pointer"
                >
                  <option value="all">👤 جميع المنفذين</option>
                  {allStaff.length > 0 ? (
                    allStaff.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.role === 'manager' ? 'مدير' : 'مصور/عامل'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="staff_fouad">فؤاد (fouad)</option>
                      <option value="staff_amine">أمين (amine)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#292A34]">
              <span className="text-slate-500 ml-1">المعاملات:</span>
              <span className="text-[#E31C2B]">خاصتك فقط ({currentStaff?.name})</span>
            </div>
          )}

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#292A34] focus:outline-none focus:border-[#E31C2B] cursor-pointer"
            >
              {statusOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export CSV Button */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              onClick={handleExportCSV}
              title="تصدير جدول المعاملات إلى Excel / CSV"
              className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تصدير</span>
            </button>
          </div>

        </div>

      </div>

      {/* View Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setViewMode('orders_table')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
            viewMode === 'orders_table'
              ? 'bg-[#292A34] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-200/60'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span>جدول المعاملات والتذاكر ({filteredOrders.length})</span>
        </button>
        <button
          onClick={() => setViewMode('staff_journal')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
            viewMode === 'staff_journal'
              ? 'bg-[#E31C2B] text-white shadow-sm shadow-red-500/20'
              : 'text-slate-600 hover:text-[#292A34] hover:bg-slate-200/60'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{isManager ? 'سجل نشاط وحركات كل عامل بالتفصيل (كشف الأصناف والسلع المباعة)' : 'سجل نشاطك ومبيعاتك بالتفصيل (الأصناف والكميات)'}</span>
        </button>
      </div>

      {/* VIEW 1: Worker Detailed Journal */}
      {viewMode === 'staff_journal' && (
        <StaffActivityJournal
          orders={orders}
          allStaff={allStaff}
          currentStaff={currentStaff}
          materials={materials}
          expenses={expenses}
          wasteRecords={wasteRecords}
          startDate={startDate}
          endDate={endDate}
          periodLabel={periodLabel}
          selectedStaffId={staffFilter}
          onSelectStaffId={setStaffFilter}
          onSelectOrderForPrint={onSelectOrderForPrint}
        />
      )}

      {/* VIEW 2: Standard Transactions Table & KPIs */}
      {viewMode === 'orders_table' && (
        <>
          {/* 2. Top Summary KPI Cards for Selected Period */}
          <div className={`grid gap-3.5 ${isManager ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
        
            {/* Total Orders Count */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold">{isManager ? 'عدد المعاملات' : 'عدد معاملاتك'}</span>
                <ReceiptText className="w-4 h-4 text-slate-400" />
              </div>
              <div className="font-mono font-black text-xl text-[#292A34]">
                {periodMetrics.totalTransactions} <span className="text-xs font-normal text-slate-500">معاملة</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                خلال {periodLabel}
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold">{isManager ? 'إجمالي المداخيل' : 'إجمالي مبيعاتك'}</span>
                <Coins className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-mono font-black text-xl text-emerald-700">
                {formatCurrency(periodMetrics.totalRevenue)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                المحصل: {formatCurrency(periodMetrics.totalPaid)}
              </div>
            </div>

            {/* Manager Only: Cost of Goods & BOM */}
            {isManager && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">تكلفة المواد والسلع</span>
                  <Layers className="w-4 h-4 text-amber-500" />
                </div>
                <div className="font-mono font-black text-xl text-amber-700">
                  {formatCurrency(periodMetrics.totalCost)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  استهلاك ورق + حبر + شراء سلع
                </div>
              </div>
            )}

            {/* Manager Only: Net Profit */}
            {isManager ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm bg-linear-to-br from-white to-emerald-50/50">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">صافي الأرباح المحققة</span>
                  <TrendingUp className="w-4 h-4 text-[#E31C2B]" />
                </div>
                <div className="font-mono font-black text-xl text-[#E31C2B]">
                  {formatCurrency(periodMetrics.totalNetProfit)}
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                  <span>هامش الربح: %{periodMetrics.profitMargin}</span>
                </div>
              </div>
            ) : (
              /* Worker View: Total Remaining/Uncollected */
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">المبالغ غير المسددة</span>
                  <Coins className="w-4 h-4 text-amber-500" />
                </div>
                <div className="font-mono font-black text-xl text-amber-700">
                  {formatCurrency(periodMetrics.totalRemaining)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  المتبقي على الزبائن
                </div>
              </div>
            )}

          </div>

          {/* 3. Who Executed Today's Transactions - Manager Only */}
          {isManager && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#E31C2B]" />
                  <h3 className="text-xs font-black text-[#292A34]">
                    من قام بالمعاملات في {periodLabel} (توزيع أداء الموظفين):
                  </h3>
                </div>
                {staffFilter !== 'all' && (
                  <button
                    onClick={() => setStaffFilter('all')}
                    className="text-[11px] font-bold text-[#E31C2B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>إلغاء فلترة الموظف (عرض الجميع)</span>
                  </button>
                )}
              </div>

              {periodMetrics.staffList.length === 0 ? (
                <div className="text-xs text-slate-400 p-2 text-center">
                  لا توجد معاملات مسجلة في الفترة المحددة
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {periodMetrics.staffList.map(st => {
                    const isSelected = staffFilter === st.staffId;
                    return (
                      <div
                        key={st.staffId}
                        onClick={() => setStaffFilter(isSelected ? 'all' : st.staffId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-red-50 border-[#E31C2B] ring-2 ring-[#E31C2B]/20 shadow-xs'
                            : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                            isSelected ? 'bg-[#E31C2B] text-white' : 'bg-[#292A34] text-white'
                          }`}>
                            {st.staffName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-xs text-[#292A34] flex items-center gap-1.5">
                              <span>{st.staffName}</span>
                              {isSelected && (
                                <span className="text-[10px] bg-[#E31C2B] text-white px-1.5 py-0.2 rounded-full font-normal">
                                  محدد
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                              {st.count} معاملة منجزة
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <div className="font-mono font-black text-xs text-emerald-700">
                            {formatCurrency(st.revenue)}
                          </div>
                          <div className="text-[10px] font-mono font-bold text-slate-500">
                            صافي: {formatCurrency(st.profit)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. Main Transactions Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-[#292A34]">
                  جدول المعاملات المنفذة ({filteredOrders.length} معاملة)
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                مرتبة من الأحدث إلى الأقدم
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#292A34] text-white font-bold">
                  <tr>
                    <th className="p-3.5 whitespace-nowrap">رقم التذكرة والوقت</th>
                    {isManager && <th className="p-3.5 whitespace-nowrap">من قام بالمعاملة (المنفذ)</th>}
                    <th className="p-3.5 whitespace-nowrap">الزبون والهاتف</th>
                    <th className="p-3.5 whitespace-nowrap">الخدمات والسلع</th>
                    <th className="p-3.5 whitespace-nowrap">المبلغ الإجمالي</th>
                    {isManager && <th className="p-3.5 whitespace-nowrap">التكلفة والربح</th>}
                    <th className="p-3.5 whitespace-nowrap">حالة الطلب</th>
                    <th className="p-3.5 text-center whitespace-nowrap">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={isManager ? 8 : 6} className="p-12 text-center text-slate-400 font-bold">
                        <ReceiptText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p>لا توجد معاملات مسجلة لك خلال هذه الفترة ({periodLabel})</p>
                        <button
                          onClick={() => handlePresetChange('all')}
                          className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>عرض جميع المعاملات</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => {
                      const cost = getOrderCost(order);
                      const profit = getOrderNetProfit(order);
                      const orderDate = order.createdAt ? new Date(order.createdAt) : null;
                      const isToday = orderDate ? orderDate.toISOString().split('T')[0] === todayStr : false;

                      return (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          
                          {/* Ticket Number + Exact Time */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-sm text-[#E31C2B]">
                                {order.ticketNumber}
                              </span>
                              {isToday && (
                                <span className="px-1.5 py-0.2 rounded-md bg-red-100 text-[#E31C2B] text-[10px] font-black">
                                  اليوم
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formatTime(order.createdAt)} ─ {formatDate(order.createdAt).split('،')[0]}</span>
                            </div>
                          </td>

                          {/* Staff Member (من قام بها) - Manager Only */}
                          {isManager && (
                            <td className="p-3.5">
                              <div className="inline-flex items-center gap-2 bg-[#F0F0F0] border border-slate-300 px-2.5 py-1 rounded-xl">
                                <div className="w-5 h-5 rounded-full bg-[#292A34] text-white flex items-center justify-center text-[10px] font-black">
                                  {order.staffName ? order.staffName.charAt(0) : 'م'}
                                </div>
                                <span className="font-bold text-[#292A34] text-xs">
                                  {order.staffName || 'غير محدد'}
                                </span>
                              </div>
                            </td>
                          )}

                          {/* Customer Info */}
                          <td className="p-3.5">
                            <div className="font-bold text-[#292A34]">{order.customerName}</div>
                            {order.customerPhone && (
                              <div className="text-[11px] text-slate-500 font-mono dir-ltr text-right flex items-center justify-end gap-1">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                <span>{order.customerPhone}</span>
                              </div>
                            )}
                          </td>

                          {/* Items & Services */}
                          <td className="p-3.5">
                            <div className="space-y-0.5 max-w-xs">
                              {order.items.map((it, idx) => (
                                <div key={idx} className="truncate text-slate-700 flex items-center gap-1">
                                  {it.service.itemType === 'direct_sale' ? (
                                    <ShoppingBag className="w-3 h-3 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Package className="w-3 h-3 text-[#E31C2B] shrink-0" />
                                  )}
                                  <span className="truncate">{it.service.name}</span>
                                  <span className="font-bold text-[#292A34] font-mono">×{it.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Financial Total */}
                          <td className="p-3.5">
                            <div className="font-mono font-black text-sm text-[#292A34]">
                              {formatCurrency(order.total)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              {order.paymentMethod === 'cash' ? (
                                <span className="text-emerald-700 font-bold">نقداً</span>
                              ) : (
                                <span className="text-sky-700 font-bold">بطاقة CIB</span>
                              )}
                              <span>•</span>
                              <span>{order.paidAmount >= order.total ? 'مدفوع' : `متبقي ${formatCurrency(order.total - order.paidAmount)}`}</span>
                            </div>
                          </td>

                          {/* Cost & Net Profit - Manager Only */}
                          {isManager && (
                            <td className="p-3.5">
                              <div className="font-mono font-black text-xs text-emerald-700 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-emerald-600" />
                                <span>صافي: +{formatCurrency(profit)}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                التكلفة: {formatCurrency(cost)}
                              </div>
                            </td>
                          )}

                          {/* Order Status & Quick Change */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              {getStatusBadge(order.status)}
                              {order.status !== 'delivered' && (
                                <select
                                  value={order.status}
                                  onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                  className="bg-[#F0F0F0] border border-slate-300 rounded-lg text-[10px] font-bold p-1 text-slate-700 cursor-pointer"
                                >
                                  <option value="pending">انتظار</option>
                                  <option value="processing">تجهيز</option>
                                  <option value="ready">جاهز</option>
                                  <option value="delivered">تسليم</option>
                                </select>
                              )}
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedOrderDetails(order)}
                                className="p-1.5 rounded-lg bg-[#F0F0F0] hover:bg-slate-200 text-[#292A34] transition-colors cursor-pointer"
                                title="تفاصيل الطلب"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onSelectOrderForPrint(order)}
                                className="p-1.5 rounded-lg bg-[#E31C2B] hover:bg-[#c91422] text-white transition-colors shadow-sm cursor-pointer"
                                title="طباعة التذكرة مجدداً"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (No Horizontal Scrolling on Mobile) */}
            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold text-xs">
                  <ReceiptText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>لا توجد معاملات مسجلة لك خلال هذه الفترة ({periodLabel})</p>
                  <button
                    onClick={() => handlePresetChange('all')}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>عرض جميع المعاملات</span>
                  </button>
                </div>
              ) : (
                filteredOrders.map(order => {
                  const cost = getOrderCost(order);
                  const profit = getOrderNetProfit(order);
                  const orderDate = order.createdAt ? new Date(order.createdAt) : null;
                  const isToday = orderDate ? orderDate.toISOString().split('T')[0] === todayStr : false;

                  return (
                    <div 
                      key={order.id}
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3"
                    >
                      {/* Top Header: Ticket Number & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-base text-[#E31C2B]">
                              {order.ticketNumber}
                            </span>
                            {isToday && (
                              <span className="px-1.5 py-0.2 rounded-md bg-red-100 text-[#E31C2B] text-[10px] font-black">
                                اليوم
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatTime(order.createdAt)} ─ {formatDate(order.createdAt).split('،')[0]}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(order.status)}
                          {order.status !== 'delivered' && (
                            <select
                              value={order.status}
                              onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                              className="bg-white border border-slate-300 rounded-lg text-[10px] font-bold p-1 text-slate-700 cursor-pointer shadow-2xs"
                            >
                              <option value="pending">انتظار</option>
                              <option value="processing">تجهيز</option>
                              <option value="ready">جاهز</option>
                              <option value="delivered">تسليم</option>
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Customer & Executor Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">الزبون:</span>
                          <span className="font-bold text-[#292A34]">{order.customerName}</span>
                          {order.customerPhone && (
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              <span>{order.customerPhone}</span>
                            </div>
                          )}
                        </div>

                        {isManager && (
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block font-bold">المنفذ:</span>
                            <span className="font-bold text-[#292A34] text-xs">
                              {order.staffName || 'غير محدد'}
                            </span>
                            <div className="text-[10px] font-mono font-black text-emerald-700 mt-0.5">
                              صافي: +{formatCurrency(profit)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">الأصناف والخدمات:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {order.items.map((it, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-xs text-slate-700 font-medium"
                            >
                              <span>{it.service.name}</span>
                              <strong className="font-mono text-[#E31C2B]">×{it.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Total & Action Buttons */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200">
                        <div>
                          <div className="font-mono font-black text-base text-[#292A34]">
                            {formatCurrency(order.total)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {order.paymentMethod === 'cash' ? 'نقداً' : 'بطاقة CIB'} • {order.paidAmount >= order.total ? 'مدفوع بالكامل' : `متبقي ${formatCurrency(order.total - order.paidAmount)}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedOrderDetails(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[#292A34] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>تفاصيل</span>
                          </button>
                          <button
                            onClick={() => onSelectOrderForPrint(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>طباعة</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </>
      )}

      {/* 5. Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <ReceiptText className="w-5 h-5 text-[#E31C2B]" />
                <span>تفاصيل التذكرة #{selectedOrderDetails.ticketNumber}</span>
              </div>
              <button 
                onClick={() => setSelectedOrderDetails(null)} 
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-medium max-h-[75vh] overflow-y-auto">
              
              <div className="bg-[#F0F0F0] p-4 rounded-xl space-y-2 border border-slate-200">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-600">الزبون:</span>
                  <span className="text-[#292A34] font-black">{selectedOrderDetails.customerName}</span>
                </div>
                {selectedOrderDetails.customerPhone && (
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-600">الهاتف:</span>
                    <span className="font-mono dir-ltr">{selectedOrderDetails.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">تاريخ ووقت المعاملة:</span>
                  <span className="font-mono">{formatDate(selectedOrderDetails.createdAt)}</span>
                </div>
                {isManager && (
                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-700 font-bold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#E31C2B]" />
                      من قام بالمعاملة (المنفذ):
                    </span>
                    <span className="font-black text-[#292A34] bg-red-50 text-[#E31C2B] px-2 py-0.5 rounded-md border border-red-200">
                      {selectedOrderDetails.staffName}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-black text-[#292A34] mb-2">الخدمات والسلع المنجزة في هذا الطلب:</h4>
                <div className="space-y-1.5">
                  {selectedOrderDetails.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-1.5">
                        {it.service.itemType === 'direct_sale' ? (
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-[#E31C2B]" />
                        )}
                        <span className="font-bold text-[#292A34]">{it.service.name}</span>
                        <span className="text-slate-500 font-bold mr-2">× {it.quantity}</span>
                      </div>
                      <span className="font-mono font-bold text-[#E31C2B]">
                        {formatCurrency((it.customPrice ?? it.service.price) * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial summary in modal */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-emerald-800 text-[11px] block font-bold">إجمالي المبلغ:</span>
                  <span className="font-mono font-black text-sm text-[#292A34]">{formatCurrency(selectedOrderDetails.total)}</span>
                </div>
                {isManager && (
                  <div>
                    <span className="text-emerald-800 text-[11px] block font-bold">التكلفة:</span>
                    <span className="font-mono font-bold text-slate-700">{formatCurrency(getOrderCost(selectedOrderDetails))}</span>
                  </div>
                )}
                {isManager && (
                  <div>
                    <span className="text-emerald-800 text-[11px] block font-bold">صافي الربح:</span>
                    <span className="font-mono font-black text-sm text-emerald-700">+{formatCurrency(getOrderNetProfit(selectedOrderDetails))}</span>
                  </div>
                )}
              </div>

              {isManager && selectedOrderDetails.materialsDeducted && selectedOrderDetails.materialsDeducted.length > 0 && (
                <div className="bg-[#292A34] text-white p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#E31C2B]" />
                      المواد والسلع التي تم خصمها آلياً من المخزن:
                    </span>
                  </div>
                  <div className="space-y-1">
                    {selectedOrderDetails.materialsDeducted.map((m, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-300 font-mono">
                        <span>• {m.materialName}</span>
                        <span className="text-amber-400">-{m.quantity} {m.unit} (تكلفة: {formatCurrency(m.cost)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <button
                  onClick={() => {
                    onSelectOrderForPrint(selectedOrderDetails);
                    setSelectedOrderDetails(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الوصل</span>
                </button>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

