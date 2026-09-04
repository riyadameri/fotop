import React from 'react';
import { 
  Keyboard, 
  X, 
  Sparkles, 
  PlusCircle, 
  Save, 
  Printer, 
  Search, 
  CreditCard, 
  Coins, 
  Zap,
  Info
} from 'lucide-react';

interface ShortcutsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsGuideModal: React.FC<ShortcutsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'إدارة عمليات البيع السريع (POS Checkout)',
      items: [
        {
          keys: ['Ctrl', 'N'],
          macKeys: ['⌘', 'N'],
          label: 'طلب جديد (New Order)',
          description: 'تفريغ السلة وبدء طلب زبون جديد فوراً وتجهيز الخانات',
          icon: PlusCircle,
          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
        },
        {
          keys: ['Ctrl', 'S'],
          macKeys: ['⌘', 'S'],
          label: 'حفظ وتسجيل الطلب (Save Order)',
          description: 'إتمام البيع، خصم المواد آلياً، وتوليد تذكرة الزبون',
          icon: Save,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        },
        {
          keys: ['Ctrl', 'P'],
          macKeys: ['⌘', 'P'],
          label: 'طباعة الوصل (Print Receipt)',
          description: 'طباعة تذكرة الاستلام أو وصل الزبون الحراري فورياً',
          icon: Printer,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
        },
        {
          keys: ['F4'],
          macKeys: ['F4'],
          label: 'دفع كامل الحساب نقداً (Exact Cash)',
          description: 'ملء خانة المبلغ المستلم بكامل الإجمالي لتسريع الحساب',
          icon: Coins,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        }
      ]
    },
    {
      category: 'البحث والتنقل والتحكم السريع',
      items: [
        {
          keys: ['F2', 'أو', 'Ctrl', 'F'],
          macKeys: ['F2', 'أو', '⌘', 'F'],
          label: 'البحث في الخدمات (Focus Search)',
          description: 'التركيز المباشر على شريط البحث عن الخدمات والمواد',
          icon: Search,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
        },
        {
          keys: ['Esc'],
          macKeys: ['Esc'],
          label: 'إغلاق النوافذ (Close Dialog)',
          description: 'إغلاق أي نافذة منبثقة أو إلغاء العرض والعودة للعمل',
          icon: X,
          color: 'text-slate-300 bg-slate-500/10 border-slate-500/30'
        },
        {
          keys: ['F1'],
          macKeys: ['F1'],
          label: 'دليل الاختصارات (Shortcuts Guide)',
          description: 'فتح هذه النافذة الإرشادية في أي وقت لمعرفة المفاتيح',
          icon: Keyboard,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#22232d] border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#292A34] border-b border-slate-700/80">
          <div className="flex items-center gap-2.5 font-black text-base">
            <div className="w-8 h-8 rounded-xl bg-[#E31C2B] text-white flex items-center justify-center shadow-md">
              <Keyboard className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3>اختصارات لوحة المفاتيح السريعة (Keyboard Shortcuts)</h3>
              <p className="text-xs text-slate-400 font-normal">لتسريع عمليات البيع وإصدار التذاكر والطباعة في ثوانٍ معدودة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {shortcuts.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2.5">
              <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>{group.category}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.items.map((item, iIdx) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={iIdx} 
                      className="bg-[#181922] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between gap-2 transition-all hover:bg-[#1d1e28]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${item.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white block">{item.label}</span>
                            <span className="text-[10px] text-slate-400 leading-tight block">{item.description}</span>
                          </div>
                        </div>
                      </div>

                      {/* Keys Badge */}
                      <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-800/80">
                        {item.keys.map((k, kIdx) => (
                          k === 'أو' ? (
                            <span key={kIdx} className="text-[10px] text-slate-500 font-bold px-1">{k}</span>
                          ) : (
                            <kbd 
                              key={kIdx} 
                              className="px-2 py-0.5 rounded-md bg-[#292A34] text-slate-200 border border-slate-600 font-mono text-[11px] font-black shadow-xs tracking-wider"
                            >
                              {k}
                            </kbd>
                          )
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Tips box */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-300">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">نصيحة لتسريع الدفع:</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                اضغط <kbd className="px-1.5 py-0.2 rounded bg-slate-700 font-mono text-[10px] text-slate-200">F2</kbd> للبحث واختيار الخدمة، ثم <kbd className="px-1.5 py-0.2 rounded bg-slate-700 font-mono text-[10px] text-slate-200">Ctrl+S</kbd> للحفظ المباشر، وأخيراً <kbd className="px-1.5 py-0.2 rounded bg-slate-700 font-mono text-[10px] text-slate-200">Ctrl+P</kbd> لطباعة الوصل الورقي للزبون.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#1c1d25] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>الاختصارات مفعلة تلقائياً وتعمل في كافة أرجاء النظام</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            حسناً، فهمت
          </button>
        </div>

      </div>
    </div>
  );
};
