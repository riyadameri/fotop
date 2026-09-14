import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Wallet, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Square, 
  TrendingUp, 
  ReceiptText, 
  Lock, 
  UserCheck,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { Shift, Staff, Expense } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';

interface ShiftsViewProps {
  shifts: Shift[];
  activeShift: Shift | undefined;
  allStaff: Staff[];
  currentStaff: Staff;
  onOpenShift: (staffId: string, staffName: string, openingCash: number) => void;
  onCloseShift: (shiftId: string, actualCash: number, notes?: string) => void;
  onSwitchStaff: (staff: Staff) => void;
}

export const ShiftsView: React.FC<ShiftsViewProps> = ({
  shifts = [],
  activeShift,
  allStaff = [],
  currentStaff,
  onOpenShift,
  onCloseShift,
  onSwitchStaff
}) => {
  // Open Shift Form State
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [openStaffId, setOpenStaffId] = useState<string>(currentStaff?.id || '');
  
  const getStoreOpeningCash = () => {
    const storeId = currentStaff?.storeId || 'store_sidiamer';
    const saved = localStorage.getItem(`fotop_store_opening_cash_${storeId}`);
    if (saved) return saved;
    return storeId === 'store_labhour' ? '3000' : '5000';
  };

  const [openingCashInput, setOpeningCashInput] = useState<string>(getStoreOpeningCash);

  // Update opening cash if staff/store changes
  useEffect(() => {
    setOpeningCashInput(getStoreOpeningCash());
  }, [currentStaff?.storeId]);

  // Close Shift Form State
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');

  const handleExecuteOpen = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = (allStaff || []).find(s => s.id === openStaffId) || currentStaff;
    onOpenShift(staff.id, staff.name, Number(openingCashInput) || 0);
    setShowOpenModal(false);
  };

  const handleExecuteClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const countedCash = Number(actualCashInput) || 0;
    onCloseShift(activeShift.id, countedCash, closeNotes);
    setShowCloseModal(false);
    setActualCashInput('');
    setCloseNotes('');
  };

  const handleExportCSV = () => {
    const rows = (shifts || []).map(s => ({
      'رقم الوردية': s.id,
      'اسم الموظف': s.staffName,
      'وقت البدء': formatDate(s.startTime),
      'وقت الإغلاق': s.endTime ? formatDate(s.endTime) : 'نشطة حالياً',
      'الرصيد الافتتاحي (دج)': s.openingCash,
      'المبيعات النقدية (دج)': s.cashSales,
      'المصروفات النثرية (دج)': s.expenses,
      'الرصيد المتوقع بالدرج (دج)': s.expectedCash,
      'الرصيد الفعلي بعد الجرد (دج)': s.actualCash ?? 'لم تغلق',
      'الفارق / العجز أو الفائض (دج)': s.difference ?? '─',
      'عدد التذاكر المنجزة': s.ordersCount,
      'الحالة': s.status === 'open' ? 'نشطة' : 'مغلقة ومطابقة'
    }));
    exportToCSV('Fotop_Shifts_Audit_Report', rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Current Active Shift Card */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#292A34] text-white">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#292A34]">حالة وردية العمل الحالية (Live Cash Drawer)</h3>
              <p className="text-xs text-slate-500 font-medium">متابعة دقيقة لحركة الصندوق والعهد النقدية بين المصورين والكاشير</p>
            </div>
          </div>

          <div>
            {activeShift ? (
              <button
                onClick={() => {
                  setActualCashInput(String(activeShift.expectedCash));
                  setShowCloseModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-black text-xs flex items-center gap-2 shadow-md shadow-[#E31C2B]/30 transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>إغلاق الوردية ومطابقة الصندوق</span>
              </button>
            ) : (
              <button
                onClick={() => setShowOpenModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>افتتاح وردية عمل جديدة</span>
              </button>
            )}
          </div>
        </div>

        {activeShift ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
            
            <div className="bg-[#F0F0F0] p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">الموظف المسؤول</span>
              <div className="text-sm font-black text-[#292A34] mt-1 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#E31C2B]" />
                <span>{activeShift.staffName}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                بدأت: {formatDate(activeShift.startTime)}
              </span>
            </div>

            <div className="bg-[#F0F0F0] p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">الرصيد الافتتاحي (الصرف)</span>
              <div className="text-lg font-black text-[#292A34] mt-1 font-mono">
                {formatCurrency(activeShift.openingCash)}
              </div>
              <span className="text-[10px] text-slate-500">العهدة الابتدائية في الدرج</span>
            </div>

            <div className="bg-[#F0F0F0] p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">المبيعات النقدية للوردية</span>
              <div className="text-lg font-black text-emerald-700 mt-1 font-mono">
                +{formatCurrency(activeShift.cashSales)}
              </div>
              <span className="text-[10px] text-slate-500 font-bold">{activeShift.ordersCount} تذاكر مدفوعة</span>
            </div>

            <div className="bg-[#F0F0F0] p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">المصروفات النثرية المسحوبة</span>
              <div className="text-lg font-black text-rose-600 mt-1 font-mono">
                -{formatCurrency(activeShift.expenses)}
              </div>
              <span className="text-[10px] text-slate-500">مشتريات طارئة ونثريات</span>
            </div>

            <div className="bg-[#292A34] text-white p-3.5 rounded-xl shadow-md">
              <span className="text-[11px] font-bold text-slate-300 block">المبلغ المتوقع بالدرج الآن</span>
              <div className="text-xl font-black text-amber-400 mt-1 font-mono">
                {formatCurrency(activeShift.expectedCash)}
              </div>
              <span className="text-[10px] text-emerald-400 font-bold">جاهز للجرد والمطابقة</span>
            </div>

          </div>
        ) : (
          <div className="bg-[#F0F0F0] p-8 text-center rounded-xl border border-dashed border-slate-300 space-y-2">
            <AlertTriangle className="w-10 h-10 text-[#E31C2B] mx-auto" />
            <h4 className="text-sm font-bold text-[#292A34]">لا توجد وردية مفتوحة حالياً في النظام</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              اضغط على "افتتاح وردية عمل جديدة" وحدد رصيد الصرف الافتتاحي للبدء في تسجيل التذاكر والمبيعات بدقة
            </p>
          </div>
        )}
      </div>

      {/* Staff Team Overview & Performance */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E31C2B] text-white">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#292A34]">طاقم العمل المسجل في الاستوديو</h3>
              <p className="text-xs text-slate-500 font-medium">تبديل الأدوار وتتبع إنتاجية كل موظف</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {allStaff.map(s => {
            const isCurrent = s.id === currentStaff.id;

            return (
              <div
                key={s.id}
                onClick={() => onSwitchStaff(s)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  isCurrent
                    ? 'border-[#E31C2B] bg-white shadow-md'
                    : 'border-slate-200 bg-[#F0F0F0] hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{s.avatar}</span>
                  <div>
                    <div className="text-xs font-bold text-[#292A34]">{s.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {s.role === 'photographer' ? 'مصور محترف' :
                       s.role === 'designer' ? 'مصمم ومعدل فوتوشوب' :
                       s.role === 'cashier' ? 'كاشير واستقبال' : 'مدير الاستوديو'}
                    </div>
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E31C2B] text-white font-bold">
                    نشط
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Shift History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-[#292A34]">سجل الورديات وعمليات إغلاق الصندوق السابقة</h3>
            <p className="text-xs text-slate-500 font-medium">سجل رقابي يوضح الفوارق والعجز أو الفائض مع التوقيع الرقمي</p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-[#F0F0F0] hover:bg-slate-200 text-[#292A34] font-bold text-xs flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>تصدير سجل الورديات</span>
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#292A34] text-white font-bold">
              <tr>
                <th className="p-3.5">الموظف</th>
                <th className="p-3.5">فترة الوردية</th>
                <th className="p-3.5">الافتتاحي</th>
                <th className="p-3.5">المبيعات النقدية</th>
                <th className="p-3.5">المصروفات</th>
                <th className="p-3.5">المتوقع بالدرج</th>
                <th className="p-3.5">المبلغ الفعلي المقبوض</th>
                <th className="p-3.5">الفارق (عجز/فائض)</th>
                <th className="p-3.5">التذاكر</th>
                <th className="p-3.5">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {shifts.map(s => {
                const isDiff = s.difference !== undefined && s.difference !== 0;

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-[#292A34]">{s.staffName}</td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                      <div>من: {formatDate(s.startTime)}</div>
                      <div>إلى: {s.endTime ? formatDate(s.endTime) : 'نشطة'}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">{formatCurrency(s.openingCash)}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700">+{formatCurrency(s.cashSales)}</td>
                    <td className="p-3.5 font-mono font-bold text-rose-600">-{formatCurrency(s.expenses)}</td>
                    <td className="p-3.5 font-mono font-black text-[#292A34]">{formatCurrency(s.expectedCash)}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">
                      {s.actualCash !== undefined ? formatCurrency(s.actualCash) : '─'}
                    </td>
                    <td className="p-3.5">
                      {s.difference === undefined ? (
                        <span className="text-slate-400">─</span>
                      ) : s.difference === 0 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                          متطابق 0 دج
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                          s.difference > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {s.difference > 0 ? `+${s.difference} دج (فائض)` : `${s.difference} دج (عجز)`}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono font-bold">{s.ordersCount}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        s.status === 'open' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {s.status === 'open' ? 'نشطة' : 'مغلقة ومؤرشفة'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards (No Horizontal Scrolling) */}
        <div className="md:hidden space-y-3">
          {shifts.map(s => (
            <div key={s.id} className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#292A34]">{s.staffName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    s.status === 'open' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {s.status === 'open' ? 'نشطة' : 'مغلقة'}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500 font-bold">
                  {s.ordersCount} تذاكر
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">الافتتاحي:</span>
                  <span className="font-mono font-bold text-slate-700">{formatCurrency(s.openingCash)}</span>
                </div>
                <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 block text-[10px]">المبيعات:</span>
                  <span className="font-mono font-bold text-emerald-800">+{formatCurrency(s.cashSales)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">المتوقع بالدرج:</span>
                  <span className="font-mono font-black text-[#292A34]">{formatCurrency(s.expectedCash)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">المبلغ الفعلي:</span>
                  <span className="font-mono font-black text-slate-800">
                    {s.actualCash !== undefined ? formatCurrency(s.actualCash) : '─'}
                  </span>
                </div>
              </div>

              {s.difference !== undefined && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 text-[11px]">الفارق النهائي:</span>
                  {s.difference === 0 ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                      متطابق 0 دج
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${
                      s.difference > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {s.difference > 0 ? `+${s.difference} دج (فائض)` : `${s.difference} دج (عجز)`}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <Play className="w-5 h-5 text-emerald-400" />
                <span>افتتاح وردية جديدة</span>
              </div>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleExecuteOpen} className="p-5 space-y-4 text-xs font-medium">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">الموظف / المستلم للوردية</label>
                <select
                  value={openStaffId}
                  onChange={(e) => setOpenStaffId(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                >
                  {allStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold">رصيد الصرف الافتتاحي في الدرج (Cash In Hand)</label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    معتمد من المدير فؤاد
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    required
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                    placeholder="5000 دج مثلاً..."
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-black text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">دج</span>
                </div>

                {/* Quick Store Preset Buttons */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
                  <span className="text-slate-500 font-bold text-[10px]">الرصيد المعتمد للمتجر:</span>
                  <button
                    type="button"
                    onClick={() => setOpeningCashInput('5000')}
                    className={`px-2 py-0.5 rounded-lg border font-mono font-bold cursor-pointer transition-colors ${
                      openingCashInput === '5000' ? 'bg-[#E31C2B] text-white border-[#E31C2B]' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    سيدي عامر (5,000 دج)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpeningCashInput('3000')}
                    className={`px-2 py-0.5 rounded-lg border font-mono font-bold cursor-pointer transition-colors ${
                      openingCashInput === '3000' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    الأبحور (3,000 دج)
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md cursor-pointer"
                >
                  تأكيد فتح الوردية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>إغلاق الوردية وجرد الصندوق</span>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleExecuteClose} className="p-5 space-y-4 text-xs font-medium">
              
              <div className="bg-[#292A34] text-white p-3.5 rounded-xl space-y-1 font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>الرصيد الافتتاحي:</span>
                  <span>{formatCurrency(activeShift.openingCash)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>المبيعات النقدية:</span>
                  <span>+{formatCurrency(activeShift.cashSales)}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>المصروفات المسحوبة:</span>
                  <span>-{formatCurrency(activeShift.expenses)}</span>
                </div>
                <div className="flex justify-between text-amber-300 pt-1.5 border-t border-slate-700 font-black text-sm">
                  <span>المبلغ المتوقع بالدرج:</span>
                  <span>{formatCurrency(activeShift.expectedCash)}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">المبلغ الفعلي الموجود بالدرج بعد العد (دج)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  placeholder={`أدخل المبلغ المعدود (${activeShift.expectedCash} دج)`}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-black text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
                />
              </div>

              {actualCashInput !== '' && (
                <div className="p-3 rounded-xl bg-[#F0F0F0] border border-slate-300 flex justify-between items-center font-bold">
                  <span>حالة المطابقة:</span>
                  <span className={`font-mono text-sm ${
                    Number(actualCashInput) - activeShift.expectedCash === 0 ? 'text-emerald-700' :
                    Number(actualCashInput) - activeShift.expectedCash > 0 ? 'text-emerald-700' : 'text-[#E31C2B]'
                  }`}>
                    {Number(actualCashInput) - activeShift.expectedCash === 0 ? 'مطابق تماماً 0 دج' :
                     Number(actualCashInput) - activeShift.expectedCash > 0 ? `+${Number(actualCashInput) - activeShift.expectedCash} دج (فائض)` :
                     `${Number(actualCashInput) - activeShift.expectedCash} دج (عجز)`}
                  </span>
                </div>
              )}

              <div>
                <label className="text-slate-700 block mb-1 font-bold">ملاحظات الإغلاق والتسليم</label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="ملاحظات حول تسليم العهدة للمناوب القادم..."
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-black shadow-md shadow-[#E31C2B]/30 cursor-pointer"
                >
                  تأكيد الإغلاق والأرشفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
