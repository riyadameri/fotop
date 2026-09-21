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
  Sliders,
  Database,
  RefreshCw,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Staff, Shift, Material, AttendanceRecord, ServiceItem, Store } from '../types';
import { formatCurrency, formatTime, formatNumber } from '../utils/formatters';
import { soundManager } from '../utils/audio';
import { api } from '../api';
import { FotopLogo } from './common/FotopLogo';
import { StudioLogo } from './common/StudioLogo';
import { StoreSelector } from './common/StoreSelector';

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
  stores?: Store[];
  currentStoreId?: string;
  onSelectStore?: (storeId: string) => void;
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
  stores = [],
  currentStoreId = 'store_sidiamer',
  onSelectStore,
}) => {
  const lowStockMaterials = (materials || []).filter(m => m.currentStock <= m.minThreshold);
  const lowStockProducts = (services || []).filter(
    s => s.itemType === 'direct_sale' && typeof s.currentStock === 'number' && s.currentStock <= (s.minThreshold || 3)
  );
  const totalLowStockCount = lowStockMaterials.length + lowStockProducts.length;

  // Live Real-Time Clock & Date for Computer Screens Header
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTimeStr = currentDateTime.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  const formattedDateStr = currentDateTime.toLocaleDateString('ar-DZ', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  });

  // MongoDB Atlas Cloud Connection State
  const [mongoStatus, setMongoStatus] = useState<{
    connected: boolean;
    database?: string;
    counts?: Record<string, number>;
    message?: string;
  }>({ connected: false });
  const [isSyncingMongo, setIsSyncingMongo] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await api.getMongoStatus();
        if (isMounted) setMongoStatus(res);
      } catch {
        if (isMounted) setMongoStatus({ connected: false });
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 25000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleManualMongoSync = async () => {
    setIsSyncingMongo(true);
    try {
      await api.syncToMongo();
      const status = await api.getMongoStatus();
      setMongoStatus(status);
      soundManager.playSuccessSound();
    } catch {
      soundManager.playAlertSound();
    } finally {
      setIsSyncingMongo(false);
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

  // Real-time live shift/attendance timer calculation
  const elapsedShiftTime = React.useMemo(() => {
    // Check if staff has active attendance or active shift
    const clockInTimeStr = activeAttendance?.clockIn || (activeShift?.status === 'open' && activeShift.staffId === currentStaff.id ? activeShift.startTime : null);
    if (!clockInTimeStr) return null;

    try {
      const start = new Date(clockInTimeStr).getTime();
      const now = currentDateTime.getTime();
      const diffMs = Math.max(0, now - start);
      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } catch {
      return null;
    }
  }, [activeAttendance?.clockIn, activeShift?.startTime, activeShift?.status, activeShift?.staffId, currentStaff.id, currentDateTime]);

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
    <header className="w-full bg-[#181920] text-white border-b border-slate-800 sticky top-0 z-30 transition-all duration-200 shadow-md backdrop-blur-md">
      {/* ========================================================================= */}
      {/* 1. PRIMARY TOP NAVIGATION BAR (Clean, Harmonized & Adaptive)               */}
      {/* ========================================================================= */}
      <div className="w-full mx-auto flex items-center justify-between gap-2 sm:gap-3 py-2 px-3 sm:px-5 lg:px-6">
          
          {/* Right / Start: Burger (Mobile) + Logo & Branding + Store Selector */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
            
            {/* Mobile Burger Menu Button */}
            {onToggleMobileMenu && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onToggleMobileMenu}
                className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs shrink-0"
                title="فتح القائمة الرئيسية"
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4 text-rose-400" />
                ) : (
                  <Menu className="w-4 h-4 text-slate-200" />
                )}
              </motion.button>
            )}

            {/* Logo & Branding */}
            <div className="flex items-center gap-2 min-w-0">
              <div 
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#23242e] border border-slate-700/80 p-0.5 text-white font-black shadow-xs shrink-0 cursor-pointer overflow-hidden transition-transform active:scale-95 flex items-center justify-center"
                onClick={() => {
                  soundManager.playClickSound();
                  if (onNavigateToHome) onNavigateToHome();
                }}
                title="الواجهة الرئيسية (نقطة البيع)"
              >
                <StudioLogo className="w-full h-full" alt={customStudioName || "شعار الاستوديو"} showGlow />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 border-2 border-[#181920] rounded-full" title="متصل بالسيرفر السحابي Redox" />
              </div>

              {/* Branding Text */}
              <div 
                className="h-8 sm:h-9 flex flex-col justify-center cursor-pointer transition-opacity hover:opacity-90 min-w-0" 
                onClick={() => {
                  soundManager.playClickSound();
                  if (onNavigateToHome) onNavigateToHome();
                }}
                title="الواجهة الرئيسية (نقطة البيع)"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1 min-w-0 leading-none">
                    <span className="truncate max-w-[85px] xs:max-w-[120px] sm:max-w-[180px]">{customStudioName}</span>
                    <span className="bg-[#E31C2B] text-white text-[9px] px-1.5 py-0.5 rounded-md font-black tracking-normal shrink-0">ERP</span>
                  </h1>
                  <span className="text-[11px] text-slate-400 font-medium hidden md:inline-block truncate leading-none">| {studioTagline}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[9px] text-slate-400 mt-1 leading-none">
                  <span className="text-slate-300">Redox Cloud</span>
                  <span>•</span>
                  <span className="font-mono text-slate-400 dir-ltr flex items-center gap-0.5">
                    <Phone className="w-2.5 h-2.5 text-[#E31C2B]" /> 05 63898395
                  </span>
                </div>
              </div>

              {/* Multi-Store Switcher */}
              {stores && stores.length > 0 && (
                <div className="hidden sm:flex items-center mr-1">
                  <div className="h-5 w-px bg-slate-700/60 ml-2 mr-1" />
                  <StoreSelector
                    stores={stores}
                    currentStoreId={currentStoreId}
                    onSelectStore={onSelectStore || (() => {})}
                    currentStaff={currentStaff}
                    variant="header"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Center: Live Attendance & Shift Status (Desktop & Tablet Screens) */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 justify-center">
            
            {/* Live Shift & Attendance Real-time Timer */}
            {elapsedShiftTime ? (
              <div 
                className="h-9 flex items-center gap-1.5 bg-[#171820] border border-emerald-500/40 rounded-xl px-2.5 text-emerald-300 shadow-xs"
                title={`المدة المنقضية في الدوام الفعلي للموظف (${currentStaff.name}) بدقة بالثواني`}
              >
                <Timer className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                <div className="flex items-center gap-1">
                  <span className="hidden xl:inline text-[9px] text-slate-400 font-medium">الوردية:</span>
                  <span className="font-mono font-black text-white text-[11px] sm:text-xs tracking-wider">
                    {elapsedShiftTime}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Worker Instant Clock-In / Clock-Out Widget */}
            <div className="h-9 flex items-center gap-1.5 bg-[#171820] border border-slate-700/80 rounded-xl text-xs shadow-xs px-2.5">
              {activeAttendance ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="hidden md:inline text-slate-400 font-normal">دوام:</span>
                    <span className="font-mono font-bold text-white">{formatTime(activeAttendance.clockIn)}</span>
                  </div>
                  <button
                    onClick={handleClockOutClick}
                    className="h-6 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700/80 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="تسجيل نهاية الدوام اليومي (خروج)"
                  >
                    <StopCircle className="w-3 h-3 text-rose-400" />
                    <span className="hidden lg:inline">خروج</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleClockInClick}
                  className="h-6 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                  title="تسجيل بدء الدوام والعمل الفعلي"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>بدء الدوام</span>
                </button>
              )}
            </div>

            {/* Active Shift Cash Indicator */}
            {activeShift && (
              <div className="h-9 flex items-center gap-1.5 bg-[#171820] border border-slate-700/80 rounded-xl text-xs px-2.5 shadow-xs">
                <Wallet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-mono text-amber-300 font-bold text-[11px]">
                  {formatCurrency(activeShift.expectedCash)}
                </span>
              </div>
            )}

            {/* Live Clock & Calendar Indicator for Desktop / Computer Screens */}
            <div className="h-9 hidden lg:flex items-center gap-2 bg-[#171820] border border-slate-700/80 rounded-xl px-2.5 text-xs text-slate-300 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-[#E31C2B] animate-pulse" />
              <span className="font-mono font-bold text-white text-[11px] tracking-wide">
                {formattedTimeStr}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {formattedDateStr}
              </span>
            </div>

            {/* MongoDB Cloud Database Status Indicator */}
            <div 
              onClick={handleManualMongoSync}
              className={`h-9 hidden md:flex items-center gap-1.5 border rounded-xl px-2.5 text-xs cursor-pointer transition-all shadow-xs ${
                mongoStatus.connected
                  ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-amber-950/50 border-amber-600/50 text-amber-300 hover:bg-amber-900/50'
              }`}
              title={
                mongoStatus.connected 
                  ? `قاعدة بيانات MongoDB Atlas متصلة بنجاح (${mongoStatus.database || 'fotop_studio'}). انقر للمزامنة الفورية.`
                  : 'قاعدة بيانات MongoDB Atlas: جاري الاتصال أو تعمل في النمط المحلي الاحتياطي. انقر لإعادة المحاولة والمزامنة.'
              }
            >
              <Database className={`w-3.5 h-3.5 ${mongoStatus.connected ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
              <span className="font-bold text-[10px]">
                {mongoStatus.connected ? 'MongoDB' : 'مزامنة'}
              </span>
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncingMongo ? 'animate-spin text-white' : 'opacity-60'}`} />
            </div>

            {/* Low Stock Quick Alert Trigger */}
            {totalLowStockCount > 0 && (
              <button
                onClick={handleOpenAlerts}
                className="h-9 bg-[#E31C2B] hover:bg-[#c91422] text-white px-2.5 rounded-xl text-xs flex items-center gap-1.5 font-bold shadow-md shadow-[#E31C2B]/30 animate-pulse cursor-pointer transition-colors"
                title="انقر لعرض تفاصيل المواد التي وصلت لحد الأمان"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{totalLowStockCount} نواقص</span>
              </button>
            )}
          </div>

          {/* Left / End: Audio Sound Toggle, Notification Bell, Action Shortcuts, Profile Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0">
            
            {/* Sound Mute / Unmute Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleToggleMute}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 ${
                isMuted 
                  ? 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200' 
                  : 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900'
              }`}
              title={isMuted ? 'الصوت مكتوم - انقر لتفعيل أصوات الأشعارات والتنبيهات' : 'الأصوات مفعلة - انقر لكتم الصوت'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </motion.button>

            {/* Notification Bell for Low Stock Alerts */}
            <div className="relative" ref={notifRef}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenAlerts}
                className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 ${
                  totalLowStockCount > 0
                    ? 'bg-[#E31C2B]/20 hover:bg-[#E31C2B]/30 border-[#E31C2B] text-white shadow-lg shadow-[#E31C2B]/20'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 text-slate-300'
                }`}
                title={
                  totalLowStockCount > 0 
                    ? `تنبيه: يوجد ${totalLowStockCount} مواد تحتاج إلى إعادة تعبئة` 
                    : 'تنبيهات المخزون (المستويات آمنة)'
                }
              >
                {totalLowStockCount > 0 ? (
                  <BellRing className="w-4 h-4 text-[#ff6b6b] animate-bounce" />
                ) : (
                  <Bell className="w-4 h-4 text-slate-300" />
                )}

                {/* Notification Badge */}
                {totalLowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#E31C2B] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#181920] shadow-md animate-pulse">
                    {totalLowStockCount}
                  </span>
                )}
              </motion.button>
            </div>

            {/* Quick Expense Shortcut (Desktop) */}
            <button
              onClick={() => {
                soundManager.playClickSound();
                onOpenExpenseModal();
              }}
              className="hidden sm:flex h-9 text-xs bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700/80 rounded-xl items-center gap-1.5 px-2.5 transition-colors cursor-pointer shadow-xs shrink-0"
              title="تسجيل مصروف نثري من الدرج"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">مصروف</span>
            </button>

            {/* Quick Waste Shortcut (Desktop) */}
            <button
              onClick={() => {
                soundManager.playClickSound();
                onOpenLogWaste();
              }}
              className="hidden lg:flex h-9 text-xs bg-slate-800/80 hover:bg-slate-700/80 text-rose-300 hover:text-rose-200 border border-slate-700/80 rounded-xl items-center gap-1.5 px-2.5 transition-colors cursor-pointer shadow-xs shrink-0"
              title="تسجيل تالف ورق أو حبر"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold">تالف</span>
            </button>

            {/* Direct Settings Shortcut (Desktop) */}
            {onNavigateToSettings && (
              <button
                onClick={() => {
                  soundManager.playClickSound();
                  onNavigateToSettings();
                }}
                className="hidden xl:flex h-9 text-xs bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl items-center gap-1.5 px-2.5 transition-colors cursor-pointer shadow-xs shrink-0"
                title="إعدادات النظام وهوية الاستوديو"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-bold">الإعدادات</span>
              </button>
            )}

            {/* Staff Switcher Profile Pill */}
            <div className="relative" ref={profileRef}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  soundManager.playClickSound();
                  setShowProfileDropdown(!showProfileDropdown);
                }}
                className={`h-8 sm:h-9 flex items-center gap-1.5 border rounded-xl cursor-pointer transition-all px-2 sm:px-2.5 shadow-xs shrink-0 ${
                  currentStaff.role === 'manager' 
                    ? 'bg-gradient-to-r from-amber-600/90 to-amber-700/90 border-amber-500/80 text-white' 
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 text-white'
                }`}
                title={`${currentStaff.name} (${currentStaff.role === 'manager' ? 'مدير' : 'عامل'})`}
              >
                {customStaffPhoto ? (
                  <img src={customStaffPhoto} alt={currentStaff.name} className="w-5 h-5 rounded-lg object-cover shrink-0" />
                ) : (
                  <span className="text-sm sm:text-base leading-none">{currentStaff.avatar}</span>
                )}
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white leading-none flex items-center gap-1">
                    <span className="truncate max-w-[85px]">{currentStaff.name}</span>
                    {currentStaff.role === 'manager' && (
                      <ShieldCheck className="w-3 h-3 text-amber-200 shrink-0" />
                    )}
                  </div>
                  <div className="text-[9px] text-slate-300 mt-0.5 leading-none">
                    {currentStaff.role === 'manager' ? 'مدير' : 'عامل'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0 opacity-80" />
              </motion.button>
            </div>

            {/* Quick Logout Button (Desktop only) */}
            {onLogout && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  soundManager.playClickSound();
                  onLogout();
                }}
                className="hidden sm:flex w-9 h-9 xl:w-auto xl:px-2.5 rounded-xl text-xs bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-200 items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="hidden xl:inline font-bold">خروج</span>
              </motion.button>
            )}

          </div>
        </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE CONTEXTUAL STATUS & ACTION STRIP (Exclusively for Mobile Phones) */}
      {/* ========================================================================= */}
      <div className="sm:hidden flex items-center justify-between gap-1.5 px-3 py-1.5 bg-[#14151b] border-t border-slate-800/80 text-xs">
        
        {/* Mobile Clock-In/Out Quick Control */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeAttendance ? (
            <div className="h-8 flex items-center gap-1.5 bg-[#23242e] border border-emerald-700/50 rounded-lg px-2 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-mono font-bold text-[10px]">
                {formatTime(activeAttendance.clockIn)}
              </span>
              <button
                onClick={handleClockOutClick}
                className="h-5 bg-rose-950 text-rose-300 hover:bg-rose-900 px-1.5 rounded text-[9px] font-bold border border-rose-800/80 flex items-center gap-0.5 cursor-pointer"
                title="خروج من الدوام"
              >
                <StopCircle className="w-2.5 h-2.5 text-rose-400" />
                <span>خروج</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleClockInClick}
              className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <PlayCircle className="w-3 h-3" />
              <span>بدء الدوام</span>
            </button>
          )}

          {/* Mobile Shift Live Timer */}
          {elapsedShiftTime && (
            <div className="h-8 flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/50 rounded-lg px-2 text-[10px] text-emerald-300 font-mono font-bold shadow-inner">
              <Timer className="w-2.5 h-2.5 text-emerald-400" />
              <span>{elapsedShiftTime}</span>
            </div>
          )}
        </div>

        {/* Center: Store Selector & Shift Cash OR Low Stock Alert */}
        <div className="flex items-center gap-1.5">
          {stores && stores.length > 0 && (
            <StoreSelector
              stores={stores}
              currentStoreId={currentStoreId}
              onSelectStore={onSelectStore || (() => {})}
              currentStaff={currentStaff}
              variant="compact"
            />
          )}

          {totalLowStockCount > 0 ? (
            <button
              onClick={handleOpenAlerts}
              className="h-8 bg-[#E31C2B] text-white px-2 rounded-lg text-[9px] font-black flex items-center gap-1 animate-pulse cursor-pointer shadow-xs"
              title="عرض نواقص المخزون"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{totalLowStockCount} نواقص</span>
            </button>
          ) : activeShift ? (
            <div className="h-8 flex items-center gap-1 bg-[#23242e] border border-slate-700/60 rounded-lg px-2 text-[10px] text-amber-400 font-mono font-bold shadow-inner" title="رصيد الصندوق المتوقع">
              <Wallet className="w-3 h-3 text-amber-400" />
              <span>{formatCurrency(activeShift.expectedCash)}</span>
            </div>
          ) : (
            <div className="h-8 flex items-center gap-1 text-[10px] text-slate-400 font-mono bg-[#23242e] border border-slate-700/60 rounded-lg px-2 shadow-inner">
              <Clock className="w-2.5 h-2.5 text-slate-400" />
              <span>{formattedTimeStr}</span>
            </div>
          )}
        </div>

        {/* End: Quick Expense Shortcut on Mobile */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => {
              soundManager.playClickSound();
              onOpenExpenseModal();
            }}
            className="h-8 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            title="تسجيل مصروف سريع من الدرج"
          >
            <Wallet className="w-3 h-3" />
            <span>+ مصروف</span>
          </button>
        </div>

      </div>

      {/* Notifications Popover Dropdown (Shared for both Compact and Full modes) */}
      {showNotificationPopover && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
            onClick={() => setShowNotificationPopover(false)}
          />
          <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-[78px] sm:top-full sm:left-4 sm:right-auto mt-1 sm:mt-2 w-auto sm:w-96 max-h-[85vh] overflow-y-auto bg-[#23242e] border border-slate-700 rounded-2xl shadow-2xl p-3.5 z-50 text-white animate-in fade-in zoom-in-95" dir="rtl">
          
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
      </>
    )}

      {/* Profile Dropdown Menu */}
      {showProfileDropdown && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
            onClick={() => setShowProfileDropdown(false)}
          />
          <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-[78px] sm:top-full sm:left-3 sm:right-auto mt-1 sm:mt-2 w-auto sm:w-80 max-h-[85vh] overflow-y-auto bg-[#23242e] border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-white animate-in fade-in zoom-in-95" dir="rtl">
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
      </>
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
                  <div className="w-16 h-16 rounded-2xl bg-[#292A34] text-white flex items-center justify-center font-black text-2xl overflow-hidden border border-slate-700/80 shadow-md shrink-0 p-1">
                    {customStudioLogo ? (
                      <img src={customStudioLogo} alt="Studio Logo" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <FotopLogo className="w-full h-full" showGlow />
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
