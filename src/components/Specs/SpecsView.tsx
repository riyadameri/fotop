import React, { useState } from 'react';
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
  Printer,
  Camera,
  Maximize2,
  Info,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { Staff } from '../../types';

interface SpecsViewProps {
  onGoToPOS: () => void;
  currentStaff?: Staff;
}

export const SpecsView: React.FC<SpecsViewProps> = ({ onGoToPOS, currentStaff }) => {
  const isManager = currentStaff?.role === 'manager';
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'id' | 'print' | 'poster'>('all');

  // Official Photographic Sizes and Quality Standards Database
  const photoSpecs = [
    {
      id: 'spec_passport',
      category: 'id',
      name: 'صور شمسية وبيومترية / جواز السفر الجزائري',
      shortName: 'جواز السفر والبيومتري',
      dimensionsMm: '35 × 45 مم',
      dimensionsCm: '3.5 × 4.5 سم',
      pixels300Dpi: '413 × 531 بكسل',
      paperType: 'ورق فوتوغرافي لامع Premium Glossy 230g',
      sheetLayout: '8 صور في ورقة 10 × 15 سم (أو 4 صور)',
      background: 'خلفية بيضاء نقية موحدة (Pure White)',
      lighting: 'إضاءة حيادية بدون ظلال على الوجه أو الخلفية',
      faceRatio: 'الوجه يشغل 70% إلى 80% من مساحة الصورة (32-36 مم)',
      notes: 'الأذنان والجبهة واضحتان، تعابير وجه محايدة، بدون نظارات عاكسة أو قبعات',
      // Financials (strictly manager-only)
      paperCost: 4.5,
      inkCost: 3.5,
      totalCost: 8.0,
      retailPrice: 250,
      netProfit: 242
    },
    {
      id: 'spec_id_card',
      category: 'id',
      name: 'بطاقة التعريف الوطنية ورخصة السياقة البيومترية',
      shortName: 'بطاقة التعريف الوطنية',
      dimensionsMm: '35 × 45 مم',
      dimensionsCm: '3.5 × 4.5 سم',
      pixels300Dpi: '413 × 531 بكسل',
      paperType: 'ورق صور فوتوغرافي عالي الدقة Glossy 230g',
      sheetLayout: '8 صور في ورقة 10 × 15 سم (أو 4 صور)',
      background: 'خلفية رمادية فاتحة أو بيضاء حسب متطلبات الدائرة',
      lighting: 'فلاش متوازن ثنائي مع مظلات توزيع الضوء Softbox',
      faceRatio: 'الوجه في المنتصف، العيون مفتوحة وموجهة للعدسة',
      notes: 'معايير وزارة الداخلية والجماعات المحلية',
      paperCost: 4.5,
      inkCost: 3.5,
      totalCost: 8.0,
      retailPrice: 250,
      netProfit: 242
    },
    {
      id: 'spec_schengen',
      category: 'id',
      name: 'تأشيرة شنغن والفيزا الأوروبية (Schengen Visa)',
      shortName: 'فيزا شنغن والأوروبية',
      dimensionsMm: '35 × 45 مم',
      dimensionsCm: '3.5 × 4.5 سم',
      pixels300Dpi: '413 × 531 بكسل',
      paperType: 'ورق فوتوغرافي احترافي غير محبب (Smooth Glossy)',
      sheetLayout: '4 صور بالورقة (مطبوعة بحواف واضحة)',
      background: 'خلفية رمادية فاتحة جداً أو بيضاء ناصعة',
      lighting: 'إضاءة استوديو متكاملة 3 نقاط إضاءة',
      faceRatio: 'المسافة من الذقن لأعلى الرأس بين 32 و 36 مم',
      notes: 'تاريخ الالتقاط حديث (أقل من 6 أشهر)، بدون أي تعديلات رقمية مفرطة',
      paperCost: 4.5,
      inkCost: 3.5,
      totalCost: 8.0,
      retailPrice: 300,
      netProfit: 292
    },
    {
      id: 'spec_us_visa',
      category: 'id',
      name: 'فيزا الولايات المتحدة الأمريكية وقرعة الهجرة (US Visa & DV Lottery)',
      shortName: 'فيزا أمريكا (2×2 بوصة)',
      dimensionsMm: '50 × 50 مم (2 × 2 بوصة)',
      dimensionsCm: '5.0 × 5.0 سم',
      pixels300Dpi: '600 × 600 بكسل (مربعة 1:1)',
      paperType: 'ورق طباعة فوتوغرافية احترافي عالي الدقة',
      sheetLayout: '2 صور في ورقة 10 × 15 سم + تسليم ملف رقمي JPEG',
      background: 'خلفية بيضاء نقية تماماً (Off-white / Pure White)',
      lighting: 'إضاءة طبيعية واضحة بدون أدنى ظل خلف الرأس',
      faceRatio: 'الرأس يمثل بين 50% إلى 69% من الارتفاع الإجمالي للصورة',
      notes: 'حجم الملف الرقمي أقل من 240 كيلوبايت وأبعاد 600×600 بكسل بالضبط',
      paperCost: 4.5,
      inkCost: 4.0,
      totalCost: 8.5,
      retailPrice: 400,
      netProfit: 391.5
    },
    {
      id: 'spec_10x15',
      category: 'print',
      name: 'طباعة ألبومات الصور الشخصية والعائلية (مقاس 10 × 15 سم - 4R)',
      shortName: 'مقاس 10 × 15 سم (4R)',
      dimensionsMm: '102 × 152 مم',
      dimensionsCm: '10 × 15 سم',
      pixels300Dpi: '1205 × 1795 بكسل',
      paperType: 'ورق حراري لامع فائق المتانة / مقاوم للماء والرطوبة',
      sheetLayout: 'ورقة كاملة (صورة واحدة 10×15)',
      background: 'حسب طبيعة اللقطة والصورة الملتقطة',
      lighting: 'تعديل تباين الألوان ودرجات التشبع قبل الطباعة',
      faceRatio: 'لقطة كاملة أو بورتريه حسب اختيار العميل',
      notes: 'المقاس القياسي الأكثر طلباً لألبومات الذكريات والمناسبات',
      paperCost: 9.0,
      inkCost: 6.0,
      totalCost: 15.0,
      retailPrice: 60,
      netProfit: 45
    },
    {
      id: 'spec_13x18',
      category: 'print',
      name: 'طباعة صور البورتريه والمناسبات (مقاس 13 × 18 سم - 5R)',
      shortName: 'مقاس 13 × 18 سم (5R)',
      dimensionsMm: '127 × 178 مم',
      dimensionsCm: '13 × 18 سم',
      pixels300Dpi: '1500 × 2102 بكسل',
      paperType: 'ورق ساتان نصف لامع (Semi-Gloss Satin 260g)',
      sheetLayout: 'ورقة مخصصة 13×18 سم',
      background: 'خلفيات فوتوغرافية أو ديكور استوديو',
      lighting: 'إضاءة بورتريه كلاسيكية (Rembrandt / Butterfly)',
      faceRatio: 'صورة شخصية، عائلية، أو تخرج',
      notes: 'مثالية لإطارات المكاتب والصالونات',
      paperCost: 15.0,
      inkCost: 9.0,
      totalCost: 24.0,
      retailPrice: 150,
      netProfit: 126
    },
    {
      id: 'spec_a4',
      category: 'poster',
      name: 'تكبير الصور والبوسترات الفاخرة (A4 - 21 × 29.7 سم)',
      shortName: 'تكبير A4 (21 × 29.7 سم)',
      dimensionsMm: '210 × 297 مم',
      dimensionsCm: '21 × 29.7 سم',
      pixels300Dpi: '2480 × 3508 بكسل',
      paperType: 'ورق فوتوغرافي ثقيل Heavyweight Glossy / Luster 260g',
      sheetLayout: 'ورقة A4 كاملة (مع إمكانية إضافة إطار فاخر)',
      background: 'مفتوح / تعديل خلفية احترافي بالفوتوشوب',
      lighting: 'معالجة لونية دقيقة ومعايرة الشاشة CMYK',
      faceRatio: 'بورتريه فني / شهادات / حفلات زفاف',
      notes: 'مناسب للبراويز الكبيرة والتعليق على الجدران',
      paperCost: 28.0,
      inkCost: 18.0,
      totalCost: 46.0,
      retailPrice: 350,
      netProfit: 304
    },
    {
      id: 'spec_a3',
      category: 'poster',
      name: 'تكبير البوسترات الكبرى واللوحات الجدارية (A3 - 29.7 × 42 سم)',
      shortName: 'تكبير A3 (29.7 × 42 سم)',
      dimensionsMm: '297 × 420 مم',
      dimensionsCm: '29.7 × 42 سم',
      pixels300Dpi: '3508 × 4960 بكسل',
      paperType: 'ورق بوستر احترافي 260g فائق النقاء',
      sheetLayout: 'ورقة A3 كاملة في الطابعة الاحترافية',
      background: 'جداريات استوديو / حفلات زفاف ومناسبات كبرى',
      lighting: 'دقة عالية جداً لضمان عدم وجود تشويش عند المعاينة القريبة',
      faceRatio: 'صورة تخرج عائلية أو عرسان',
      notes: 'طباعة عريضة مع تغليف حراري لحماية الألوان من البهتان',
      paperCost: 55.0,
      inkCost: 35.0,
      totalCost: 90.0,
      retailPrice: 700,
      netProfit: 610
    }
  ];

  const filteredSpecs = selectedFilter === 'all' 
    ? photoSpecs 
    : photoSpecs.filter(s => s.category === selectedFilter);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
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
              <span>دليل المقاسات والمعايير الفوتوغرافية الرسمية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              معايير ومواصفات مقاسات الصور في الاستوديو
            </h2>
            <p className="text-sm sm:text-base font-bold text-[#fca5a5] mt-1">
              دليل تقني معتمد: معايير جواز السفر، الفيزا، الهوية، وتكبيرات الألبومات والبوسترات
            </p>
          </div>

          <div className="bg-[#373946] border border-slate-600 p-4 rounded-xl text-right text-xs space-y-1.5 w-full md:w-auto">
            <div className="text-slate-300 font-bold">النظام: <span className="text-white font-black">Fotop Studio ERP</span></div>
            <div className="text-slate-300 flex items-center justify-end gap-1.5 font-mono">
              <span>دقة الطباعة المعتمدة: 300 DPI</span>
              <Printer className="w-3.5 h-3.5 text-[#E31C2B]" />
            </div>
            <div className="text-slate-300 flex items-center justify-end gap-1.5 font-mono">
              <span>صيغة الألوان: sRGB / CMYK</span>
              <Camera className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-slate-300 flex items-center justify-end gap-1.5 font-mono">
              <span className="text-amber-400">نظام إدارة الجودة الفوتوغرافية</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Quick Reference Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700 text-xs">
          <div className="bg-[#1e1f27] p-3 rounded-xl">
            <span className="text-slate-400 block text-[11px]">مقاس البيومتري القياسي</span>
            <strong className="text-white font-bold text-sm">35 × 45 مم</strong>
          </div>
          <div className="bg-[#1e1f27] p-3 rounded-xl">
            <span className="text-slate-400 block text-[11px]">مقاس فيزا أمريكا والقرعة</span>
            <strong className="text-slate-200 font-bold">50 × 50 مم (2×2")</strong>
          </div>
          <div className="bg-[#1e1f27] p-3 rounded-xl">
            <span className="text-slate-400 block text-[11px]">مقاس ألبومات 10x15</span>
            <strong className="text-amber-400 font-bold">102 × 152 مم (4R)</strong>
          </div>
          <div className="bg-[#1e1f27] p-3 rounded-xl">
            <span className="text-slate-400 block text-[11px]">الدقة الموصى بها</span>
            <strong className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 300 نقطة/بوصة (DPI)
            </strong>
          </div>
        </div>

      </div>

      {/* SECTION 1: PHOTO SIZES & TECHNICAL GUIDELINES DIRECTORY */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#E31C2B]" />
              <h3 className="text-lg font-black text-[#292A34]">دليل المقاسات والمعايير الرسمية المعتمدة</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isManager 
                ? 'عرض الأبعاد المليمترية، دقة البيكسل، مواصفات الورق والتصوير، وتكاليف وهوامش الربح المقدرة'
                : 'عرض الأبعاد المليمترية، دقة البيكسل، نوع الورق، مواصفات الإضاءة والخلفية وتعليمات التصوير'}
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === 'all' 
                  ? 'bg-white text-[#292A34] shadow-xs' 
                  : 'text-slate-600 hover:text-[#292A34]'
              }`}
            >
              الكل ({photoSpecs.length})
            </button>
            <button
              onClick={() => setSelectedFilter('id')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === 'id' 
                  ? 'bg-[#E31C2B] text-white shadow-xs' 
                  : 'text-slate-600 hover:text-[#292A34]'
              }`}
            >
              جواز وسفر وبيومتري
            </button>
            <button
              onClick={() => setSelectedFilter('print')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === 'print' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-[#292A34]'
              }`}
            >
              ألبومات وتكبير عادي
            </button>
            <button
              onClick={() => setSelectedFilter('poster')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === 'poster' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-[#292A34]'
              }`}
            >
              بوسترات A4 / A3
            </button>
          </div>
        </div>

        {/* Specs Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSpecs.map(spec => (
            <div 
              key={spec.id} 
              className="bg-slate-50/70 border-2 border-slate-200 hover:border-[#E31C2B] rounded-2xl p-4 sm:p-5 transition-all space-y-3 flex flex-col justify-between shadow-2xs group"
            >
              <div className="space-y-2.5">
                {/* Title & Dimension Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 inline-block mb-1">
                      {spec.category === 'id' ? 'صور رسمية وهوية' : spec.category === 'print' ? 'طباعة صور وألبومات' : 'تكبير وبوسترات'}
                    </span>
                    <h4 className="font-black text-sm sm:text-base text-[#292A34] group-hover:text-[#E31C2B] transition-colors">
                      {spec.name}
                    </h4>
                  </div>
                  <div className="bg-[#292A34] text-white font-mono font-black text-xs sm:text-sm px-2.5 py-1 rounded-xl shrink-0 shadow-xs">
                    {spec.dimensionsMm}
                  </div>
                </div>

                {/* Technical Dimension Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] pt-1">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold">الأبعاد (سم)</span>
                    <strong className="font-mono text-slate-800 font-bold">{spec.dimensionsCm}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold">الدقة (300 DPI)</span>
                    <strong className="font-mono text-slate-800 font-bold text-[10px]">{spec.pixels300Dpi}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[10px] font-bold">الإنتاجية بالورقة</span>
                    <strong className="font-mono text-[#E31C2B] font-bold text-[10px]">{spec.sheetLayout.split('(')[0]}</strong>
                  </div>
                </div>

                {/* Photo & Studio Technical Guidelines */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold shrink-0">نوع الورق:</span>
                    <span className="text-slate-800 font-bold">{spec.paperType}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold shrink-0">الخلفية:</span>
                    <span className="text-slate-700">{spec.background}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold shrink-0">معايير الوجه:</span>
                    <span className="text-slate-700">{spec.faceRatio}</span>
                  </div>
                  <div className="flex items-start gap-1.5 pt-1 border-t border-slate-100 text-[11px] text-amber-900 bg-amber-50/60 p-1.5 rounded-lg">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{spec.notes}</span>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown (MANAGER ONLY) */}
              {isManager ? (
                <div className="pt-2 border-t border-slate-200/80 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-amber-950 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                      <span>تحليل التكلفة وصافي الربح المقدر (خاص بالإدارة):</span>
                    </span>
                    <span className="font-mono text-emerald-700 font-black">
                      صافي الربح: +{spec.netProfit} دج
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-mono">
                    <div className="bg-white p-1 rounded border border-amber-200">
                      <span className="text-slate-500 block text-[9px]">ورق</span>
                      <strong className="text-slate-700">{spec.paperCost} دج</strong>
                    </div>
                    <div className="bg-white p-1 rounded border border-amber-200">
                      <span className="text-amber-800 block text-[9px]">حبر</span>
                      <strong className="text-amber-800">{spec.inkCost} دج</strong>
                    </div>
                    <div className="bg-white p-1 rounded border border-amber-300">
                      <span className="text-rose-600 block text-[9px]">التكلفة الكلية</span>
                      <strong className="text-rose-600 font-black">{spec.totalCost} دج</strong>
                    </div>
                    <div className="bg-emerald-50 p-1 rounded border border-emerald-300">
                      <span className="text-emerald-800 block text-[9px]">سعر البيع</span>
                      <strong className="text-emerald-800 font-black">{spec.retailPrice} دج</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>سعر البيع للزبون:</span>
                  <span className="font-mono font-black text-sm text-[#E31C2B]">{spec.retailPrice} دج</span>
                </div>
              )}

            </div>
          ))}
        </div>

      </div>

      {/* SECTION 2: 4 CORE FUNCTIONAL SYSTEM MODULES */}
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
              {isManager 
                ? 'يقوم النظام بخصم أوراق الطباعة وكمية الحبر بالمليلتر والإطارات آلياً بمجرد تأكيد أي طلب (مثال: طلب 4 أو 8 صور شمسية يخصم تلقائياً ورقة 10x15 سم + 0.4 مل حبر) مع احتساب تكلفة المواد الخام بدقة.'
                : 'يقوم النظام بخصم أوراق الطباعة ومستلزمات الصور والإطارات آلياً بمجرد تأكيد أي طلب، لضمان دقة الرصيد الفعلي وتنبيه فريق العمل عند الاقتراب من حد الأمان.'}
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
              {isManager 
                ? 'تسجيل حالات تشويه الطباعة، انحشار الورق، أو أخطاء القص مع توثيق اسم الموظف والسبب، وحساب الخسارة المالية المباشرة لخصمها من الأرباح والحد من الهدر.'
                : 'تسجيل وتوثيق حالات تشويه الطباعة، انحشار الورق، أو أخطاء القص لضبط الجودة ومتابعة أسباب التلف والحد من الهدر في الاستوديو.'}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">توثيق أسباب التلف</span>
              <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">مسؤولية الموظف</span>
              {isManager && (
                <span className="bg-[#F0F0F0] text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">حساب الخسارة المالية</span>
              )}
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

          {/* Module 5: Accounting & Net Profit (MANAGER ONLY) */}
          {isManager && (
            <div className="bg-white border-2 border-slate-200 p-5 rounded-2xl shadow-sm space-y-2.5 hover:border-[#E31C2B] transition-all md:col-span-2">
              <div className="flex items-center gap-2 text-[#E31C2B]">
                <BarChart3 className="w-5 h-5" />
                <h4 className="font-black text-sm text-[#292A34]">5. المحاسبة وحساب الأرباح الصافية الحقيقية (لوحة الإدارة)</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                معادلة مالية دقيقة: <strong>صافي الربح = إجمالي الإيرادات - تكلفة المواد الخام (BOM) - خسائر التالف - المصروفات النثرية</strong>، مع رسوم بيانية تفاعلية وتصدير تقارير Excel و PDF.
              </p>
            </div>
          )}

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
