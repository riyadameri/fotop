/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { PosView } from './components/POS/PosView';
import { ReceiptModal } from './components/POS/ReceiptModal';
import { InventoryView } from './components/Inventory/InventoryView';
import { WasteView } from './components/Waste/WasteView';
import { ShiftsView } from './components/Shifts/ShiftsView';
import { AccountingView } from './components/Accounting/AccountingView';
import { HumanResourcesView } from './components/HR/HumanResourcesView';
import { OrdersView } from './components/Orders/OrdersView';
import { SpecsView } from './components/Specs/SpecsView';
import { SettingsView } from './components/Settings/SettingsView';
import { LoginScreen } from './components/Auth/LoginScreen';

import { 
  INITIAL_MATERIALS, 
  INITIAL_SERVICES, 
  INITIAL_STAFF, 
  INITIAL_SHIFTS, 
  INITIAL_ORDERS, 
  INITIAL_WASTE_RECORDS, 
  INITIAL_EXPENSES,
  INITIAL_ATTENDANCE
} from './data/initialData';

import { 
  Material, 
  ServiceItem, 
  Staff, 
  Shift, 
  Order, 
  WasteRecord, 
  Expense, 
  OrderStatus,
  AttendanceRecord,
  SalaryPayment 
} from './types';

import { api } from './api';
import { soundManager } from './utils/audio';

