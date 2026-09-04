import React, { useState, useMemo } from 'react';
import { Staff, SalaryPayment, SalaryPaymentType, SalaryPaymentMethod, AttendanceRecord, Expense } from '../../types';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  CreditCard, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Printer, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  CheckCircle2, 
  UserCheck, 
  Wallet, 
  ArrowUpRight, 
  ChevronDown, 
  Sparkles, 
  AlertCircle,
  Clock3,
  Receipt,
  FileText,
  BadgePercent,
  Sliders,
  X
} from 'lucide-react';
import { exportToCSV, formatCurrency, formatDate, formatTime } from '../../utils/formatters';

interface HumanResourcesViewProps {
  allStaff: Staff[];
  salaryPayments: SalaryPayment[];
  attendanceLogs: AttendanceRecord[];
  currentStaff: Staff;
  onUpdateStaff: (staff: Staff) => void;
  onAddSalaryPayment: (payment: Partial<SalaryPayment> & { recordAsStudioExpense?: boolean }) => Promise<void>;
  onUpdateSalaryPayment: (id: string, payment: Partial<SalaryPayment>) => Promise<void>;
  onDeleteSalaryPayment: (id: string) => Promise<void>;
  onAddExpense?: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onAddManualAttendance?: (record: Partial<AttendanceRecord>) => void;
  onDeleteAttendance?: (id: string) => void;
}

