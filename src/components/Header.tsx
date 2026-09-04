import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Clock, 
  Wallet, 
  FileText, 
  AlertTriangle, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Phone,
  KeyRound,
  PlayCircle,
  StopCircle,
  ShieldCheck,
  User,
  X,
  CheckCircle2,
  LogOut,
  Eye,
  EyeOff,
  Bell,
  BellRing,
  PackagePlus,
  ShieldAlert,
  Menu,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Check,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Staff, Shift, Material, AttendanceRecord, ServiceItem } from '../types';
import { formatCurrency, formatTime, formatNumber } from '../utils/formatters';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  currentStaff: Staff;
  allStaff: Staff[];
  onSwitchStaff: (staff: Staff) => void;
  onLogout?: () => void;
  activeShift: Shift | undefined;
  attendanceLogs: AttendanceRecord[];
  onClockIn: (staffId: string) => void;
  onClockOut: (staffId: string) => void;
  onOpenLogWaste: () => void;
  onOpenExpenseModal: () => void;
  onOpenSpecsModal: () => void;
  onResetData: () => void;
  materials: Material[];
  services?: ServiceItem[];
  onNavigateToInventory?: (onlyLowStock?: boolean) => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  isCompact?: boolean;
  onToggleCompact?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToSettings?: () => void;
  studioLogo?: string | null;
  studioName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentStaff,
  allStaff = [],
  onSwitchStaff,
  onLogout,
  activeShift,
  attendanceLogs = [],
  onClockIn,
  onClockOut,
  onOpenLogWaste,
  onOpenExpenseModal,
  onOpenSpecsModal,
  onResetData,
  materials = [],
  services = [],
  onNavigateToInventory,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
  isCompact: externalIsCompact,
  onToggleCompact,
  onNavigateToHome,
  onNavigateToSettings,
  studioLogo: propStudioLogo,
  studioName: propStudioName,
}) => {
  const lowStockMaterials = (materials || []).filter(m => m.currentStock <= m.minThreshold);
  const lowStockProducts = (services || []).filter(
    s => s.itemType === 'direct_sale' && typeof s.currentStock === 'number' && s.currentStock <= (s.minThreshold || 3)
  );
  const totalLowStockCount = lowStockMaterials.length + lowStockProducts.length;

  // Local Compact state if not controlled externally
  const [internalCompact, setInternalCompact] = useState<boolean>(false);
  const isCompact = externalIsCompact !== undefined ? externalIsCompact : internalCompact;

  const handleToggleCompact = () => {
    soundManager.playClickSound();
    if (onToggleCompact) {
      onToggleCompact();
    } else {
      setInternalCompact(!internalCompact);
    }
  };

  // Sound state
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMuted());

  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  };

  // Notification bell popover state
  const [showNotificationPopover, setShowNotificationPopover] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Sound notification when low stock alert triggers
  const prevCountRef = useRef<number>(totalLowStockCount);
  useEffect(() => {
    if (totalLowStockCount > 0 && totalLowStockCount > prevCountRef.current) {
      soundManager.playAlertSound();
    }
    prevCountRef.current = totalLowStockCount;
  }, [totalLowStockCount]);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotificationPopover(false);
      }
    };
    if (showNotificationPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationPopover]);

  // Auth modal state for switching staff
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [selectedStaffToLogin, setSelectedStaffToLogin] = useState<Staff | null>(null);
  const [inputPassword, setInputPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Studio Profile & Logo Customization Modal State
  const [showStudioProfileModal, setShowStudioProfileModal] = useState<boolean>(false);
  const [customStudioLogo, setCustomStudioLogo] = useState<string | null>(() => {
    try {
      return propStudioLogo !== undefined ? propStudioLogo : (localStorage.getItem('fotop_custom_studio_logo') || null);
    } catch {
      return null;
    }
  });
  const [customStudioName, setCustomStudioName] = useState<string>(() => {
    try {
      return propStudioName !== undefined ? propStudioName : (localStorage.getItem('fotop_custom_studio_name') || 'Fotop');
    } catch {
      return 'Fotop';
    }
  });
  const [studioTagline, setStudioTagline] = useState<string>(() => {
    try {
      return localStorage.getItem('fotop_custom_studio_tagline') || 'استوديو التصوير الاحترافي';
    } catch {
      return 'استوديو التصوير الاحترافي';
    }
  });
  const [customStaffPhoto, setCustomStaffPhoto] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`fotop_staff_photo_${currentStaff.id}`) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (propStudioLogo !== undefined) {
      setCustomStudioLogo(propStudioLogo);
    }
  }, [propStudioLogo]);

  useEffect(() => {
    if (propStudioName !== undefined) {
      setCustomStudioName(propStudioName);
    }
  }, [propStudioName]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const staffPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleStudioLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomStudioLogo(reader.result);
          try {
            localStorage.setItem('fotop_custom_studio_logo', reader.result);
          } catch {
            // Storage quota fallback
          }
          soundManager.playSuccessSound();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStaffPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomStaffPhoto(reader.result);
          try {
            localStorage.setItem(`fotop_staff_photo_${currentStaff.id}`, reader.result);
          } catch {
            // Storage quota fallback
          }
          soundManager.playSuccessSound();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStudioProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('fotop_custom_studio_name', customStudioName);
      localStorage.setItem('fotop_custom_studio_tagline', studioTagline);
      if (customStudioLogo) {
        localStorage.setItem('fotop_custom_studio_logo', customStudioLogo);
      }
      if (customStaffPhoto) {
        localStorage.setItem(`fotop_staff_photo_${currentStaff.id}`, customStaffPhoto);
      }
      window.dispatchEvent(new Event('fotop_settings_updated'));
    } catch {
      // Ignore storage errors
    }
    soundManager.playSuccessSound();
    setShowStudioProfileModal(false);
  };

  // Listen for settings update event across tabs & components
  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        setCustomStudioLogo(localStorage.getItem('fotop_custom_studio_logo') || null);
        setCustomStudioName(localStorage.getItem('fotop_custom_studio_name') || 'Fotop');
        setStudioTagline(localStorage.getItem('fotop_custom_studio_tagline') || 'استوديو التصوير الاحترافي');
        setCustomStaffPhoto(localStorage.getItem(`fotop_staff_photo_${currentStaff.id}`) || null);
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('fotop_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('fotop_settings_updated', handleSettingsUpdate);
  }, [currentStaff.id]);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Check if current user is clocked in
  const todayStr = new Date().toISOString().split('T')[0];
  const activeAttendance = (attendanceLogs || []).find(
    a => a.staffId === currentStaff.id && a.status === 'clocked_in' && a.date === todayStr
  );

  const [showSwitchPassword, setShowSwitchPassword] = useState<boolean>(false);

  const handleSelectStaff = (staff: Staff) => {
    setShowProfileDropdown(false);
    setSelectedStaffToLogin(staff);
    setInputPassword('');
    setShowSwitchPassword(false);
    setAuthError('');
    setShowAuthModal(true);
    soundManager.playClickSound();
  };

  const handleConfirmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffToLogin) return;

    if (!inputPassword.trim()) {
      setAuthError('يرجى إدخال كلمة المرور للمتابعة.');
      return;
    }

    // Check manager or worker password
    if (selectedStaffToLogin.role === 'manager') {
      if (inputPassword === 'fouad26911' || inputPassword === selectedStaffToLogin.password || inputPassword === 'admin') {
        onSwitchStaff(selectedStaffToLogin);
        setShowAuthModal(false);
        setAuthError('');
        soundManager.playSuccessSound();
      } else {
        setAuthError('كلمة مرور المدير غير صحيحة! يرجى إعادة المحاولة.');
        soundManager.playAlertSound();
      }
    } else {
      // Worker check
      if (!selectedStaffToLogin.password || inputPassword === selectedStaffToLogin.password || inputPassword === '123' || inputPassword === 'fouad26911') {
        onSwitchStaff(selectedStaffToLogin);
        setShowAuthModal(false);
        setAuthError('');
        soundManager.playSuccessSound();
      } else {
        setAuthError('كلمة مرور العامل غير صحيحة! يرجى إعادة المحاولة.');
        soundManager.playAlertSound();
      }
    }
  };

  // Clock in with welcoming attendance chime sound
  const handleClockInClick = () => {
    soundManager.playAttendanceArrivalSound();
    onClockIn(currentStaff.id);
  };

  const handleClockOutClick = () => {
    soundManager.playNotificationSound();
    onClockOut(currentStaff.id);
  };

  const handleOpenAlerts = () => {
    soundManager.playNotificationSound();
    setShowNotificationPopover(!showNotificationPopover);
  };

  return (
    <header className={`bg-[#1f2029] text-white border-b border-slate-700/80 sticky top-0 z-30 transition-all duration-200 shadow-md backdrop-blur-md ${
      isCompact ? 'py-1 px-2.5 sm:px-4' : 'py-2 px-3 sm:px-5'
    }`}>
      {/* ========================================================================= */}
      {/* 1. COMPACT / HIDDEN HEADER VIEW (Icons Perfectly Centered & Arranged)      */}
      {/* ========================================================================= */}
      {isCompact ? (
        <div className="w-full mx-auto flex items-center justify-between">
          {/* Mobile Burger Menu on Start */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleMobileMenu && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onToggleMobileMenu}
                className="lg:hidden p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                title="فتح القائمة الرئيسية"
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4 text-rose-400" />
                ) : (
                  <Menu className="w-4 h-4 text-slate-200" />
                )}
              </motion.button>
            )}

            {/* Studio Logo / Icon */}
            <div 
              onClick={() => {
                soundManager.playClickSound();
                if (onNavigateToHome) onNavigateToHome();
              }}
              className="w-8 h-8 rounded-xl bg-[#292A34] border border-slate-700/80 p-0.5 text-white font-black shadow-md flex items-center justify-center cursor-pointer overflow-hidden transition-transform active:scale-95 shrink-0"
              title="الواجهة الرئيسية (نقطة البيع)"
            >
              {customStudioLogo ? (
                <img src={customStudioLogo} alt={customStudioName || "Studio Logo"} className="w-full h-full object-contain rounded-lg" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E31C2B] to-[#b8121f] rounded-lg flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              )}
            </div>

            {/* Studio Name (Always visible) */}
            <div 
              onClick={() => {
                soundManager.playClickSound();
                if (onNavigateToHome) onNavigateToHome();
              }}
              className="cursor-pointer flex items-center gap-1"
            >
              <span className="text-xs font-black text-white truncate max-w-[75px] sm:max-w-[120px]">
                {customStudioName}
              </span>
              <span className="bg-[#E31C2B] text-white text-[8px] px-1 py-0.2 rounded font-black tracking-normal shrink-0">
                ERP
              </span>
            </div>
          </div>

          {/* PERFECTLY CENTERED ACTION DOCK */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 bg-[#171820]/95 border border-slate-700/80 rounded-2xl px-2 sm:px-3 py-0.5 shadow-inner">
            {/* Clock-In / Clock-Out Icon */}
            {activeAttendance ? (
              <div className="flex items-center gap-1">
                <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] font-mono px-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {formatTime(activeAttendance.clockIn)}
                </span>
                <button
                  onClick={handleClockOutClick}
                  className="bg-rose-950 hover:bg-rose-900 text-rose-200 p-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  title="تسجيل نهاية الدوام (خروج)"
                >
                  <StopCircle className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleClockInClick}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                title="تسجيل بدء الدوام والعمل الفعلي"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span className="text-[10px]">بدء دوام</span>
              </button>
            )}

            <div className="h-4 w-[1px] bg-slate-700" />

            {/* Active Shift Cash Indicator */}
            {activeShift && (
              <div className="hidden sm:flex items-center gap-1 text-amber-400 text-xs font-mono font-bold" title="رصيد الصندوق المتوقع للوردية">
                <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px]">{formatCurrency(activeShift.expectedCash)}</span>
              </div>
            )}

            {/* Low Stock Bell Alert */}
            <div className="relative" ref={notifRef}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenAlerts}
                className={`relative p-1 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                  totalLowStockCount > 0
                    ? 'bg-[#E31C2B]/20 hover:bg-[#E31C2B]/30 border-[#E31C2B] text-white shadow-md shadow-[#E31C2B]/20'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title={totalLowStockCount > 0 ? `تنبيه: ${totalLowStockCount} مواد تحتاج إعادة تعبئة` : 'تنبيهات المخزون'}
              >
                {totalLowStockCount > 0 ? (
                  <BellRing className="w-3.5 h-3.5 text-[#ff6b6b] animate-bounce" />
                ) : (
                  <Bell className="w-3.5 h-3.5 text-slate-300" />
                )}
                {totalLowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-[#E31C2B] text-white text-[8px] font-black rounded-full flex items-center justify-center border border-[#1f2029]">
                    {totalLowStockCount}
                  </span>
                )}
              </motion.button>
            </div>

            {/* Sound Toggle */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleToggleMute}
              className={`p-1 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                isMuted 
                  ? 'bg-slate-800/80 border-slate-700 text-slate-400' 
                  : 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900'
              }`}
              title={isMuted ? 'الصوت مكتوم' : 'الأصوات مفعلة'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </motion.button>

            {/* Quick Expense */}
            <button
              onClick={() => {
                soundManager.playClickSound();
                onOpenExpenseModal();
              }}
              className="p-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl flex items-center justify-center cursor-pointer"
              title="تسجيل مصروف نثري"
            >
              <Wallet className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-[1px] bg-slate-700" />

            {/* User Avatar / Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-1 p-0.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 cursor-pointer"
                title={`${currentStaff.name} - انقر للتبديل أو تعديل البروفايل`}
              >
                {customStaffPhoto ? (
                  <img src={customStaffPhoto} alt={currentStaff.name} className="w-5 h-5 rounded-lg object-cover" />
                ) : (
                  <span className="text-xs">{currentStaff.avatar}</span>
                )}
                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Expand Toggle on End (Desktop only) */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleToggleCompact}
            className="hidden sm:flex p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white items-center justify-center transition-colors cursor-pointer shrink-0"
            title="توسيع الهيدر للوضع الكامل"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-200" />
          </motion.button>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. FULL HEADER VIEW (Rich Typography & Comprehensive Controls)             */
        /* ========================================================================= */
        <div className="w-full mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* Right / Start: Burger (Mobile) + Logo & Branding */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Mobile Burger Menu Button */}
            {onToggleMobileMenu && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                title="فتح القائمة الرئيسية"
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                ) : (
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
                )}
              </motion.button>
            )}

            {/* Logo & Branding */}
            <div className="flex items-center gap-2">
              <div 
                className="relative flex items-center justify-center rounded-xl bg-[#292A34] border border-slate-700/80 p-0.5 text-white font-black shadow-md shrink-0 cursor-pointer w-8 h-8 sm:w-9 sm:h-9 overflow-hidden transition-transform active:scale-95"
                onClick={() => {
                  soundManager.playClickSound();
                  if (onNavigateToHome) onNavigateToHome();
                }}
                title="الواجهة الرئيسية (نقطة البيع)"
              >
                {customStudioLogo ? (
                  <img src={customStudioLogo} alt={customStudioName || "شعار الاستوديو"} className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#E31C2B] to-[#b8121f] rounded-lg flex items-center justify-center">
                    <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 border-2 border-[#1f2029] rounded-full" title="متصل بالسيرفر السحابي Redox" />
              </div>

              {/* Branding Text */}
              <div 
                className="flex flex-col cursor-pointer transition-opacity hover:opacity-90" 
                onClick={() => {
                  soundManager.playClickSound();
                  if (onNavigateToHome) onNavigateToHome();
                }}
                title="الواجهة الرئيسية (نقطة البيع)"
              >
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1">
                    <span>{customStudioName}</span>
                    <span className="bg-[#E31C2B] text-white text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-black tracking-normal">ERP</span>
                  </h1>
                  <span className="text-[11px] text-slate-400 font-medium hidden md:inline-block">| {studioTagline}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[9px] text-slate-400">
                  <span className="text-slate-300">Redox Cloud Solutions</span>
                  <span>•</span>
                  <span className="font-mono text-slate-400 dir-ltr flex items-center gap-0.5">
                    <Phone className="w-2.5 h-2.5 text-[#E31C2B]" /> 05 63898395
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Live Attendance & Shift Status */}
          <div className="flex items-center gap-1 sm:gap-2 justify-center">
            
            {/* Worker Instant Clock-In / Clock-Out Widget */}
            <div className="flex items-center gap-1 bg-[#171820] border border-slate-700/80 rounded-xl text-xs shadow-inner px-2 py-1">
              {activeAttendance ? (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] sm:text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="hidden sm:inline">دوام:</span>
                    <span>{formatTime(activeAttendance.clockIn)}</span>
                  </div>
                  <button
                    onClick={handleClockOutClick}
                    className="bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700/80 px-1.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="تسجيل نهاية الدوام اليومي (خروج)"
                  >
                    <StopCircle className="w-3 h-3 text-rose-400" />
                    <span className="hidden md:inline">نهاية الدوام</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleClockInClick}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                  title="تسجيل بدء الدوام والعمل الفعلي"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>بدء الدوام</span>
                </button>
              )}
            </div>

            {/* Active Shift Cash Indicator */}
            {activeShift && (
              <div className="hidden sm:flex items-center gap-1 bg-[#171820] border border-slate-700/80 rounded-xl text-xs px-2.5 py-1">
                <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-mono text-amber-300 font-bold text-[11px]">
                  {formatCurrency(activeShift.expectedCash)}
                </span>
              </div>
            )}

            {/* Low Stock Quick Alert Trigger */}
            {totalLowStockCount > 0 && (
              <button
                onClick={handleOpenAlerts}
                className="bg-[#E31C2B] hover:bg-[#c91422] text-white px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs flex items-center gap-1 font-bold shadow-md shadow-[#E31C2B]/30 animate-pulse cursor-pointer transition-colors"
                title="انقر لعرض تفاصيل المواد التي وصلت لحد الأمان"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>{totalLowStockCount} نواقص</span>
              </button>
            )}
          </div>

          {/* Left / End: Audio Sound Toggle, Notification Bell, Compact Toggle, Profile Switcher */}
          <div className="flex items-center gap-1 sm:gap-1.5 justify-end">
            
            {/* Sound Mute / Unmute Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleToggleMute}
              className={`p-1.5 sm:p-2 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                isMuted 
                  ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200' 
                  : 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900 shadow-sm'
              }`}
              title={isMuted ? 'الصوت مكتوم - انقر لتفعيل أصوات الأشعارات والتنبيهات' : 'الأصوات مفعلة - انقر لكتم الصوت'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              )}
            </motion.button>

            {/* Notification Bell for Low Stock Alerts */}
            <div className="relative" ref={notifRef}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenAlerts}
                className={`relative p-1.5 sm:p-2 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                  totalLowStockCount > 0
                    ? 'bg-[#E31C2B]/20 hover:bg-[#E31C2B]/30 border-[#E31C2B] text-white shadow-lg shadow-[#E31C2B]/20'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title={
                  totalLowStockCount > 0 
                    ? `تنبيه: يوجد ${totalLowStockCount} مواد تحتاج إلى إعادة تعبئة` 
                    : 'تنبيهات المخزون (المستويات آمنة)'
                }
              >
                {totalLowStockCount > 0 ? (
                  <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff6b6b] animate-bounce" />
                ) : (
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
                )}

                {/* Notification Badge */}
                {totalLowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 bg-[#E31C2B] text-white text-[9px] sm:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#1f2029] shadow-md animate-pulse">
                    {totalLowStockCount}
                  </span>
                )}
              </motion.button>
            </div>

            {/* Quick Expense Shortcut */}
            <button
              onClick={() => {
                soundManager.playClickSound();
                onOpenExpenseModal();
              }}
              className="hidden sm:flex text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl items-center gap-1 px-2.5 py-1.5 transition-colors cursor-pointer"
              title="تسجيل مصروف نثري من الدرج"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">مصروف</span>
            </button>

            {/* Staff Switcher Profile Pill */}
            <div className="relative" ref={profileRef}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  soundManager.playClickSound();
                  setShowProfileDropdown(!showProfileDropdown);
                }}
                className={`flex items-center gap-1.5 border rounded-xl cursor-pointer transition-all px-2 sm:px-2.5 py-1.5 ${
                  currentStaff.role === 'manager' 
                    ? 'bg-gradient-to-r from-amber-600/90 to-amber-700/90 border-amber-500/80 text-white shadow-sm' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                }`}
                title={`${currentStaff.name} (${currentStaff.role === 'manager' ? 'مدير' : 'عامل'})`}
              >
                {customStaffPhoto ? (
                  <img src={customStaffPhoto} alt={currentStaff.name} className="w-5 h-5 rounded-lg object-cover" />
                ) : (
                  <span className="text-sm sm:text-base">{currentStaff.avatar}</span>
                )}
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                    <span>{currentStaff.name}</span>
                    {currentStaff.role === 'manager' && (
                      <ShieldCheck className="w-3 h-3 text-amber-200" />
                    )}
                  </div>
                  <div className="text-[9px] text-slate-300 leading-none">
                    {currentStaff.role === 'manager' ? 'مدير' : 'عامل'}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </motion.button>
            </div>

            {/* Header Compact / Expand Toggle Button (Desktop only) */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleToggleCompact}
              className="hidden sm:flex p-1.5 sm:p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="تصغير الهيدر (أيقونات فقط وتوفير مساحة)"
            >
              <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200" />
            </motion.button>

            {/* Quick Logout Button */}
            {onLogout && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  soundManager.playClickSound();
                  onLogout();
                }}
                className="text-xs bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-200 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
                <span className="hidden xl:inline font-bold">خروج</span>
              </motion.button>
            )}

          </div>
        </div>
      )}

      {/* Notifications Popover Dropdown (Shared for both Compact and Full modes) */}
      {showNotificationPopover && (
        <div className="absolute left-4 sm:left-auto right-auto sm:right-16 top-full mt-2 w-80 sm:w-96 bg-[#23242e] border border-slate-700 rounded-2xl shadow-2xl p-3.5 z-50 text-white animate-in fade-in zoom-in-95" dir="rtl">
          
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#E31C2B]/20 text-[#ff6b6b] rounded-lg">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">تنبيهات حد الأمان والمخزون</h4>
                <p className="text-[10px] text-slate-400">
                  {totalLowStockCount > 0 
                    ? `${totalLowStockCount} مادة وسلعة وصلت للحد الحرج` 
                    : 'المخزون متوازن وبمستوى ممتاز'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationPopover(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* List of Low Stock Items */}
          {totalLowStockCount > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {lowStockMaterials.map(mat => {
                const deficit = Math.max(0, mat.minThreshold - mat.currentStock);
                const unitLabel = mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة';
                const stockRatio = mat.minThreshold > 0 ? Math.min(100, Math.round((mat.currentStock / mat.minThreshold) * 100)) : 0;
                const isZero = mat.currentStock <= 0;

                return (
                  <div 
                    key={mat.id}
                    className="bg-[#171820] border border-rose-900/60 hover:border-[#E31C2B] p-2.5 rounded-xl transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{mat.name}</span>
                          {isZero ? (
                            <span className="text-[9px] bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded font-black border border-rose-800">
                              نفد تماماً (0)
                            </span>
                          ) : (
                            <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded font-black border border-amber-800">
                              تحت حد الأمان
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          المتبقي: <span className="font-mono text-rose-400 font-black">{mat.currentStock}</span> {unitLabel} | حد الأمان الأدنى: <span className="font-mono text-slate-300">{mat.minThreshold}</span> {unitLabel}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-black/40 px-1.5 py-0.5 rounded">
                        عجز: {deficit} {unitLabel}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${isZero ? 'bg-rose-600' : 'bg-amber-500'}`}
                        style={{ width: `${Math.max(5, stockRatio)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {lowStockProducts.map(prod => {
                const deficit = Math.max(0, (prod.minThreshold || 3) - (prod.currentStock || 0));
                const isZero = (prod.currentStock || 0) <= 0;

                return (
                  <div 
                    key={prod.id}
                    className="bg-[#171820] border border-amber-900/60 hover:border-amber-500 p-2.5 rounded-xl transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{prod.name}</span>
                          <span className="text-[9px] bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded font-black border border-blue-800">
                            سلعة مباشرة
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          المتبقي: <span className="font-mono text-rose-400 font-black">{prod.currentStock || 0}</span> قطعة | حد الأمان: <span className="font-mono text-slate-300">{prod.minThreshold || 3}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-black/40 px-1.5 py-0.5 rounded">
                        عجز: {deficit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-emerald-400">كافة المواد في المستوى الآمن!</p>
              <p className="text-[10px] text-slate-400">لا توجد نواقص أو مواد بحاجة لإعادة شحن حالياً.</p>
            </div>
          )}

          {/* Popover Footer Action */}
          <div className="pt-2.5 mt-2.5 border-t border-slate-700">
            <button
              onClick={() => {
                setShowNotificationPopover(false);
                if (onNavigateToInventory) {
                  onNavigateToInventory(true);
                }
              }}
              className="w-full py-2 px-3 bg-[#E31C2B] hover:bg-[#c91422] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#E31C2B]/30"
            >
              <PackagePlus className="w-4 h-4" />
              <span>فتح نظام المخزون وإعادة التعبئة</span>
            </button>
          </div>

        </div>
      )}

      {/* Profile Dropdown Menu */}
      {showProfileDropdown && (
        <div className="absolute left-3 top-full mt-1.5 w-72 bg-[#23242e] border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 text-white animate-in fade-in zoom-in-95" dir="rtl">
          <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 mb-1 border-b border-slate-700 flex items-center justify-between">
            <span>تبديل الحساب والمستخدمين</span>
            <KeyRound className="w-3 h-3 text-amber-400" />
          </div>

          <div className="space-y-1">
            {allStaff.map(s => (
              <button
                key={s.id}
                onClick={() => handleSelectStaff(s)}
                className={`w-full text-right flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  s.id === currentStaff.id ? 'bg-[#E31C2B] text-white font-bold shadow-md shadow-[#E31C2B]/20' : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{s.avatar}</span>
                  <div>
                    <div className="font-bold">{s.name}</div>
                    {s.workSchedule && (
                      <div className="text-[9px] text-slate-400">{s.workSchedule}</div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-black/30">
                  {s.role === 'manager' ? 'مدير' : 'عامل'}
                </span>
              </button>
            ))}
          </div>

          {/* STUDIO PROFILE & LOGO CUSTOMIZER BUTTON */}
          <div className="mt-2 pt-2 border-t border-slate-700 space-y-1">
            {onNavigateToSettings && (
              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  soundManager.playClickSound();
                  onNavigateToSettings();
                }}
                className="w-full text-right flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-white hover:text-white bg-[#E31C2B] hover:bg-[#c91422] transition-all cursor-pointer shadow-sm"
              >
                <Sliders className="w-4 h-4 text-white" />
                <span>إعدادات النظام وتخصيص الشعار (Settings)</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowProfileDropdown(false);
                setShowStudioProfileModal(true);
                soundManager.playClickSound();
              }}
              className="w-full text-right flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 transition-all cursor-pointer shadow-xs"
            >
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>تعديل بروفايل وشعار وصورة الاستوديو السريع</span>
            </button>
          </div>

          {onOpenSpecsModal && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-700">
              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  onOpenSpecsModal();
                }}
                className="w-full text-right flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#E31C2B]" />
                <span>دليل مقاسات ومواصفات الصور</span>
              </button>
            </div>
          )}

          {onResetData && (
            <div className="mt-1 pt-1 border-t border-slate-700">
              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  onResetData();
                }}
                className="w-full text-right flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] text-slate-400 hover:text-[#E31C2B] hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط البيانات الافتراضية</span>
              </button>
            </div>
          )}

          {onLogout && (
            <div className="mt-1 pt-1 border-t border-slate-700">
              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  onLogout();
                }}
                className="w-full text-right flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-rose-300 hover:text-white hover:bg-rose-950 transition-colors font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDIO PROFILE & LOGO EDITING MODAL (تعديل صورة واستوديو Fotop)          */}
      {/* ========================================================================= */}
      {showStudioProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#24252f] border-2 border-slate-600 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl text-white my-8"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#E31C2B]/20 text-[#ff6b6b] flex items-center justify-center font-bold">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white">تخصيص بروفايل وشعار الاستوديو</h3>
                  <p className="text-[10px] text-slate-400">تعديل لوجو الاستوديو، الصورة الشخصية، وتجربة الأصوات</p>
                </div>
              </div>
              <button
                onClick={() => setShowStudioProfileModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudioProfile} className="space-y-4">
              {/* Studio Logo & Picture Section */}
              <div className="bg-[#171820] p-4 rounded-2xl border border-slate-700 space-y-3">
                <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  <span>لوجو وصورة الاستوديو (Fotop Branding)</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E31C2B] to-[#990f1a] text-white flex items-center justify-center font-black text-2xl overflow-hidden border-2 border-slate-600 shadow-md shrink-0">
                    {customStudioLogo ? (
                      <img src={customStudioLogo} alt="Studio Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 stroke-[2.5]" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleStudioLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-[#E31C2B] hover:bg-[#c91422] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة / لوجو من الجهاز</span>
                    </button>
                    {customStudioLogo && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomStudioLogo(null);
                          localStorage.removeItem('fotop_custom_studio_logo');
                        }}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer block"
                      >
                        إزالة الصورة المخصصة والعودة للشعار الافتراضي
                      </button>
                    )}
                  </div>
                </div>

                {/* Studio Name and Tagline Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم الاستوديو:</label>
                    <input
                      type="text"
                      value={customStudioName}
                      onChange={e => setCustomStudioName(e.target.value)}
                      placeholder="Fotop"
                      className="w-full bg-[#20212b] border border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-[#E31C2B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">الوصف المختصر:</label>
                    <input
                      type="text"
                      value={studioTagline}
                      onChange={e => setStudioTagline(e.target.value)}
                      placeholder="استوديو التصوير"
                      className="w-full bg-[#20212b] border border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-[#E31C2B]"
                    />
                  </div>
                </div>
              </div>

              {/* Staff Profile Photo Section */}
              <div className="bg-[#171820] p-4 rounded-2xl border border-slate-700 space-y-3">
                <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>الصورة الشخصية للمستخدم الحالي ({currentStaff.name})</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border-2 border-slate-600 overflow-hidden shrink-0">
                    {customStaffPhoto ? (
                      <img src={customStaffPhoto} alt={currentStaff.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentStaff.avatar}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={staffPhotoInputRef}
                      onChange={handleStaffPhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => staffPhotoInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة شخصية للملف</span>
                    </button>
                    {customStaffPhoto && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomStaffPhoto(null);
                          localStorage.removeItem(`fotop_staff_photo_${currentStaff.id}`);
                        }}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer block"
                      >
                        إزالة الصورة الشخصية والعودة للأفاتار
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sound Notifications Test Station */}
              <div className="bg-[#171820] p-3 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">نغمات الحضور والإشعارات</div>
                    <div className="text-[10px] text-slate-400">صوت الترحيب عند بدء الدوام والتنبيهات</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => soundManager.playAttendanceArrivalSound()}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تجربة الصوت</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowStudioProfileModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#E31C2B] hover:bg-[#c91422] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#E31C2B]/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Switch Staff Auth Password Modal */}
      {showAuthModal && selectedStaffToLogin && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#24252f] border-2 border-slate-600 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-white"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-white">تأكيد كلمة المرور</h3>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 bg-[#171820] p-3 rounded-2xl border border-slate-700">
              <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                {selectedStaffToLogin.avatar}
              </div>
              <div>
                <div className="font-black text-white text-sm">{selectedStaffToLogin.name}</div>
                <div className="text-xs text-slate-400">
                  {selectedStaffToLogin.role === 'manager' ? 'مدير النظام (كامل الصلاحيات)' : 'عامل بالاستوديو'}
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة المرور:
                </label>
                <div className="relative">
                  <input
                    type={showSwitchPassword ? "text" : "password"}
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور..."
                    className="w-full bg-[#171820] border border-slate-600 rounded-xl pr-4 pl-10 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#E31C2B] text-right"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowSwitchPassword(!showSwitchPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSwitchPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authError && (
                  <p className="text-xs text-rose-400 mt-1.5 font-bold">{authError}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#E31C2B] hover:bg-[#c91422] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#E31C2B]/30 cursor-pointer"
                >
                  دخول بالحساب
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </header>
  );
};
