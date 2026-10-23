import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Image as ImageIcon,
  Upload,
  Sparkles,
  Check,
  CheckCheck,
  Sliders,
  Database,
  RefreshCw,
  Timer,
  UserX,
  ReceiptText,
  TrendingDown,
  AlertOctagon,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Staff, Shift, Material, AttendanceRecord, ServiceItem, Store, Order, Expense, SystemAlert, SystemAlertType } from '../types';
import { formatCurrency, formatTime, formatNumber, formatDate } from '../utils/formatters';
import { soundManager } from '../utils/audio';
import { api } from '../api';
import { generateSystemAlerts } from '../utils/alertsGenerator';
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
  shifts?: Shift[];
  orders?: Order[];
  expenses?: Expense[];
  onNavigateTab?: (tab: any) => void;
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
  shifts = [],
  orders = [],
  expenses = [],
  onNavigateTab,
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
  // 6 Intelligent Alerts Engine
  const [alertActiveCategory, setAlertActiveCategory] = useState<string>('all');
  const systemAlerts = useMemo(() => {
    return generateSystemAlerts({
      materials,
      services,
      shifts,
      allStaff,
      attendanceLogs,
      expenses,
      orders,
    });
  }, [materials, services, shifts, allStaff, attendanceLogs, expenses, orders]);

  // Read / Unread Notifications State (persisted in localStorage)
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('fotop_read_alerts');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markAlertAsRead = (alertId: string) => {
    setReadAlertIds(prev => {
      if (prev.has(alertId)) return prev;
      const next = new Set(prev);
      next.add(alertId);
      try {
        localStorage.setItem('fotop_read_alerts', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const markAllAlertsAsRead = () => {
    soundManager.playSuccessSound();
    setReadAlertIds(prev => {
      const next = new Set(prev);
      systemAlerts.alerts.forEach(a => next.add(a.id));
      try {
        localStorage.setItem('fotop_read_alerts', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const toggleAlertReadStatus = (alertId: string) => {
    setReadAlertIds(prev => {
      const next = new Set(prev);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      try {
        localStorage.setItem('fotop_read_alerts', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const totalAlertCount = systemAlerts.counts.total;
  const unreadAlertCount = useMemo(() => {
    return systemAlerts.alerts.filter(a => !readAlertIds.has(a.id)).length;
  }, [systemAlerts.alerts, readAlertIds]);
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

  // Sound notification when new unread system alert triggers
  const prevCountRef = useRef<number>(unreadAlertCount);
  useEffect(() => {
    if (unreadAlertCount > 0 && unreadAlertCount > prevCountRef.current) {
      soundManager.playAlertSound();
    }
    prevCountRef.current = unreadAlertCount;
  }, [unreadAlertCount]);

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

  // Unified Burger Menu State
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState<boolean>(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleBurgerClickOutside = (event: MouseEvent) => {
      if (burgerMenuRef.current && !burgerMenuRef.current.contains(event.target as Node)) {
        setIsBurgerMenuOpen(false);
      }
    };
    if (isBurgerMenuOpen) {
      document.addEventListener('mousedown', handleBurgerClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleBurgerClickOutside);
    };
  }, [isBurgerMenuOpen]);

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

          {/* Left / End: Unified Burger Menu + Smart Alerts Bell */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0">
            
            {/* Dedicated Smart Alerts Bell Button */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleOpenAlerts}
                className={`relative h-9 px-2.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all shadow-xs ${
                  unreadAlertCount > 0
                    ? 'bg-rose-950/80 border-rose-700 text-rose-200 hover:bg-rose-900 hover:text-white'
                    : 'bg-[#23242e] border-slate-700/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                }`}
                title={`تنبيهات النظام الذكية والرقابة (${unreadAlertCount} غير مقروء من أصل ${totalAlertCount})`}
              >
                <Bell className={`w-4 h-4 ${unreadAlertCount > 0 ? 'text-[#ff5252] animate-bounce' : 'text-slate-400'}`} />
                {unreadAlertCount > 0 ? (
                  <span className="font-mono font-black text-xs bg-[#E31C2B] text-white px-1.5 py-0.2 rounded-full min-w-5 text-center shadow-xs">
                    {unreadAlertCount}
                  </span>
                ) : (
                  <span className="hidden xl:inline text-[11px] font-bold text-slate-400">0</span>
                )}
              </motion.button>
            </div>

            <div className="relative" ref={burgerMenuRef}>
              
              {/* The Burger Button */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  soundManager.playClickSound();
                  setIsBurgerMenuOpen(!isBurgerMenuOpen);
                }}
                className={`relative h-9 px-2.5 sm:px-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all shadow-xs ${
                  isBurgerMenuOpen 
                    ? 'bg-[#E31C2B] border-[#E31C2B] text-white shadow-md shadow-[#E31C2B]/30' 
                    : 'bg-[#23242e] hover:bg-slate-700/80 border-slate-700/80 text-white'
                }`}
                title="القائمة والخيارات السريعة (برجر باتن)"
              >
                {/* User avatar or photo */}
                {customStaffPhoto ? (
                  <img src={customStaffPhoto} alt={currentStaff.name} className="w-5 h-5 rounded-md object-cover shrink-0" />
                ) : (
                  <span className="text-sm leading-none">{currentStaff.avatar || '👤'}</span>
                )}

                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white leading-none flex items-center gap-1">
                    <span className="truncate max-w-[85px]">{currentStaff.name}</span>
                    {currentStaff.role === 'manager' && (
                      <ShieldCheck className="w-3 h-3 text-amber-300 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Burger Icon */}
                <Menu className="w-4 h-4 text-slate-200 shrink-0" />

                {/* Red alert bubble for low stock */}
                {totalLowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#E31C2B] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#181920] shadow-md animate-pulse">
                    {totalLowStockCount}
                  </span>
                )}
              </motion.button>

              {/* Burger Dropdown Menu */}
              <AnimatePresence>
                {isBurgerMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-[#1c1d25] border border-slate-700/90 rounded-2xl shadow-2xl p-3 z-50 text-white divide-y divide-slate-800"
                    dir="rtl"
                  >
                    {/* 1. User Header & Switcher */}
                    <div className="pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {customStaffPhoto ? (
                          <img src={customStaffPhoto} alt={currentStaff.name} className="w-9 h-9 rounded-xl object-cover border border-slate-700" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                            {currentStaff.avatar || '👤'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-xs text-white flex items-center gap-1">
                            <span>{currentStaff.name}</span>
                            {currentStaff.role === 'manager' ? (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-1.5 py-0.2 rounded-md">
                                مدير عام
                              </span>
                            ) : (
                              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-black px-1.5 py-0.2 rounded-md">
                                عامل
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {currentStoreId === 'store_sidiamer' ? 'فرع سيدي عامر' : 'فرع الأبحور'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsBurgerMenuOpen(false);
                          setShowProfileDropdown(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                        title="تبديل حساب المستخدم"
                      >
                        <User className="w-3 h-3 text-amber-400" />
                        <span>تبديل</span>
                      </button>
                    </div>

                    {/* 2. Quick Actions */}
                    <div className="py-2.5 space-y-1">
                      <div className="text-[10px] font-black text-slate-400 px-1 mb-1">
                        الإجراءات السريعة
                      </div>

                      {/* Quick Expense */}
                      <button
                        onClick={() => {
                          setIsBurgerMenuOpen(false);
                          soundManager.playClickSound();
                          onOpenExpenseModal();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 text-right text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <Wallet className="w-3.5 h-3.5" />
                          </div>
                          <span>تسجيل مصروف نثري من الدرج</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">+ مصروف</span>
                      </button>

                      {/* Quick Waste */}
                      <button
                        onClick={() => {
                          setIsBurgerMenuOpen(false);
                          soundManager.playClickSound();
                          onOpenLogWaste();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 text-right text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                          <span>تسجيل تالف ورق أو حبر</span>
                        </div>
                        <span className="text-[10px] font-mono text-rose-400 font-bold">+ تالف</span>
                      </button>

                      {/* Settings */}
                      {onNavigateToSettings && (
                        <button
                          onClick={() => {
                            setIsBurgerMenuOpen(false);
                            soundManager.playClickSound();
                            onNavigateToSettings();
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 text-right text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                              <Sliders className="w-3.5 h-3.5" />
                            </div>
                            <span>إعدادات النظام وهوية الاستوديو</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">ضبط</span>
                        </button>
                      )}
                    </div>

                    {/* 3. System Controls & Alerts */}
                    <div className="py-2.5 space-y-1">
                      <div className="text-[10px] font-black text-slate-400 px-1 mb-1">
                        التحكم والتنبيهات
                      </div>

                      {/* Low Stock Alerts */}
                      <button
                        onClick={() => {
                          setIsBurgerMenuOpen(false);
                          handleOpenAlerts();
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-right text-xs font-bold transition-colors cursor-pointer ${
                          totalLowStockCount > 0 ? 'bg-[#E31C2B]/15 hover:bg-[#E31C2B]/25 text-white' : 'hover:bg-slate-800/80 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            totalLowStockCount > 0 ? 'bg-[#E31C2B] text-white' : 'bg-slate-800 text-slate-300'
                          }`}>
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <span>تنبيهات حد الأمان والمخزون</span>
                        </div>
                        {totalLowStockCount > 0 ? (
                          <span className="text-[10px] bg-[#E31C2B] text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                            {totalLowStockCount} نواقص
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-bold">آمن</span>
                        )}
                      </button>

                      {/* Sound Toggle */}
                      <button
                        onClick={handleToggleMute}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 text-right text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
                            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <span>أصوات وتنبيهات النظام</span>
                        </div>
                        <span className={`text-[10px] font-bold ${isMuted ? 'text-slate-400' : 'text-emerald-400'}`}>
                          {isMuted ? 'مكتوم' : 'مفعل'}
                        </span>
                      </button>

                      {/* MongoDB Atlas Cloud Sync */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <Database className={`w-3.5 h-3.5 ${mongoStatus.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
                          <span className="text-[11px] font-bold text-slate-300">سحابة MongoDB</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black ${mongoStatus.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {mongoStatus.connected ? 'متصل' : 'محلي'}
                          </span>
                          <button
                            onClick={handleManualMongoSync}
                            disabled={isSyncingMongo}
                            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-50"
                            title="مزامنة فورية مع MongoDB"
                          >
                            <RefreshCw className={`w-3 h-3 ${isSyncingMongo ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4. Logout Action */}
                    {onLogout && (
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setIsBurgerMenuOpen(false);
                            soundManager.playClickSound();
                            onLogout();
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-400" />
                          <span>تسجيل الخروج من المنظومة</span>
                        </button>
                      </div>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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

      {/* 6 INTELLIGENT SYSTEM ALERTS POPOVER (تنبيهات النظام الذكية الستة) */}
      {showNotificationPopover && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
            onClick={() => setShowNotificationPopover(false)}
          />
          <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-[78px] sm:top-full sm:left-4 sm:right-auto mt-1 sm:mt-2 w-auto sm:w-[470px] max-h-[85vh] overflow-y-auto bg-[#23242e] border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-white animate-in fade-in zoom-in-95" dir="rtl">
          
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#E31C2B]/20 text-[#ff6b6b] rounded-xl border border-red-500/30">
                <BellRing className="w-5 h-5 text-[#E31C2B] animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-1.5 flex-wrap">
                  <span>مركز التنبيهات والرقابة الذكية</span>
                  {unreadAlertCount > 0 ? (
                    <span className="text-[10px] bg-[#E31C2B] text-white px-2 py-0.5 rounded-full font-black animate-pulse shadow-xs">
                      {unreadAlertCount} غير مقروء
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      الكل مقروء ✓
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-400">
                  مراقبة فورية للمخزون، الصندوق، دوام العمال، المصروفات، والعمليات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {unreadAlertCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAlertsAsRead}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                  title="تعيين جميع التنبيهات كمقروءة"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>تعيين الكل كمقروء</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowNotificationPopover(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-xs cursor-pointer"
                title="إغلاق"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 6 Category Filter Chips + Unread chip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar border-b border-slate-800 text-[11px]">
            <button
              onClick={() => setAlertActiveCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                alertActiveCategory === 'all' ? 'bg-[#E31C2B] text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              الكل ({totalAlertCount})
            </button>
            <button
              onClick={() => setAlertActiveCategory('unread')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                alertActiveCategory === 'unread' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>غير مقروءة</span>
              <span className="font-mono">({unreadAlertCount})</span>
            </button>
            <button
              onClick={() => setAlertActiveCategory('low_stock')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                alertActiveCategory === 'low_stock' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              نقص المخزون ({systemAlerts.counts.low_stock})
            </button>
            <button
              onClick={() => setAlertActiveCategory('cash_discrepancy')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                alertActiveCategory === 'cash_discrepancy' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              فرق الصندوق ({systemAlerts.counts.cash_discrepancy})
            </button>
            <button
              onClick={() => setAlertActiveCategory('absent_worker')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                alertActiveCategory === 'absent_worker' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              عامل غائب ({systemAlerts.counts.absent_worker})
            </button>
            <button
              onClick={() => setAlertActiveCategory('unusual_expense')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                alertActiveCategory === 'unusual_expense' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              مصروف مرتفع ({systemAlerts.counts.unusual_expense})
            </button>
            <button
              onClick={() => setAlertActiveCategory('incomplete_operation')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                alertActiveCategory === 'incomplete_operation' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              عملية معلقة ({systemAlerts.counts.incomplete_operation})
            </button>
            <button
              onClick={() => setAlertActiveCategory('revenue_drop')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                alertActiveCategory === 'revenue_drop' ? 'bg-red-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              هبوط مداخيل ({systemAlerts.counts.revenue_drop})
            </button>
          </div>

          {/* Alert Cards List */}
          {(() => {
            const displayAlerts = systemAlerts.alerts.filter(a => {
              if (alertActiveCategory === 'unread') return !readAlertIds.has(a.id);
              if (alertActiveCategory === 'all') return true;
              return a.type === alertActiveCategory;
            });

            if (displayAlerts.length === 0) {
              return (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-emerald-400">
                    {alertActiveCategory === 'unread' ? 'رائع! لا توجد تنبيهات غير مقروءة' : 'لا توجد تنبيهات مسجلة في هذا القسم!'}
                  </p>
                  <p className="text-xs text-slate-400">كافة العمليات والمؤشرات تسير بصورة طبيعية ومستقرة.</p>
                </div>
              );
            }

            return (
              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                {displayAlerts.map(alert => {
                  const isRead = readAlertIds.has(alert.id);
                  const isCritical = alert.severity === 'critical';
                  const isWarning = alert.severity === 'warning';

                  return (
                    <div 
                      key={alert.id}
                      onClick={() => {
                        markAlertAsRead(alert.id);
                        if (alert.actionTab) {
                          setShowNotificationPopover(false);
                          if (onNavigateTab) {
                            onNavigateTab(alert.actionTab);
                          } else if (alert.actionTab === 'inventory' && onNavigateToInventory) {
                            onNavigateToInventory(true);
                          }
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                        isRead
                          ? 'bg-slate-800/40 border-slate-700/60 opacity-75 hover:opacity-100 hover:bg-slate-800/70 hover:border-slate-600'
                          : isCritical
                          ? 'bg-rose-950/50 border-rose-600 hover:border-rose-400 shadow-xs ring-1 ring-rose-500/30'
                          : isWarning
                          ? 'bg-amber-950/50 border-amber-600 hover:border-amber-400 shadow-xs ring-1 ring-amber-500/30'
                          : 'bg-slate-800/80 border-slate-600 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                              isRead
                                ? 'bg-slate-700/50 text-slate-400'
                                : isCritical
                                ? 'bg-rose-500/25 text-rose-300'
                                : isWarning
                                ? 'bg-amber-500/25 text-amber-300'
                                : 'bg-sky-500/25 text-sky-300'
                            }`}>
                              {alert.type === 'low_stock' && <PackagePlus className="w-4 h-4" />}
                              {alert.type === 'cash_discrepancy' && <AlertOctagon className="w-4 h-4" />}
                              {alert.type === 'absent_worker' && <UserX className="w-4 h-4" />}
                              {alert.type === 'unusual_expense' && <Wallet className="w-4 h-4" />}
                              {alert.type === 'incomplete_operation' && <ReceiptText className="w-4 h-4" />}
                              {alert.type === 'revenue_drop' && <TrendingDown className="w-4 h-4" />}
                            </div>
                            {!isRead && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-[#23242e] animate-ping" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className={`font-black text-xs ${isRead ? 'text-slate-300 font-semibold' : 'text-white'}`}>
                                {alert.title}
                              </h5>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                                isCritical ? 'bg-rose-900/80 text-rose-200 border border-rose-700/60' : isWarning ? 'bg-amber-900/80 text-amber-200 border border-amber-700/60' : 'bg-slate-700 text-slate-300'
                              }`}>
                                {alert.type === 'low_stock' ? 'نقص مخزون' :
                                 alert.type === 'cash_discrepancy' ? 'فارق بالصندوق' :
                                 alert.type === 'absent_worker' ? 'غياب عامل' :
                                 alert.type === 'unusual_expense' ? 'مصروف غير معتاد' :
                                 alert.type === 'incomplete_operation' ? 'عملية معلقة' : 'مداخيل غير طبيعية'}
                              </span>

                              {isRead ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400/90 bg-emerald-950/40 border border-emerald-700/40 px-1.5 py-0.2 rounded">
                                  <CheckCheck className="w-2.5 h-2.5" />
                                  <span>مقروء</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-300 bg-rose-950/60 border border-rose-600/40 px-1.5 py-0.2 rounded">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  <span>جديد</span>
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] mt-1 leading-relaxed ${isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                              {alert.description}
                            </p>
                          </div>
                        </div>

                        {/* Quick Action Button & Toggle Read Button */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundManager.playClickSound();
                              toggleAlertReadStatus(alert.id);
                            }}
                            className={`p-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                              isRead
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                            }`}
                            title={isRead ? 'إعادة التعيين كغير مقروء' : 'تعيين كمقروء'}
                          >
                            <CheckCheck className={`w-3.5 h-3.5 ${isRead ? 'text-slate-400' : 'text-emerald-400'}`} />
                          </button>

                          {alert.actionTab && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAlertAsRead(alert.id);
                                setShowNotificationPopover(false);
                                if (onNavigateTab) {
                                  onNavigateTab(alert.actionTab);
                                } else if (alert.actionTab === 'inventory' && onNavigateToInventory) {
                                  onNavigateToInventory(true);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-white/15"
                              title={alert.actionLabel || 'متابعة'}
                            >
                              <span>{alert.actionLabel || 'متابعة'}</span>
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Popover Footer Action */}
          <div className="pt-3 mt-3 border-t border-slate-700 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">
                غير مقروء: <strong className="text-rose-400 font-mono font-black">{unreadAlertCount}</strong> / {totalAlertCount}
              </span>
              {unreadAlertCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAlertsAsRead}
                  className="px-2 py-0.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="تعيين كافة التنبيهات كمقروءة"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>تعيين الكل كمقروء</span>
                </button>
              )}
            </div>
            
            <button
              onClick={() => {
                setShowNotificationPopover(false);
                if (onNavigateTab) {
                  onNavigateTab('dashboard');
                }
              }}
              className="py-1.5 px-3 bg-[#E31C2B] hover:bg-[#c91422] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#E31C2B]/30"
            >
              <span>فتح لوحة القيادة والمتابعة</span>
              <ArrowLeft className="w-3.5 h-3.5" />
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
