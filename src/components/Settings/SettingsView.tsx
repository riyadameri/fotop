import React, { useState, useRef, useEffect } from 'react';
import { 
  Sliders, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  Save, 
  RotateCcw, 
  Building, 
  Phone, 
  MapPin, 
  Receipt, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Printer, 
  QrCode, 
  Layers, 
  FileText, 
  ShieldCheck, 
  Download, 
  HelpCircle,
  Eye,
  Camera,
  Link,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  Users,
  Timer,
  FileSpreadsheet,
  RefreshCw,
  LogOut,
  LogIn,
  Coins,
  Wallet,
  Banknote,
  Building2,
  ShieldAlert,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Scale,
  DollarSign,
  Calculator
} from 'lucide-react';
import { soundManager } from '../../utils/audio';
import { Staff, AttendanceRecord, Store, Shift, Order, Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { api } from '../../api';
import { FotopLogo } from '../common/FotopLogo';

interface SettingsViewProps {
  currentStaff: Staff;
  allStaff?: Staff[];
  attendanceLogs?: AttendanceRecord[];
  stores?: Store[];
  onUpdateStore?: (storeId: string, storeData: Partial<Store>) => Promise<void> | void;
  shifts?: Shift[];
  orders?: Order[];
  expenses?: Expense[];
  onUpdateStudioProfile?: (logo: string | null, name: string) => void;
  onGoToPOS?: () => void;
  onAutoClockInAll?: () => Promise<{ clockedInCount: number; clockedInStaffNames?: string[] } | any>;
  onAutoClockOutAll?: () => Promise<{ clockedOutCount: number } | any>;
  onClockInStaff?: (staffId: string, staffName: string) => void;
  onClockOutStaff?: (staffId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentStaff,
  allStaff = [],
  attendanceLogs = [],
  stores = [],
  onUpdateStore,
  shifts = [],
  orders = [],
  expenses = [],
  onUpdateStudioProfile,
  onGoToPOS,
  onAutoClockInAll,
  onAutoClockOutAll,
  onClockInStaff,
  onClockOutStaff
}) => {
  const isManager = currentStaff?.role === 'manager';
  const isFouad = currentStaff?.id === 'staff_fouad' || currentStaff?.name?.toLowerCase().includes('fouad') || isManager;

  // State for Studio Logo
  const [studioLogo, setStudioLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('fotop_custom_studio_logo') || null;
    } catch {
      return null;
    }
  });

  // State for Studio Information
  const [studioName, setStudioName] = useState<string>(() => {
    try {
      return localStorage.getItem('fotop_custom_studio_name') || 'Fotop Studio';
    } catch {
      return 'Fotop Studio';
    }
  });

  const [studioTagline, setStudioTagline] = useState<string>(() => {
    try {
      return localStorage.getItem('fotop_custom_studio_tagline') || 'استوديو التصوير الاحترافي والمطبوعات';
    } catch {
      return 'استوديو التصوير الاحترافي والمطبوعات';
    }
  });

  const [studioPhone, setStudioPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('fotop_custom_studio_phone') || '05 63 89 83 95';
    } catch {
      return '05 63 89 83 95';
    }
  });

  const [studioAddress, setStudioAddress] = useState<string>(() => {
    try {
      return localStorage.getItem('fotop_custom_studio_address') || 'الشارع التجاري الرئيسي، الجزائر';
    } catch {
      return 'الشارع التجاري الرئيسي، الجزائر';
    }
  });

  const [taxNumber, setTaxNumber] = useState<string>(() => {
    try {
      return localStorage.getItem('fotop_custom_studio_tax') || 'RC: 16/00-984210B';
    } catch {
      return 'RC: 16/00-984210B';
    }
  });

  // Receipt Settings
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fotop_show_receipt_logo') !== 'false';
    } catch {
      return true;
    }
  });

  const [receiptFooter, setReceiptFooter] = useState<string>(() => {
    try {
      return localStorage.getItem('fotop_receipt_footer') || 'شكراً لثقتكم باستوديو Fotop ─ نسعد بخدمتكم دائماً';
    } catch {
      return 'شكراً لثقتكم باستوديو Fotop ─ نسعد بخدمتكم دائماً';
    }
  });

  const [receiptWidth, setReceiptWidth] = useState<'80mm' | '58mm' | 'a5'>(() => {
    try {
      return (localStorage.getItem('fotop_receipt_width') as '80mm' | '58mm' | 'a5') || '80mm';
    } catch {
      return '80mm';
    }
  });

  const [showQrOnReceipt, setShowQrOnReceipt] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fotop_receipt_show_qr') !== 'false';
    } catch {
      return true;
    }
  });

  const [showBomOnReceipt, setShowBomOnReceipt] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fotop_receipt_show_bom') === 'true';
    } catch {
      return false;
    }
  });

  // Sound & Interface Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => !soundManager.getMuted());
  const [compactHeader, setCompactHeader] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fotop_header_compact') === 'true';
    } catch {
      return false;
    }
  });

  // Extra Studio Operations Settings
  const [studioOpenTime, setStudioOpenTime] = useState<string>(() => {
    try {
      return localStorage.getItem('fotop_studio_open_time') || '08:30';
    } catch {
      return '08:30';
    }
  });

  const [studioCloseTime, setStudioCloseTime] = useState<string>(() => {
    try {
      return localStorage.getItem('fotop_studio_close_time') || '20:00';
    } catch {
      return '20:00';
    }
  });

  const [defaultTurnaround, setDefaultTurnaround] = useState<string>(() => {
    try {
      return localStorage.getItem('fotop_default_turnaround') || '30m';
    } catch {
      return '30m';
    }
  });

  const [taxRate, setTaxRate] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('fotop_tax_rate')) || 0;
    } catch {
      return 0;
    }
  });

  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('fotop_low_stock_threshold')) || 10;
    } catch {
      return 10;
    }
  });

  const [autoAttendanceOnOpen, setAutoAttendanceOnOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fotop_auto_attendance_on_open') === 'true';
    } catch {
      return false;
    }
  });

  // Attendance Trigger States
  const [isAutoClocking, setIsAutoClocking] = useState<boolean>(false);
  const [attendanceActionMessage, setAttendanceActionMessage] = useState<string | null>(null);

  // URL input state
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTabSection, setActiveTabSection] = useState<'branding' | 'receipt' | 'attendance' | 'cash_in_hand' | 'system'>('cash_in_hand');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Date today string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  // Cash In Hand (الرصيد الافتتاحي للخزينة) Settings State
  const sidiStore = (stores || []).find(s => s.id === 'store_sidiamer');
  const labhourStore = (stores || []).find(s => s.id === 'store_labhour');

  const [sidiCashInHand, setSidiCashInHand] = useState<string>(() => {
    return String(sidiStore?.openingCashBalance ?? 5000);
  });
  const [sidiCashNotes, setSidiCashNotes] = useState<string>(() => {
    return sidiStore?.cashInHandNotes || 'فكة نقدية معتمدة لبداية اليوم (فئات 200 دج و 500 دج و 1000 دج)';
  });
  const [sidiLastUpdated, setSidiLastUpdated] = useState<string>(() => {
    return sidiStore?.lastCashInHandUpdate || todayStr;
  });

  const [labhourCashInHand, setLabhourCashInHand] = useState<string>(() => {
    return String(labhourStore?.openingCashBalance ?? 3000);
  });
  const [labhourCashNotes, setLabhourCashNotes] = useState<string>(() => {
    return labhourStore?.cashInHandNotes || 'فكة نقدية معتمدة لبداية اليوم (فئات 100 دج و 200 دج و 500 دج)';
  });
  const [labhourLastUpdated, setLabhourLastUpdated] = useState<string>(() => {
    return labhourStore?.lastCashInHandUpdate || todayStr;
  });

  const [cashInHandMessage, setCashInHandMessage] = useState<string | null>(null);

  // Sync state if stores prop updates from backend
  useEffect(() => {
    if (sidiStore?.openingCashBalance !== undefined) {
      setSidiCashInHand(String(sidiStore.openingCashBalance));
    }
    if (sidiStore?.cashInHandNotes) {
      setSidiCashNotes(sidiStore.cashInHandNotes);
    }
    if (sidiStore?.lastCashInHandUpdate) {
      setSidiLastUpdated(sidiStore.lastCashInHandUpdate);
    }
  }, [sidiStore?.openingCashBalance, sidiStore?.cashInHandNotes, sidiStore?.lastCashInHandUpdate]);

  useEffect(() => {
    if (labhourStore?.openingCashBalance !== undefined) {
      setLabhourCashInHand(String(labhourStore.openingCashBalance));
    }
    if (labhourStore?.cashInHandNotes) {
      setLabhourCashNotes(labhourStore.cashInHandNotes);
    }
    if (labhourStore?.lastCashInHandUpdate) {
      setLabhourLastUpdated(labhourStore.lastCashInHandUpdate);
    }
  }, [labhourStore?.openingCashBalance, labhourStore?.cashInHandNotes, labhourStore?.lastCashInHandUpdate]);

  // Real-time Reconciliation Calculations per Store for Today
  const sidiOrdersToday = (orders || []).filter(o => 
    (o.storeId === 'store_sidiamer' || o.storeName?.toLowerCase().includes('sidiamer') || o.storeName?.includes('سيدي عامر')) &&
    o.createdAt?.startsWith(todayStr)
  );
  const sidiCashSales = sidiOrdersToday
    .filter(o => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  
  const sidiExpensesToday = (expenses || []).filter(e => 
    (e.storeId === 'store_sidiamer' || e.storeName?.toLowerCase().includes('sidiamer') || e.storeName?.includes('سيدي عامر')) &&
    e.createdAt?.startsWith(todayStr)
  );
  const sidiCashExpenses = sidiExpensesToday.reduce((sum, e) => sum + (e.amount || 0), 0);
  const sidiExpectedCash = (Number(sidiCashInHand) || 0) + sidiCashSales - sidiCashExpenses;

  const sidiShiftsToday = (shifts || []).filter(s => 
    (s.storeId === 'store_sidiamer' || s.storeName?.toLowerCase().includes('sidiamer') || s.storeName?.includes('سيدي عامر')) &&
    s.startTime?.startsWith(todayStr)
  );
  const sidiClosedShifts = sidiShiftsToday.filter(s => s.endTime);
  const sidiTotalDifference = sidiClosedShifts.reduce((sum, s) => sum + (s.difference || 0), 0);

  // Labhour calculations
  const labhourOrdersToday = (orders || []).filter(o => 
    (o.storeId === 'store_labhour' || o.storeName?.toLowerCase().includes('labhour') || o.storeName?.includes('الأبحور')) &&
    o.createdAt?.startsWith(todayStr)
  );
  const labhourCashSales = labhourOrdersToday
    .filter(o => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  
  const labhourExpensesToday = (expenses || []).filter(e => 
    (e.storeId === 'store_labhour' || e.storeName?.toLowerCase().includes('labhour') || e.storeName?.includes('الأبحور')) &&
    e.createdAt?.startsWith(todayStr)
  );
  const labhourCashExpenses = labhourExpensesToday.reduce((sum, e) => sum + (e.amount || 0), 0);
  const labhourExpectedCash = (Number(labhourCashInHand) || 0) + labhourCashSales - labhourCashExpenses;

  const labhourShiftsToday = (shifts || []).filter(s => 
    (s.storeId === 'store_labhour' || s.storeName?.toLowerCase().includes('labhour') || s.storeName?.includes('الأبحور')) &&
    s.startTime?.startsWith(todayStr)
  );
  const labhourClosedShifts = labhourShiftsToday.filter(s => s.endTime);
  const labhourTotalDifference = labhourClosedShifts.reduce((sum, s) => sum + (s.difference || 0), 0);

  // Handlers for Cash In Hand
  const handleSaveSidiCashInHand = async () => {
    const val = Number(sidiCashInHand) || 0;
    const now = new Date().toISOString().split('T')[0];
    setSidiLastUpdated(now);
    try {
      localStorage.setItem('fotop_store_opening_cash_store_sidiamer', String(val));
      if (onUpdateStore) {
        await onUpdateStore('store_sidiamer', {
          openingCashBalance: val,
          lastCashInHandUpdate: now,
          cashInHandNotes: sidiCashNotes
        });
      }
      soundManager.playSuccess();
      setCashInHandMessage('تم اعتماد وتثبيت الرصيد الافتتاحي (5,000 دج) لمتجر سيدي عامر بنجاح!');
      setTimeout(() => setCashInHandMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveLabhourCashInHand = async () => {
    const val = Number(labhourCashInHand) || 0;
    const now = new Date().toISOString().split('T')[0];
    setLabhourLastUpdated(now);
    try {
      localStorage.setItem('fotop_store_opening_cash_store_labhour', String(val));
      if (onUpdateStore) {
        await onUpdateStore('store_labhour', {
          openingCashBalance: val,
          lastCashInHandUpdate: now,
          cashInHandNotes: labhourCashNotes
        });
      }
      soundManager.playSuccess();
      setCashInHandMessage('تم اعتماد وتثبيت الرصيد الافتتاحي (3,000 دج) لمتجر الأبحور بنجاح!');
      setTimeout(() => setCashInHandMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAllStoresCashInHand = async () => {
    await handleSaveSidiCashInHand();
    await handleSaveLabhourCashInHand();
    setCashInHandMessage('تم اعتماد وتثبيت الرصيد الافتتاحي لكلا المتجرين (سيدي عامر والأبحور) بنجاح!');
    setTimeout(() => setCashInHandMessage(null), 4000);
  };

  // Helper to determine currently active clocked-in staff
  const activeClockedInStaffIds = new Set(
    (attendanceLogs || [])
      .filter(a => a.date === todayStr && a.status === 'clocked_in')
      .map(a => a.staffId)
  );

  // Auto Clock-In All
  const handleTriggerAutoClockIn = async () => {
    setIsAutoClocking(true);
    try {
      if (onAutoClockInAll) {
        const res = await onAutoClockInAll();
        soundManager.playSuccessSound();
        const count = res?.clockedInCount ?? (res?.clockedInStaffNames?.length ?? allStaff.length);
        setAttendanceActionMessage(`تم بنجاح تسجيل حضور ودخول ${count} من عمال الاستوديو تلقائياً! ⚡`);
      } else {
        const res = await api.autoClockInAll(currentStaff.id);
        soundManager.playSuccessSound();
        setAttendanceActionMessage(`تم بنجاح تسجيل حضور ودخول ${res.clockedInCount} من عمال الاستوديو تلقائياً! ⚡`);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تسجيل الدوام التلقائي، يرجى المحاولة ثانية.');
    } finally {
      setIsAutoClocking(false);
      setTimeout(() => setAttendanceActionMessage(null), 5000);
    }
  };

  // Auto Clock-Out All
  const handleTriggerAutoClockOut = async () => {
    if (!confirm('هل تريد بالتأكيد إنهاء دوام وتسجيل خروج جميع العمال الحاضرين حالياً؟')) return;
    setIsAutoClocking(true);
    try {
      if (onAutoClockOutAll) {
        const res = await onAutoClockOutAll();
        soundManager.playClickSound();
        setAttendanceActionMessage(`تم إنهاء دوام وتسجيل خروج ${res?.clockedOutCount || 0} من العمال.`);
      } else {
        const res = await api.autoClockOutAll();
        soundManager.playClickSound();
        setAttendanceActionMessage(`تم إنهاء دوام وتسجيل خروج ${res.clockedOutCount} من العمال.`);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنهاء دوام العمال');
    } finally {
      setIsAutoClocking(false);
      setTimeout(() => setAttendanceActionMessage(null), 5000);
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    try {
      const backupData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('fotop_') || key.startsWith('materials') || key.startsWith('orders'))) {
          backupData[key] = localStorage.getItem(key);
        }
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fotop_studio_backup_${todayStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      soundManager.playSuccessSound();
      setAttendanceActionMessage('تم تنزيل النسخة الاحتياطية لبيانات الاستوديو بنجاح');
      setTimeout(() => setAttendanceActionMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('تعذر تصدير النسخة الاحتياطية');
    }
  };

  // Preset Logos/Icons for quick selection
  const presetLogos = [
    { name: 'افتراضي (كاميرا فوتوب)', url: '' },
    { name: 'عدسة فوتوغرافية', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=160&auto=format&fit=crop&q=80' },
    { name: 'استوديو كلاسيكي', url: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=160&auto=format&fit=crop&q=80' },
    { name: 'لوجو فني عصري', url: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=160&auto=format&fit=crop&q=80' }
  ];

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 3 ميغابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setStudioLogo(reader.result);
          soundManager.playSuccessSound();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL apply
  const handleApplyUrl = () => {
    if (!imageUrlInput.trim()) return;
    setStudioLogo(imageUrlInput.trim());
    setImageUrlInput('');
    soundManager.playSuccessSound();
  };

  // Save all settings to LocalStorage and dispatch global event
  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      // Save Logo
      if (studioLogo) {
        localStorage.setItem('fotop_custom_studio_logo', studioLogo);
      } else {
        localStorage.removeItem('fotop_custom_studio_logo');
      }

      // Save Studio Info
      localStorage.setItem('fotop_custom_studio_name', studioName);
      localStorage.setItem('fotop_custom_studio_tagline', studioTagline);
      localStorage.setItem('fotop_custom_studio_phone', studioPhone);
      localStorage.setItem('fotop_custom_studio_address', studioAddress);
      localStorage.setItem('fotop_custom_studio_tax', taxNumber);

      // Save Receipt Config
      localStorage.setItem('fotop_show_receipt_logo', String(showLogoOnReceipt));
      localStorage.setItem('fotop_receipt_footer', receiptFooter);
      localStorage.setItem('fotop_receipt_width', receiptWidth);
      localStorage.setItem('fotop_receipt_show_qr', String(showQrOnReceipt));
      localStorage.setItem('fotop_receipt_show_bom', String(showBomOnReceipt));

      // Save System Prefs
      localStorage.setItem('fotop_header_compact', String(compactHeader));
      localStorage.setItem('fotop_studio_open_time', studioOpenTime);
      localStorage.setItem('fotop_studio_close_time', studioCloseTime);
      localStorage.setItem('fotop_default_turnaround', defaultTurnaround);
      localStorage.setItem('fotop_tax_rate', String(taxRate));
      localStorage.setItem('fotop_low_stock_threshold', String(defaultLowStockThreshold));
      localStorage.setItem('fotop_auto_attendance_on_open', String(autoAttendanceOnOpen));

      if (soundEnabled) {
        soundManager.setMuted(false);
      } else {
        soundManager.setMuted(true);
      }

      // Notify parent & global subscribers
      if (onUpdateStudioProfile) {
        onUpdateStudioProfile(studioLogo, studioName);
      }
      window.dispatchEvent(new Event('fotop_settings_updated'));

      soundManager.playSuccessSound();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى.');
    }
  };

  // Reset to default settings
  const handleResetToDefault = () => {
    if (confirm('هل أنت متأكد من استعادة شعار وإعدادات استوديو Fotop الافتراضية؟')) {
      setStudioLogo(null);
      setStudioName('Fotop Studio');
      setStudioTagline('استوديو التصوير الاحترافي والمطبوعات');
      setStudioPhone('05 63 89 83 95');
      setStudioAddress('الشارع التجاري الرئيسي، الجزائر');
      setTaxNumber('RC: 16/00-984210B');
      setShowLogoOnReceipt(true);
      setReceiptFooter('شكراً لثقتكم باستوديو Fotop ─ نسعد بخدمتكم دائماً');
      setReceiptWidth('80mm');
      setShowQrOnReceipt(true);
      setShowBomOnReceipt(false);

      try {
        localStorage.removeItem('fotop_custom_studio_logo');
        localStorage.setItem('fotop_custom_studio_name', 'Fotop Studio');
        localStorage.setItem('fotop_custom_studio_tagline', 'استوديو التصوير الاحترافي والمطبوعات');
        localStorage.setItem('fotop_custom_studio_phone', '05 63 89 83 95');
        localStorage.setItem('fotop_custom_studio_address', 'الشارع التجاري الرئيسي، الجزائر');
        localStorage.setItem('fotop_custom_studio_tax', 'RC: 16/00-984210B');
        localStorage.setItem('fotop_show_receipt_logo', 'true');
        localStorage.setItem('fotop_receipt_footer', 'شكراً لثقتكم باستوديو Fotop ─ نسعد بخدمتكم دائماً');
        localStorage.setItem('fotop_receipt_width', '80mm');
        localStorage.setItem('fotop_receipt_show_qr', 'true');
        localStorage.setItem('fotop_receipt_show_bom', 'false');

        window.dispatchEvent(new Event('fotop_settings_updated'));
      } catch (e) {
        console.error(e);
      }

      soundManager.playClickSound();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#292A34] via-[#1F2028] to-[#17181F] text-white p-5 sm:p-7 rounded-3xl shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#E31C2B]/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E31C2B] to-[#b8121f] text-white flex items-center justify-center shadow-lg shadow-[#E31C2B]/30 shrink-0">
              <Sliders className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">إعدادات النظام وهوية الاستوديو</h1>
                <span className="bg-[#E31C2B]/20 text-[#E31C2B] border border-[#E31C2B]/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Studio Settings
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                تخصيص شعار وهوية الاستوديو، معلومات الوصولات والفواتير، خيارات الطباعة وتفضيلات النظام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {saveSuccess && (
              <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-2 rounded-xl animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم حفظ وتطبيق التغييرات بنجاح!</span>
              </div>
            )}
            <button
              onClick={() => handleSaveSettings()}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#E31C2B] hover:bg-[#c91422] text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-[#E31C2B]/30 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتطبيق التغييرات</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTabSection('branding')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTabSection === 'branding'
                ? 'bg-white text-[#292A34] shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4 text-[#E31C2B]" />
            <span>شعار وهوية الاستوديو (Logo & Branding)</span>
          </button>

          <button
            onClick={() => setActiveTabSection('receipt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTabSection === 'receipt'
                ? 'bg-white text-[#292A34] shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-500" />
            <span>تخصيص الوصولات والطباعة (Receipt & Tickets)</span>
          </button>

          <button
            onClick={() => setActiveTabSection('cash_in_hand')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTabSection === 'cash_in_hand'
                ? 'bg-white text-[#292A34] shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>الرصيد الافتتاحي للخزينة (Cash In Hand)</span>
            <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">المدير فؤاد</span>
          </button>

          <button
            onClick={() => setActiveTabSection('attendance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTabSection === 'attendance'
                ? 'bg-white text-[#292A34] shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-400" />
            <span>تسجيل دوام العمال التلقائي (Auto Attendance)</span>
            <span className="bg-[#E31C2B] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">مدير</span>
          </button>

          <button
            onClick={() => setActiveTabSection('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTabSection === 'system'
                ? 'bg-white text-[#292A34] shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>إعدادات الاستوديو والنظام (Studio & System)</span>
          </button>
        </div>
      </div>

      {/* Cash In Hand Success Toast */}
      {cashInHandMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="text-sm font-black">{cashInHandMessage}</span>
          </div>
          <button 
            onClick={() => setCashInHandMessage(null)}
            className="text-white/80 hover:text-white text-xs px-2 py-1 rounded-lg bg-emerald-700/50"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Action Notification Toast if trigger happened */}
      {attendanceActionMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
            <span className="text-sm font-black">{attendanceActionMessage}</span>
          </div>
          <button 
            onClick={() => setAttendanceActionMessage(null)}
            className="text-white/80 hover:text-white text-xs px-2 py-1 rounded-lg bg-emerald-700/50"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Side: Form Controls (8 Columns on Large Screens) */}
        <div className="lg:col-span-8 space-y-6">

          {/* ========================================================================= */}
          {/* SECTION: STORE CASH IN HAND (الرصيد الافتتاحي للخزينة لكل متجر)            */}
          {/* ========================================================================= */}
          {activeTabSection === 'cash_in_hand' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6 animate-in fade-in duration-200">
              
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold shadow-xs">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-[#292A34]">
                        تحديد الرصيد الافتتاحي للخزينة (Cash In Hand)
                      </h2>
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        المدير العام: فؤاد
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تحديد رصيد العهدة والصرف النقدي في الدرج لكل متجر على حدة في بداية اليوم، لاحتساب فروقات الخزينة ومطابقة الجرد
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAllStoresCashInHand}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>اعتماد رصيد المتجرين معاً</span>
                  </button>
                </div>
              </div>

              {/* Accounting Formula Banner */}
              <div className="bg-gradient-to-br from-slate-900 via-[#1E1F27] to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <Calculator className="w-4 h-4" />
                    <span>المعادلة المحاسبية المعتمدة لمطابقة الخزينة وحساب الفروقات:</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">نظام فوتوب المحاسبي الموحد</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <div className="text-[10px] text-slate-400 font-bold mb-1">1. الرصيد المتوقع بالخزينة (Expected Cash)</div>
                    <div className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                      الرصيد الافتتاحي (Cash In Hand) + المبيعات النقدية - المصروفات النقدية
                    </div>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <div className="text-[10px] text-slate-400 font-bold mb-1">2. فارق الخزينة عند إغلاق الوردية (Difference)</div>
                    <div className="font-mono font-bold text-amber-300 text-xs sm:text-sm">
                      النقد الفعلي في الدرج - الرصيد المتوقع (عجز ــ / فائض +)
                    </div>
                  </div>
                </div>
              </div>

              {/* TWO STORES CASH IN HAND CARDS */}
              <div className="grid grid-cols-1 gap-6">

                {/* STORE 1: FOTOP SIDI AMER */}
                <div className="border-2 border-[#E31C2B]/30 rounded-3xl p-5 bg-[#FAFAFA] hover:border-[#E31C2B] transition-all space-y-4">
                  {/* Store Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#E31C2B] text-white flex items-center justify-center font-black shadow-sm">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-[#292A34]">متجر فوتوب سيدي عامر (Fotop Sidi Amer)</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-[#E31C2B] border border-red-200">
                            الفرع الرئيسي
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          المدير: <strong className="text-slate-700">فؤاد (fouad)</strong> • العمال: أحمد، بلال، فؤاد • العملة: دينار جزائري (DZD)
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                      آخر تحديث: <strong className="text-slate-700">{sidiLastUpdated}</strong>
                    </div>
                  </div>

                  {/* Cash In Hand Input & Chips */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-6 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        الرصيد الافتتاحي اليومي للصندوق (Cash In Hand):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={sidiCashInHand}
                          onChange={(e) => setSidiCashInHand(e.target.value)}
                          placeholder="5000"
                          className="w-full bg-white border-2 border-slate-300 rounded-2xl px-4 py-3 text-lg font-mono font-black text-[#E31C2B] focus:outline-none focus:border-[#E31C2B] shadow-inner"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                          دج (DZD)
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-6 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        ملاحظات الفكة والفئات النقدية المعتمدة:
                      </label>
                      <input
                        type="text"
                        value={sidiCashNotes}
                        onChange={(e) => setSidiCashNotes(e.target.value)}
                        placeholder="فئات 200 دج و 500 دج و 1000 دج..."
                        className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#E31C2B]"
                      />
                    </div>
                  </div>

                  {/* Quick Value Presets Chips */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-[11px] font-bold text-slate-500">مبالغ شائعة:</span>
                    {[2000, 3000, 5000, 8000, 10000, 15000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSidiCashInHand(String(amt));
                          soundManager.playClickSound();
                        }}
                        className={`px-2.5 py-1 rounded-xl font-mono text-xs font-bold transition-colors cursor-pointer ${
                          sidiCashInHand === String(amt)
                            ? 'bg-[#E31C2B] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-[#E31C2B]'
                        }`}
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Live Treasury Status for Sidi Amer */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] text-slate-500 font-bold block">الافتتاحي المعتمد</span>
                      <span className="text-sm font-black font-mono text-[#E31C2B]">
                        {formatCurrency(Number(sidiCashInHand) || 0)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-50">
                      <span className="text-[10px] text-emerald-800 font-bold block">+ مبيعات نقدية لليوم</span>
                      <span className="text-sm font-black font-mono text-emerald-700">
                        +{formatCurrency(sidiCashSales)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-rose-50">
                      <span className="text-[10px] text-rose-800 font-bold block">- مصاريف نقدية لليوم</span>
                      <span className="text-sm font-black font-mono text-rose-600">
                        -{formatCurrency(sidiCashExpenses)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900 text-white">
                      <span className="text-[10px] text-slate-400 font-bold block">= المتوقع بالدرج حالياً</span>
                      <span className="text-sm font-black font-mono text-emerald-400">
                        {formatCurrency(sidiExpectedCash)}
                      </span>
                    </div>
                  </div>

                  {/* Sidi Amer Save Action */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] text-slate-500">
                      {sidiClosedShifts.length > 0 ? (
                        <span>
                          أغلقت اليوم {sidiClosedShifts.length} وردية • صافي الفروقات: {' '}
                          <strong className={sidiTotalDifference === 0 ? 'text-emerald-600' : sidiTotalDifference > 0 ? 'text-blue-600' : 'text-rose-600'}>
                            {sidiTotalDifference > 0 ? `+${formatCurrency(sidiTotalDifference)} (فائض)` : sidiTotalDifference < 0 ? `${formatCurrency(sidiTotalDifference)} (عجز)` : 'متطابق تماماً (0 دج)'}
                          </strong>
                        </span>
                      ) : (
                        <span>لا توجد ورديات مغلقة اليوم بعد في فرع سيدي عامر</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSidiCashInHand}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#E31C2B] hover:bg-[#c91422] text-white text-xs font-black rounded-xl shadow-md shadow-[#E31C2B]/20 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ واعتماد رصيد سيدي عامر</span>
                    </button>
                  </div>
                </div>


                {/* STORE 2: FOTOP LABHOUR */}
                <div className="border-2 border-blue-600/30 rounded-3xl p-5 bg-[#FAFAFA] hover:border-blue-600 transition-all space-y-4">
                  {/* Store Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-[#292A34]">متجر فوتوب الأبحور (Fotop Labhour)</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                            فرع الأبحور
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          المدير: <strong className="text-slate-700">فؤاد (fouad)</strong> • العمال: ياسين، صهيب • العملة: دينار جزائري (DZD)
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                      آخر تحديث: <strong className="text-slate-700">{labhourLastUpdated}</strong>
                    </div>
                  </div>

                  {/* Cash In Hand Input & Chips */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-6 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        الرصيد الافتتاحي اليومي للصندوق (Cash In Hand):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={labhourCashInHand}
                          onChange={(e) => setLabhourCashInHand(e.target.value)}
                          placeholder="3000"
                          className="w-full bg-white border-2 border-slate-300 rounded-2xl px-4 py-3 text-lg font-mono font-black text-blue-600 focus:outline-none focus:border-blue-600 shadow-inner"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                          دج (DZD)
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-6 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        ملاحظات الفكة والفئات النقدية المعتمدة:
                      </label>
                      <input
                        type="text"
                        value={labhourCashNotes}
                        onChange={(e) => setLabhourCashNotes(e.target.value)}
                        placeholder="فئات 100 دج و 200 دج و 500 دج..."
                        className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Quick Value Presets Chips */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-[11px] font-bold text-slate-500">مبالغ شائعة:</span>
                    {[1000, 2000, 3000, 5000, 8000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setLabhourCashInHand(String(amt));
                          soundManager.playClickSound();
                        }}
                        className={`px-2.5 py-1 rounded-xl font-mono text-xs font-bold transition-colors cursor-pointer ${
                          labhourCashInHand === String(amt)
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-600'
                        }`}
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Live Treasury Status for Labhour */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] text-slate-500 font-bold block">الافتتاحي المعتمد</span>
                      <span className="text-sm font-black font-mono text-blue-600">
                        {formatCurrency(Number(labhourCashInHand) || 0)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-50">
                      <span className="text-[10px] text-emerald-800 font-bold block">+ مبيعات نقدية لليوم</span>
                      <span className="text-sm font-black font-mono text-emerald-700">
                        +{formatCurrency(labhourCashSales)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-rose-50">
                      <span className="text-[10px] text-rose-800 font-bold block">- مصاريف نقدية لليوم</span>
                      <span className="text-sm font-black font-mono text-rose-600">
                        -{formatCurrency(labhourCashExpenses)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900 text-white">
                      <span className="text-[10px] text-slate-400 font-bold block">= المتوقع بالدرج حالياً</span>
                      <span className="text-sm font-black font-mono text-emerald-400">
                        {formatCurrency(labhourExpectedCash)}
                      </span>
                    </div>
                  </div>

                  {/* Labhour Save Action */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] text-slate-500">
                      {labhourClosedShifts.length > 0 ? (
                        <span>
                          أغلقت اليوم {labhourClosedShifts.length} وردية • صافي الفروقات: {' '}
                          <strong className={labhourTotalDifference === 0 ? 'text-emerald-600' : labhourTotalDifference > 0 ? 'text-blue-600' : 'text-rose-600'}>
                            {labhourTotalDifference > 0 ? `+${formatCurrency(labhourTotalDifference)} (فائض)` : labhourTotalDifference < 0 ? `${formatCurrency(labhourTotalDifference)} (عجز)` : 'متطابق تماماً (0 دج)'}
                          </strong>
                        </span>
                      ) : (
                        <span>لا توجد ورديات مغلقة اليوم بعد في فرع الأبحور</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveLabhourCashInHand}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ واعتماد رصيد الأبحور</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Total Combined Float Card */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">إجمالي العهدة النقدية الافتتاحية للمتجرين (سيدي عامر + الأبحور):</span>
                    <span className="text-xl font-black font-mono text-white">
                      {formatCurrency((Number(sidiCashInHand) || 0) + (Number(labhourCashInHand) || 0))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveAllStoresCashInHand}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تطبيق واعتماد رصيد المتجرين الآن</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 1: STUDIO LOGO & BRANDING                                         */}
          {/* ========================================================================= */}
          {activeTabSection === 'branding' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-50 text-[#E31C2B] rounded-xl font-bold">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#292A34]">تخصيص شعار الاستوديو (Studio & Customer Logo)</h2>
                    <p className="text-xs text-slate-500">يظهر هذا الشعار في الشريط العلوي، القائمة الجانبية، وأعلى وصولات واستلام الزبائن</p>
                  </div>
                </div>
                {studioLogo && (
                  <button
                    onClick={() => {
                      setStudioLogo(null);
                      soundManager.playClickSound();
                    }}
                    className="flex items-center gap-1 text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إزالة الشعار</span>
                  </button>
                )}
              </div>

              {/* Logo Preview & Upload Dropzone */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                {/* Logo Live Box */}
                <div className="sm:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                  <div className="w-24 h-24 rounded-2xl bg-[#292A34] text-white flex items-center justify-center shadow-lg shadow-[#E31C2B]/20 overflow-hidden relative group p-1.5 border border-slate-700">
                    {studioLogo ? (
                      <img src={studioLogo} alt="Studio Logo Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <FotopLogo className="w-full h-full" showGlow />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#292A34] block">المعاينة الحالية للشعار</span>
                    <span className="text-[10px] text-slate-400">{studioLogo ? 'شعار مخصص مفعل' : 'الشعار الافتراضي (Fotop)'}</span>
                  </div>
                </div>

                {/* Upload Action Options */}
                <div className="sm:col-span-8 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      1. تحميل صورة من جهازك (PNG, JPG, SVG, WebP)
                    </label>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#E31C2B]" />
                      <span>اختيار ملف صورة من الكمبيوتر أو الهاتف</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      2. أو وضع رابط صورة مباشر (Image URL)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="https://example.com/my-studio-logo.png"
                          className="w-full pl-3 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E31C2B] focus:border-transparent font-mono"
                        />
                        <Link className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        disabled={!imageUrlInput.trim()}
                        className="px-4 py-2 bg-[#292A34] hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        تطبيق الرابط
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Studio Information Fields */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-sm font-black text-[#292A34] flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#E31C2B]" />
                  <span>معلومات وهوية الاستوديو التجارية</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">اسم الاستوديو (Studio Name)</label>
                    <input
                      type="text"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="مثال: Fotop Studio أو استوديو الأمل"
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E31C2B] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الشعار والوصف التسويقي (Slogan / Subtitle)</label>
                    <input
                      type="text"
                      value={studioTagline}
                      onChange={(e) => setStudioTagline(e.target.value)}
                      placeholder="مثال: استوديو التصوير الاحترافي والمطبوعات"
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E31C2B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">هاتف التواصل وخدمة الزبائن (Phone)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studioPhone}
                        onChange={(e) => setStudioPhone(e.target.value)}
                        placeholder="05 63 89 83 95"
                        className="w-full pl-3 pr-8 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E31C2B] font-mono font-bold"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">عنوان ومقر الاستوديو (Address)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studioAddress}
                        onChange={(e) => setStudioAddress(e.target.value)}
                        placeholder="الشارع التجاري الرئيسي، الجزائر"
                        className="w-full pl-3 pr-8 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E31C2B]"
                      />
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">السجل التجاري / الرقم الضريبي (RC / NIF - اختياري)</label>
                    <input
                      type="text"
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      placeholder="RC: 16/00-984210B / NIF: 099812450124"
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E31C2B] font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: RECEIPT & PRINTING SETTINGS                                    */}
          {/* ========================================================================= */}
          {activeTabSection === 'receipt' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#292A34]">تخصيص وصولات الزبائن وتذاكر الاستلام</h2>
                  <p className="text-xs text-slate-500">التحكم في تصميم التذكرة المطبوعة الحرارية وبيانات الاستوديو</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Logo On Receipt Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 text-[#E31C2B] flex items-center justify-center font-bold">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#292A34] block">طباعة شعار الاستوديو أعلى وصل الزبون</span>
                      <span className="text-[11px] text-slate-500">إظهار اللوجو المخصص في تذكرة الاستلام الحرارية</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showLogoOnReceipt} 
                      onChange={(e) => setShowLogoOnReceipt(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E31C2B]"></div>
                  </label>
                </div>

                {/* Paper Size Format */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">نوع وطابعات الإيصال المدعومة (Paper Format)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: '80mm', label: 'طابعة حرارية 80mm', desc: 'القياسي للطابعات الحرارية السريعة POS' },
                      { id: '58mm', label: 'طابعة حرارية 58mm', desc: 'الطابعات الصغيرة والمحمولة' },
                      { id: 'a5', label: 'ورق قياسي A5 / A4', desc: 'فواتير كاملة للمؤسسات' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setReceiptWidth(f.id as any)}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          receiptWidth === f.id
                            ? 'border-[#E31C2B] bg-red-50/50 text-[#292A34] ring-2 ring-[#E31C2B]/20 font-black'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold text-xs block">{f.label}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* QR Code Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#292A34] block">إظهار كود الاستلام والتحقق السريع (QR Code)</span>
                      <span className="text-[11px] text-slate-500">يمكّن الزبون أو العامل من مسح الباركود لمتابعة حالة الصور فوراً</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showQrOnReceipt} 
                      onChange={(e) => setShowQrOnReceipt(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E31C2B]"></div>
                  </label>
                </div>

                {/* Receipt Footer Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رسالة الشكر أسفل وصل الزبون (Receipt Footer Note)
                  </label>
                  <textarea
                    rows={2}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="شكراً لثقتكم باستوديو Fotop ─ نسعد بخدمتكم دائماً"
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E31C2B]"
                  />
                  <span className="text-[10px] text-slate-400">تظهر هذه العبارة في أسفل الوصل المطبوع المقدم للزبون</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: MANAGER AUTO ATTENDANCE CONTROL                                   */}
          {/* ========================================================================= */}
          {activeTabSection === 'attendance' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-[#292A34]">تسجيل دوام وحضور العمال التلقائي</h2>
                      <span className="bg-[#E31C2B] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        لوحة تحكم المدير
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      بداء وإيقاف تسجيل الدوام لجميع عمال الاستوديو تلقائياً دون الحاجة لتسجيل كل عامل يدوياً
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>تاريخ اليوم: {todayStr}</span>
                </div>
              </div>

              {/* Status KPI Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block">إجمالي العمال المسجلين</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xl font-black text-[#292A34] font-mono">{allStaff.length}</span>
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 block">الحاضرون حالياً (مسجل دوامهم اليوم)</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xl font-black text-emerald-700 font-mono">{activeClockedInStaffIds.size}</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 block">لم يسجل دوامهم بعد اليوم</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xl font-black text-amber-700 font-mono">
                      {Math.max(0, allStaff.length - activeClockedInStaffIds.size)}
                    </span>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>

              {/* MANAGER ACTION BUTTONS: AUTO CLOCK-IN ALL & AUTO CLOCK-OUT ALL */}
              <div className="bg-gradient-to-br from-slate-900 via-[#292A34] to-slate-800 text-white p-5 rounded-3xl shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                    <span className="font-black text-sm">أوامر التشغيل السريع للدوام (One-Click Operations)</span>
                  </div>
                  <span className="text-[11px] text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                    إشراف وإدارة فورية
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Primary Button: Auto Clock-In All Staff */}
                  <button
                    type="button"
                    disabled={isAutoClocking}
                    onClick={handleTriggerAutoClockIn}
                    className="flex flex-col items-center justify-center p-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer border border-emerald-400/40 text-center group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                      <span className="font-black text-sm sm:text-base">
                        {isAutoClocking ? 'جاري تسجيل دوام العمال...' : 'بدء تسجيل دوام جميع العمال تلقائياً'}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-100 font-medium">
                      تسجيل حضور فوري لكافة عمال الاستوديو غير المسجلين اليوم
                    </span>
                  </button>

                  {/* Secondary Button: Auto Clock-Out All Clocked-in Staff */}
                  <button
                    type="button"
                    disabled={isAutoClocking || activeClockedInStaffIds.size === 0}
                    onClick={handleTriggerAutoClockOut}
                    className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-rose-900/60 active:scale-98 text-white rounded-2xl shadow-md transition-all cursor-pointer border border-slate-700 hover:border-rose-500/50 text-center group disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <LogOut className="w-5 h-5 text-rose-400" />
                      <span className="font-black text-sm sm:text-base text-rose-200 group-hover:text-white">
                        إنهاء دوام جميع العمال الحاضرين
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      يحسب ساعات العمل الإجمالية ويقفل وردية الحضور للجميع
                    </span>
                  </button>
                </div>
              </div>

              {/* Individual Staff Attendance Status List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#292A34] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#E31C2B]" />
                    <span>قائمة عمال الاستوديو وحالة دوامهم اليوم</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    يمكن للمدير أيضاً تبديل حالة دوام أي عامل فردياً
                  </span>
                </div>

                <div className="space-y-2">
                  {allStaff.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      لا يوجد عمال مسجلين
                    </div>
                  ) : (
                    allStaff.map(worker => {
                      const isClockedIn = activeClockedInStaffIds.has(worker.id);
                      const todayRecord = (attendanceLogs || []).find(
                        a => a.staffId === worker.id && a.date === todayStr && a.status === 'clocked_in'
                      );

                      return (
                        <div
                          key={worker.id}
                          className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200 rounded-2xl transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#292A34] to-slate-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                              {worker.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-xs text-[#292A34]">{worker.name}</span>
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                                  {worker.role === 'manager' ? 'مدير الاستوديو' : 'عامل استوديو'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                {isClockedIn ? (
                                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                    حاضر الآن ─ وقت الدخول: {todayRecord?.clockIn ? new Date(todayRecord.clockIn).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : 'مسجل'}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">غير مسجل حالياً</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isClockedIn ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onClockOutStaff) {
                                    onClockOutStaff(worker.id);
                                  } else {
                                    api.clockOut(worker.id);
                                  }
                                  soundManager.playClickSound();
                                  setAttendanceActionMessage(`تم تسجيل خروج العامل: ${worker.name}`);
                                  setTimeout(() => setAttendanceActionMessage(null), 4000);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 hover:bg-rose-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>تسجيل خروج</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onClockInStaff) {
                                    onClockInStaff(worker.id, worker.name);
                                  } else {
                                    api.clockIn(worker.id, worker.name);
                                  }
                                  soundManager.playSuccessSound();
                                  setAttendanceActionMessage(`تم تسجيل دوام العامل: ${worker.name}`);
                                  setTimeout(() => setAttendanceActionMessage(null), 4000);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>تسجيل دخول</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Automatic Attendance Automation Settings */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Timer className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-xs text-[#292A34] block">
                        تسجيل الدوام التلقائي عند فتح الاستوديو (Auto Attendance on Open)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        تسجيل حضور جميع العمال تلقائياً فور بدء أول وردية أو تسجيل أول عملية بيع باليوم
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={autoAttendanceOnOpen} 
                      onChange={(e) => setAutoAttendanceOnOpen(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: SYSTEM PREFERENCES & AUDIO                                     */}
          {/* ========================================================================= */}
          {activeTabSection === 'system' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#292A34]">إعدادات الاستوديو والنظام والمؤثرات</h2>
                  <p className="text-xs text-slate-500">أوقات العمل، مواعيد التسليم، الضرائب، التنبيهات، والنسخ الاحتياطي</p>
                </div>
              </div>

              {/* Extra Studio Settings Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    أوقات فتح وغلق الاستوديو اليومية (Operating Hours)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block mb-0.5">ساعة الفتح:</span>
                      <input 
                        type="time" 
                        value={studioOpenTime}
                        onChange={(e) => setStudioOpenTime(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block mb-0.5">ساعة الإغلاق:</span>
                      <input 
                        type="time" 
                        value={studioCloseTime}
                        onChange={(e) => setStudioCloseTime(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-xl font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وقت تسليم الطلبات والصور الافتراضي للزبون
                  </label>
                  <select
                    value={defaultTurnaround}
                    onChange={(e) => setDefaultTurnaround(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-[#292A34]"
                  >
                    <option value="15m">15 دقيقة (صور جواز وبطاقة سريعة)</option>
                    <option value="30m">30 دقيقة (طباعة قياسية)</option>
                    <option value="1h">ساعة واحدة</option>
                    <option value="3h">3 ساعات (تعديل فوتوشوب متقدم)</option>
                    <option value="same_day">نفس اليوم قبل الإغلاق</option>
                    <option value="24h">24 ساعة (ألبومات ومناسبات)</option>
                  </select>
                  <span className="text-[10px] text-slate-400">يظهر تلقائياً في خانة موعد التسليم عند إنشاء تذكرة طلب جديدة</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نسبة الضريبة / الرسم الإضافي (TVA / Tax Rate %)
                  </label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-[#292A34] font-mono"
                  >
                    <option value="0">0% (معفى من الضريبة)</option>
                    <option value="9">9% (نسبة مخفضة)</option>
                    <option value="19">19% (النسبة العادية TVA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    حد تنبيه انخفاض المخزون الافتراضي للمواد
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={defaultLowStockThreshold}
                    onChange={(e) => setDefaultLowStockThreshold(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">يطلق تنبيهاً باللون الأحمر عند نزول كمية ورق الصور أو الحبر عن هذا الحد</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Audio sound effects toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#292A34] block">المؤثرات الصوتية التفاعلية (Sound Effects)</span>
                      <span className="text-[11px] text-slate-500">تشغيل نغمات تأكيد البيع الناجح، تنبيهات المخزون المنخفض، وأصوات النقر</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={soundEnabled} 
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setSoundEnabled(enabled);
                        soundManager.setMuted(!enabled);
                        if (enabled) soundManager.playSuccessSound();
                      }}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Compact Header Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#292A34] block">وضع الهيدر المصغر (Compact Header Mode)</span>
                      <span className="text-[11px] text-slate-500">تقليص ارتفاع الشريط العلوي لتوفير أقصى مساحة عرض لشاشة البيع</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={compactHeader} 
                      onChange={(e) => setCompactHeader(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#292A34]"></div>
                  </label>
                </div>

                {/* Data Backup & Export Action */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-md">
                  <div>
                    <span className="font-bold text-xs block">نسخ احتياطي لكافة بيانات وإعدادات الاستوديو</span>
                    <span className="text-[11px] text-slate-400">تصدير ملف JSON يحتوي على سجلات الإعدادات والزبائن والمخزون</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تنزيل نسخة احتياطية</span>
                  </button>
                </div>

                {/* Reset Defaults Action */}
                <div className="p-4 bg-red-50/50 rounded-2xl border border-red-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-red-900 block">استعادة الإعدادات والشعار الافتراضي</span>
                    <span className="text-[11px] text-red-600">إعادة ضبط اسم الاستوديو والشعار والنصوص إلى الوضع الافتراضي لـ Fotop</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-3.5 py-2 bg-white text-red-700 border border-red-300 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الافتراضي</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Dynamic Context (Cash In Hand Summary or Receipt Mockup) */}
        <div className="lg:col-span-4 space-y-4">
          {activeTabSection === 'cash_in_hand' ? (
            <div className="space-y-4">
              {/* Executive Summary Card */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    <span className="font-black text-sm">موقف الخزينة اللحظي للمتجرين</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    مباشر (Live)
                  </span>
                </div>

                {/* Sidi Amer Widget */}
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#E31C2B]"></span>
                      سيدي عامر (الفرع الرئيسي)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">الافتتاحي: {formatCurrency(Number(sidiCashInHand) || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
                    <span className="text-slate-400">المتوقع بالدرج:</span>
                    <span className="font-mono font-black text-emerald-400">{formatCurrency(sidiExpectedCash)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">فروقات الجرد:</span>
                    <span className={`font-mono font-bold ${sidiTotalDifference === 0 ? 'text-slate-300' : sidiTotalDifference > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                      {sidiTotalDifference === 0 ? '0 دج (مطابق)' : sidiTotalDifference > 0 ? `+${formatCurrency(sidiTotalDifference)} (فائض)` : `${formatCurrency(sidiTotalDifference)} (عجز)`}
                    </span>
                  </div>
                </div>

                {/* Labhour Widget */}
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      الأبحور (فرع الأبحور)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">الافتتاحي: {formatCurrency(Number(labhourCashInHand) || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
                    <span className="text-slate-400">المتوقع بالدرج:</span>
                    <span className="font-mono font-black text-emerald-400">{formatCurrency(labhourExpectedCash)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">فروقات الجرد:</span>
                    <span className={`font-mono font-bold ${labhourTotalDifference === 0 ? 'text-slate-300' : labhourTotalDifference > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                      {labhourTotalDifference === 0 ? '0 دج (مطابق)' : labhourTotalDifference > 0 ? `+${formatCurrency(labhourTotalDifference)} (فائض)` : `${formatCurrency(labhourTotalDifference)} (عجز)`}
                    </span>
                  </div>
                </div>

                {/* Combined Total */}
                <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 text-center">
                  <span className="text-[11px] text-emerald-300 block font-bold">إجمالي النقد المتوقع في كلا المتجرين:</span>
                  <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
                    {formatCurrency(sidiExpectedCash + labhourExpectedCash)}
                  </span>
                </div>
              </div>

              {/* Cashier Control & Guidelines Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#E31C2B]" />
                  <span>إجراءات الرقابة المالية للمدير فؤاد</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span><strong>عد الفكة:</strong> يُلزم الكاشير بعد الفكة النقدية عند فتح الوردية ومطابقتها مع الرصيد الافتتاحي المحدد أعلاه.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span><strong>إغلاق الصندوق:</strong> يُحسب الفارق آلياً فور إدخال النقد الفعلي عند نهاية الوردية ويوثق بالسجلات.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span><strong>ترحيل الفروقات:</strong> أي عجز أو زيادة تُسجل في تقرير الأرباح اليومي مع ذكر اسم العامل المسؤول.</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-md border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-[#E31C2B]" />
                  <span className="font-bold text-xs">معاينة الوصل المطبوع (Live Ticket)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{receiptWidth}</span>
              </div>

              {/* Thermal Ticket Replica */}
              <div className="bg-white text-[#292A34] p-4 rounded-2xl border border-slate-300 font-sans shadow-inner text-xs space-y-3">
                {/* Header with Logo */}
                <div className="text-center pb-2.5 border-b border-dashed border-slate-300">
                  {showLogoOnReceipt && (
                    <div className="flex justify-center mb-1.5">
                      {studioLogo ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-xs border border-slate-200">
                          <img src={studioLogo} alt="Receipt Logo" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <FotopLogo className="w-12 h-12" />
                      )}
                    </div>
                  )}
                  <div className="font-black text-sm text-[#292A34]">{studioName}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{studioTagline}</div>
                  <div className="text-[9px] text-slate-600 font-mono mt-0.5">هاتف: {studioPhone}</div>
                  <div className="text-[9px] text-slate-400 font-mono">{studioAddress}</div>
                </div>

                {/* Sample Ticket Number */}
                <div className="bg-slate-100 p-2 rounded-xl text-center border border-slate-200">
                  <div className="text-[9px] text-slate-500 font-bold">تذكرة تسليم الصور</div>
                  <div className="text-lg font-black text-[#E31C2B] font-mono">FTP-1088</div>
                  <div className="text-[10px] text-emerald-800 font-bold">استلام فوري (15 دقيقة)</div>
                </div>

                {/* Customer Sample */}
                <div className="text-[11px] space-y-1 py-1 border-b border-dashed border-slate-300 text-slate-600">
                  <div className="flex justify-between">
                    <span>الزبون:</span>
                    <span className="font-bold text-[#292A34]">سفيان علام</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>المجموع:</span>
                    <span className="font-bold text-slate-900">800 د.ج</span>
                  </div>
                </div>

                {/* QR Code */}
                {showQrOnReceipt && (
                  <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                    <QrCode className="w-6 h-6 text-[#292A34]" />
                    <span className="text-[9px] font-mono font-bold text-slate-600">FOTOP VERIFIED</span>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center pt-1 text-[9px] text-slate-500 leading-tight">
                  {receiptFooter}
                </div>
              </div>
            </div>
          )}

          {/* Quick POS Shortcut */}
          {onGoToPOS && (
            <button
              onClick={onGoToPOS}
              className="w-full flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-50 text-[#292A34] rounded-2xl border border-slate-200 font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#E31C2B]" />
              <span>الذهاب إلى نقطة البيع (POS) وتجربة الوصل</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
