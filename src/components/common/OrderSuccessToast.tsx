import React, { useEffect, useState } from 'react';
import { CheckCircle2, Printer, X, Receipt, ShoppingBag } from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface OrderSuccessToastProps {
  order: Order | null;
  onClose: () => void;
  onPrintReceipt: (order: Order) => void;
  durationMs?: number;
}

export const OrderSuccessToast: React.FC<OrderSuccessToastProps> = ({
  order,
  onClose,
  onPrintReceipt,
  durationMs = 5000
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!order) return;

    setProgress(100);
    const intervalMs = 50;
    const step = (intervalMs / durationMs) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev <= step) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [order, isPaused, durationMs, onClose]);

  if (!order) return null;

  return (
    <aside
      aria-label="إشعار نجاح الطلب"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="bg-[#292A34] text-white border border-emerald-500/40 rounded-2xl shadow-2xl p-4 overflow-hidden relative backdrop-blur-md">
        
        {/* Main Content */}
        <div className="flex items-start justify-between gap-3">
          
          {/* Left Icon & Text */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-emerald-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md">
                  تَـمّ
                </span>
                <h4 className="text-sm font-black text-white">تم إتمام الطلب بنجاح</h4>
              </div>

              {/* Order quick metadata */}
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-300 flex-wrap font-medium">
                <span>تذكرة: <strong className="font-mono text-amber-400 font-bold">#{order.ticketNumber}</strong></span>
                <span className="text-slate-500">•</span>
                <span>المبلغ: <strong className="font-mono text-white font-bold">{formatCurrency(order.total)}</strong></span>
                {order.customerName && order.customerName !== 'زبون مباشر' && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="truncate max-w-[120px] text-slate-200 font-bold">{order.customerName}</span>
                  </>
                )}
              </div>

              <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">
                ✓ تم خصم المواد من المخزن وتسجيل الإيراد بالوردية الحالية
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-start">
            <button
              onClick={() => {
                onClose();
                onPrintReceipt(order);
              }}
              title="طباعة وصل الطلب"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all hover:scale-102 cursor-pointer border border-white/10"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>طباعة الوصل</span>
            </button>

            <button
              onClick={onClose}
              title="إغلاق الإشعار"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Auto-dismiss progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </aside>
  );
};