export const HumanResourcesView: React.FC<HumanResourcesViewProps> = ({
  allStaff = [],
  salaryPayments = [],
  attendanceLogs = [],
  currentStaff,
  onUpdateStaff,
  onAddSalaryPayment,
  onUpdateSalaryPayment,
  onDeleteSalaryPayment,
  onAddManualAttendance,
  onDeleteAttendance
}) => {
  const isManager = currentStaff.role === 'manager';

  // Active sub-view tab: 'roster' (قائمة الموظفين والرواتب), 'payments' (سجل المدفوعات), 'attendance' (سجل الدوام الاسترشادي)
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'payments' | 'attendance'>('roster');

  // Search and filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM

  // Modal: New Salary Payment
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [payStaffId, setPayStaffId] = useState<string>(allStaff.find(s => s.role === 'worker')?.id || allStaff[0]?.id || '');
  const [paymentType, setPaymentType] = useState<SalaryPaymentType>('monthly');
  const [periodDate, setPeriodDate] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM or YYYY-MM-DD
  const [baseAmount, setBaseAmount] = useState<string>('30000');
  const [bonusAmount, setBonusAmount] = useState<string>('0');
  const [deductionAmount, setDeductionAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<SalaryPaymentMethod>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [recordAsStudioExpense, setRecordAsStudioExpense] = useState<boolean>(true);
  const [isSubmittingPay, setIsSubmittingPay] = useState<boolean>(false);

  // Modal: Edit Salary Payment
  const [editingPayment, setEditingPayment] = useState<SalaryPayment | null>(null);
  const [editPaymentType, setEditPaymentType] = useState<SalaryPaymentType>('monthly');
  const [editPeriodDate, setEditPeriodDate] = useState<string>('');
  const [editBaseAmount, setEditBaseAmount] = useState<string>('0');
  const [editBonusAmount, setEditBonusAmount] = useState<string>('0');
  const [editDeductionAmount, setEditDeductionAmount] = useState<string>('0');
  const [editPaymentMethod, setEditPaymentMethod] = useState<SalaryPaymentMethod>('cash');
  const [editNotes, setEditNotes] = useState<string>('');

  // Modal: Edit Worker Base Rates
  const [editingRatesStaff, setEditingRatesStaff] = useState<Staff | null>(null);
  const [staffMonthlySalary, setStaffMonthlySalary] = useState<string>('35000');
  const [staffDailyRate, setStaffDailyRate] = useState<string>('2000');
  const [staffHourlyRate, setStaffHourlyRate] = useState<string>('250');
  const [staffOvertimeRate, setStaffOvertimeRate] = useState<string>('350');

  // Modal: Payslip Voucher Print
  const [printingPayment, setPrintingPayment] = useState<SalaryPayment | null>(null);

  // Modal: Manual Attendance
  const [showManualAttendanceModal, setShowManualAttendanceModal] = useState<boolean>(false);
  const [manualStaffId, setManualStaffId] = useState<string>(allStaff[0]?.id || '');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualHours, setManualHours] = useState<string>('8');
  const [manualNotes, setManualNotes] = useState<string>('ساعات عمل موثقة');

  // Success Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper when changing staff or payment type in create modal
  const handleSelectStaffForPay = (staffId: string) => {
    setPayStaffId(staffId);
    const target = allStaff.find(s => s.id === staffId);
    if (!target) return;

    if (paymentType === 'monthly') {
      const base = target.monthlySalaryBase || (target.hourlyRate ? target.hourlyRate * 8 * 26 : 30000);
      setBaseAmount(String(base));
    } else if (paymentType === 'daily') {
      const daily = target.dailyRate || (target.hourlyRate ? target.hourlyRate * 8 : 2000);
      setBaseAmount(String(daily));
    }
  };

  const handleChangePaymentType = (type: SalaryPaymentType) => {
    setPaymentType(type);
    const target = allStaff.find(s => s.id === payStaffId);
    if (type === 'monthly') {
      setPeriodDate(new Date().toISOString().substring(0, 7)); // YYYY-MM
      if (target) {
        setBaseAmount(String(target.monthlySalaryBase || 35000));
      }
    } else if (type === 'daily') {
      setPeriodDate(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
      if (target) {
        setBaseAmount(String(target.dailyRate || 2000));
      }
    } else if (type === 'advance') {
      setPeriodDate(new Date().toISOString().split('T')[0]);
      setBaseAmount('5000');
    } else if (type === 'bonus') {
      setPeriodDate(new Date().toISOString().split('T')[0]);
      setBaseAmount('0');
      setBonusAmount('5000');
    }
  };

  // Calculate live net in modal
  const currentCalculatedNet = useMemo(() => {
    const base = Number(baseAmount) || 0;
    const bonus = Number(bonusAmount) || 0;
    const ded = Number(deductionAmount) || 0;
    return Math.max(0, base + bonus - ded);
  }, [baseAmount, bonusAmount, deductionAmount]);

  const editCalculatedNet = useMemo(() => {
    const base = Number(editBaseAmount) || 0;
    const bonus = Number(editBonusAmount) || 0;
    const ded = Number(editDeductionAmount) || 0;
    return Math.max(0, base + bonus - ded);
  }, [editBaseAmount, editBonusAmount, editDeductionAmount]);

  // Submit New Payment
  const handleSubmitNewPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStaff = allStaff.find(s => s.id === payStaffId);
    if (!targetStaff) return;

    if (currentCalculatedNet <= 0 && Number(baseAmount) <= 0 && Number(bonusAmount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح للدفعة');
      return;
    }

    setIsSubmittingPay(true);
    try {
      await onAddSalaryPayment({
        staffId: targetStaff.id,
        staffName: targetStaff.name,
        paymentType,
        periodDate,
        paymentDate: new Date().toISOString(),
        baseAmount: Number(baseAmount) || 0,
        bonusAmount: Number(bonusAmount) || 0,
        deductionAmount: Number(deductionAmount) || 0,
        netPaidAmount: currentCalculatedNet,
        paymentMethod,
        paidByStaffId: currentStaff.id,
        paidByStaffName: currentStaff.name,
        notes: paymentNotes,
        recordAsStudioExpense
      });

      setShowPaymentModal(false);
      setPaymentNotes('');
      setBonusAmount('0');
      setDeductionAmount('0');
      showToast(`تم دفع المستحق المالي بنجاح للموظف: ${targetStaff.name} بمبلغ ${formatCurrency(currentCalculatedNet)}`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ عملية الدفع');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Submit Edit Payment
  const handleSubmitEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    try {
      await onUpdateSalaryPayment(editingPayment.id, {
        paymentType: editPaymentType,
        periodDate: editPeriodDate,
        baseAmount: Number(editBaseAmount) || 0,
        bonusAmount: Number(editBonusAmount) || 0,
        deductionAmount: Number(editDeductionAmount) || 0,
        netPaidAmount: editCalculatedNet,
        paymentMethod: editPaymentMethod,
        notes: editNotes,
      });

      setEditingPayment(null);
      showToast('تم تعديل بيانات الدفعة والمبلغ بنجاح');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تعديل الدفعة');
    }
  };

  // Delete Payment Handler
  const handleDeletePayment = async (pay: SalaryPayment) => {
    if (window.confirm(`هل أنت متأكد من حذف دفعة الراتب رقم ${pay.receiptNumber} الخاصة بالموظف "${pay.staffName}" بمبلغ ${formatCurrency(pay.netPaidAmount)}؟`)) {
      try {
        await onDeleteSalaryPayment(pay.id);
        showToast('تم حذف سجل الدفعة بنجاح');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Save staff base rates
  const handleSaveStaffRates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRatesStaff) return;

    const updated: Staff = {
      ...editingRatesStaff,
      monthlySalaryBase: Number(staffMonthlySalary) || undefined,
      dailyRate: Number(staffDailyRate) || undefined,
      hourlyRate: Number(staffHourlyRate) || undefined,
      overtimeHourlyRate: Number(staffOvertimeRate) || undefined,
    };

    onUpdateStaff(updated);
    setEditingRatesStaff(null);
    showToast(`تم تحديث شروط الراتب والأجر للموظف: ${updated.name}`);
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return (salaryPayments || []).filter(p => {
      // Staff filter
      if (selectedStaffFilter !== 'all' && p.staffId !== selectedStaffFilter) return false;
      // Type filter
      if (selectedTypeFilter !== 'all' && p.paymentType !== selectedTypeFilter) return false;
      // Month filter (matches periodDate or paymentDate)
      if (selectedMonthFilter) {
        const matchesPeriod = p.periodDate && p.periodDate.startsWith(selectedMonthFilter);
        const matchesPayment = p.paymentDate && p.paymentDate.startsWith(selectedMonthFilter);
        if (!matchesPeriod && !matchesPayment) return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.staffName?.toLowerCase().includes(q);
        const matchReceipt = p.receiptNumber?.toLowerCase().includes(q);
        const matchNotes = p.notes?.toLowerCase().includes(q);
        if (!matchName && !matchReceipt && !matchNotes) return false;
      }
      return true;
    });
  }, [salaryPayments, selectedStaffFilter, selectedTypeFilter, selectedMonthFilter, searchQuery]);

  // Financial Stats
  const stats = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const thisMonthPayments = (salaryPayments || []).filter(p => (p.periodDate && p.periodDate.startsWith(currentMonth)) || (p.paymentDate && p.paymentDate.startsWith(currentMonth)));
    
    const totalPaidThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.netPaidAmount, 0);
    const totalPaidAllTime = (salaryPayments || []).reduce((sum, p) => sum + p.netPaidAmount, 0);
    const monthlyTypeCount = thisMonthPayments.filter(p => p.paymentType === 'monthly').length;
    const dailyTypeCount = thisMonthPayments.filter(p => p.paymentType === 'daily').length;
    const advanceTypeCount = thisMonthPayments.filter(p => p.paymentType === 'advance').length;

    return {
      totalPaidThisMonth,
      totalPaidAllTime,
      paymentsCountThisMonth: thisMonthPayments.length,
      monthlyTypeCount,
      dailyTypeCount,
      advanceTypeCount,
      activeStaffCount: (allStaff || []).filter(s => s.active).length
    };
  }, [salaryPayments, allStaff]);

  // Export to CSV
  const handleExportPaymentsCSV = () => {
    const data = filteredPayments.map(p => ({
      'رقم الوصل': p.receiptNumber,
      'اسم الموظف': p.staffName,
      'نوع الدفع': p.paymentType === 'monthly' ? 'شهري' : p.paymentType === 'daily' ? 'يومية' : p.paymentType === 'advance' ? 'تسبيق' : 'مكافأة',
      'الفترة / اليوم': p.periodDate,
      'المبلغ الأساسي (دج)': p.baseAmount,
      'علاوات (+دج)': p.bonusAmount,
      'خصومات (-دج)': p.deductionAmount,
      'المبلغ الصافي المدفوع (دج)': p.netPaidAmount,
      'طريقة الدفع': p.paymentMethod === 'cash' ? 'نقداً من الصندوق' : p.paymentMethod === 'baridimob' ? 'بريدي موب' : p.paymentMethod === 'ccp' ? 'CCP' : 'بنكي',
      'تاريخ العملية': formatDate(p.paymentDate),
      'القائم بالدفع': p.paidByStaffName,
      'ملاحظات': p.notes || ''
    }));
    exportToCSV(`سجل_مدفوعات_الرواتب_${selectedMonthFilter || 'شامل'}`, data);
  };

  // Open Pay Modal for specific worker
  const openPayForWorker = (staff: Staff, type: SalaryPaymentType = 'monthly') => {
    setPayStaffId(staff.id);
    setPaymentType(type);
    if (type === 'monthly') {
      setPeriodDate(new Date().toISOString().substring(0, 7));
      setBaseAmount(String(staff.monthlySalaryBase || (staff.hourlyRate ? staff.hourlyRate * 8 * 26 : 35000)));
    } else if (type === 'daily') {
      setPeriodDate(new Date().toISOString().split('T')[0]);
      setBaseAmount(String(staff.dailyRate || (staff.hourlyRate ? staff.hourlyRate * 8 : 2000)));
    }
    setBonusAmount('0');
    setDeductionAmount('0');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  // Open Edit Rates Modal
  const openEditRates = (staff: Staff) => {
    setEditingRatesStaff(staff);
    setStaffMonthlySalary(String(staff.monthlySalaryBase || ''));
    setStaffDailyRate(String(staff.dailyRate || ''));
    setStaffHourlyRate(String(staff.hourlyRate || '250'));
    setStaffOvertimeRate(String(staff.overtimeHourlyRate || '350'));
  };

  // Open Edit Payment Modal
  const openEditPayment = (payment: SalaryPayment) => {
    setEditingPayment(payment);
    setEditPaymentType(payment.paymentType);
    setEditPeriodDate(payment.periodDate || '');
    setEditBaseAmount(String(payment.baseAmount || '0'));
    setEditBonusAmount(String(payment.bonusAmount || '0'));
    setEditDeductionAmount(String(payment.deductionAmount || '0'));
    setEditPaymentMethod(payment.paymentMethod || 'cash');
    setEditNotes(payment.notes || '');
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn text-[#292A34]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#292A34] text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#292A34] to-[#1c1d24] flex items-center justify-center text-white shadow-md shadow-slate-900/20">
              <Users className="w-7 h-7 text-[#E31C2B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#292A34]">الموارد البشرية ودفع الرواتب</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                  دفع حر ومعدل يدوياً
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                إدارة أجور الموظفين والعمال، الدفع شهرياً أو باليوم مع تحديد وتعديل المبالغ والعلاوات والخصومات وسندات الاستلام
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isManager && (
              <button
                onClick={() => {
                  setPayStaffId(allStaff[0]?.id || '');
                  handleChangePaymentType('monthly');
                  setShowPaymentModal(true);
                }}
                className="bg-[#E31C2B] hover:bg-[#c91825] text-white px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-[#E31C2B]/30 transition-all cursor-pointer active:scale-95"
              >
                <DollarSign className="w-4 h-4 stroke-[2.5]" />
                <span>دفع مستحق / راتب جديد</span>
              </button>
            )}

            <button
              onClick={handleExportPaymentsCSV}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>تصدير CSV</span>
            </button>
          </div>
        </div>

        {/* 4 SUMMARY STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>إجمالي مدفوعات هذا الشهر</span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl font-black font-mono text-[#292A34]">
              {formatCurrency(stats.totalPaidThisMonth)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              تم تنفيذ <span className="font-bold font-mono text-emerald-700">{stats.paymentsCountThisMonth}</span> عمليات دفع هذا الشهر
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>توزيع الدفعات الشهرية</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-xl font-black font-mono text-blue-800">
              {stats.monthlyTypeCount} <span className="text-xs font-normal text-slate-500">راتب شهري</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              + <span className="font-bold font-mono text-amber-700">{stats.dailyTypeCount}</span> يوميات عمل منفصلة
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>تسبيقات وسلفيات على الراتب</span>
              <CreditCard className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-xl font-black font-mono text-amber-800">
              {stats.advanceTypeCount} <span className="text-xs font-normal text-slate-500">تسبيقات مسجلة</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              تُخصم آلياً أو يدوياً عند تسوية الراتب
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>طاقم العمل النشط</span>
              <UserCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 text-xl font-black font-mono text-purple-800">
              {stats.activeStaffCount} <span className="text-xs font-normal text-slate-500">موظفين مسجلين</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              إجمالي مدفوعات الأجور الشاملة: {formatCurrency(stats.totalPaidAllTime)}
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('roster')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'roster'
              ? 'bg-[#292A34] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>بطاقات الموظفين وخيارات الدفع</span>
          <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {allStaff.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('payments')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'payments'
              ? 'bg-[#292A34] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4 text-amber-400" />
          <span>سجل المدفوعات والوصولات الرسمية</span>
          <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {salaryPayments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'attendance'
              ? 'bg-[#292A34] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-400" />
          <span>سجل الحضور والدوام (مرجع استرشادي)</span>
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB 1: STAFF ROSTER & QUICK PAYOUT CARDS
      ========================================================================= */}
      {activeSubTab === 'roster' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStaff.map(staff => {
              // Calculate how much paid this month
              const currentMonth = new Date().toISOString().substring(0, 7);
              const workerMonthPayments = (salaryPayments || []).filter(p => p.staffId === staff.id && ((p.periodDate && p.periodDate.startsWith(currentMonth)) || (p.paymentDate && p.paymentDate.startsWith(currentMonth))));
              const totalPaidWorkerThisMonth = workerMonthPayments.reduce((sum, p) => sum + p.netPaidAmount, 0);

              // Informational attendance logs for worker this month
              const workerAttendanceMonth = (attendanceLogs || []).filter(a => a.staffId === staff.id && (a.date ? a.date.startsWith(currentMonth) : a.clockIn.startsWith(currentMonth)));
              const totalMinsMonth = workerAttendanceMonth.reduce((sum, a) => sum + (a.totalMinutes || 0), 0);
              const totalHoursMonth = Math.round((totalMinsMonth / 60) * 10) / 10;

              return (
                <div 
                  key={staff.id} 
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 bg-slate-100 rounded-xl">{staff.avatar || '👤'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-base text-[#292A34]">{staff.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              staff.role === 'manager' 
                                ? 'bg-[#292A34] text-white' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {staff.role === 'manager' ? 'مدير المحل' : 'عامل في الأستوديو'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{staff.phone || 'بدون هاتف'}</p>
                        </div>
                      </div>

                      {isManager && (
                        <button
                          onClick={() => openEditRates(staff)}
                          title="تعديل شروط الراتب والأجر"
                          className="p-1.5 text-slate-400 hover:text-[#292A34] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Agreed Pay Structure */}
                    <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>الراتب الشهري الأساسي:</span>
                        <span className="font-black font-mono text-[#292A34]">
                          {staff.monthlySalaryBase ? formatCurrency(staff.monthlySalaryBase) : 'غير محدد'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>اليومية المتفق عليها (باليوم):</span>
                        <span className="font-black font-mono text-emerald-700">
                          {staff.dailyRate ? formatCurrency(staff.dailyRate) : 'غير محدد'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>سعر الساعة العادية / الإضافية:</span>
                        <span className="font-mono text-slate-700">
                          {staff.hourlyRate || 250} دج / {staff.overtimeHourlyRate || 350} دج
                        </span>
                      </div>
                    </div>

                    {/* Performance & Payout this month */}
                    <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center text-emerald-900 font-bold">
                        <span>المدفوع له هذا الشهر ({currentMonth}):</span>
                        <span className="font-black font-mono text-sm text-emerald-700">
                          {formatCurrency(totalPaidWorkerThisMonth)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-emerald-200/50">
                        <span>ساعات الدوام المسجلة (استرشادي):</span>
                        <span className="font-bold font-mono text-slate-700">
                          {totalHoursMonth} ساعة ({workerAttendanceMonth.length} أيام)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isManager && (
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openPayForWorker(staff, 'monthly')}
                        className="bg-[#292A34] hover:bg-[#1c1d24] text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>دفع راتب شهري</span>
                      </button>

                      <button
                        onClick={() => openPayForWorker(staff, 'daily')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>دفع يومية</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: SALARY PAYMENTS & VOUCHERS LEDGER
      ========================================================================= */}
      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الموظف أو رقم الوصل..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#292A34]"
                />
              </div>

              {/* Staff Select */}
              <select
                value={selectedStaffFilter}
                onChange={e => setSelectedStaffFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">كل الموظفين والعمال</option>
                {allStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {/* Type Select */}
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">جميع أنواع الدفع</option>
                <option value="monthly">راتب شهري</option>
                <option value="daily">يومية عمل</option>
                <option value="advance">تسبيق على الراتب</option>
                <option value="bonus">مكافأة / علاوة</option>
              </select>

              {/* Month Select */}
              <input
                type="month"
                value={selectedMonthFilter}
                onChange={e => setSelectedMonthFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer font-mono"
              />
            </div>

            <div className="text-xs font-bold text-slate-500">
              المعروض: <span className="font-mono text-[#292A34] font-black">{filteredPayments.length}</span> دفعة
            </div>
          </div>

          {/* Payments Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
                  <tr>
                    <th className="py-3.5 px-4">رقم الوصل</th>
                    <th className="py-3.5 px-4">الموظف</th>
                    <th className="py-3.5 px-4">نوع الدفعة</th>
                    <th className="py-3.5 px-4">الفترة / اليوم</th>
                    <th className="py-3.5 px-4">المبلغ الأساسي</th>
                    <th className="py-3.5 px-4">علاوات / خصم</th>
                    <th className="py-3.5 px-4">الصافي المدفوع</th>
                    <th className="py-3.5 px-4">طريقة الدفع</th>
                    <th className="py-3.5 px-4">تاريخ العملية</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-slate-400 font-bold">
                        لا توجد دفعات رواتب مسجلة مطابقة لخيارات البحث
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map(p => {
                      const typeBadge = p.paymentType === 'monthly'
                        ? { label: 'راتب شهري', bg: 'bg-blue-100 text-blue-800' }
                        : p.paymentType === 'daily'
                        ? { label: 'يومية', bg: 'bg-emerald-100 text-emerald-800' }
                        : p.paymentType === 'advance'
                        ? { label: 'تسبيق', bg: 'bg-amber-100 text-amber-800' }
                        : { label: 'مكافأة', bg: 'bg-purple-100 text-purple-800' };

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            {p.receiptNumber}
                          </td>
                          <td className="py-3.5 px-4 font-black text-[#292A34]">
                            {p.staffName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${typeBadge.bg}`}>
                              {typeBadge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {p.periodDate || '─'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            {formatCurrency(p.baseAmount)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            {p.bonusAmount > 0 && <span className="text-emerald-600 block">+{p.bonusAmount} دج</span>}
                            {p.deductionAmount > 0 && <span className="text-rose-600 block">-{p.deductionAmount} دج</span>}
                            {p.bonusAmount === 0 && p.deductionAmount === 0 && <span className="text-slate-400">─</span>}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                            {formatCurrency(p.netPaidAmount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] text-slate-600 font-bold">
                              {p.paymentMethod === 'cash' ? '💵 نقداً' : p.paymentMethod === 'baridimob' ? '💳 بريدي موب' : p.paymentMethod === 'ccp' ? '📮 CCP' : '🏛️ بنكي'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {formatDate(p.paymentDate)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Print Receipt */}
                              <button
                                onClick={() => setPrintingPayment(p)}
                                title="طباعة وصل الراتب"
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Edit Payment */}
                              {isManager && (
                                <button
                                   onClick={() => openEditPayment(p)}
                                  title="تعديل المبلغ أو البيانات"
                                  className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete Payment */}
                              {isManager && (
                                <button
                                  onClick={() => handleDeletePayment(p)}
                                  title="حذف الدفعة"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments Mobile Cards (No Horizontal Scroll) */}
          <div className="md:hidden space-y-3">
            {filteredPayments.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200">
                لا توجد دفعات رواتب مسجلة مطابقة لخيارات البحث
              </div>
            ) : (
              filteredPayments.map(p => {
                const typeBadge = p.paymentType === 'monthly'
                  ? { label: 'راتب شهري', bg: 'bg-blue-100 text-blue-800' }
                  : p.paymentType === 'daily'
                  ? { label: 'يومية', bg: 'bg-emerald-100 text-emerald-800' }
                  : p.paymentType === 'advance'
                  ? { label: 'تسبيق', bg: 'bg-amber-100 text-amber-800' }
                  : { label: 'مكافأة', bg: 'bg-purple-100 text-purple-800' };

                return (
                  <div key={p.id} className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="font-bold text-sm text-[#292A34] block">{p.staffName}</span>
                        <span className="font-mono text-[10px] text-slate-400">{p.receiptNumber} • {formatDate(p.paymentDate)}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${typeBadge.bg}`}>
                        {typeBadge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">المبلغ الأساسي:</span>
                        <span className="font-mono font-bold text-slate-700">{formatCurrency(p.baseAmount)}</span>
                      </div>
                      <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                        <span className="text-emerald-700 block text-[10px]">الصافي المدفوع:</span>
                        <span className="font-mono font-black text-emerald-800 text-sm">{formatCurrency(p.netPaidAmount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-slate-600 text-[11px]">
                        {p.paymentMethod === 'cash' ? '💵 نقداً' : p.paymentMethod === 'baridimob' ? '💳 بريدي موب' : p.paymentMethod === 'ccp' ? '📮 CCP' : '🏛️ بنكي'}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPrintingPayment(p)}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>وصل</span>
                        </button>
                        {isManager && (
                          <button
                            onClick={() => openEditPayment(p)}
                            className="p-1 text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {isManager && (
                          <button
                            onClick={() => handleDeletePayment(p)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: ATTENDANCE (INFORMATIVE REFERENCE)
      ========================================================================= */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200/80 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock3 className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-blue-950">سجل الدوام والحضور الاسترشادي</h4>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  هذا السجل لتوثيق أوقات دخول وخروج العمال كمرجع استرشادي للمدير، ولا يتم فرض أي خصم آلي إلا بقرار وتحديد المدير في الموارد البشرية.
                </p>
              </div>
            </div>

            {isManager && (
              <button
                onClick={() => setShowManualAttendanceModal(true)}
                className="bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة دوام يدوي</span>
              </button>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
                  <tr>
                    <th className="py-3.5 px-4">التاريخ</th>
                    <th className="py-3.5 px-4">الموظف</th>
                    <th className="py-3.5 px-4">وقت الدخول</th>
                    <th className="py-3.5 px-4">وقت الخروج</th>
                    <th className="py-3.5 px-4">إجمالي الساعات</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4">ملاحظات</th>
                    {isManager && <th className="py-3.5 px-4 text-center">إجراءات</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        لا توجد سجلات حضور مسجلة حالياً
                      </td>
                    </tr>
                  ) : (
                    attendanceLogs.map(att => {
                      const hours = att.totalMinutes ? (att.totalMinutes / 60).toFixed(1) : '─';
                      return (
                        <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{att.date}</td>
                          <td className="py-3 px-4 font-black text-[#292A34]">{att.staffName}</td>
                          <td className="py-3 px-4 font-mono text-emerald-700">{formatTime(att.clockIn)}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{att.clockOut ? formatTime(att.clockOut) : 'دوام جارٍ...'}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#292A34]">{hours} ساعة</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              att.status === 'clocked_in' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {att.status === 'clocked_in' ? 'متواجد حالياً' : 'مكتمل'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{att.notes || '─'}</td>
                          {isManager && (
                            <td className="py-3 px-4 text-center">
                              {onDeleteAttendance && (
                                <button
                                  onClick={() => onDeleteAttendance(att.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Attendance Cards */}
          <div className="md:hidden space-y-3">
            {attendanceLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-slate-200">
                لا توجد سجلات حضور مسجلة حالياً
              </div>
            ) : (
              attendanceLogs.map(att => {
                const hours = att.totalMinutes ? (att.totalMinutes / 60).toFixed(1) : '─';
                return (
                  <div key={att.id} className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="font-bold text-sm text-[#292A34] block">{att.staffName}</span>
                        <span className="font-mono text-[10px] text-slate-400">{att.date}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        att.status === 'clocked_in' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {att.status === 'clocked_in' ? 'متواجد حالياً' : 'مكتمل'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                        <span className="text-emerald-700 block text-[10px]">دخول:</span>
                        <span className="font-mono font-bold text-emerald-800">{formatTime(att.clockIn)}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">خروج:</span>
                        <span className="font-mono font-bold text-slate-700">{att.clockOut ? formatTime(att.clockOut) : 'دوام جارٍ...'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="font-mono font-bold text-slate-600 text-[11px]">
                        المدة: {hours} ساعة
                      </span>
                      {isManager && onDeleteAttendance && (
                        <button
                          onClick={() => onDeleteAttendance(att.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer text-xs flex items-center gap-1 font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NEW SALARY / DAILY PAYOUT (MANAGER)
      ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#292A34] text-white flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#292A34]">دفع مستحق مالي / راتب للموظف</h3>
                  <p className="text-xs text-slate-500">تحديد وتعديل المبلغ المستحق بحرية تامة</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewPayment} className="mt-5 space-y-4">
              {/* Select Staff */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">اختر الموظف أو العامل:</label>
                <select
                  value={payStaffId}
                  onChange={e => handleSelectStaffForPay(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#292A34] focus:outline-none focus:border-[#292A34] cursor-pointer"
                >
                  {allStaff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role === 'manager' ? 'مدير' : 'عامل'}) ─ الراتب المتفق: {s.monthlySalaryBase ? `${s.monthlySalaryBase} دج` : 'غير محدد'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Type Tabs */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">نوع الدفعة المستحقة:</label>
                <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleChangePaymentType('monthly')}
                    className={`py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                      paymentType === 'monthly' ? 'bg-[#292A34] text-white shadow-xs' : 'text-slate-600 hover:text-[#292A34]'
                    }`}
                  >
                    📅 شهري
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangePaymentType('daily')}
                    className={`py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                      paymentType === 'daily' ? 'bg-[#292A34] text-white shadow-xs' : 'text-slate-600 hover:text-[#292A34]'
                    }`}
                  >
                    ☀️ باليوم (يومية)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangePaymentType('advance')}
                    className={`py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                      paymentType === 'advance' ? 'bg-[#292A34] text-white shadow-xs' : 'text-slate-600 hover:text-[#292A34]'
                    }`}
                  >
                    ⚡ تسبيق
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangePaymentType('bonus')}
                    className={`py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                      paymentType === 'bonus' ? 'bg-[#292A34] text-white shadow-xs' : 'text-slate-600 hover:text-[#292A34]'
                    }`}
                  >
                    🏆 مكافأة
                  </button>
                </div>
              </div>

              {/* Period Date */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  {paymentType === 'monthly' ? 'الشهر المعني بالدفع:' : 'اليوم المعني بالدفع:'}
                </label>
                {paymentType === 'monthly' ? (
                  <input
                    type="month"
                    required
                    value={periodDate}
                    onChange={e => setPeriodDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#292A34] focus:outline-none focus:border-[#292A34]"
                  />
                ) : (
                  <input
                    type="date"
                    required
                    value={periodDate}
                    onChange={e => setPeriodDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#292A34] focus:outline-none focus:border-[#292A34]"
                  />
                )}
              </div>

              {/* Base Amount */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  المبلغ الأساسي (دج) ─ <span className="text-emerald-700">يمكنك تعديله بحرية</span>:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={baseAmount}
                    onChange={e => setBaseAmount(e.target.value)}
                    placeholder="مثلاً: 35000"
                    className="w-full pr-4 pl-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black font-mono text-[#292A34] focus:outline-none focus:border-[#292A34]"
                  />
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">دج</span>
                </div>
              </div>

              {/* Bonus & Deductions Adjustments */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                    علاوة / مكافأة (+دج):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={bonusAmount}
                    onChange={e => setBonusAmount(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-800 mb-1">
                    خصم / اقتطاع (-دج):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={deductionAmount}
                    onChange={e => setDeductionAmount(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono text-rose-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Net Summary Box */}
              <div className="bg-gradient-to-br from-[#292A34] to-[#1c1d24] text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs text-slate-300 font-bold block">المبلغ الصافي النهائي المدفوع:</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {formatCurrency(currentCalculatedNet)}
                  </span>
                </div>
                <div className="text-left text-[11px] text-slate-300">
                  <span>طريقة التسليم: {paymentMethod === 'cash' ? 'نقداً من الصندوق' : paymentMethod === 'baridimob' ? 'بريدي موب' : paymentMethod === 'ccp' ? 'CCP' : 'بنكي'}</span>
                </div>
              </div>

              {/* Payment Method & Register deduction */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">وسيلة الدفع:</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as SalaryPaymentMethod)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="cash">💵 نقداً من الخزينة</option>
                    <option value="baridimob">💳 تطبيق بريدي موب</option>
                    <option value="ccp">📮 الحساب البريدي الجاري CCP</option>
                    <option value="bank">🏛️ تحويل بنكي</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer pt-4">
                    <input
                      type="checkbox"
                      checked={recordAsStudioExpense}
                      onChange={e => setRecordAsStudioExpense(e.target.checked)}
                      className="w-4 h-4 accent-[#E31C2B] rounded"
                    />
                    <span className="text-[11px] font-bold text-slate-700">
                      قيد كمصروف رسمي في محاسبة الأستوديو
                    </span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">ملاحظات وسند الصرف (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثلاً: راتب شهر سبتمبر كامل مع مكافأة إنجاز..."
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#292A34] focus:outline-none focus:border-[#292A34]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-6 py-2.5 bg-[#E31C2B] hover:bg-[#c91825] text-white font-black rounded-xl text-xs shadow-md shadow-[#E31C2B]/30 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingPay ? 'جاري التأكيد...' : 'تأكيد وتسجيل الدفع'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT SALARY PAYMENT
      ========================================================================= */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#292A34]">تعديل دفعة الراتب ({editingPayment.receiptNumber})</h3>
                  <p className="text-xs text-slate-500">الموظف: {editingPayment.staffName}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditPayment} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">نوع الدفعة:</label>
                <select
                  value={editPaymentType}
                  onChange={e => setEditPaymentType(e.target.value as SalaryPaymentType)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="monthly">📅 راتب شهري</option>
                  <option value="daily">☀️ باليوم (يومية)</option>
                  <option value="advance">⚡ تسبيق على الراتب</option>
                  <option value="bonus">🏆 مكافأة / علاوة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">الفترة أو اليوم المعني:</label>
                <input
                  type="text"
                  value={editPeriodDate}
                  onChange={e => setEditPeriodDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#292A34] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">المبلغ الأساسي (دج):</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={editBaseAmount}
                  onChange={e => setEditBaseAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black font-mono text-[#292A34] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">علاوة (+دج):</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={editBonusAmount}
                    onChange={e => setEditBonusAmount(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rose-800 mb-1">خصم (-دج):</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={editDeductionAmount}
                    onChange={e => setEditDeductionAmount(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-rose-700"
                  />
                </div>
              </div>

              <div className="bg-[#292A34] text-white p-4 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-slate-300 font-bold">الصافي المعدل:</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatCurrency(editCalculatedNet)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">طريقة الدفع:</label>
                <select
                  value={editPaymentMethod}
                  onChange={e => setEditPaymentMethod(e.target.value as SalaryPaymentMethod)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="cash">💵 نقداً من الخزينة</option>
                  <option value="baridimob">💳 بريدي موب</option>
                  <option value="ccp">📮 CCP</option>
                  <option value="bank">🏛️ تحويل بنكي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">الملاحظات:</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#292A34]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT WORKER BASE RATES (SALARY / DAILY / HOURLY)
      ========================================================================= */}
      {editingRatesStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#292A34]">تعديل شروط الأجر للموظف</h3>
                  <p className="text-xs text-slate-500">{editingRatesStaff.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRatesStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffRates} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">الراتب الأساسي الشهري (دج):</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={staffMonthlySalary}
                  onChange={e => setStaffMonthlySalary(e.target.value)}
                  placeholder="مثلاً: 35000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#292A34] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">الأجر باليوم (اليومية بالدينار دج):</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={staffDailyRate}
                  onChange={e => setStaffDailyRate(e.target.value)}
                  placeholder="مثلاً: 2000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#292A34] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">أجر الساعة العادية:</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={staffHourlyRate}
                    onChange={e => setStaffHourlyRate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#292A34] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">أجر الساعة الإضافية:</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={staffOvertimeRate}
                    onChange={e => setStaffOvertimeRate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#292A34] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingRatesStaff(null)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: OFFICIAL SALARY PAYSLIP / VOUCHER (PRINTABLE)
      ========================================================================= */}
      {printingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-300 animate-scaleUp my-8 text-right">
            {/* Payslip Header */}
            <div className="flex items-center justify-between pb-6 border-b-2 border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#292A34] text-white flex items-center justify-center rounded-xl font-black text-xl">
                  FP
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#292A34]">أستوديو فوتوب للتصوير والطباعة</h2>
                  <p className="text-xs text-slate-500">Fotop Studio ERP ─ وصل دفع مستحقات وأجور</p>
                </div>
              </div>
              <div className="text-left font-mono">
                <span className="text-xs bg-slate-100 text-slate-800 font-black px-3 py-1 rounded-lg border border-slate-200">
                  {printingPayment.receiptNumber}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">{formatDate(printingPayment.paymentDate)}</p>
              </div>
            </div>

            {/* Payslip Details */}
            <div className="mt-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">اسم الموظف المستلم:</span>
                  <span className="text-sm font-black text-[#292A34]">{printingPayment.staffName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">نوع الدفعة والفترة:</span>
                  <span className="text-sm font-bold text-slate-800">
                    {printingPayment.paymentType === 'monthly' ? 'راتب شهري' : printingPayment.paymentType === 'daily' ? 'يومية عمل' : printingPayment.paymentType === 'advance' ? 'تسبيق' : 'مكافأة'} ({printingPayment.periodDate})
                  </span>
                </div>
              </div>

              {/* Financial Calculation Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">البيان المالي</th>
                      <th className="py-2.5 px-3 text-left">المبلغ (دج)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-700">المبلغ الأساسي المحدد</td>
                      <td className="py-2.5 px-3 text-left">{formatCurrency(printingPayment.baseAmount)}</td>
                    </tr>
                    {printingPayment.bonusAmount > 0 && (
                      <tr className="text-emerald-700 bg-emerald-50/40">
                        <td className="py-2.5 px-3 font-bold">+ علاوات ومكافآت إضافية</td>
                        <td className="py-2.5 px-3 text-left">+{formatCurrency(printingPayment.bonusAmount)}</td>
                      </tr>
                    )}
                    {printingPayment.deductionAmount > 0 && (
                      <tr className="text-rose-700 bg-rose-50/40">
                        <td className="py-2.5 px-3 font-bold">- خصومات واقتطاعات</td>
                        <td className="py-2.5 px-3 text-left">-{formatCurrency(printingPayment.deductionAmount)}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-900 text-white font-black text-sm">
                      <td className="py-3 px-3">المبلغ الصافي النهائي المستلم</td>
                      <td className="py-3 px-3 text-left text-emerald-400">{formatCurrency(printingPayment.netPaidAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Method & Notes */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600">
                <p>طريقة الدفع: <span className="font-bold">{printingPayment.paymentMethod === 'cash' ? 'نقداً من الصندوق' : printingPayment.paymentMethod === 'baridimob' ? 'بريدي موب' : printingPayment.paymentMethod === 'ccp' ? 'CCP' : 'تحويل بنكي'}</span></p>
                {printingPayment.notes && <p className="mt-1">ملاحظات: {printingPayment.notes}</p>}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div>
                  <span className="block font-bold text-slate-700">توقيع وختم الإدارة:</span>
                  <div className="h-14 border-b border-dashed border-slate-400 mt-2"></div>
                  <span className="text-[10px] text-slate-400 mt-1 block">المدير: {printingPayment.paidByStaffName}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-700">توقيع الموظف بالاستلام:</span>
                  <div className="h-14 border-b border-dashed border-slate-400 mt-2"></div>
                  <span className="text-[10px] text-slate-400 mt-1 block">الموظف: {printingPayment.staffName}</span>
                </div>
              </div>
            </div>

            {/* Print Modal Actions */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between no-print">
              <button
                onClick={() => setPrintingPayment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-[#292A34] hover:bg-[#1c1d24] text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الوصل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: MANUAL ATTENDANCE (INFORMATIVE REFERENCE)
      ========================================================================= */}
      {showManualAttendanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#292A34]">إضافة سجل دوام يدوي</h3>
                  <p className="text-xs text-slate-500">توثيق ساعات الحضور كمرجع استرشادي</p>
                </div>
              </div>
              <button
                onClick={() => setShowManualAttendanceModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const st = allStaff.find(s => s.id === manualStaffId);
                const hrs = Number(manualHours) || 8;
                if (onAddManualAttendance) {
                  onAddManualAttendance({
                    staffId: manualStaffId,
                    staffName: st?.name || 'موظف',
                    date: manualDate,
                    clockIn: `${manualDate}T08:30:00.000Z`,
                    clockOut: `${manualDate}T17:00:00.000Z`,
                    totalMinutes: hrs * 60,
                    hourlyRateApplied: st?.hourlyRate || 250,
                    notes: manualNotes
                  });
                }
                setShowManualAttendanceModal(false);
                showToast('تم تسجيل الدوام اليدوي بنجاح');
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">الموظف:</label>
                <select
                  value={manualStaffId}
                  onChange={e => setManualStaffId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {allStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ الدوام:</label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={e => setManualDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">عدد الساعات:</label>
                <input
                  type="number"
                  required
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={manualHours}
                  onChange={e => setManualHours(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">ملاحظة:</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowManualAttendanceModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md cursor-pointer"
                >
                  حفظ الدوام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
