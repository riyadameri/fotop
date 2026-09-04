import React from 'react';
import { 
  FileCheck2, 
  Globe, 
  Phone, 
  Mail, 
  Server, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Clock, 
  BarChart3,
  Building2,
  Lock,
  Sparkles,
  Printer
} from 'lucide-react';

interface SpecsViewProps {
  onGoToPOS: () => void;
}

export const SpecsView: React.FC<SpecsViewProps> = ({ onGoToPOS }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Official Project Sheet Header Card */}
      <div className="bg-[#292A34] text-white rounded-2xl p-6 sm:p-8 shadow-xl border-t-4 border-[#E31C2B] relative overflow-hidden">
        
        {/* Decorative background watermark */}
        <div className="absolute -left-10 -bottom-10 opacity-5 pointer-events-none">
          <Building2 className="w-80 h-80 text-white" />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E31C2B] text-white font-bold text-xs mb-3 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>بطاقة تقنية ومواصفات المشروع الرسمية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              نظام إدارة استوديو التصوير والمخزون
            </h2>
            <p className="text-lg font-bold text-[#fca5a5] mt-1">
              Fotop Studio ERP ─ الحل الرقمي المتكامل
            </p>
          </div>

          <div className="bg-[#373946] border border-slate-600 p-4 rounded-xl text-right text-xs space-y-1.5 w-full md:w-auto">
            <div className="text-slate-300 font-bold">الشركة المنفذة: <span className="text-white font-black">Redox Cloud Solutions</span></div>
            <div className="text-slate-300 flex items-center justify-end gap-1.5 font-mono">
              <span>05 63898395</span>
              <Phone className="w-3.5 h-3.5 text-[#E31C2B]" />
            </div>
            <div className="text-slate-300 flex items-center justify-end gap-1.5 font-mono">
              <span>sales@rudox.claud</span>
              <Mail className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-slate-300 flex items-center justify-end gap-1.5 font-mono">
              <span className="text-amber-400">rudox.claud</span>
              <Globe className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Project Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700 text-xs">
          <div className="bg-[#1e1f27] p-3 rounded-xl">
            <span className="text-slate-400 block text-[11px]">العميل المستفيد</span>
            <strong className="text-white font-bold text-sm">استوديو Fotop</strong>
          </div>
          <div className="bg-[#1e1f27] p-3 rounded-xl">
            <span className="text-slate-400 block text-[11px]">تاريخ الانطلاق</span>
            <strong className="text-slate-200 font-bold">21 أوت</strong>
          </div>
          <div className="bg-[#1e1f27] p-3 rounded-xl">
            <span className="text-slate-400 block text-[11px]">تاريخ التسليم</span>
            <strong className="text-amber-400 font-bold">21 سبتمبر</strong>
          </div>
          <div className="bg-[#1e1f27] p-3 rounded-xl">
            <span className="text-slate-400 block text-[11px]">البيئة التشغيلية</span>
            <strong className="text-emerald-400 font-bold flex items-center gap-1">
              <Server className="w-3 h-3" /> سيرفر مخصص في Redox
            </strong>
          </div>
        </div>

      </div>

      {/* 6 Core Functional Modules Detailed Showcase */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-[#292A34] px-1">الأهداف والوحدات الوظيفية المنجزة في النظام</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Module 1: POS */}
          <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm space-y-2.5 hover:border-[#E31C2B] transition-all">
            <div className="flex items-center gap-2 text-[#E31C2B]">
              <Zap className="w-5 h-5" />
              <h4 className="font-black text-sm text-[#292A34]">1. نقطة بيع سريعة (POS) وإصدار التذاكر</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              واجهة تفاعلية فورية تتيح للكاشير والمصور اختيار باقات الصور (4 صور شمسية، 8 صور، تكبير A4/A3، براويز، تغليف)، مع تحديد موعد الاستلام وطباعة وصل حراري فوري للزبون برمز تذكرة فريد.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">طباعة فورية</span>
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">دفع نقدي وبطاقة</span>
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">تحديد موعد الاستلام</span>
            </div>
          </div>

          {/* Module 2: BOM Inventory */}
          <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm space-y-2.5 hover:border-[#E31C2B] transition-all">
            <div className="flex items-center gap-2 text-[#E31C2B]">
              <Layers className="w-5 h-5" />
              <h4 className="font-black text-sm text-[#292A34]">2. إدارة المخزون وخصم المواد آلياً (BOM)</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              يقوم النظام بخصم أوراق الطباعة وكمية الحبر بالمليلتر والإطارات آلياً بمجرد تأكيد أي طلب (مثال: طلب 4 أو 8 صور شمسية يخصم تلقائياً ورقة 10x15 سم + 0.4 مل حبر).
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">خصم BOM فوري</span>
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">تنبيه حد الأمان</span>
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">تزويد مخزون</span>
            </div>
          </div>

          {/* Module 3: Waste Tracking */}
          <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm space-y-2.5 hover:border-[#E31C2B] transition-all">
            <div className="flex items-center gap-2 text-[#E31C2B]">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-black text-sm text-[#292A34]">3. تتبع التالف والرقابة على الهدر (Waste Tracking)</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              تسجيل حالات تشويه الطباعة، انحشار الورق، أو أخطاء القص مع توثيق اسم الموظف والسبب، وحساب الخسارة المالية المباشرة لخصمها من الأرباح والحد من الهدر.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">توثيق أسباب التلف</span>
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">مسؤولية الموظف</span>
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">حساب الخسارة المالية</span>
            </div>
          </div>

          {/* Module 4: Shifts & Cash */}
          <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm space-y-2.5 hover:border-[#E31C2B] transition-all">
            <div className="flex items-center gap-2 text-[#E31C2B]">
              <Clock className="w-5 h-5" />
              <h4 className="font-black text-sm text-[#292A34]">4. إدارة الورديات وإغلاق الصندوق (Cash Shifts)</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              افتتاح الوردية برصيد صرف ابتدائي، تتبع المبيعات والمصروفات النثرية لحظياً، ومطابقة المبلغ الفعلي بالدرج عند نهاية المناوبة لكشف أي عجز أو فائض.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">تسليم العهدة</span>
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">مطابقة الصندوق</span>
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">كشف الفوارق</span>
            </div>
          </div>

          {/* Module 5: Accounting & Net Profit */}
          <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm space-y-2.5 hover:border-[#E31C2B] transition-all md:col-span-2">
            <div className="flex items-center gap-2 text-[#E31C2B]">
              <BarChart3 className="w-5 h-5" />
              <h4 className="font-black text-sm text-[#292A34]">5. المحاسبة وحساب الأرباح الصافية الحقيقية</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              معادلة مالية دقيقة: <strong>صافي الربح = إجمالي الإيرادات - تكلفة المواد الخام (BOM) - خسائر التالف - المصروفات النثرية</strong>، مع رسوم بيانية تفاعلية وتصدير تقارير Excel.
            </p>
          </div>

        </div>
      </div>

      {/* CTA Button */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
        <h4 className="font-black text-[#292A34] text-base">جاهز للبدء في تشغيل الاستوديو وتسجيل التذاكر؟</h4>
        <button
          onClick={onGoToPOS}
          className="inline-flex items-center gap-2 bg-[#E31C2B] hover:bg-[#c91422] text-white px-8 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-[#E31C2B]/30 transition-all cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>الانتقال إلى نقطة البيع السريعة (POS)</span>
        </button>
      </div>

    </div>
  );
};
