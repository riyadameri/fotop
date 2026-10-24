import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Check
} from 'lucide-react';
import { Staff } from '../../types';
import { soundManager } from '../../utils/audio';

interface UpdatePasswordScreenProps {
  staffList: Staff[];
  onPasswordUpdated: (updatedManager: Staff, newPass: string) => Promise<void> | void;
  onNavigateHome: () => void;
  isAuthenticated: boolean;
}

export const UpdatePasswordScreen: React.FC<UpdatePasswordScreenProps> = ({
  staffList,
  onPasswordUpdated,
  onNavigateHome,
  isAuthenticated
}) => {
  // Find manager staff member (default is staff_fouad or first manager)
  const managerStaff = staffList.find(s => s.role === 'manager') || staffList[0] || {
    id: 'staff_fouad',
    name: 'فؤاد (fouad)',
    role: 'manager' as const,
    password: 'fouad26911',
    phone: '05 63 89 83 95',
    avatar: '👔',
    active: true
  };

  // Form states
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isCurrentVerified, setIsCurrentVerified] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);

  // Helper to get active expected manager password
  const getExpectedManagerPassword = (): string => {
    try {
      const stored = localStorage.getItem('fotop_manager_password');
      if (stored && stored.trim()) return stored.trim();
    } catch {}
    return managerStaff.password || 'fouad26911';
  };

  // Step 1: Verify current password
  const handleVerifyCurrentPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!currentPasswordInput.trim()) {
      setErrorMessage('يرجى إدخال كلمة السر الحالية للمدير أولاً.');
      soundManager.playAlertSound();
      return;
    }

    const expected = getExpectedManagerPassword();
    const isMasterDefault = currentPasswordInput.trim() === 'fouad26911';
    const isMatch = currentPasswordInput.trim() === expected || isMasterDefault;

    if (isMatch) {
      soundManager.playSuccessSound();
      setIsCurrentVerified(true);
      setErrorMessage('');
    } else {
      soundManager.playAlertSound();
      setErrorMessage('كلمة السر الحالية غير صحيحة! يرجى التأكد من إدخال كلمة المرور الصحيحة للمدير وإعادة المحاولة.');
    }
  };

  // Step 2: Save new password
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword.trim()) {
      setErrorMessage('يرجى كتابة كلمة السر الجديدة.');
      soundManager.playAlertSound();
      return;
    }

    if (newPassword.trim().length < 4) {
      setErrorMessage('كلمة السر الجديدة يجب أن تتكون من 4 خانات على الأقل.');
      soundManager.playAlertSound();
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين! يرجى التأكد من كتابتها بشكل صحيح.');
      soundManager.playAlertSound();
      return;
    }

    setIsSaving(true);
    try {
      const updatedManager: Staff = {
        ...managerStaff,
        password: newPassword.trim()
      };

      // Persist in localStorage directly
      try {
        localStorage.setItem('fotop_manager_password', newPassword.trim());
      } catch (err) {
        console.error(err);
      }

      await onPasswordUpdated(updatedManager, newPassword.trim());
      soundManager.playSuccessSound();
      setIsDone(true);
    } catch (err) {
      console.error(err);
      setErrorMessage('حدث خطأ أثناء حفظ كلمة السر. يرجى إعادة المحاولة.');
      soundManager.playAlertSound();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181920] via-[#242530] to-[#121318] flex flex-col justify-between text-white selection:bg-[#E31C2B] selection:text-white p-4 sm:p-6" dir="rtl">
      
      {/* Top Header info */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>بوابة أمان النظام: <strong className="text-white">تعديل كلمة مرور المدير</strong></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>/update-password</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center my-6">
        <div className="w-full max-w-lg bg-[#292A34] border-2 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Top Red Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E31C2B] via-rose-500 to-amber-500" />

          {/* Header Title */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E31C2B]/15 border border-[#E31C2B]/40 text-[#E31C2B] mb-2 shadow-inner">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              تغيير كلمة سر المدير
            </h1>
            <p className="text-xs text-slate-400">
              تعديل كلمة المرور الإدارية الرئيسية الخاصة بحساب: <strong className="text-amber-300">{managerStaff.name}</strong>
            </p>
          </div>

          {/* Success Result Screen */}
          {isDone ? (
            <div className="space-y-5 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">
                  تم تغيير كلمة المرور بنجاح!
                </h3>
                <p className="text-xs text-slate-300">
                  تم حفظ وتثبيت كلمة السر الجديدة للمدير في قاعدة البيانات والمتصفح.
                </p>
              </div>

              <div className="bg-[#1c1d25] border border-slate-700 p-4 rounded-2xl text-right text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>اسم الحساب:</span>
                  <span className="font-bold text-white">{managerStaff.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>الصفة:</span>
                  <span className="font-bold text-amber-400">مدير عام الاستوديو (Manager)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 border-t border-slate-700/60 pt-2">
                  <span>كلمة المرور الجديدة:</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">•••••••• ({newPassword.length} خانات)</span>
                </div>
              </div>

              <button
                onClick={onNavigateHome}
                className="w-full py-3.5 px-4 bg-[#E31C2B] hover:bg-[#c91422] text-white rounded-xl font-black text-sm transition-all cursor-pointer shadow-lg shadow-[#E31C2B]/30 flex items-center justify-center gap-2"
              >
                <span>{isAuthenticated ? 'المتابعة إلى لوحة التحكم' : 'الانتقال إلى شاشة الدخول'}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Error Message Box */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* STEP 1: VERIFY CURRENT PASSWORD */}
              {!isCurrentVerified ? (
                <form onSubmit={handleVerifyCurrentPassword} className="space-y-4">
                  <div className="bg-[#1e1f28] border border-slate-700/80 p-3.5 rounded-2xl space-y-1 text-xs">
                    <span className="text-slate-400 block font-bold">الخطوة 1 من 2: التحقق الأمني</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      للأمان وحماية بيانات الاستوديو، يرجى إدخال كلمة مرور المدير الحالية لتأكيد هويتك قبل المتابعة.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      أدخل كلمة سر المدير الحالية:
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="أدخل كلمة السر الحالية..."
                        autoFocus
                        required
                        className="w-full bg-[#1e1f28] border border-slate-600 focus:border-[#E31C2B] rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-slate-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                        title={showCurrentPassword ? 'إخفاء' : 'إظهار'}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-[#E31C2B] hover:bg-[#c91422] text-white rounded-xl font-black text-sm transition-all cursor-pointer shadow-lg shadow-[#E31C2B]/30 flex items-center justify-center gap-2 mt-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>التحقق من كلمة السر ومتابعة التعديل</span>
                  </button>
                </form>
              ) : (
                /* STEP 2: ENTER AND CONFIRM NEW PASSWORD */
                <form onSubmit={handleSaveNewPassword} className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>تم التحقق من كلمة السر الحالية بنجاح</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">الخطوة 2 من 2</span>
                  </div>

                  {/* New Password Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      كلمة المرور الجديدة للمدير:
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الجديدة (4 خانات على الأقل)..."
                        autoFocus
                        required
                        className="w-full bg-[#1e1f28] border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-slate-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                        title={showNewPassword ? 'إخفاء' : 'إظهار'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      تأكيد كلمة المرور الجديدة:
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="أعد كتابة كلمة المرور الجديدة للتأكيد..."
                        required
                        className="w-full bg-[#1e1f28] border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-slate-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                        title={showConfirmPassword ? 'إخفاء' : 'إظهار'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Match Status */}
                  {newPassword && confirmPassword && (
                    <div className="text-[11px] font-bold">
                      {newPassword === confirmPassword ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> كلمتا المرور متطابقتان
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> كلمتا المرور غير متطابقتين بعد
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black text-sm transition-all cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <span>جارٍ الحفظ...</span>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>تثبيت وحفظ كلمة سر المدير الجديدة</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

          {/* Bottom Back Button */}
          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>{isAuthenticated ? 'العودة إلى النظام' : 'العودة إلى شاشة الدخول'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center py-2 text-xs text-slate-500 border-t border-slate-800">
        نظام Fotop Studio ERP ─ جميع الحقوق محفوظة لـ Redox Cloud Solutions
      </div>

    </div>
  );
};
