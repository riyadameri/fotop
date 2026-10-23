import React, { useState, useMemo } from 'react';
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
  CheckCheck,
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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | AlertType>('all');

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
    setReadAlertIds(prev => {
      const next = new Set(prev);
      alerts.forEach(a => next.add(a.id));
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

  const unreadCount = useMemo(() => {
    return alerts.filter(a => !readAlertIds.has(a.id)).length;
  }, [alerts, readAlertIds]);

  if (!isOpen) return null;

  const filterTabs: { id: 'all' | 'unread' | AlertType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: `الكل (${alerts.length})`, icon: Bell },
    { id: 'unread', label: `غير مقروءة (${unreadCount})`, icon: CheckCheck },
    { id: 'low_stock', label: `نقص المخزون (${alerts.filter(a => a.type === 'low_stock').length})`, icon: Boxes },
    { id: 'cash_discrepancy', label: `فرق الصندوق (${alerts.filter(a => a.type === 'cash_discrepancy').length})`, icon: Coins },
    { id: 'absent_worker', label: `عامل غائب (${alerts.filter(a => a.type === 'absent_worker').length})`, icon: UserX },
    { id: 'unusual_expense', label: `مصروف غير معتاد (${alerts.filter(a => a.type === 'unusual_expense').length})`, icon: Wallet },
    { id: 'incomplete_order', label: `عملية غير مكتملة (${alerts.filter(a => a.type === 'incomplete_order').length})`, icon: Clock },
    { id: 'abnormal_revenue_drop', label: `انخفاض المداخيل (${alerts.filter(a => a.type === 'abnormal_revenue_drop').length})`, icon: TrendingDown },
  ];

  const filteredAlerts = alerts.filter(a => {
    if (selectedFilter === 'unread') return !readAlertIds.has(a.id);
    if (selectedFilter === 'all') return true;
    return a.type === selectedFilter;
  });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-white border border-slate-300 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#292A34] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#E31C2B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E31C2B] text-white">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base text-white">مركز التنبيهات والرقابة الذكية</h3>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-black text-xs shadow-xs animate-pulse">
                    {unreadCount} غير مقروء
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
                    الكل مقروء ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                متابعة لحظية لنواقص المخزون، فروق الصندوق، غياب العمال، والمصاريف غير المعتادة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAlertsAsRead}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="تعيين جميع التنبيهات كمقروءة"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">تعيين الكل كمقروء</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                <h4 className="font-black text-base text-[#292A34]">
                  {selectedFilter === 'unread' ? 'رائع! لا توجد تنبيهات غير مقروءة' : 'لا توجد تنبيهات في هذا القسم'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  جميع العمليات المخزنية، مطابقة الصندوق، دوام العمال، والمصروفات تعمل بصورة طبيعية ومنتظمة.
                </p>
              </div>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const isRead = readAlertIds.has(alert.id);

              return (
                <div 
                  key={alert.id}
                  onClick={() => {
                    markAlertAsRead(alert.id);
                    onClose();
                    onNavigateTab(alert.actionTab);
                  }}
                  className={`pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer relative ${
                    isRead
                      ? 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/60 opacity-80'
                      : 'bg-white hover:bg-rose-50/40 border-rose-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <div className={`p-2 rounded-xl border shadow-2xs mt-0.5 ${
                        isRead ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-200'
                      }`}>
                        {getAlertIcon(alert.type)}
                      </div>
                      {!isRead && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs ${isRead ? 'font-bold text-slate-600' : 'font-black text-[#292A34]'}`}>
                          {alert.title}
                        </span>
                        {getSeverityBadge(alert.severity)}
                        <span className="text-[10px] text-slate-500 font-medium">({alert.typeLabel})</span>
                        
                        {isRead ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                            <CheckCheck className="w-2.5 h-2.5" />
                            <span>مقروء</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>جديد</span>
                          </span>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed font-normal ${isRead ? 'text-slate-500' : 'text-slate-600'}`}>
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAlertReadStatus(alert.id);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        isRead
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                      }`}
                      title={isRead ? 'إعادة التعيين كغير مقروء' : 'تعيين كمقروء'}
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAlertAsRead(alert.id);
                        onClose();
                        onNavigateTab(alert.actionTab);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#292A34] hover:bg-[#E31C2B] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
                    >
                      <span>{alert.actionLabel}</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-slate-600" />
              <span>نظام الحماية والمراقبة الذكي</span>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAlertsAsRead}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>تعيين الكل كمقروء</span>
              </button>
            )}
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

