import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Phone, 
  User, 
  QrCode,
  Layers,
  Sparkles
} from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  // Dynamic studio settings from LocalStorage
  const customLogo = typeof window !== 'undefined' ? localStorage.getItem('fotop_custom_studio_logo') : null;
  const studioName = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_name')) || 'Fotop Studio';
  const studioTagline = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_tagline')) || 'استوديو التصوير الاحترافي والمطبوعات';
  const studioPhone = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_phone')) || '05 63 89 83 95';
  const studioAddress = (typeof window !== 'undefined' && localStorage.getItem('fotop_custom_studio_address')) || 'الشارع التجاري الرئيسي، الجزائر';
  const showLogo = typeof window !== 'undefined' ? localStorage.getItem('fotop_show_receipt_logo') !== 'false' : true;
  const showQr = typeof window !== 'undefined' ? localStorage.getItem('fotop_receipt_show_qr') !== 'false' : true;
  const receiptFooter = (typeof window !== 'undefined' && localStorage.getItem('fotop_receipt_footer')) || 'شكراً لثقتكم باستوديو Fotop ─ نسعد بخدمتكم دائماً';

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#292A34] text-white">
          <div className="flex items-center gap-2 font-black text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>تم تسجيل الطلب وخصم المواد آلياً</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Body */}
        <div className="p-5 overflow-y-auto max-h-[75vh] bg-[#F0F0F0]">
          <div 
            ref={printContentRef}
            className="print-ticket bg-white text-[#292A34] p-5 rounded-2xl border-2 border-slate-300 font-sans shadow-md"
          >
            {/* Receipt Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
              {showLogo && (
                <div className="flex justify-center mb-1.5">
                  {customLogo ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden shadow-xs border border-slate-200">
                      <img src={customLogo} alt="Receipt Logo" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-[#E31C2B] text-white rounded-lg inline-block font-black text-base shadow-sm">
                      📸 {studioName}
                    </div>
                  )}
                </div>
              )}
              <div className="text-base font-black text-[#292A34]">{studioName}</div>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{studioTagline}</p>
              <p className="text-[10px] text-slate-600 mt-0.5 font-mono">الهاتف: {studioPhone} | {studioAddress}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">نظام التشغيل: Redox Cloud Solutions (rudox.claud)</p>
            </div>

            {/* Ticket Big Badge */}
            <div className="my-3 py-2.5 bg-[#F0F0F0] rounded-xl border border-slate-300 text-center">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">رقم التذكرة لمتابعة واستلام الصور</div>
              <div className="text-2xl font-black text-[#E31C2B] font-mono tracking-widest my-0.5">{order.ticketNumber}</div>
              <div className="text-[11px] text-emerald-800 font-bold flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>موعد الاستلام: {order.estimatedPickupAt || 'فوري'}</span>
              </div>
            </div>

            {/* Customer & Order Meta */}
            <div className="text-xs space-y-1.5 py-2.5 border-b border-dashed border-slate-300 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">الزبون:</span>
                <span className="font-bold text-[#292A34]">{order.customerName}</span>
              </div>
              {order.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">الهاتف:</span>
                  <span className="font-mono text-[#292A34] dir-ltr font-bold">{order.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">التاريخ والوقت:</span>
                <span className="font-mono">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المصور / المنفذ:</span>
                <span className="font-bold text-slate-800">{order.staffName}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-3 border-b-2 border-dashed border-slate-300">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex justify-between">
                <span>الخدمة / الباقة</span>
                <span>المبلغ</span>
              </div>
              <div className="space-y-2 text-xs">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#292A34]">{item.service.name}</span>
                      <span className="text-[11px] text-slate-500 mr-1.5 font-bold">× {item.quantity}</span>
                    </div>
                    <span className="font-bold text-[#292A34] font-mono">
                      {formatCurrency((item.customPrice ?? item.service.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 space-y-1.5 text-xs border-b border-dashed border-slate-300 font-medium">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>الخصم الممنوح:</span>
                  <span className="font-mono">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-[#292A34] pt-1 border-t border-slate-200">
                <span>المجموع الإجمالي:</span>
                <span className="font-mono text-[#E31C2B] text-base">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-700">
                <span>طريقة الدفع:</span>
                <span className="font-bold">{order.paymentMethod === 'cash' ? 'نقداً (Cash)' : order.paymentMethod === 'card' ? 'بطاقة بنكية / ذهبية' : 'تحويل'}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-700">
                <span>المبلغ المدفوع:</span>
                <span className="font-mono font-bold">{formatCurrency(order.paidAmount)}</span>
              </div>
              {order.total - order.paidAmount > 0 && (
                <div className="flex justify-between text-xs font-bold text-rose-700 bg-rose-50 p-1.5 rounded-lg">
                  <span>المتبقي عند الاستلام:</span>
                  <span className="font-mono">{formatCurrency(order.total - order.paidAmount)}</span>
                </div>
              )}
            </div>

            {/* Deducted Materials Summary on receipt */}
            {order.materialsDeducted && order.materialsDeducted.length > 0 && (
              <div className="py-2 border-b border-dashed border-slate-300 text-[10px] text-slate-500">
                <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#E31C2B]" />
                  <span>المواد المخصومة آلياً من المخزون (BOM):</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {order.materialsDeducted.map((m, idx) => (
                    <span key={idx} className="bg-[#F0F0F0] px-1.5 py-0.5 rounded text-slate-700 font-mono">
                      {m.quantity} {m.unit} {m.materialName.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer QR simulation & Notes */}
            <div className="mt-3 text-center">
              {showQr && (
                <div className="flex justify-center my-1.5">
                  <div className="p-2 border-2 border-slate-400 rounded-xl bg-[#F0F0F0] flex items-center gap-2 text-xs text-[#292A34] font-mono">
                    <QrCode className="w-9 h-9 text-[#292A34]" />
                    <div className="text-right text-[9px] leading-tight">
                      <div className="font-bold text-[#E31C2B]">{studioName.toUpperCase()} VERIFIED</div>
                      <div className="font-mono font-bold text-xs">{order.ticketNumber}</div>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-[10px] font-bold text-[#292A34]">يرجى الاحتفاظ بهذا الوصل أو رقم التذكرة لاستلام الصور</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{receiptFooter}</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            إغلاق ومتابعة البيع
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#E31C2B] hover:bg-[#c91422] text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-[#E31C2B]/30 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الوصل الفوري (Print Ticket)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