export function App() {
  const DB_VERSION_KEY = 'fotop_backend_clean_v1';

  // State
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [currentStaff, setCurrentStaff] = useState<Staff>(INITIAL_STAFF[0]);
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>(INITIAL_WASTE_RECORDS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('pos');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fotop_header_compact') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHeaderCompact = () => {
    setIsHeaderCompact(prev => {
      const next = !prev;
      try {
        localStorage.setItem('fotop_header_compact', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };
  const [printedOrder, setPrintedOrder] = useState<Order | null>(null);
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState<boolean>(false);
  const [showQuickWasteModal, setShowQuickWasteModal] = useState<boolean>(false);
  
  // Quick Expense Form
  const [quickExpTitle, setQuickExpTitle] = useState<string>('');
  const [quickExpAmount, setQuickExpAmount] = useState<string>('');
  const [quickExpCategory, setQuickExpCategory] = useState<Expense['category']>('materials');

  // Quick Waste Form
  const [quickWasteMatId, setQuickWasteMatId] = useState<string>('');
  const [quickWasteQty, setQuickWasteQty] = useState<string>('1');
  const [quickWasteReason, setQuickWasteReason] = useState<WasteRecord['reason']>('print_error');

  // 1. Initial Load from Backend API
  useEffect(() => {
    async function loadData() {
      try {
        // Clear obsolete localstorage cache to ensure no old data conflicts
        if (!localStorage.getItem(DB_VERSION_KEY)) {
          localStorage.clear();
          localStorage.setItem(DB_VERSION_KEY, 'true');
        }

        const data = await api.getAllData();
        if (data) {
          setMaterials(data.materials || []);
          setServices(data.services || []);
          const staff = data.staff && data.staff.length > 0 ? data.staff : INITIAL_STAFF;
          setStaffList(staff);
          setCurrentStaff(staff[0]);
          setShifts(data.shifts || []);
          setOrders(data.orders || []);
          setWasteRecords(data.wasteRecords || []);
          setExpenses(data.expenses || []);
          setAttendanceLogs(data.attendanceLogs || []);
          setSalaryPayments(data.salaryPayments || []);
        }
      } catch (err) {
        console.warn('Could not fetch from backend API, using initial state:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Active shift calculation
  const activeShift = (shifts || []).find(s => s.status === 'open');
  const lowStockCount = (materials || []).filter(m => m.currentStock <= m.minThreshold).length;
  const openOrdersCount = (orders || []).filter(o => o.status !== 'delivered').length;

  // Clock-In for worker
  const handleClockIn = async (staffId: string) => {
    const st = staffList.find(s => s.id === staffId) || currentStaff;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      staffId: st.id,
      staffName: st.name,
      clockIn: now.toISOString(),
      date: todayStr,
      status: 'clocked_in',
      notes: 'تسجيل دخول وبداية الدوام'
    };
    setAttendanceLogs(prev => [newRecord, ...(prev || [])]);

    try {
      const updated = await api.clockIn(st.id, st.name);
      if (updated) setAttendanceLogs(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Clock-Out for worker
  const handleClockOut = async (staffId: string) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    setAttendanceLogs(prev => {
      return (prev || []).map(att => {
        if (att.staffId === staffId && att.status === 'clocked_in' && att.date === todayStr) {
          const startTime = new Date(att.clockIn).getTime();
          const endTime = now.getTime();
          const totalMinutes = Math.max(1, Math.round((endTime - startTime) / (1000 * 60)));
          return {
            ...att,
            clockOut: now.toISOString(),
            status: 'clocked_out',
            totalMinutes,
            notes: 'تسجيل خروج ونهاية الدوام'
          };
        }
        return att;
      });
    });

    try {
      const updated = await api.clockOut(staffId);
      if (updated) setAttendanceLogs(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Staff Management (Manager)
  const handleAddStaff = async (newStaff: Staff) => {
    setStaffList(prev => [...(prev || []), newStaff]);
    try {
      const updated = await api.addStaff(newStaff);
      if (updated) setStaffList(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStaff = async (updated: Staff) => {
    setStaffList(prev => (prev || []).map(s => s.id === updated.id ? updated : s));
    if (currentStaff.id === updated.id) {
      setCurrentStaff(updated);
    }
    try {
      const updatedList = await api.updateStaff(updated);
      if (updatedList) setStaffList(updatedList);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    setStaffList(prev => (prev || []).filter(s => s.id !== staffId));
    try {
      const updated = await api.deleteStaff(staffId);
      if (updated) setStaffList(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Manual Attendance Logging
  const handleAddManualAttendance = async (record: Partial<AttendanceRecord>) => {
    const rate = Number(record.hourlyRateApplied) || 250;
    const mins = Number(record.totalMinutes) || 0;
    const earnedPay = Math.round((mins / 60) * rate);
    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      staffId: record.staffId || currentStaff.id,
      staffName: record.staffName || currentStaff.name,
      date: record.date || new Date().toISOString().split('T')[0],
      clockIn: record.clockIn || new Date().toISOString(),
      clockOut: record.clockOut || new Date().toISOString(),
      status: 'clocked_out',
      totalMinutes: mins,
      hourlyRateApplied: rate,
      earnedPay,
      notes: record.notes || 'سجل حضور يدوي موثق'
    };
    setAttendanceLogs(prev => [newRecord, ...(prev || [])]);
    try {
      const updated = await api.addManualAttendance(record);
      if (updated) setAttendanceLogs(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    setAttendanceLogs(prev => (prev || []).filter(a => a.id !== id));
    try {
      const updated = await api.deleteAttendance(id);
      if (updated) setAttendanceLogs(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Service and Retail Item Management
  const handleAddService = async (newService: ServiceItem) => {
    setServices(prev => [newService, ...(prev || [])]);
    try {
      const updated = await api.addService(newService);
      if (updated) setServices(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateService = async (updatedService: ServiceItem) => {
    setServices(prev => (prev || []).map(s => s.id === updatedService.id ? updatedService : s));
    try {
      const updated = await api.updateService(updatedService);
      if (updated) setServices(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    setServices(prev => (prev || []).filter(s => s.id !== serviceId));
    try {
      const updated = await api.deleteService(serviceId);
      if (updated) setServices(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Checkout order with automatic BOM inventory deduction
  const handleCheckoutOrder = async (orderData: Omit<Order, 'id' | 'ticketNumber' | 'createdAt'>) => {
    const newId = `ord_${Date.now()}`;
    const nextTicketNum = orders.length > 0 ? 1000 + orders.length + 1 : 1001;
    const ticketNumber = `FTP-${nextTicketNum}`;
    const createdAt = new Date().toISOString();

    const newOrder: Order = {
      ...orderData,
      id: newId,
      ticketNumber,
      createdAt
    };

    // Optimistic UI updates
    setOrders(prev => [newOrder, ...prev]);

    if (orderData.materialsDeducted && orderData.materialsDeducted.length > 0) {
      setMaterials(prevMaterials => {
        return (prevMaterials || []).map(mat => {
          const deduction = orderData.materialsDeducted?.find(d => d.materialId === mat.id);
          if (deduction) {
            const updatedStock = Math.max(0, Number((mat.currentStock - deduction.quantity).toFixed(2)));
            return { ...mat, currentStock: updatedStock };
          }
          return mat;
        });
      });
    }

    if (activeShift) {
      setShifts(prevShifts => {
        return (prevShifts || []).map(s => {
          if (s.id === activeShift.id) {
            const isCash = orderData.paymentMethod === 'cash';
            const cashAdded = isCash ? orderData.paidAmount : 0;
            return {
              ...s,
              cashSales: s.cashSales + cashAdded,
              expectedCash: s.expectedCash + cashAdded,
              ordersCount: s.ordersCount + 1
            };
          }
          return s;
        });
      });
    }

    setPrintedOrder(newOrder);
    soundManager.playSuccessSound();

    // Call backend API
    try {
      const res = await api.createOrder(orderData);
      if (res) {
        setOrders(res.orders);
        setMaterials(res.materials);
        setShifts(res.shifts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Waste record
  const handleAddWasteRecord = async (record: Omit<WasteRecord, 'id' | 'createdAt'>) => {
    const newWaste: WasteRecord = {
      ...record,
      id: `wst_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setWasteRecords(prev => [newWaste, ...(prev || [])]);

    setMaterials(prev => {
      return (prev || []).map(m => {
        if (m.id === record.materialId) {
          return {
            ...m,
            currentStock: Math.max(0, Number((m.currentStock - record.quantity).toFixed(2)))
          };
        }
        return m;
      });
    });

    try {
      const res = await api.addWasteRecord(record);
      if (res) {
        setWasteRecords(res.wasteRecords);
        setMaterials(res.materials);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Restock Material
  const handleRestock = async (materialId: string, quantityToAdd: number, newUnitCost?: number) => {
    setMaterials(prev => {
      return (prev || []).map(m => {
        if (m.id === materialId) {
          return {
            ...m,
            currentStock: m.currentStock + quantityToAdd,
            unitCost: newUnitCost !== undefined && newUnitCost > 0 ? newUnitCost : m.unitCost
          };
        }
        return m;
      });
    });

    try {
      const updated = await api.restockMaterial(materialId, quantityToAdd, newUnitCost);
      if (updated) setMaterials(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Add Material
  const handleAddMaterial = async (newMat: Omit<Material, 'id'>) => {
    const mat: Material = {
      ...newMat,
      id: `mat_${Date.now()}`
    };
    setMaterials(prev => [...(prev || []), mat]);
    try {
      const updated = await api.addMaterial(mat);
      if (updated) setMaterials(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Update Material
  const handleUpdateMaterial = async (updated: Material) => {
    setMaterials(prev => (prev || []).map(m => m.id === updated.id ? updated : m));
    try {
      const updatedList = await api.updateMaterial(updated);
      if (updatedList) setMaterials(updatedList);
    } catch (e) {
      console.error(e);
    }
  };

  // Shifts Operations
  const handleOpenShift = async (staffId: string, staffName: string, openingCash: number) => {
    const newShift: Shift = {
      id: `shf_${Date.now()}`,
      staffId,
      staffName,
      startTime: new Date().toISOString(),
      openingCash,
      cashSales: 0,
      expenses: 0,
      expectedCash: openingCash,
      ordersCount: 0,
      status: 'open'
    };
    setShifts(prev => [newShift, ...(prev || [])]);

    try {
      const updated = await api.openShift(staffId, staffName, openingCash);
      if (updated) setShifts(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseShift = async (shiftId: string, actualCash: number, notes?: string) => {
    setShifts(prev => {
      return (prev || []).map(s => {
        if (s.id === shiftId) {
          const diff = actualCash - s.expectedCash;
          return {
            ...s,
            endTime: new Date().toISOString(),
            actualCash,
            difference: diff,
            status: 'closed',
            notes
          };
        }
        return s;
      });
    });

    try {
      const updated = await api.closeShift(shiftId, actualCash, notes);
      if (updated) setShifts(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Add Expense
  const handleAddExpense = async (exp: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...exp,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setExpenses(prev => [newExp, ...(prev || [])]);

    if (activeShift) {
      setShifts(prev => {
        return (prev || []).map(s => {
          if (s.id === activeShift.id) {
            return {
              ...s,
              expenses: s.expenses + exp.amount,
              expectedCash: s.expectedCash - exp.amount
            };
          }
          return s;
        });
      });
    }

    try {
      const res = await api.addExpense(exp);
      if (res) {
        setExpenses(res.expenses);
        setShifts(res.shifts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const isCompleted = newStatus === 'ready' || newStatus === 'delivered';
    const nowIso = new Date().toISOString();
    setOrders(prev => (prev || []).map(o => {
      if (o.id === orderId) {
        const completedAt = isCompleted ? (o.completedAt || nowIso) : undefined;
        let serviceDurationMinutes = o.serviceDurationMinutes;
        if (completedAt && o.createdAt) {
          const diffMs = new Date(completedAt).getTime() - new Date(o.createdAt).getTime();
          serviceDurationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
        }
        return { ...o, status: newStatus, completedAt, serviceDurationMinutes };
      }
      return o;
    }));
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus);
      if (updated) setOrders(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // Salary Payments Handlers
  const handleAddSalaryPayment = async (payment: Partial<SalaryPayment> & { recordAsStudioExpense?: boolean }) => {
    try {
      const res = await api.addSalaryPayment(payment);
      if (res) {
        setSalaryPayments(res.salaryPayments || []);
        if (res.expenses) setExpenses(res.expenses);
        if (res.shifts) setShifts(res.shifts);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleUpdateSalaryPayment = async (id: string, payment: Partial<SalaryPayment>) => {
    try {
      const res = await api.updateSalaryPayment(id, payment);
      if (res) {
        setSalaryPayments(res.salaryPayments || []);
        if (res.expenses) setExpenses(res.expenses);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleDeleteSalaryPayment = async (id: string) => {
    try {
      const res = await api.deleteSalaryPayment(id);
      if (res) {
        setSalaryPayments(res.salaryPayments || []);
        if (res.expenses) setExpenses(res.expenses);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // Reset to default data (Wipes everything on server & client, keeping only fouad manager)
  const handleResetData = async () => {
    if (window.confirm('هل أنت متأكد من تفريغ كافة البيانات وإعادة تعيين النظام بالكامل؟ سيبقى فقط حساب المدير فؤاد.')) {
      try {
        localStorage.clear();
        localStorage.setItem(DB_VERSION_KEY, 'true');
        const freshData = await api.resetAllData();
        if (freshData) {
          setMaterials(freshData.materials || []);
          setServices(freshData.services || []);
          setStaffList(freshData.staff || INITIAL_STAFF);
          setCurrentStaff(freshData.staff?.[0] || INITIAL_STAFF[0]);
          setShifts(freshData.shifts || []);
          setOrders(freshData.orders || []);
          setWasteRecords(freshData.wasteRecords || []);
          setExpenses(freshData.expenses || []);
          setAttendanceLogs(freshData.attendanceLogs || []);
          setSalaryPayments(freshData.salaryPayments || []);
        }
      } catch (e) {
        console.error(e);
        setMaterials([]);
        setServices([]);
        setStaffList(INITIAL_STAFF);
        setCurrentStaff(INITIAL_STAFF[0]);
        setShifts([]);
        setOrders([]);
        setWasteRecords([]);
        setExpenses([]);
        setAttendanceLogs([]);
        setSalaryPayments([]);
      }
    }
  };

  // Auth Handlers
  const handleLogin = (staff: Staff, autoClockIn: boolean) => {
    setCurrentStaff(staff);
    setIsAuthenticated(true);
    if (autoClockIn) {
      handleClockIn(staff.id);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // If not authenticated, show the Login Screen first
  if (!isAuthenticated) {
    return (
      <LoginScreen
        staffList={staffList}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#292A34] flex flex-col font-['Cairo',sans-serif]">
      
      {/* Top Global Header (Slim & Professional) */}
      <Header
        currentStaff={currentStaff}
        allStaff={staffList}
        onSwitchStaff={setCurrentStaff}
        onLogout={handleLogout}
        activeShift={activeShift}
        attendanceLogs={attendanceLogs}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        onOpenLogWaste={() => setShowQuickWasteModal(true)}
        onOpenExpenseModal={() => setShowQuickExpenseModal(true)}
        onOpenSpecsModal={() => setActiveTab('specs')}
        onResetData={handleResetData}
        materials={materials}
        services={services}
        onNavigateToInventory={() => setActiveTab('inventory')}
        onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isMobileMenuOpen={isMobileNavOpen}
        isCompact={isHeaderCompact}
        onToggleCompact={toggleHeaderCompact}
        onNavigateToHome={() => {
          setActiveTab('pos');
          setIsMobileNavOpen(false);
        }}
        onNavigateToSettings={() => {
          setActiveTab('settings');
          setIsMobileNavOpen(false);
        }}
      />

      {/* Main Responsive Body Layout (Right Sidebar on Desktop in RTL + Main View Area) */}
      <div className="flex-1 flex flex-row w-full min-h-[calc(100vh-54px)]">
        
        {/* Navigation Component (Sidebar on Desktop, Drawer on Mobile) */}
        <Navigation
          currentStaff={currentStaff}
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            setIsMobileNavOpen(false);
          }}
          lowStockCount={lowStockCount}
          openOrdersCount={openOrdersCount}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Main Workspace with Motion Transitions */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-[#E31C2B] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-bold text-slate-500">جاري الاتصال بالخادم وتحميل البيانات...</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.995 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-full"
                >
                  {activeTab === 'pos' && (
                    <PosView
                      services={services || []}
                      materials={materials || []}
                      currentStaff={currentStaff}
                      activeShift={activeShift}
                      onCheckoutOrder={handleCheckoutOrder}
                    />
                  )}

                  {activeTab === 'inventory' && (
                    <InventoryView
                      materials={materials || []}
                      services={services || []}
                      currentStaff={currentStaff}
                      onUpdateMaterial={handleUpdateMaterial}
                      onAddMaterial={handleAddMaterial}
                      onRestock={handleRestock}
                      onAddService={handleAddService}
                      onUpdateService={handleUpdateService}
                      onDeleteService={handleDeleteService}
                      onAddExpense={handleAddExpense}
                    />
                  )}

                  {activeTab === 'waste' && (
                    <WasteView
                      wasteRecords={wasteRecords || []}
                      materials={materials || []}
                      staffList={staffList || []}
                      currentStaff={currentStaff}
                      onAddWasteRecord={handleAddWasteRecord}
                    />
                  )}

                  {activeTab === 'shifts' && (
                    <ShiftsView
                      shifts={shifts || []}
                      activeShift={activeShift}
                      allStaff={staffList || []}
                      currentStaff={currentStaff}
                      onOpenShift={handleOpenShift}
                      onCloseShift={handleCloseShift}
                      onSwitchStaff={setCurrentStaff}
                    />
                  )}

                  {activeTab === 'hr' && (
                    <HumanResourcesView
                      allStaff={staffList || []}
                      salaryPayments={salaryPayments || []}
                      attendanceLogs={attendanceLogs || []}
                      currentStaff={currentStaff}
                      onUpdateStaff={handleUpdateStaff}
                      onAddSalaryPayment={handleAddSalaryPayment}
                      onUpdateSalaryPayment={handleUpdateSalaryPayment}
                      onDeleteSalaryPayment={handleDeleteSalaryPayment}
                      onAddExpense={handleAddExpense}
                      onAddManualAttendance={handleAddManualAttendance}
                      onDeleteAttendance={handleDeleteAttendance}
                    />
                  )}

                  {activeTab === 'accounting' && (
                    <AccountingView
                      orders={orders || []}
                      materials={materials || []}
                      wasteRecords={wasteRecords || []}
                      expenses={expenses || []}
                      shifts={shifts || []}
                      currentStaff={currentStaff}
                      allStaff={staffList || []}
                      attendanceLogs={attendanceLogs || []}
                      salaryPayments={salaryPayments || []}
                      onAddExpense={handleAddExpense}
                      onAddStaff={handleAddStaff}
                      onUpdateStaff={handleUpdateStaff}
                      onDeleteStaff={handleDeleteStaff}
                      onAddManualAttendance={handleAddManualAttendance}
                      onDeleteAttendance={handleDeleteAttendance}
                      onAddSalaryPayment={handleAddSalaryPayment}
                      onUpdateSalaryPayment={handleUpdateSalaryPayment}
                      onDeleteSalaryPayment={handleDeleteSalaryPayment}
                    />
                  )}

                  {activeTab === 'orders' && (
                    <OrdersView
                      orders={orders || []}
                      allStaff={staffList || []}
                      currentStaff={currentStaff}
                      materials={materials || []}
                      expenses={expenses || []}
                      wasteRecords={wasteRecords || []}
                      onSelectOrderForPrint={setPrintedOrder}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                    />
                  )}

                  {activeTab === 'specs' && (
                    <SpecsView onGoToPOS={() => setActiveTab('pos')} />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsView
                      currentStaff={currentStaff}
                      onGoToPOS={() => setActiveTab('pos')}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Footer Branding */}
          <footer className="bg-white/80 border border-slate-200/80 rounded-2xl py-3 px-5 text-center text-xs text-slate-500 mt-8 shadow-xs">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#292A34]">Fotop Studio ERP</span>
                <span>─</span>
                <span>استضافة سحابية: <strong className="text-[#E31C2B]">Redox Cloud Solutions</strong></span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                <span>05 63898395</span>
                <span>•</span>
                <span className="text-slate-400">redox.cloud</span>
              </div>
            </div>
          </footer>
        </main>
      </div>


      {/* Printable Receipt Modal */}
      <ReceiptModal
        order={printedOrder}
        onClose={() => setPrintedOrder(null)}
      />

      {/* Quick Expense Modal from Header */}
      {showQuickExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-black text-sm text-amber-400">تسجيل مصروف سريع من الدرج</span>
              <button onClick={() => setShowQuickExpenseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!quickExpTitle || !quickExpAmount) return;
              handleAddExpense({
                title: quickExpTitle.trim(),
                amount: Number(quickExpAmount),
                category: quickExpCategory,
                staffId: currentStaff.id,
                staffName: currentStaff.name
              });
              setShowQuickExpenseModal(false);
              setQuickExpTitle('');
              setQuickExpAmount('');
            }} className="p-5 space-y-3.5 text-xs font-medium">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">بيان المصروف</label>
                <input
                  type="text"
                  required
                  value={quickExpTitle}
                  onChange={(e) => setQuickExpTitle(e.target.value)}
                  placeholder="شراء مستلزمات سريعة، كابل، ضيافة..."
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">المبلغ (دج)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quickExpAmount}
                    onChange={(e) => setQuickExpAmount(e.target.value)}
                    placeholder="300 دج مثلاً..."
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-black focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">التصنيف</label>
                  <select
                    value={quickExpCategory}
                    onChange={(e) => setQuickExpCategory(e.target.value as any)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  >
                    <option value="materials">شراء مواد</option>
                    <option value="tea_coffee">ضيافة وشاي</option>
                    <option value="maintenance">صيانة</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowQuickExpenseModal(false)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#E31C2B] text-white font-black shadow-md">حفظ وخصم</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Waste Modal from Header */}
      {showQuickWasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <span className="font-black text-sm text-[#E31C2B]">تسجيل تالف ورق أو حبر</span>
              <button onClick={() => setShowQuickWasteModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const m = (materials || []).find(mat => mat.id === (quickWasteMatId || materials[0]?.id));
              if (!m) return;
              const qty = Number(quickWasteQty) || 1;
              handleAddWasteRecord({
                materialId: m.id,
                materialName: m.name,
                quantity: qty,
                unit: m.unit === 'sheet' ? 'ورقة' : m.unit === 'ml' ? 'مل' : 'قطعة',
                reason: quickWasteReason,
                costLoss: qty * m.unitCost,
                staffId: currentStaff.id,
                staffName: currentStaff.name
              });
              setShowQuickWasteModal(false);
            }} className="p-5 space-y-3.5 text-xs font-medium">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">المادة التالفة</label>
                <select
                  value={quickWasteMatId || materials[0]?.id}
                  onChange={(e) => setQuickWasteMatId(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                >
                  {(materials || []).map(m => (
                    <option key={m.id} value={m.id}>{m.name} (متوفر: {m.currentStock})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">الكمية التالفة</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quickWasteQty}
                    onChange={(e) => setQuickWasteQty(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">سبب التلف</label>
                  <select
                    value={quickWasteReason}
                    onChange={(e) => setQuickWasteReason(e.target.value as any)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  >
                    <option value="print_error">خطأ طباعة / بهتان</option>
                    <option value="miscut">خطأ في القص</option>
                    <option value="paper_jam">انحشار ورق</option>
                    <option value="ink_spill">هدر حبر</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button type="button" onClick={() => setShowQuickWasteModal(false)} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#E31C2B] text-white font-black shadow-md">تسجيل وخصم</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
