import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  ShoppingBag, 
  Package, 
  Clock, 
  TrendingUp, 
  Printer, 
  FileSpreadsheet, 
  Layers, 
  ReceiptText, 
  Sparkles, 
  DollarSign, 
  AlertCircle,
  Calendar,
  CheckCircle2,
  Trash2,
  Coins
} from 'lucide-react';
import { Order, Staff, Material, Expense, WasteRecord } from '../../types';
import { formatCurrency, formatDate, formatTime, exportToCSV, getItemUnitCost } from '../../utils/formatters';

interface StaffActivityJournalProps {
  orders: Order[];
  allStaff: Staff[];
  currentStaff?: Staff;
  materials: Material[];
  expenses?: Expense[];
  wasteRecords?: WasteRecord[];
  startDate: string;
  endDate: string;
  periodLabel: string;
  selectedStaffId: string;
  onSelectStaffId: (staffId: string) => void;
  onSelectOrderForPrint: (order: Order) => void;
}

export const StaffActivityJournal: React.FC<StaffActivityJournalProps> = ({
  orders = [],
  allStaff = [],
  currentStaff,
  materials = [],
  expenses = [],
  wasteRecords = [],
  startDate,
  endDate,
  periodLabel,
  selectedStaffId,
  onSelectStaffId,
  onSelectOrderForPrint
}) => {
  const isManager = currentStaff?.role === 'manager';
  const effectiveStaffId = isManager ? selectedStaffId : (currentStaff?.id || 'all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'direct_sale' | 'photo_studio'>('all');
  const [printStatementStaff, setPrintStatementStaff] = useState<Staff | null>(null);

  // Helper to compute cost of an item
  const getItemCost = (item: { service: any; quantity: number }): number => {
    const unitCost = getItemUnitCost(item.service, materials);
    return unitCost * item.quantity;
  };

  // Helper to get staff display list
  const staffOptions = useMemo(() => {
    if (allStaff && allStaff.length > 0) return allStaff;
    return [
      { id: 'staff_fouad', name: 'فؤاد (fouad)', role: 'worker' as const, phone: '', avatar: '', active: true },
      { id: 'staff_amine', name: 'أمين (amine)', role: 'worker' as const, phone: '', avatar: '', active: true }
    ];
  }, [allStaff]);

  // Filter orders by date range and selected staff
  const relevantOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = o.createdAt ? o.createdAt.split('T')[0] : '';
      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;
      if (effectiveStaffId !== 'all' && o.staffId !== effectiveStaffId && o.staffName !== effectiveStaffId) {
        if (!isManager && (o.staffName === currentStaff?.name || o.staffId === currentStaff?.id)) {
          return true;
        }
        return false;
      }
      return true;
    });
  }, [orders, startDate, endDate, effectiveStaffId, isManager, currentStaff]);

  // Filter expenses by date and staff
  const relevantExpenses = useMemo(() => {
    return (expenses || []).filter(e => {
      const expDate = e.createdAt ? e.createdAt.split('T')[0] : '';
      if (startDate && expDate < startDate) return false;
      if (endDate && expDate > endDate) return false;
      if (selectedStaffId !== 'all' && e.staffId !== selectedStaffId && e.staffName !== selectedStaffId) {
        return false;
      }
      return true;
    });
  }, [expenses, startDate, endDate, selectedStaffId]);

  // Filter waste by date and staff
  const relevantWaste = useMemo(() => {
    return (wasteRecords || []).filter(w => {
      const wDate = w.createdAt ? w.createdAt.split('T')[0] : '';
      if (startDate && wDate < startDate) return false;
      if (endDate && wDate > endDate) return false;
      if (selectedStaffId !== 'all' && w.staffId !== selectedStaffId && w.staffName !== selectedStaffId) {
        return false;
      }
      return true;
    });
  }, [wasteRecords, startDate, endDate, selectedStaffId]);

  // 1. Group items/services sold by this staff (كشف الأصناف والسلع المنفذة بالتفصيل)
  const itemizedSalesBreakdown = useMemo(() => {
    const map: Record<string, {
      serviceId: string;
      name: string;
      itemType: 'direct_sale' | 'service';
      unitPrice: number;
      quantitySold: number;
      totalRevenue: number;
      totalCost: number;
      netProfit: number;
      ordersCount: number;
    }> = {};

    for (const ord of relevantOrders) {
      for (const it of ord.items) {
        const key = it.service.id || it.service.name;
        const itType = it.service.itemType === 'direct_sale' ? 'direct_sale' : 'service';
        const price = it.customPrice ?? it.service.price;
        const revenue = price * it.quantity;
        const cost = getItemCost(it);
        const profit = Math.max(0, revenue - cost);

        if (!map[key]) {
          map[key] = {
            serviceId: key,
            name: it.service.name,
            itemType: itType,
            unitPrice: price,
            quantitySold: 0,
            totalRevenue: 0,
            totalCost: 0,
            netProfit: 0,
            ordersCount: 0
          };
        }

        map[key].quantitySold += it.quantity;
        map[key].totalRevenue += revenue;
        map[key].totalCost += cost;
        map[key].netProfit += profit;
        map[key].ordersCount += 1;
      }
    }

    return Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [relevantOrders, materials]);

  // Filter breakdown by category
  const filteredItemBreakdown = useMemo(() => {
    if (filterCategory === 'all') return itemizedSalesBreakdown;
    if (filterCategory === 'direct_sale') {
      return itemizedSalesBreakdown.filter(i => i.itemType === 'direct_sale');
    }
    return itemizedSalesBreakdown.filter(i => i.itemType === 'service');
  }, [itemizedSalesBreakdown, filterCategory]);

  // 2. Timeline of all worker events (الخط الزمني لكافة أنشطة العامل)
  interface ActivityEvent {
    id: string;
    type: 'sale_direct' | 'sale_service' | 'expense' | 'waste';
    timestamp: string;
    title: string;
    description: string;
    amount?: number;
    profit?: number;
    cost?: number;
    staffName: string;
    orderRef?: Order;
    badge: string;
  }

  const activityTimeline = useMemo(() => {
    const events: ActivityEvent[] = [];

    // Add order events
    for (const o of relevantOrders) {
      const hasDirectSale = o.items.some(i => i.service.itemType === 'direct_sale');
      const hasService = o.items.some(i => i.service.itemType !== 'direct_sale');

      const itemsDesc = o.items.map(i => `${i.service.name} (×${i.quantity})`).join(' + ');
      const ordCost = o.items.reduce((sum, it) => sum + getItemCost(it), 0);
      const ordProfit = Math.max(0, o.total - ordCost);

      events.push({
        id: `ord_${o.id}`,
        type: hasDirectSale && !hasService ? 'sale_direct' : 'sale_service',
        timestamp: o.createdAt,
        title: `معاملة تذكرة #${o.ticketNumber} ─ للزبون: ${o.customerName}`,
        description: itemsDesc,
        amount: o.total,
        cost: ordCost,
        profit: ordProfit,
        staffName: o.staffName,
        orderRef: o,
        badge: hasDirectSale && !hasService ? 'بيع سلع' : 'طباعة وتصوير'
      });
    }

    // Add expense events
    for (const e of relevantExpenses) {
      events.push({
        id: `exp_${e.id}`,
        type: 'expense',
        timestamp: e.createdAt,
        title: `تسجيل مصروف / توريد: ${e.title}`,
        description: e.category === 'materials' ? 'شراء مواد وسلع للمخزن' : e.notes || 'مصاريف تشغيلية',
        amount: -e.amount,
        staffName: e.staffName,
        badge: e.category === 'materials' ? 'توريد مخزون' : 'مصروف'
      });
    }

    // Add waste events
    for (const w of relevantWaste) {
      events.push({
        id: `wst_${w.id}`,
        type: 'waste',
        timestamp: w.createdAt,
        title: `تسجيل إتلاف مادة: ${w.materialName} (${w.quantity} ${w.unit})`,
        description: `السبب: ${w.reason} ${w.notes ? `─ ${w.notes}` : ''}`,
        cost: w.costLoss,
        staffName: w.staffName,
        badge: 'هدر / إتلاف'
      });
    }

    // Sort descending by timestamp
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [relevantOrders, relevantExpenses, relevantWaste, materials]);

  // Totals for the selected worker
  const workerTotals = useMemo(() => {
    const totalOrders = relevantOrders.length;
    const totalRevenue = relevantOrders.reduce((sum, o) => sum + o.total, 0);
    const totalCost = relevantOrders.reduce((sum, o) => {
      return sum + o.items.reduce((s, it) => s + getItemCost(it), 0);
    }, 0);
    const totalProfit = Math.max(0, totalRevenue - totalCost);
    const totalExpensesRecorded = relevantExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalWasteLoss = relevantWaste.reduce((sum, w) => sum + w.costLoss, 0);

    const directSalesCount = itemizedSalesBreakdown
      .filter(i => i.itemType === 'direct_sale')
      .reduce((sum, i) => sum + i.quantitySold, 0);

    const servicesCount = itemizedSalesBreakdown
      .filter(i => i.itemType === 'service')
      .reduce((sum, i) => sum + i.quantitySold, 0);

    return {
      totalOrders,
      totalRevenue,
      totalCost,
      totalProfit,
      totalExpensesRecorded,
      totalWasteLoss,
      directSalesCount,
      servicesCount,
      profitMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0
    };
  }, [relevantOrders, relevantExpenses, relevantWaste, itemizedSalesBreakdown, materials]);

  // Export Staff Activity to CSV
  const handleExportStaffCSV = () => {
    const rows = filteredItemBreakdown.map(it => ({
      'اسم الصنف / الخدمة': it.name,
      'النوع': it.itemType === 'direct_sale' ? 'سلعة بيع مباشر (فلاش ديسك، بطاقة...)' : 'خدمة واستوديو (صور، طباعة...)',
      'الكمية المنفذة / المباعة': it.quantitySold,
      'سعر الوحدة (دج)': it.unitPrice,
      'إجمالي المبيعات (دج)': it.totalRevenue,
      'إجمالي التكلفة (دج)': it.totalCost,
      'صافي الربح المحقق (دج)': it.netProfit,
      'عدد التذاكر': it.ordersCount
    }));

    const currentStaffName = selectedStaffId === 'all' 
      ? 'All_Staff' 
      : (staffOptions.find(s => s.id === selectedStaffId)?.name || selectedStaffId);

    exportToCSV(`Fotop_Staff_Sales_${currentStaffName}_${startDate || 'all'}_to_${endDate || 'all'}`, rows);
  };

  const selectedStaffObj = staffOptions.find(s => s.id === selectedStaffId);

  return (
    <div className="space-y-5">
      
      {/* 1. Staff Selector Chips (Shown to Manager only) */}
      {isManager ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#E31C2B]" />
              <h3 className="font-black text-sm text-[#292A34]">
                اختر العامل لعرض كشف نشاطه ومبيعاته المفصلة:
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
              الفترة: {periodLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            
            {/* All Staff Option */}
            <button
              onClick={() => onSelectStaffId('all')}
              className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                selectedStaffId === 'all'
                  ? 'bg-[#292A34] text-white border-[#292A34] shadow-md'
                  : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-black text-xs">
                  👥
                </div>
                <div>
                  <div className="font-black text-xs">جميع العمال</div>
                  <div className="text-[10px] opacity-80 font-medium mt-0.5">كشف مجمّع لكل الفريق</div>
                </div>
              </div>
              {selectedStaffId === 'all' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Individual Staff Cards */}
            {staffOptions.map(st => {
              const isSelected = selectedStaffId === st.id;
              // Calculate quick counts for this specific staff
              const stOrders = orders.filter(o => {
                const oDate = o.createdAt ? o.createdAt.split('T')[0] : '';
                if (startDate && oDate < startDate) return false;
                if (endDate && oDate > endDate) return false;
                return o.staffId === st.id || o.staffName === st.name;
              });
              const stRev = stOrders.reduce((sum, o) => sum + o.total, 0);

              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStaffId(st.id)}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#E31C2B] text-white border-[#E31C2B] shadow-md shadow-red-500/20'
                      : 'bg-white hover:bg-slate-50 text-[#292A34] border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                      isSelected ? 'bg-white text-[#E31C2B]' : 'bg-[#292A34] text-white'
                    }`}>
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-xs flex items-center gap-1">
                        <span>{st.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-normal ${
                          isSelected ? 'bg-red-800 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {st.role === 'admin' ? 'مدير' : 'مصور'}
                        </span>
                      </div>
                      <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-red-100' : 'text-slate-500'}`}>
                        {stOrders.length} معاملة • {formatCurrency(stRev)}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                </button>
              );
            })}

          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#292A34] text-white flex items-center justify-center font-black text-base">
              {currentStaff?.name.charAt(0) || 'ع'}
            </div>
            <div>
              <h3 className="font-black text-sm text-[#292A34]">
                كشف نشاطك ومبيعاتك المنفذة: ({currentStaff?.name})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                جميع السلع والخدمات التي قمت ببيعها وتسجيلها في هذه الفترة
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-xl">
            الفترة: {periodLabel}
          </span>
        </div>
      )}

      {/* 2. Worker Performance KPI Dashboard */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isManager ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3.5`}>
        
        {/* Gross Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">{isManager ? 'إجمالي مبيعات العامل' : 'إجمالي مبيعاتك الشخصية'}</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono font-black text-xl text-emerald-700">
            {formatCurrency(workerTotals.totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span>{workerTotals.totalOrders} تذكرة منجزة</span>
          </div>
        </div>

        {/* Net Profit (Manager Only) */}
        {isManager && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm bg-gradient-to-br from-white to-red-50/40">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold">صافي الربح المحقق</span>
              <TrendingUp className="w-4 h-4 text-[#E31C2B]" />
            </div>
            <div className="font-mono font-black text-xl text-[#E31C2B]">
              {formatCurrency(workerTotals.totalProfit)}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-1">
              هامش الربح: %{workerTotals.profitMargin}
            </div>
          </div>
        )}

        {/* Goods Sold Count (مثل فلاش ديسك) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">سلع البيع المباشر</span>
            <ShoppingBag className="w-4 h-4 text-sky-600" />
          </div>
          <div className="font-mono font-black text-xl text-sky-700">
            {workerTotals.directSalesCount} <span className="text-xs font-normal text-slate-500">قطعة مباعة</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            فلاش ديسك، كارت ميموار، ألبومات
          </div>
        </div>

        {/* Services & Photo Count (مثل طباعة الصور) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">خدمات التصوير والطباعة</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-mono font-black text-xl text-purple-700">
            {workerTotals.servicesCount} <span className="text-xs font-normal text-slate-500">خدمة / صورة</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            تصوير فيزا، طباعة صور، سحب وثائق
          </div>
        </div>

      </div>

      {/* 3. Itemized Breakdown: Exactly What This Worker Sold & Printed */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Header & Category Tabs */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-black text-sm text-[#292A34]">
              <Sparkles className="w-4 h-4 text-[#E31C2B]" />
              <span>
                كشف الأصناف والسلع المنفذة بالتفصيل
                {selectedStaffObj ? ` ─ لـ (${selectedStaffObj.name})` : ''}:
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              كل سلعة بيعت (مثل الفلاش ديسك) وكل خدمة طُبعت (مثل صور الفيزا والـ 10x15) مع الكميات والمداخيل والربح
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Filter Tabs */}
            <div className="bg-[#F0F0F0] p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterCategory === 'all' ? 'bg-[#292A34] text-white shadow-xs' : 'text-slate-600 hover:text-[#292A34]'
                }`}
              >
                الكل ({itemizedSalesBreakdown.length})
              </button>
              <button
                onClick={() => setFilterCategory('direct_sale')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  filterCategory === 'direct_sale' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 hover:text-[#292A34]'
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>سلع البيع المباشر</span>
              </button>
              <button
                onClick={() => setFilterCategory('photo_studio')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  filterCategory === 'photo_studio' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-[#292A34]'
                }`}
              >
                <Package className="w-3 h-3" />
                <span>خدمات واستوديو</span>
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportStaffCSV}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="تصدير كشف مبيعات العامل إلى Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير كشف</span>
            </button>

            {/* Print Worker Statement */}
            <button
              onClick={() => setPrintStatementStaff(selectedStaffObj || staffOptions[0])}
              className="px-3 py-1.5 rounded-xl bg-[#292A34] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="طباعة كشف حساب ومبيعات العامل"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الكشف</span>
            </button>

          </div>
        </div>

        {/* Table of Itemized Sales */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#292A34] text-white font-bold">
              <tr>
                <th className="p-3.5 whitespace-nowrap">الصنف / الخدمة</th>
                <th className="p-3.5 whitespace-nowrap">النوع والتصنيف</th>
                <th className="p-3.5 whitespace-nowrap text-center">الكمية المنفذة / المباعة</th>
                <th className="p-3.5 whitespace-nowrap">سعر الوحدة</th>
                <th className="p-3.5 whitespace-nowrap">إجمالي المبيعات</th>
                {isManager && <th className="p-3.5 whitespace-nowrap">التكلفة الإجمالية</th>}
                {isManager && <th className="p-3.5 whitespace-nowrap">صافي الربح المحقق</th>}
                <th className="p-3.5 whitespace-nowrap text-center">عدد التذاكر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredItemBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 8 : 6} className="p-10 text-center text-slate-400 font-bold">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p>لا توجد مبيعات مسجلة لهذا العامل خلال الفترة المحددة ({periodLabel})</p>
                  </td>
                </tr>
              ) : (
                filteredItemBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Item Name */}
                    <td className="p-3.5 font-bold text-[#292A34]">
                      <div className="flex items-center gap-2">
                        {item.itemType === 'direct_sale' ? (
                          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                            <Package className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-[#292A34]">{item.name}</span>
                        </div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="p-3.5">
                      {item.itemType === 'direct_sale' ? (
                        <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[10px] inline-flex items-center gap-1">
                          🛒 سلعة بيع مباشر
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px] inline-flex items-center gap-1">
                          📸 خدمة واستوديو
                        </span>
                      )}
                    </td>

                    {/* Quantity Sold */}
                    <td className="p-3.5 text-center">
                      <span className="inline-block bg-[#F0F0F0] border border-slate-300 px-3 py-1 rounded-xl font-mono font-black text-sm text-[#292A34]">
                        {item.quantitySold} <span className="text-[10px] font-normal text-slate-500">
                          {item.itemType === 'direct_sale' ? 'قطعة' : 'صورة/طلب'}
                        </span>
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="p-3.5 font-mono text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>

                    {/* Total Revenue */}
                    <td className="p-3.5 font-mono font-black text-sm text-[#292A34]">
                      {formatCurrency(item.totalRevenue)}
                    </td>

                    {/* Total Cost (Manager Only) */}
                    {isManager && (
                      <td className="p-3.5 font-mono text-amber-700">
                        {formatCurrency(item.totalCost)}
                      </td>
                    )}

                    {/* Net Profit (Manager Only) */}
                    {isManager && (
                      <td className="p-3.5">
                        <div className="font-mono font-black text-xs text-emerald-700 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          <span>+{formatCurrency(item.netProfit)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ربح %{item.totalRevenue > 0 ? Math.round((item.netProfit / item.totalRevenue) * 100) : 0}
                        </div>
                      </td>
                    )}

                    {/* Orders Count */}
                    <td className="p-3.5 text-center font-mono text-slate-500 font-bold">
                      {item.ordersCount}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
            {filteredItemBreakdown.length > 0 && (
              <tfoot className="bg-slate-100 font-black text-xs border-t-2 border-slate-300">
                <tr>
                  <td colSpan={2} className="p-3.5 text-[#292A34]">
                    المجموع الكلي للأصناف المباعة ({filteredItemBreakdown.length} صنف):
                  </td>
                  <td className="p-3.5 text-center font-mono text-sm text-[#E31C2B]">
                    {filteredItemBreakdown.reduce((sum, i) => sum + i.quantitySold, 0)} قطعة/خدمة
                  </td>
                  <td className="p-3.5">─</td>
                  <td className="p-3.5 font-mono text-emerald-800 text-sm">
                    {formatCurrency(filteredItemBreakdown.reduce((sum, i) => sum + i.totalRevenue, 0))}
                  </td>
                  {isManager && (
                    <td className="p-3.5 font-mono text-amber-800">
                      {formatCurrency(filteredItemBreakdown.reduce((sum, i) => sum + i.totalCost, 0))}
                    </td>
                  )}
                  {isManager && (
                    <td className="p-3.5 font-mono text-[#E31C2B] text-sm">
                      +{formatCurrency(filteredItemBreakdown.reduce((sum, i) => sum + i.netProfit, 0))}
                    </td>
                  )}
                  <td className="p-3.5 text-center font-mono">
                    {relevantOrders.length}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </div>

      {/* 4. Chronological Live Timeline Feed (سجل حركات العامل بالدقيقة والساعة) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#E31C2B]" />
            <div>
              <h3 className="font-black text-sm text-[#292A34]">
                الخط الزمني لكافة العمليات والأنشطة ({activityTimeline.length} حركة):
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                سجل كل عملية بيع مباشر، طباعة صورة، توريد مخزون، ومصروفات مرتبة زمنياً
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">من الأحدث إلى الأقدم</span>
        </div>

        {activityTimeline.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold text-xs">
            لا توجد حركات مسجلة في هذه الفترة
          </div>
        ) : (
          <div className="space-y-3">
            {activityTimeline.map((ev, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                
                {/* Event Left / Title */}
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold mt-0.5 ${
                    ev.type === 'sale_direct' 
                      ? 'bg-sky-100 text-sky-700' 
                      : ev.type === 'sale_service'
                      ? 'bg-purple-100 text-purple-700'
                      : ev.type === 'expense'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {ev.type === 'sale_direct' && <ShoppingBag className="w-4 h-4" />}
                    {ev.type === 'sale_service' && <Package className="w-4 h-4" />}
                    {ev.type === 'expense' && <Coins className="w-4 h-4" />}
                    {ev.type === 'waste' && <Trash2 className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs text-[#292A34]">{ev.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                        ev.type === 'sale_direct'
                          ? 'bg-sky-100 text-sky-800'
                          : ev.type === 'sale_service'
                          ? 'bg-purple-100 text-purple-800'
                          : ev.type === 'expense'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ev.badge}
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.2 rounded-md font-bold">
                        المنفذ: {ev.staffName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium mt-1">
                      {ev.description}
                    </p>

                    <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span>{formatTime(ev.timestamp)} ─ {formatDate(ev.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Event Right / Financial values */}
                <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  {ev.amount !== undefined && (
                    <div className={`font-mono font-black text-sm ${ev.amount >= 0 ? 'text-[#292A34]' : 'text-amber-700'}`}>
                      {ev.amount >= 0 ? `+${formatCurrency(ev.amount)}` : formatCurrency(ev.amount)}
                    </div>
                  )}
                  {isManager && ev.profit !== undefined && (
                    <div className="text-[11px] font-mono font-black text-emerald-700 mt-0.5">
                      صافي: +{formatCurrency(ev.profit)}
                    </div>
                  )}
                  {ev.orderRef && (
                    <button
                      onClick={() => onSelectOrderForPrint(ev.orderRef!)}
                      className="mt-1 text-[10px] text-[#E31C2B] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Printer className="w-2.5 h-2.5" />
                      <span>وصل التذكرة</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* 5. Printable Worker Statement Modal */}
      {printStatementStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <Printer className="w-5 h-5 text-[#E31C2B]" />
                <span>كشف حساب وأنشطة العامل: {printStatementStaff.name}</span>
              </div>
              <button 
                onClick={() => setPrintStatementStaff(null)} 
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Content Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs text-[#292A34] font-medium print:p-0">
              
              {/* Studio Header */}
              <div className="text-center border-b pb-4 border-slate-200">
                <h2 className="text-lg font-black text-[#292A34]">استوديو التصوير الرقمي FOTOP</h2>
                <p className="text-xs text-slate-500 font-bold mt-0.5">كشف مبيعات وأنشطة الموظف الرسمية</p>
                <div className="mt-2 inline-flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span><strong>اسم الموظف:</strong> {printStatementStaff.name}</span>
                  <span>•</span>
                  <span><strong>الفترة:</strong> {periodLabel}</span>
                  <span>•</span>
                  <span><strong>تاريخ الاستخراج:</strong> {new Date().toLocaleDateString('ar-DZ')}</span>
                </div>
              </div>

              {/* Financial Box */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[11px] font-bold">إجمالي المبيعات</div>
                  <div className="font-mono font-black text-sm text-[#292A34] mt-0.5">{formatCurrency(workerTotals.totalRevenue)}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[11px] font-bold">تكلفة المواد والسلع</div>
                  <div className="font-mono font-bold text-amber-700 text-sm mt-0.5">{formatCurrency(workerTotals.totalCost)}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-emerald-800 text-[11px] font-bold">صافي الأرباح المحققة</div>
                  <div className="font-mono font-black text-sm text-emerald-700 mt-0.5">+{formatCurrency(workerTotals.totalProfit)}</div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-black text-[#292A34] border-b pb-1 border-slate-200">تفاصيل الأصناف والخدمات المنفذة:</h4>
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2">الصنف / الخدمة</th>
                      <th className="p-2 text-center">الكمية المباعة</th>
                      <th className="p-2">سعر الوحدة</th>
                      <th className="p-2">إجمالي المبلغ</th>
                      <th className="p-2">صافي الربح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {filteredItemBreakdown.map((it, i) => (
                      <tr key={i}>
                        <td className="p-2">{it.name}</td>
                        <td className="p-2 text-center font-bold font-mono">{it.quantitySold}</td>
                        <td className="p-2 font-mono">{formatCurrency(it.unitPrice)}</td>
                        <td className="p-2 font-mono font-bold">{formatCurrency(it.totalRevenue)}</td>
                        <td className="p-2 font-mono font-bold text-emerald-700">+{formatCurrency(it.netProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center font-bold">
                <div>
                  <p className="text-slate-600 mb-8">توقيع الموظف:</p>
                  <p className="text-slate-400">........................</p>
                </div>
                <div>
                  <p className="text-slate-600 mb-8">ختم وإدارة الاستوديو:</p>
                  <p className="text-slate-400">........................</p>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>إرسال للطباعة الآن</span>
              </button>
              <button
                onClick={() => setPrintStatementStaff(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
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
