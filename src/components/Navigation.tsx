import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Layers, 
  AlertOctagon, 
  Users, 
  BarChart3, 
  ReceiptText,
  FileCheck2,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Camera,
  PlusCircle,
  Trash2,
  FileText,
  LogOut,
  ShieldCheck,
  User,
  Clock,
  Sparkles,
  ChevronDown,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Staff, AttendanceRecord } from '../types';
import { soundManager } from '../utils/audio';

export type TabType = 'pos' | 'inventory' | 'waste' | 'shifts' | 'accounting' | 'hr' | 'orders' | 'specs' | 'settings';

interface NavigationProps {
  currentStaff: Staff;
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  lowStockCount: number;
  openOrdersCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSpecs?: () => void;
  onOpenExpense?: () => void;
  onOpenWaste?: () => void;
  onLogout?: () => void;
  activeAttendance?: AttendanceRecord;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentStaff,
  activeTab,
  onChangeTab,
  lowStockCount,
  openOrdersCount,
  isMobileOpen = false,
  onCloseMobile = () => {},
  isCollapsed = false,
  onToggleCollapse,
  onOpenSpecs,
  onOpenExpense,
  onOpenWaste,
  onLogout,
  activeAttendance
}) => {
  const isManager = currentStaff?.role === 'manager';

  // Dynamic Studio Branding from LocalStorage
  const [studioLogo, setStudioLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('fotop_custom_studio_logo') || null;
    } catch {
      return null;
    }
  });

  const [studioName, setStudioName] = useState<string>(() => {
    try {
      return localStorage.getItem('fotop_custom_studio_name') || 'Fotop';
    } catch {
      return 'Fotop';
    }
  });

  // Listen for settings update event
  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        setStudioLogo(localStorage.getItem('fotop_custom_studio_logo') || null);
        setStudioName(localStorage.getItem('fotop_custom_studio_name') || 'Fotop');
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('fotop_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('fotop_settings_updated', handleSettingsUpdate);
  }, []);

  const allTabs: { 
    id: TabType; 
    label: string; 
    shortLabel: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>; 
    badge?: number; 
    badgeColor?: string; 
    managerOnly?: boolean 
  }[] = [
    {
      id: 'pos',
      label: 'نقطة البيع السريعة (POS)',
      shortLabel: 'البيع السريع',
      description: 'إصدار الفواتير والتذاكر وطباعة الوصل',
      icon: Zap
    },
    {
      id: 'orders',
      label: isManager ? 'سجل التذاكر والطلبات' : 'سجل تذاكري ومعاملاتي',
      shortLabel: 'الطلبات والتذاكر',
      description: 'متابعة وتعديل واسترجاع الفواتير',
      icon: ReceiptText,
      badge: openOrdersCount > 0 ? openOrdersCount : undefined,
      badgeColor: 'bg-[#292A34] text-white font-bold'
    },
    {
      id: 'inventory',
      label: 'المخزون وخصم BOM',
      shortLabel: 'إدارة المخزون',
      description: 'تتبع الورق والحبر والسلع وحد الأمان',
      icon: Layers,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-[#E31C2B] text-white font-bold animate-pulse',
      managerOnly: true
    },
    {
      id: 'waste',
      label: 'تتبع التالف والهدر',
      shortLabel: 'سجل التالف',
      description: 'توثيق أخطاء الطباعة والورق التالف',
      icon: AlertOctagon,
      managerOnly: true
    },
    {
      id: 'shifts',
      label: 'الورديات وإدارة الصندوق',
      shortLabel: 'الورديات والخزينة',
      description: 'فتح وإغلاق اليوميات ومطابقة الكاش',
      icon: Users,
      managerOnly: true
    },
    {
      id: 'hr',
      label: 'الموارد البشرية والرواتب',
      shortLabel: 'الرواتب والعمال',
      description: 'مسيرات الرواتب، السلفيات، والدوام',
      icon: UserCheck,
      managerOnly: true
    },
    {
      id: 'accounting',
      label: 'المحاسبة والأرباح الصافية',
      shortLabel: 'المحاسبة والأرباح',
      description: 'المصروفات، الدخل، والأرباح التفصيلية',
      icon: BarChart3,
      managerOnly: true
    },
    {
      id: 'specs',
      label: 'دليل مقاسات ومواصفات الصور',
      shortLabel: 'دليل المقاسات',
      description: 'معايير جواز السفر، الفيزا، والبطاقة',
      icon: FileCheck2
    },
    {
      id: 'settings',
      label: 'إعدادات وهوية الاستوديو',
      shortLabel: 'الإعدادات والشعار',
      description: 'تغيير الشعار، معلومات الاستوديو والوصولات',
      icon: Sliders
    }
  ];

  const visibleTabs = allTabs.filter(tab => isManager || !tab.managerOnly);

  // Reusable Tab Item component with animated selection
  const renderTabItem = (tab: typeof allTabs[0], isMobile = false) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <motion.button
        key={tab.id}
        whileHover={{ scale: 1.015, x: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          soundManager.playClickSound();
          onChangeTab(tab.id);
          if (isMobile) onCloseMobile();
        }}
        title={isCollapsed && !isMobile ? tab.label : undefined}
        className={`w-full flex items-center justify-between p-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer relative group ${
          isActive
            ? 'bg-gradient-to-r from-[#E31C2B] to-[#c91422] text-white shadow-lg shadow-[#E31C2B]/25 font-black'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60'
        }`}
      >
        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed && !isMobile ? 'mx-auto' : ''}`}>
          <div className={`p-2 rounded-xl transition-colors shrink-0 ${
            isActive 
              ? 'bg-white/20 text-white' 
              : 'bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700'
          }`}>
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          </div>
          
          {(!isCollapsed || isMobile) && (
            <div className="text-right truncate">
              <div className="leading-tight truncate">{tab.label}</div>
              <div className={`text-[10px] mt-0.5 truncate font-normal ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                {tab.description}
              </div>
            </div>
          )}
        </div>

        {(!isCollapsed || isMobile) && tab.badge !== undefined && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono shadow-sm shrink-0 mr-2 ${
            tab.badgeColor || (isActive ? 'bg-white text-[#E31C2B]' : 'bg-slate-700 text-slate-200')
          }`}>
            {tab.badge}
          </span>
        )}

        {/* Floating tooltip when sidebar is collapsed on desktop */}
        {isCollapsed && !isMobile && (
          <div className="hidden group-hover:block absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-[#1e1f27] text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-2xl border border-slate-700 z-50 pointer-events-none animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="bg-[#E31C2B] text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {tab.badge}
                </span>
              )}
            </div>
          </div>
        )}
      </motion.button>
    );
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP RIGHT SIDEBAR (Visible on lg and larger screens)                  */}
      {/* ========================================================================= */}
      <aside 
        className={`hidden lg:flex flex-col bg-[#1f2029] border-l border-slate-700/80 shrink-0 sticky top-0 h-screen z-40 text-white transition-all duration-300 select-none shadow-2xl ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
          <div 
            onClick={() => {
              soundManager.playClickSound();
              onChangeTab('pos');
            }}
            className="flex items-center gap-3 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            title="الواجهة الرئيسية (نقطة البيع)"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#292A34] border border-slate-700/80 p-0.5 text-white flex items-center justify-center shadow-lg shrink-0 font-black overflow-hidden">
              {studioLogo ? (
                <img src={studioLogo} alt={studioName} className="w-full h-full object-contain rounded-xl" />
              ) : (
                <div className="w-full h-full bg-[#E31C2B] rounded-xl flex items-center justify-center">
                  <Camera className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-tight text-white truncate">{studioName}</span>
                  <span className="bg-[#E31C2B] text-white text-[10px] px-1.5 py-0.5 rounded font-black">ERP</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">استوديو التصوير والمخزون</div>
              </div>
            )}
          </div>

          {/* Toggle Sidebar Collapse Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
            >
              {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Current Staff Card */}
        <div className="p-3 border-b border-slate-700/60 bg-[#191a21]">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                {currentStaff?.avatar || (isManager ? '👨‍💼' : '🧑‍💻')}
              </div>
              <span 
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#191a21] ${
                  activeAttendance ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
                title={activeAttendance ? 'الدوام نشط حالياً' : 'غير مسجل الدوام'}
              />
            </div>
            {!isCollapsed && (
              <div className="truncate flex-1">
                <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                  <span>{currentStaff?.name || 'مستخدم'}</span>
                  {isManager ? (
                    <span className="bg-amber-950 text-amber-300 border border-amber-600/60 text-[9px] px-1.5 py-0.2 rounded font-bold">
                      مدير
                    </span>
                  ) : (
                    <span className="bg-blue-950 text-blue-300 border border-blue-600/60 text-[9px] px-1.5 py-0.2 rounded font-bold">
                      عامل
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{activeAttendance ? 'مسجل حضور' : 'تسجيل الدوام اختياري'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              أقسام النظام الرئيسية
            </div>
          )}
          {visibleTabs.map(tab => renderTabItem(tab, false))}
        </div>

        {/* Bottom Quick Tools */}
        <div className="p-3 border-t border-slate-700/80 bg-[#191a21] space-y-1.5">
          {onOpenExpense && !isCollapsed && (
            <button
              onClick={onOpenExpense}
              className="w-full py-2 px-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-200 text-xs font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>تسجيل مصروف سريع</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 font-mono">دج</span>
            </button>
          )}

          {onOpenWaste && !isCollapsed && (
            <button
              onClick={onOpenWaste}
              className="w-full py-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs font-bold rounded-xl flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>تسجيل هدر وتالف</span>
              </div>
              <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-300">ورق/حبر</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className={`w-full py-2.5 px-3 bg-slate-800/80 hover:bg-rose-950/80 hover:border-rose-600 border border-slate-700 text-slate-300 hover:text-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isCollapsed ? 'px-0' : ''
              }`}
              title="تسجيل الخروج من الحساب"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
              {!isCollapsed && <span>تسجيل الخروج</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER NAVIGATION (Slide-out Burger Menu for Mobile & Tablets)     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex justify-start" dir="rtl">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Slide-out Sidebar Panel (Slides from the right edge to left) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-80 max-w-[85vw] h-full bg-[#1f2029] text-white flex flex-col shadow-2xl border-l border-slate-700/80 z-10 mr-0"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-[#191a21]">
                <div 
                  onClick={() => {
                    soundManager.playClickSound();
                    onChangeTab('pos');
                    onCloseMobile();
                  }}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                  title="الواجهة الرئيسية (نقطة البيع)"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#292A34] border border-slate-700/80 p-0.5 text-white flex items-center justify-center shadow-lg shrink-0 font-black overflow-hidden">
                    {studioLogo ? (
                      <img src={studioLogo} alt={studioName} className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <div className="w-full h-full bg-[#E31C2B] rounded-xl flex items-center justify-center">
                        <Camera className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-black text-white">{studioName}</span>
                      <span className="bg-[#E31C2B] text-white text-[10px] px-1.5 py-0.5 rounded font-black">ERP</span>
                    </div>
                    <div className="text-[10px] text-slate-400">نظام استوديو التصوير</div>
                  </div>
                </div>

                <button
                  onClick={onCloseMobile}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="إغلاق القائمة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Staff Card */}
              <div className="p-3.5 border-b border-slate-700/60 bg-[#191a21]/60">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                    {currentStaff?.avatar || (isManager ? '👨‍💼' : '🧑‍💻')}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-sm font-black text-white truncate flex items-center gap-1.5">
                      <span>{currentStaff?.name || 'مستخدم'}</span>
                      {isManager ? (
                        <span className="bg-amber-950 text-amber-300 border border-amber-600/60 text-[9px] px-1.5 py-0.2 rounded font-bold">
                          مدير
                        </span>
                      ) : (
                        <span className="bg-blue-950 text-blue-300 border border-blue-600/60 text-[9px] px-1.5 py-0.2 rounded font-bold">
                          عامل
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {activeAttendance ? '🟢 دوام مسجل ونشط' : '⚪ تسجيل الدوام اختياري'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Navigation List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                <div className="text-[11px] font-bold text-slate-400 px-2 py-1">
                  أقسام النظام
                </div>
                {visibleTabs.map(tab => renderTabItem(tab, true))}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-700 bg-[#191a21] space-y-2">
                {onOpenSpecs && (
                  <button
                    onClick={() => {
                      onOpenSpecs();
                      onCloseMobile();
                    }}
                    className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#E31C2B]" />
                    <span>دليل مقاسات ومواصفات الصور</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      onCloseMobile();
                      onLogout();
                    }}
                    className="w-full py-2.5 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج من الحساب</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

