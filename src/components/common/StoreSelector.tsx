import React, { useState, useRef, useEffect } from 'react';
import { 
  Store as StoreIcon, 
  ChevronDown, 
  Check, 
  MapPin, 
  Phone, 
  Building2, 
  Sparkles,
  Layers,
  ArrowRightLeft,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, Staff } from '../../types';
import { soundManager } from '../../utils/audio';

interface StoreSelectorProps {
  stores: Store[];
  currentStoreId: string; // 'store_sidiamer' | 'store_labhour' | 'all'
  onSelectStore: (storeId: string) => void;
  currentStaff: Staff;
  variant?: 'header' | 'sidebar' | 'banner' | 'compact';
}

export const StoreSelector: React.FC<StoreSelectorProps> = ({
  stores,
  currentStoreId,
  onSelectStore,
  currentStaff,
  variant = 'header'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isManager = currentStaff.role === 'manager';

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeStore = stores.find(s => s.id === currentStoreId);
  const isAllStores = currentStoreId === 'all';

  const getStoreTheme = (storeId: string) => {
    if (storeId === 'store_sidiamer') {
      return {
        accent: '#E31C2B',
        badgeBg: 'bg-[#E31C2B]/20 text-[#fca5a5] border-[#E31C2B]/40',
        pillBg: 'bg-[#E31C2B] text-white shadow-[#E31C2B]/30',
        cardBg: 'from-rose-950/60 to-slate-900/90 border-rose-600/40',
        label: 'سيدي عامر'
      };
    }
    if (storeId === 'store_labhour') {
      return {
        accent: '#2563EB',
        badgeBg: 'bg-blue-950/40 text-blue-300 border-blue-600/40',
        pillBg: 'bg-blue-600 text-white shadow-blue-600/30',
        cardBg: 'from-blue-950/60 to-slate-900/90 border-blue-600/40',
        label: 'الأبحور'
      };
    }
    return {
      accent: '#8B5CF6',
      badgeBg: 'bg-purple-950/40 text-purple-300 border-purple-600/40',
      pillBg: 'bg-purple-600 text-white shadow-purple-600/30',
      cardBg: 'from-purple-950/60 to-slate-900/90 border-purple-600/40',
      label: 'شامل'
    };
  };

  const currentTheme = getStoreTheme(currentStoreId);

  // If worker, show read-only or their assigned store badge
  if (!isManager) {
    const workerStore = stores.find(s => s.id === currentStaff.storeId) || stores[0];
    const theme = getStoreTheme(workerStore?.id || 'store_sidiamer');

    if (variant === 'compact') {
      return (
        <div className="h-8 flex items-center gap-1.5 px-2 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[10px] shadow-inner shrink-0">
          <StoreIcon className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="font-bold text-white truncate max-w-[90px]">
            {workerStore?.arabicName || workerStore?.name || 'فوتوب'}
          </span>
          <span className={`text-[9px] px-1 py-0.2 rounded font-bold border ${theme.badgeBg}`}>
            {theme.label}
          </span>
        </div>
      );
    }

    return (
      <div className="h-9 flex items-center gap-1.5 px-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs shadow-inner shrink-0">
        <StoreIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-bold text-white text-[11px] truncate max-w-[130px]">
          {workerStore?.arabicName || workerStore?.name || 'استوديو فوتوب'}
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${theme.badgeBg}`}>
          {theme.label}
        </span>
      </div>
    );
  }

  const isCompactVariant = variant === 'compact';

  // Manager View: Interactive Dropdown / Switcher
  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          soundManager.playClickSound();
          setIsOpen(!isOpen);
        }}
        className={`${
          isCompactVariant ? 'h-8 px-2 rounded-lg text-[10px]' : 'h-9 px-2.5 sm:px-3 rounded-xl text-xs'
        } flex items-center gap-1.5 border font-bold transition-all cursor-pointer shadow-xs shrink-0 ${
          isAllStores
            ? 'bg-purple-950/80 hover:bg-purple-900/90 border-purple-600/60 text-purple-200'
            : currentStoreId === 'store_sidiamer'
            ? 'bg-[#E31C2B]/15 hover:bg-[#E31C2B]/25 border-[#E31C2B]/50 text-white'
            : 'bg-blue-950/80 hover:bg-blue-900/90 border-blue-600/60 text-blue-200'
        }`}
        title="تبديل المتجر أو عرض الحسابات المشتركة"
      >
        <div className="flex items-center gap-1">
          <StoreIcon className={`${
            isCompactVariant ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'
          } ${
            isAllStores ? 'text-purple-400' : currentStoreId === 'store_sidiamer' ? 'text-[#E31C2B]' : 'text-blue-400'
          }`} />
          <span className={`truncate ${isCompactVariant ? 'max-w-[85px]' : 'max-w-[110px] sm:max-w-[140px]'}`}>
            {isAllStores 
              ? (isCompactVariant ? 'شامل' : 'كافة المتاجر (موحد)') 
              : activeStore?.arabicName || activeStore?.name || 'اختر المتجر'}
          </span>
        </div>

        <span className={`${isCompactVariant ? 'hidden' : 'hidden sm:inline'} text-[9px] px-1.5 py-0.5 rounded font-black border ${currentTheme.badgeBg}`}>
          {isAllStores ? 'شامل' : currentTheme.label}
        </span>

        <ChevronDown className={`${isCompactVariant ? 'w-2.5 h-2.5' : 'w-3 h-3'} transition-transform duration-200 opacity-70 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 sm:right-0 mt-2 w-72 sm:w-80 bg-[#1e2029] border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl text-right"
            dir="rtl"
          >
            {/* Header info */}
            <div className="p-2 border-b border-slate-700/60 mb-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  إدارة شبكة متاجر فوتوب
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                  المدير: fouad
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                حدد المتجر النشط لإدارة ومتابعة الحسابات، نقطة البيع، العمال، والمخزون بشكل مستقل.
              </p>
            </div>

            {/* Store Options List */}
            <div className="space-y-1.5">
              {stores.map(store => {
                const isSelected = currentStoreId === store.id;
                const theme = getStoreTheme(store.id);

                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClickSound();
                      onSelectStore(store.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected 
                        ? `bg-gradient-to-r ${theme.cardBg} border-opacity-100 shadow-md`
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? theme.pillBg : 'bg-slate-700 text-slate-300'
                      }`}>
                        <StoreIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{store.arabicName}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${theme.badgeBg}`}>
                            {theme.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-slate-500" />
                            {store.address}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">{store.name}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Consolidated All-Stores Mode for Fouad Manager */}
              <button
                type="button"
                onClick={() => {
                  soundManager.playClickSound();
                  onSelectStore('all');
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer mt-2 ${
                  isAllStores
                    ? 'bg-gradient-to-r from-purple-950/80 to-slate-900/90 border-purple-500/70 shadow-md text-white'
                    : 'bg-purple-950/20 hover:bg-purple-950/40 border-purple-800/40 text-purple-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isAllStores ? 'bg-purple-600 text-white' : 'bg-purple-900/60 text-purple-300'
                  }`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>جميع الفروع (عرض محاسبي شامل)</span>
                      <span className="text-[9px] bg-purple-950/60 text-purple-300 px-1.5 py-0.2 rounded border border-purple-700/50 font-black">
                        شامل
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-300/80 mt-0.5 truncate">
                      مقارنة وتجميع إيرادات سيدي عامر + الأبحور
                    </p>
                  </div>
                </div>

                {isAllStores && (
                  <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            </div>

            {/* Quick Summary Footer */}
            <div className="mt-2 pt-2 border-t border-slate-700/50 px-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>المدير المسؤول: <strong className="text-white">فؤاد</strong></span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                حسابات منفصلة ومحمية
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
