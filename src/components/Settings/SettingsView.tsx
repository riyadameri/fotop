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
  AlertCircle
} from 'lucide-react';
import { soundManager } from '../../utils/audio';
import { Staff } from '../../types';

interface SettingsViewProps {
  currentStaff: Staff;
  onUpdateStudioProfile?: (logo: string | null, name: string) => void;
  onGoToPOS?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentStaff,
  onUpdateStudioProfile,
  onGoToPOS
}) => {
  const isManager = currentStaff?.role === 'manager';

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

  // URL input state
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTabSection, setActiveTabSection] = useState<'branding' | 'receipt' | 'system'>('branding');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
            onClick={() => setActiveTabSection('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTabSection === 'system'
                ? 'bg-white text-[#292A34] shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>تفضيلات النظام والأصوات (Preferences)</span>
          </button>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Side: Form Controls (8 Columns on Large Screens) */}
        <div className="lg:col-span-8 space-y-6">

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
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#E31C2B] to-[#b8121f] text-white flex items-center justify-center shadow-lg shadow-[#E31C2B]/20 overflow-hidden relative group">
                    {studioLogo ? (
                      <img src={studioLogo} alt="Studio Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-10 h-10 stroke-[2.2]" />
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
          {/* SECTION 3: SYSTEM PREFERENCES & AUDIO                                     */}
          {/* ========================================================================= */}
          {activeTabSection === 'system' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#292A34]">تفضيلات الواجهة والأصوات التفاعلية</h2>
                  <p className="text-xs text-slate-500">التحكم في المؤثرات الصوتية، وضع الشريط العلوي، وإدارة البيانات</p>
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

        {/* Right Side: Live Interactive Receipt Mockup (4 Columns on Large Screens) */}
        <div className="lg:col-span-4 space-y-4">
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
                      <div className="px-2.5 py-1 bg-[#E31C2B] text-white rounded-lg inline-block font-black text-xs shadow-xs">
                        📸 {studioName}
                      </div>
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
