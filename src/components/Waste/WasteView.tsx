import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Plus, 
  Trash2, 
  User, 
  Calendar, 
  DollarSign, 
  Layers, 
  FileSpreadsheet, 
  AlertTriangle,
  TrendingDown,
  Info
} from 'lucide-react';
import { WasteRecord, Material, Staff } from '../../types';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';

interface WasteViewProps {
  wasteRecords: WasteRecord[];
  materials: Material[];
  staffList: Staff[];
  currentStaff: Staff;
  onAddWasteRecord: (record: Omit<WasteRecord, 'id' | 'createdAt'>) => void;
}

export const WasteView: React.FC<WasteViewProps> = ({
  wasteRecords = [],
  materials = [],
  staffList = [],
  currentStaff,
  onAddWasteRecord
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>((materials || [])[0]?.id || '');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<WasteRecord['reason']>('print_error');
  const [notes, setNotes] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(currentStaff?.id || '');
  const [filterReason, setFilterReason] = useState<string>('all');

  const reasonsMap: Record<WasteRecord['reason'], { label: string; desc: string }> = {
    print_error: { label: 'خطأ في الطباعة / تشويه ألوان', desc: 'ألوان باهتة أو خطوط رأس الطابعة' },
    miscut: { label: 'خطأ في القص أو المقاس', desc: 'قص مائل أو تلف أثناء التشذيب' },
    paper_jam: { label: 'انحشار الورق في الطابعة', desc: 'تجعيد الورق أو تمزقه داخل الساحب' },
    ink_spill: { label: 'هدر أو انسكاب حبر', desc: 'تنظيف رؤوس مكثف أو تسريب' },
    expired: { label: 'تلف مادة / انتهاء صلاحية', desc: 'رطوبة في الورق أو تلف كيميائي' },
    other: { label: 'أسباب أخرى', desc: 'ملاحظة خاصة' }
  };

  const filteredRecords = (wasteRecords || []).filter(r => {
    return filterReason === 'all' || r.reason === filterReason;
  });

  const totalWasteCost = (wasteRecords || []).reduce((acc, r) => acc + r.costLoss, 0);
  const totalWasteItems = (wasteRecords || []).reduce((acc, r) => acc + r.quantity, 0);

  const handleSaveWaste = (e: React.FormEvent) => {
    e.preventDefault();
    const mat = materials.find(m => m.id === selectedMaterialId);
    if (!mat || !quantity) return;

    const qty = Number(quantity);
    const cost = qty * mat.unitCost;
    const staff = staffList.find(s => s.id === selectedStaffId) || currentStaff;

    onAddWasteRecord({
      materialId: mat.id,
      materialName: mat.name,
      quantity: qty,
      unit: mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة',
      reason,
      costLoss: cost,
      staffId: staff.id,
      staffName: staff.name,
      notes: notes.trim()
    });

    setShowAddModal(false);
    setQuantity('1');
    setNotes('');
  };

  const handleExportCSV = () => {
    const rows = wasteRecords.map(r => ({
      'التاريخ والوقت': formatDate(r.createdAt),
      'المادة التالفة': r.materialName,
      'الكمية التالفة': r.quantity,
      'الوحدة': r.unit,
      'سبب التلف': reasonsMap[r.reason]?.label || r.reason,
      'الخسارة المالية (دج)': r.costLoss,
      'المسؤول / الموظف': r.staffName,
      'الملاحظات': r.notes || ''
    }));
    exportToCSV('Fotop_Waste_Loss_Report', rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">إجمالي الخسارة المالية للهدر والتالف</span>
            <div className="text-2xl font-black text-[#E31C2B] mt-1 font-mono">{formatCurrency(totalWasteCost)}</div>
            <span className="text-[11px] text-slate-500 font-medium">مخصومة تلقائياً من تكاليف المواد</span>
          </div>
          <div className="p-3 bg-rose-50 text-[#E31C2B] rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">مجموع الوحدات التالفة المسجلة</span>
            <div className="text-2xl font-black text-[#292A34] mt-1 font-mono">{totalWasteItems} وحدة</div>
            <span className="text-[11px] text-slate-500 font-medium">أوراق فوتوغرافية، أحبار، إطارات</span>
          </div>
          <div className="p-3 bg-[#F0F0F0] text-[#292A34] rounded-xl">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#292A34] text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-300">الرقابة والجودة</span>
            <div className="text-xl font-black text-amber-400 mt-1">تتبع مسؤولية الورديات</div>
            <span className="text-[11px] text-slate-300">توثيق السبب لتقليل نسبة الأخطاء</span>
          </div>
          <div className="p-3 bg-[#373946] text-amber-400 rounded-xl">
            <Info className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Table & Log Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600">تصفية حسب السبب:</span>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
            >
              <option value="all">جميع الأسباب</option>
              <option value="print_error">خطأ في الطباعة</option>
              <option value="miscut">خطأ في القص</option>
              <option value="paper_jam">انحشار في الساحب</option>
              <option value="ink_spill">هدر حبر</option>
              <option value="expired">تلف مادة</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-[#F0F0F0] hover:bg-slate-200 text-[#292A34] font-bold text-xs flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>تصدير التقرير</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#E31C2B]/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل هدر / تلف جديد</span>
            </button>
          </div>

        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#292A34] text-white font-bold">
              <tr>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">المادة المتضررة</th>
                <th className="p-3.5">الكمية التالفة</th>
                <th className="p-3.5">سبب الهدر والتلف</th>
                <th className="p-3.5">الخسارة المالية المباشرة</th>
                <th className="p-3.5">الموظف المسؤول</th>
                <th className="p-3.5">ملاحظات تفصيلية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    لا توجد سجلات هدر مطابقة حالياً
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-slate-500">{formatDate(r.createdAt)}</td>
                    <td className="p-3.5 font-bold text-[#292A34]">{r.materialName}</td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-[#292A34] bg-[#F0F0F0] px-2 py-1 rounded-lg">
                        {r.quantity} {r.unit}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#E31C2B] font-bold border border-rose-200">
                        {reasonsMap[r.reason]?.label || r.reason}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-black text-[#E31C2B]">
                      -{formatCurrency(r.costLoss)}
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">
                      {r.staffName}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {r.notes || '─'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards (No Horizontal Scrolling) */}
        <div className="md:hidden space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200">
              لا توجد سجلات هدر مطابقة حالياً
            </div>
          ) : (
            filteredRecords.map(r => (
              <div key={r.id} className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-sm text-[#292A34]">{r.materialName}</span>
                  <span className="font-mono font-black text-xs text-[#E31C2B]">
                    -{formatCurrency(r.costLoss)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">الكمية التالفة:</span>
                    <span className="font-mono font-bold text-[#292A34]">{r.quantity} {r.unit}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">المسؤول:</span>
                    <span className="font-bold text-slate-700">{r.staffName}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#E31C2B] font-bold text-[10px] border border-rose-200">
                    {reasonsMap[r.reason]?.label || r.reason}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{formatDate(r.createdAt)}</span>
                </div>
                {r.notes && (
                  <div className="text-[11px] text-slate-600 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                    {r.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>

      {/* Add Waste Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <AlertOctagon className="w-5 h-5 text-[#E31C2B]" />
                <span>تسجيل هدر أو تلف مادة فوتوغرافية</span>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWaste} className="p-5 space-y-3.5 text-xs font-medium">
              
              <div>
                <label className="text-slate-700 block mb-1 font-bold">اختر المادة التالفة من المخزون</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (المتوفر: {m.currentStock} {m.unit === 'sheet' ? 'ورقة' : 'وحدة'} | التكلفة: {m.unitCost} دج)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">الكمية التالفة</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">الموظف / المنفذ</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  >
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">سبب التلف</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                >
                  <option value="print_error">خطأ في الطباعة / تشويه ألوان</option>
                  <option value="miscut">خطأ في القص أو المقاس</option>
                  <option value="paper_jam">انحشار في ساحب الطابعة</option>
                  <option value="ink_spill">هدر حبر أثناء التنظيف المكثف</option>
                  <option value="expired">تلف مادة بسبب الرطوبة أو التخزين</option>
                  <option value="other">أسباب أخرى</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="وصف المشكلة لمنع تكرارها..."
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
                />
              </div>

              <div className="bg-[#292A34] text-white p-3 rounded-xl flex items-center justify-between">
                <span className="text-slate-300 font-bold">سيتم خصم الكمية فوراً من المخزون:</span>
                <span className="text-rose-400 font-mono font-bold">
                  -{Number(quantity || 0) * (materials.find(m => m.id === selectedMaterialId)?.unitCost || 0)} دج
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-black shadow-md shadow-[#E31C2B]/30 cursor-pointer"
                >
                  تأكيد تسجيل التالف وخصم المخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
