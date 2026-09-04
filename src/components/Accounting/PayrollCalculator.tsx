import React, { useState, useMemo } from 'react';
import { Staff, AttendanceRecord, Expense } from '../../types';
import { 
  Calculator, 
  Clock, 
  Calendar, 
  DollarSign, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  Edit2, 
  PlusCircle, 
  MinusCircle, 
  Wallet, 
  CalendarDays, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  AlertCircle,
  Clock3,
  Search,
  ArrowUpDown
} from 'lucide-react';
import { exportToCSV, formatCurrency, formatDate, formatTime } from '../../utils/formatters';

interface PayrollCalculatorProps {
  allStaff: Staff[];
  attendanceLogs: AttendanceRecord[];
  currentStaff: Staff;
  onUpdateStaff: (staff: Staff) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onAddManualAttendance?: (record: Partial<AttendanceRecord>) => void;
  onDeleteAttendance?: (id: string) => void;
}

interface WorkerPayrollSummary {
  staff: Staff;
  recordsCount: number;
  totalMinutes: number;
  totalHours: number;
  hourlyRate: number;
  baseSalary: number;
  overtimeMinutes: number;
  overtimeHours: number;
  overtimePay: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  dailyBreakdown: {
    id: string;
    date: string;
    dayName: string;
    clockIn: string;
    clockOut?: string;
    minutes: number;
    hours: number;
    dayEarnings: number;
    isOvertime: boolean;
    notes?: string;
  }[];
}

const ARABIC_DAYS: Record<number, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت'
};

