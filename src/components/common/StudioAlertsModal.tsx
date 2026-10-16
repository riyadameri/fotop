import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  Coins, 
  UserX, 
  Wallet, 
  Clock, 
  TrendingDown, 
  CheckCircle2, 
  X, 
  ArrowLeft,
  Boxes
} from 'lucide-react';
import { StudioAlert, AlertType } from '../../utils/alertsHelper';
import { TabType } from '../Navigation';

interface StudioAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: StudioAlert[];
  onNavigateTab: (tab: TabType) => void;
}

export const StudioAlertsModal: React.FC<StudioAlertsModalProps> = ({
  isOpen,
  onClose,
  alerts = [],
  onNavigateTab
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | AlertType>('all');

  if (!isOpen) return null;

  const filterTabs: { id: 'all' | AlertType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: `الكل (${alerts.length})`, icon: Bell },
    { id: 'low_stock', label: `نقص المخزون (${alerts.filter(a => a.type === 'low_stock').length})`, icon: Boxes },
    { id: 'cash_discrepancy', label: `فرق الصندوق (${alerts.filter(a => a.type === 'cash_discrepancy').length})`, icon: Coins },
    { id: 'absent_worker', label: `عامل غائب (${alerts.filter(a => a.type === 'absent_worker').length})`, icon: UserX },
    { id: 'unusual_expense', label: `مصروف غير معتاد (${alerts.filter(a => a.type === 'unusual_expense').length})`, icon: Wallet },
    { id: 'incomplete_order', label: `عملية غير مكتملة (${alerts.filter(a => a.type === 'incomplete_order').length})`, icon: Clock },
    { id: 'abnormal_revenue_drop', label: `انخفاض المداخيل (${alerts.filter(a => a.type === 'abnormal_revenue_drop').length})`, icon: TrendingDown },
  ];

  const filteredAlerts = selectedFilter === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === selectedFilter);

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'low_stock': return <Boxes className="w-5 h-5 text-rose-500" />;
      case 'cash_discrepancy': return <Coins className="w-5 h-5 text-amber-500" />;
      case 'absent_worker': return <UserX className="w-5 h-5 text-orange-500" />;
      case 'unusual_expense': return <Wallet className="w-5 h-5 text-purple-500" />;
      case 'incomplete_order': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'abnormal_revenue_drop': return <TrendingDown className="w-5 h-5 text-amber-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    }
  };

  const getSeverityBadge = (severity: StudioAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">حرج وعاجل</span>;
      case 'warning':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">تحذير مهم</span>;
      case 'info':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">تنبيه وملاحظة</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-300 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#292A34] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#E31C2B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E31C2B] text-white">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">مركز التنبيهات والرقابة الذكية</h3>
                {alerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-black text-xs shadow-xs">
                    {alerts.length} تنبيه
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                متابعة لحظية لنواقص المخزون، فروق الصندوق، غياب العمال، والمصاريف غير المعتادة
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Category Filter Pills */}
        <div className="bg-slate-50 border-b border-slate-200 p-2.5 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
          {filterTabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#292A34] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Alerts Content List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-black text-base text-[#292A34]">لا توجد تنبيهات في هذا القسم</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  جميع العمليات المخزنية، مطابقة الصندوق، دوام العمال، والمصروفات تعمل بصورة طبيعية ومنتظمة.
                </p>
              </div>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div 
                key={alert.id}
                className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#292A34]">{alert.title}</span>
                      {getSeverityBadge(alert.severity)}
                      <span className="text-[10px] text-slate-500 font-medium">({alert.typeLabel})</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {alert.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab(alert.actionTab);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#292A34] hover:bg-[#E31C2B] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs self-end sm:self-center shrink-0 cursor-pointer"
                >
                  <span>{alert.actionLabel}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-slate-600" />
            <span>نظام الحماية والمراقبة الذكي لاستوديو فوتوب</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