export const PayrollCalculator: React.FC<PayrollCalculatorProps> = ({
  allStaff = [],
  attendanceLogs = [],
  currentStaff,
  onUpdateStaff,
  onAddExpense,
  onAddManualAttendance,
  onDeleteAttendance
}) => {
  // Period filter
  const [periodPreset, setPeriodPreset] = useState<'today' | 'week' | 'month' | 'last_month' | 'custom' | 'all'>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bonus & Deduction state overrides per worker (in-memory adjustments)
  const [staffAdjustments, setStaffAdjustments] = useState<Record<string, { bonus: number; bonusNote: string; deduction: number; deductionNote: string }>>({});

  // Active detail modal / expanded worker
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);

  // Hourly Rate Edit Modal
  const [editingRateStaff, setEditingRateStaff] = useState<{ staff: Staff; newRate: number } | null>(null);

  // Payslip Print Modal
  const [printingPayslip, setPrintingPayslip] = useState<WorkerPayrollSummary | null>(null);

  // Manual Attendance Modal
  const [showManualAttendanceModal, setShowManualAttendanceModal] = useState<boolean>(false);
  const [manualStaffId, setManualStaffId] = useState<string>(allStaff[0]?.id || '');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualHours, setManualHours] = useState<string>('8');
  const [manualNotes, setManualNotes] = useState<string>('ساعات عمل موثقة');

  // Payout success notification
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  // Date filtering helper
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0
    }).format(amount).replace('DZD', 'دج');
  };

  const formatDate = (iso: string) => {
    if (!iso) return '─';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string) => {
    if (!iso) return '─';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  // Helper to check if record falls in period
  const matchesDateRange = (dateStr: string) => {
    const recordDate = new Date(dateStr);
    if (periodPreset === 'today') {
      return dateStr.startsWith(todayStr);
    }
    if (periodPreset === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return recordDate >= oneWeekAgo;
    }
    if (periodPreset === 'month') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    }
    if (periodPreset === 'last_month') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonth = lastMonthDate.getMonth();
      const lastMonthYear = lastMonthDate.getFullYear();
      return recordDate.getMonth() === lastMonth && recordDate.getFullYear() === lastMonthYear;
    }
    if (periodPreset === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      const start = customStartDate ? new Date(`${customStartDate}T00:00:00`) : new Date(0);
      const end = customEndDate ? new Date(`${customEndDate}T23:59:59`) : new Date(8640000000000000);
      return recordDate >= start && recordDate <= end;
    }
    return true; // 'all'
  };

  // Filter attendance logs
  const filteredAttendance = useMemo(() => {
    return (attendanceLogs || []).filter(a => matchesDateRange(a.date || a.clockIn));
  }, [attendanceLogs, periodPreset, customStartDate, customEndDate]);

  // Compute payroll summary per worker
  const payrollSummaries: WorkerPayrollSummary[] = useMemo(() => {
    return allStaff.map(st => {
      const staffLogs = filteredAttendance.filter(a => a.staffId === st.id);
      const rate = st.hourlyRate !== undefined && st.hourlyRate > 0 ? st.hourlyRate : 250;
      const overtimeRate = st.overtimeHourlyRate || Math.round(rate * 1.25);

      let totalMinutes = 0;
      let overtimeMinutes = 0;

      // Standard shift duration in minutes (e.g. 8.5 hours = 510 mins)
      let standardDailyMinutes = 8 * 60;
      if (st.shiftStartTime && st.shiftEndTime) {
        const [startH, startM] = st.shiftStartTime.split(':').map(Number);
        const [endH, endM] = st.shiftEndTime.split(':').map(Number);
        const diff = (endH * 60 + endM) - (startH * 60 + startM);
        if (diff > 0) standardDailyMinutes = diff;
      }

      const dailyBreakdown = staffLogs.map(log => {
        let mins = log.totalMinutes || 0;
        // If currently clocked in, compute running minutes
        if (log.status === 'clocked_in' && log.clockIn) {
          const startMs = new Date(log.clockIn).getTime();
          const runningMs = Math.max(0, now.getTime() - startMs);
          mins = Math.round(runningMs / (1000 * 60));
        }

        totalMinutes += mins;

        let logOvertime = 0;
        if (mins > standardDailyMinutes) {
          logOvertime = mins - standardDailyMinutes;
          overtimeMinutes += logOvertime;
        }

        const logHours = Number((mins / 60).toFixed(2));
        const dayEarnings = Math.round((mins / 60) * rate);
        const dObj = new Date(log.date || log.clockIn);
        const dayName = ARABIC_DAYS[dObj.getDay()] || 'يوم عمل';

        return {
          id: log.id,
          date: log.date || log.clockIn.split('T')[0],
          dayName,
          clockIn: log.clockIn,
          clockOut: log.clockOut,
          minutes: mins,
          hours: logHours,
          dayEarnings,
          isOvertime: logOvertime > 0,
          notes: log.notes
        };
      });

      const totalHours = Number((totalMinutes / 60).toFixed(2));
      const overtimeHours = Number((overtimeMinutes / 60).toFixed(2));
      const regularHours = Math.max(0, totalHours - overtimeHours);

      const baseSalary = Math.round(regularHours * rate);
      const overtimePay = Math.round(overtimeHours * overtimeRate);

      const adjustments = staffAdjustments[st.id] || { bonus: 0, bonusNote: '', deduction: 0, deductionNote: '' };
      const netSalary = Math.max(0, baseSalary + overtimePay + (adjustments.bonus || 0) - (adjustments.deduction || 0));

      return {
        staff: st,
        recordsCount: staffLogs.length,
        totalMinutes,
        totalHours,
        hourlyRate: rate,
        baseSalary,
        overtimeMinutes,
        overtimeHours,
        overtimePay,
        bonus: adjustments.bonus || 0,
        deduction: adjustments.deduction || 0,
        netSalary,
        dailyBreakdown
      };
    }).filter(summary => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return summary.staff.name.toLowerCase().includes(q) || (summary.staff.workSchedule || '').toLowerCase().includes(q);
    });
  }, [allStaff, filteredAttendance, staffAdjustments, searchQuery]);

  // Overall totals
  const overallTotalHours = useMemo(() => {
    return payrollSummaries.reduce((sum, p) => sum + p.totalHours, 0);
  }, [payrollSummaries]);

  const overallTotalPayroll = useMemo(() => {
    return payrollSummaries.reduce((sum, p) => sum + p.netSalary, 0);
  }, [payrollSummaries]);

  const overallAvgHourlyRate = useMemo(() => {
    if (payrollSummaries.length === 0) return 0;
    const sumRates = payrollSummaries.reduce((sum, p) => sum + p.hourlyRate, 0);
    return Math.round(sumRates / payrollSummaries.length);
  }, [payrollSummaries]);

  // Handler to update staff hourly rate
  const handleSaveHourlyRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRateStaff) return;
    const updatedStaff: Staff = {
      ...editingRateStaff.staff,
      hourlyRate: Number(editingRateStaff.newRate)
    };
    onUpdateStaff(updatedStaff);
    setEditingRateStaff(null);
  };

  // Handler for adjustment (bonus/deduction)
  const handleSetAdjustment = (staffId: string, field: 'bonus' | 'deduction', val: number) => {
    setStaffAdjustments(prev => {
      const current = prev[staffId] || { bonus: 0, bonusNote: '', deduction: 0, deductionNote: '' };
      return {
        ...prev,
        [staffId]: {
          ...current,
          [field]: Math.max(0, val)
        }
      };
    });
  };

  // Handler to Record Payout as Studio Expense
  const handleRecordPayoutExpense = (summary: WorkerPayrollSummary) => {
    const periodName = 
      periodPreset === 'today' ? 'اليوم' :
      periodPreset === 'week' ? 'هذا الأسبوع' :
      periodPreset === 'month' ? 'الشهر الحالي' :
      periodPreset === 'last_month' ? 'الشهر الماضي' : 'فترة محددة';

    const note = `صرف مستحقات الراتب للعامل: ${summary.staff.name} (${summary.totalHours} ساعة عمل موثقة بسعر ${summary.hourlyRate} دج/ساعة)`;
    
    if (window.confirm(`هل تريد تسجيل صرف راتب ${summary.staff.name} بمبلغ ${formatCurrency(summary.netSalary)} كمصروف في حسابات الاستوديو؟`)) {
      onAddExpense({
        title: `رواتب وأجور: ${summary.staff.name} (${periodName})`,
        amount: summary.netSalary,
        category: 'other',
        staffId: currentStaff.id,
        staffName: currentStaff.name,
        notes: note
      });

      setPayoutSuccessMsg(`تم تسجيل صرف راتب ${summary.staff.name} (${formatCurrency(summary.netSalary)}) وخصمه من المصروفات بنجاح.`);
      setTimeout(() => setPayoutSuccessMsg(null), 4000);
    }
  };

  // Export Payroll to Excel/CSV
  const handleExportPayrollCSV = () => {
    const periodLabel = 
      periodPreset === 'today' ? 'اليوم' :
      periodPreset === 'week' ? 'الأسبوع الحالي' :
      periodPreset === 'month' ? 'الشهر الحالي' :
      periodPreset === 'last_month' ? 'الشهر الماضي' :
      periodPreset === 'custom' ? `فترة مخصصة (${customStartDate} إلى ${customEndDate})` : 'كامل السجلات';

    const rows = payrollSummaries.map(p => ({
      'اسم العامل': p.staff.name,
      'الصفة': p.staff.role === 'manager' ? 'مدير عام' : 'عامل استوديو',
      'مواقيت الدوام المقررة': p.staff.workSchedule || `${p.staff.shiftStartTime || '08:30'} - ${p.staff.shiftEndTime || '17:00'}`,
      'الأجر بالساعة (دج)': p.hourlyRate,
      'إجمالي ساعات العمل الموثقة': p.totalHours,
      'أيام الحضور': p.recordsCount,
      'ساعات العمل الإضافي': p.overtimeHours,
      'مستحق الساعات الأساسية (دج)': p.baseSalary,
      'مستحق الساعات الإضافية (دج)': p.overtimePay,
      'المكافآت والحوافز (دج)': p.bonus,
      'الخصومات والسلفيات (دج)': p.deduction,
      'صافي الراتب المستحق للصرف (دج)': p.netSalary
    }));

    exportToCSV(`Fotop_Staff_Payroll_${periodPreset}_${todayStr}`, rows);
  };

  // Add manual attendance handler
  const handleCreateManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddManualAttendance) return;
    const staff = allStaff.find(s => s.id === manualStaffId);
    if (!staff) return;

    const hours = Number(manualHours) || 0;
    const totalMinutes = Math.round(hours * 60);
    const hourlyRateApplied = staff.hourlyRate || 250;
    const earnedPay = Math.round(hours * hourlyRateApplied);

    onAddManualAttendance({
      staffId: staff.id,
      staffName: staff.name,
      date: manualDate,
      clockIn: `${manualDate}T${staff.shiftStartTime || '08:30'}:00`,
      clockOut: `${manualDate}T${staff.shiftEndTime || '17:00'}:00`,
      totalMinutes,
      hourlyRateApplied,
      earnedPay,
      status: 'clocked_out',
      notes: manualNotes
    });

    setShowManualAttendanceModal(false);
    setManualHours('8');
    setManualNotes('ساعات عمل موثقة');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Title */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E31C2B] text-white flex items-center justify-center shadow-lg shadow-[#E31C2B]/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#292A34]">حاسبة الرواتب وساعات العمل الآلية</h2>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  مربوط بنظام سجلات الدوام AttendanceLogs
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                احتساب فوري ودقيق لرواتب وأجور عمال الاستوديو بناءً على ساعات الحضور الفعلية مع إمكانية تعديل سعر الساعة والمكافآت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowManualAttendanceModal(true)}
              className="px-3.5 py-2 bg-[#292A34] hover:bg-[#373946] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Clock3 className="w-4 h-4 text-amber-400" />
              <span>+ إضافة ساعات عمل يدوية</span>
            </button>

            <button
              onClick={handleExportPayrollCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير كشف الرواتب (Excel)</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {payoutSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{payoutSuccessMsg}</span>
          </div>
        )}

        {/* Period Filters & Search */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 ml-1">الفترة الزمنية:</span>
            {[
              { id: 'month', label: 'الشهر الحالي' },
              { id: 'last_month', label: 'الشهر الماضي' },
              { id: 'week', label: 'آخر 7 أيام' },
              { id: 'today', label: 'اليوم' },
              { id: 'custom', label: 'نطاق مخصص' },
              { id: 'all', label: 'كامل السجلات' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriodPreset(p.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodPreset === p.id 
                    ? 'bg-[#E31C2B] text-white shadow-sm' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث باسم العامل أو الدوام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F0F0F0] border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-[#292A34] font-medium focus:outline-none focus:border-[#E31C2B]"
            />
          </div>
        </div>

        {/* Custom Range Inputs if custom selected */}
        {periodPreset === 'custom' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs flex-wrap">
            <span className="font-bold text-slate-700">من تاريخ:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
            />
            <span className="font-bold text-slate-700">إلى تاريخ:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
            />
          </div>
        )}

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          
          <div className="bg-[#292A34] text-white p-4 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-300 text-xs font-bold">
              <span>إجمالي مستحقات الأجور</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-emerald-400">
              {formatCurrency(overallTotalPayroll)}
            </div>
            <p className="text-[10px] text-slate-300">صافي المستحق للصرف في الفترة المحددة</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
              <span>إجمالي ساعات العمل الموثقة</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-sky-700">
              {overallTotalHours.toFixed(1)} <span className="text-xs font-normal">ساعة</span>
            </div>
            <p className="text-[10px] text-slate-500">من سجلات الحضور والانصراف</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
              <span>متوسط الأجر بالساعة</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-[#292A34]">
              {overallAvgHourlyRate} <span className="text-xs font-normal">دج/ساعة</span>
            </div>
            <p className="text-[10px] text-slate-500">قابل للتعديل المخصص لكل عامل</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
              <span>عدد عمال الاستوديو</span>
              <UserCheck className="w-4 h-4 text-[#E31C2B]" />
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-[#292A34]">
              {payrollSummaries.length} <span className="text-xs font-normal">موظف</span>
            </div>
            <p className="text-[10px] text-slate-500">طاقم العمل المسجل في النظام</p>
          </div>

        </div>
      </div>

      {/* Main Staff Payroll Cards & Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[#292A34]">تفاصيل رواتب وساعات عمل الموظفين:</h3>
          <span className="text-xs text-slate-500 font-bold">
            عدد السجلات المسجلة: {filteredAttendance.length} جلسة دوام
          </span>
        </div>

        {payrollSummaries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-xs font-bold">
            لا توجد سجلات حضور للموظفين في هذه الفترة المحددة.
          </div>
        ) : (
          <div className="space-y-4">
            {payrollSummaries.map(item => {
              const isExpanded = expandedWorkerId === item.staff.id;

              return (
                <div 
                  key={item.staff.id} 
                  className={`bg-white border-2 rounded-2xl transition-all overflow-hidden ${
                    isExpanded ? 'border-[#292A34] shadow-md' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar / Row */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    
                    {/* Worker Info */}
                    <div className="flex items-center gap-3.5 min-w-[240px]">
                      <div className="w-12 h-12 rounded-2xl bg-[#292A34] text-white flex items-center justify-center text-xl font-bold shrink-0">
                        {item.staff.avatar || '👤'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-[#292A34]">{item.staff.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.staff.role === 'manager' ? 'bg-[#E31C2B] text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.staff.role === 'manager' ? 'المدير العام' : 'عامل استوديو'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
                          <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-[#E31C2B]" />
                            {item.staff.workSchedule || `${item.staff.shiftStartTime || '08:30'} - ${item.staff.shiftEndTime || '17:00'}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hourly Rate & Hours Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto text-xs">
                      
                      {/* Hourly Rate with Quick Edit Button */}
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                        <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between">
                          <span>الأجر بالساعة:</span>
                          <button
                            onClick={() => setEditingRateStaff({ staff: item.staff, newRate: item.hourlyRate })}
                            className="text-sky-600 hover:text-sky-800 p-0.5 cursor-pointer"
                            title="تعديل أجر الساعة"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="font-mono font-black text-sm text-[#292A34] mt-0.5">
                          {item.hourlyRate} <span className="text-[10px] font-normal text-slate-500">دج/ساعة</span>
                        </div>
                      </div>

                      {/* Logged Hours */}
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                        <div className="text-[10px] text-slate-500 font-bold">ساعات العمل:</div>
                        <div className="font-mono font-black text-sm text-sky-700 mt-0.5">
                          {item.totalHours} <span className="text-[10px] font-normal text-slate-500">ساعة</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">({item.recordsCount} يوم حضور)</div>
                      </div>

                      {/* Overtime Hours */}
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                        <div className="text-[10px] text-slate-500 font-bold">الساعات الإضافية:</div>
                        <div className="font-mono font-black text-sm text-amber-600 mt-0.5">
                          {item.overtimeHours > 0 ? `+${item.overtimeHours} س` : '0 س'}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">({item.overtimePay > 0 ? `+${formatCurrency(item.overtimePay)}` : 'عادي'})</div>
                      </div>

                      {/* Net Total Salary */}
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                        <div className="text-[10px] text-emerald-800 font-bold">صافي الراتب المستحق:</div>
                        <div className="font-mono font-black text-sm text-emerald-700 mt-0.5">
                          {formatCurrency(item.netSalary)}
                        </div>
                        <div className="text-[9px] text-emerald-600 font-medium">جاهز للصرف</div>
                      </div>

                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-2 lg:pt-0">
                      
                      <button
                        onClick={() => handleRecordPayoutExpense(item)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                        title="تسجيل صرف الراتب كمصروف في الاستوديو"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>صرف الراتب</span>
                      </button>

                      <button
                        onClick={() => setPrintingPayslip(item)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#292A34] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        title="طباعة كشف الراتب الرسمي"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>كشف الراتب</span>
                      </button>

                      <button
                        onClick={() => setExpandedWorkerId(isExpanded ? null : item.staff.id)}
                        className="px-3 py-2 bg-[#292A34] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-[#373946]"
                      >
                        <span>{isExpanded ? 'إخفاء التفاصيل' : 'تفاصيل الدوام'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                  </div>

                  {/* Expanded Section: Daily Breakdown & Bonuses/Deductions */}
                  {isExpanded && (
                    <div className="bg-[#F9FAFB] border-t border-slate-200 p-4 sm:p-5 space-y-4 animate-in fade-in">
                      
                      {/* Bonuses & Deductions Modifiers */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                        <h5 className="text-xs font-black text-[#292A34] flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>تعديل المكافآت والحوافز أو الخصومات للشهر:</span>
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Bonus input */}
                          <div className="flex items-center gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                            <PlusCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div className="flex-1">
                              <label className="text-[11px] font-bold text-emerald-900 block mb-1">
                                مكافأة إنتاجية أو حافز مبيعات (دج):
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="100"
                                  placeholder="0 دج"
                                  value={item.bonus || ''}
                                  onChange={(e) => handleSetAdjustment(item.staff.id, 'bonus', Number(e.target.value))}
                                  className="w-32 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#292A34] focus:outline-none focus:border-emerald-500"
                                />
                                <span className="text-xs font-bold text-emerald-800">
                                  {item.bonus > 0 ? `+${formatCurrency(item.bonus)}` : 'لا يوجد حافز'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Deduction input */}
                          <div className="flex items-center gap-3 bg-rose-50/60 p-3 rounded-xl border border-rose-200">
                            <MinusCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <div className="flex-1">
                              <label className="text-[11px] font-bold text-rose-900 block mb-1">
                                خصم غياب / تأخير أو سلفة (دج):
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="100"
                                  placeholder="0 دج"
                                  value={item.deduction || ''}
                                  onChange={(e) => handleSetAdjustment(item.staff.id, 'deduction', Number(e.target.value))}
                                  className="w-32 bg-white border border-rose-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#292A34] focus:outline-none focus:border-rose-500"
                                />
                                <span className="text-xs font-bold text-rose-800">
                                  {item.deduction > 0 ? `-${formatCurrency(item.deduction)}` : 'لا يوجد خصم'}
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Daily Attendance Logs Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-slate-700">سجل أيام وساعات الحضور الموثقة:</h5>
                          <span className="text-[11px] text-slate-500">
                            معدل الحساب: {item.hourlyRate} دج لكل 60 دقيقة دوام
                          </span>
                        </div>

                        {item.dailyBreakdown.length === 0 ? (
                          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center text-xs text-slate-400 font-bold">
                            لا توجد جلسات دوام مسجلة لهذا العامل في الفترة المحددة.
                          </div>
                        ) : (
                          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-xs">
                            <table className="w-full text-right text-xs">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                  <th className="p-2.5">اليوم والتاريخ</th>
                                  <th className="p-2.5">وقت الدخول (Clock-In)</th>
                                  <th className="p-2.5">وقت الخروج (Clock-Out)</th>
                                  <th className="p-2.5 text-center">المدة المنقضية</th>
                                  <th className="p-2.5 text-left">المستحق المحسوب</th>
                                  {onDeleteAttendance && <th className="p-2.5 text-center w-10">إجراء</th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium">
                                {item.dailyBreakdown.map(day => (
                                  <tr key={day.id} className="hover:bg-slate-50">
                                    <td className="p-2.5">
                                      <div className="font-bold text-[#292A34]">{day.dayName}</div>
                                      <div className="font-mono text-[10px] text-slate-500">{formatDate(day.date)}</div>
                                    </td>
                                    <td className="p-2.5 font-mono font-bold text-emerald-700">
                                      {formatTime(day.clockIn)}
                                    </td>
                                    <td className="p-2.5 font-mono font-bold text-rose-700">
                                      {day.clockOut ? formatTime(day.clockOut) : <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">حاضر الآن (دوام مستمر)</span>}
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-bold text-slate-700">
                                      {Math.floor(day.minutes / 60)} س و {day.minutes % 60} د
                                      {day.isOvertime && (
                                        <span className="mr-1 text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-bold">
                                          إضافي
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-left font-mono font-black text-[#292A34]">
                                      {formatCurrency(day.dayEarnings)}
                                    </td>
                                    {onDeleteAttendance && (
                                      <td className="p-2.5 text-center">
                                        <button
                                          onClick={() => {
                                            if (window.confirm('هل أنت متأكد من حذف هذا السجل الزمني؟')) {
                                              onDeleteAttendance(day.id);
                                            }
                                          }}
                                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                          title="حذف هذا السجل"
                                        >
                                          <MinusCircle className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* =====================================================================
          MODAL: EDIT HOURLY RATE (أجر الساعة)
      ===================================================================== */}
      {editingRateStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span>تعديل الأجر بالساعة: {editingRateStaff.staff.name}</span>
              </div>
              <button 
                onClick={() => setEditingRateStaff(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHourlyRate} className="p-5 space-y-4 text-xs font-medium">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">
                  الأجر بالساعة الجديد (دج/ساعة)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    step="10"
                    required
                    value={editingRateStaff.newRate}
                    onChange={(e) => setEditingRateStaff({
                      ...editingRateStaff,
                      newRate: Number(e.target.value)
                    })}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-black text-base focus:outline-none focus:border-[#E31C2B]"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                    دج / ساعة
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  مثال: 250 دج، 300 دج، أو 500 دج حسب كفاءة وخبرة العامل
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600">خيارات سريعة مقترحة:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[200, 250, 300, 400].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditingRateStaff({ ...editingRateStaff, newRate: val })}
                      className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-mono font-bold text-slate-800"
                    >
                      {val} دج
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRateStaff(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-black shadow-md shadow-[#E31C2B]/30 cursor-pointer"
                >
                  حفظ وتطبيق فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD MANUAL ATTENDANCE (إضافة ساعات عمل يدوية)
      ===================================================================== */}
      {showManualAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2 font-black text-sm">
                <Clock3 className="w-5 h-5 text-amber-400" />
                <span>إضافة وتوثيق ساعات عمل يدوية لعامل</span>
              </div>
              <button 
                onClick={() => setShowManualAttendanceModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualAttendance} className="p-5 space-y-3.5 text-xs font-medium">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">اختيار العامل</label>
                <select
                  value={manualStaffId}
                  onChange={(e) => setManualStaffId(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                >
                  {allStaff.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.hourlyRate || 250} دج/ساعة)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">تاريخ الدوام</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">عدد ساعات العمل الفعلية</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-black focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">بيان أو سبب التوثيق اليدوي</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="مثال: دوام إضافي لإنجاز جلسة تصوير، نسيان تسجيل الدخول..."
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowManualAttendanceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#292A34] hover:bg-[#373946] text-white font-black shadow-md cursor-pointer"
                >
                  حفظ في سجل الحضور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: PRINT PAYSLIP (كشف الراتب الرسمي)
      ===================================================================== */}
      {printingPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white border-2 border-slate-300 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Top Actions */}
            <div className="bg-[#292A34] text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>كشف الراتب والمستحقات المعتمد</span>
              </div>
              <button 
                onClick={() => setPrintingPayslip(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Printable Payslip Body */}
            <div id="fotop-payslip-content" className="p-6 space-y-4 text-slate-800 font-['Cairo',sans-serif]">
              
              {/* Studio Header */}
              <div className="flex items-center justify-between border-b-2 border-[#292A34] pb-3">
                <div>
                  <h2 className="text-xl font-black text-[#E31C2B] tracking-tight">استوديو فوتوب • FOTOP STUDIO</h2>
                  <p className="text-xs text-slate-600 font-bold">كشف حساب مستحقات الأجور وساعات الدوام الموثقة</p>
                </div>
                <div className="text-left font-mono text-xs text-slate-500 font-bold">
                  <div>تاريخ الإصدار: {formatDate(todayStr)}</div>
                  <div className="text-[10px] text-slate-400">نظام Fotop ERP</div>
                </div>
              </div>

              {/* Employee & Period Details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block">اسم الموظف:</span>
                  <span className="text-sm font-black text-[#292A34]">{printingPayslip.staff.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">الصفة الوظيفية:</span>
                  <span className="font-bold text-slate-800">
                    {printingPayslip.staff.role === 'manager' ? 'المدير العام (fouad)' : 'عامل استوديو'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">مواقيت العمل المقررة:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {printingPayslip.staff.workSchedule || `${printingPayslip.staff.shiftStartTime || '08:30'} - ${printingPayslip.staff.shiftEndTime || '17:00'}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">الأجر المعتمد للساعة:</span>
                  <span className="font-mono font-black text-[#E31C2B]">
                    {printingPayslip.hourlyRate} دج / ساعة
                  </span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-[#292A34] text-white font-bold">
                    <tr>
                      <th className="p-2.5">البيان والتفصيل</th>
                      <th className="p-2.5 text-center">الكمية / الساعات</th>
                      <th className="p-2.5 text-left">المبلغ المستحق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="p-2.5 font-bold">ساعات العمل الأساسية الموثقة</td>
                      <td className="p-2.5 text-center font-mono font-bold">{(printingPayslip.totalHours - printingPayslip.overtimeHours).toFixed(1)} س</td>
                      <td className="p-2.5 text-left font-mono font-bold">{formatCurrency(printingPayslip.baseSalary)}</td>
                    </tr>
                    {printingPayslip.overtimeHours > 0 && (
                      <tr className="bg-amber-50/50">
                        <td className="p-2.5 font-bold text-amber-900">ساعات عمل إضافية (Overtime)</td>
                        <td className="p-2.5 text-center font-mono font-bold text-amber-900">+{printingPayslip.overtimeHours} س</td>
                        <td className="p-2.5 text-left font-mono font-bold text-amber-900">+{formatCurrency(printingPayslip.overtimePay)}</td>
                      </tr>
                    )}
                    {printingPayslip.bonus > 0 && (
                      <tr className="bg-emerald-50/50">
                        <td className="p-2.5 font-bold text-emerald-900">مكافآت وحوافز إنتاجية</td>
                        <td className="p-2.5 text-center text-emerald-700">حافز مبيعات</td>
                        <td className="p-2.5 text-left font-mono font-bold text-emerald-900">+{formatCurrency(printingPayslip.bonus)}</td>
                      </tr>
                    )}
                    {printingPayslip.deduction > 0 && (
                      <tr className="bg-rose-50/50">
                        <td className="p-2.5 font-bold text-rose-900">خصومات غياب أو سلفيات نقدية</td>
                        <td className="p-2.5 text-center text-rose-700">خصم</td>
                        <td className="p-2.5 text-left font-mono font-bold text-rose-900">-{formatCurrency(printingPayslip.deduction)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-black text-sm border-t-2 border-slate-300">
                    <tr>
                      <td className="p-3 text-[#292A34]">صافي الراتب الإجمالي المستحق للصرف:</td>
                      <td className="p-3 text-center font-mono text-xs text-slate-500">{printingPayslip.totalHours} س إجمالي</td>
                      <td className="p-3 text-left font-mono text-base text-[#E31C2B]">
                        {formatCurrency(printingPayslip.netSalary)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-6 text-center text-xs font-bold border-t border-slate-200">
                <div>
                  <p className="text-slate-500 mb-6">توقيع واستلام الموظف:</p>
                  <div className="border-b border-dashed border-slate-400 w-32 mx-auto"></div>
                </div>
                <div>
                  <p className="text-slate-500 mb-6">توقيع وختم الإدارة (فؤاد):</p>
                  <div className="border-b border-dashed border-slate-400 w-32 mx-auto"></div>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPrintingPayslip(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold"
              >
                إغلاق
              </button>

              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 rounded-xl bg-[#292A34] hover:bg-[#373946] text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>طباعة كشف الراتب</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
