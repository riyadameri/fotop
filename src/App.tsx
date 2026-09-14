/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Zap, ReceiptText, Layers, Clock, Menu, LayoutDashboard } from 'lucide-react';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { DashboardView } from './components/Dashboard/DashboardView';
import { PosView } from './components/POS/PosView';
import { ReceiptModal } from './components/POS/ReceiptModal';
import { OrderSuccessToast } from './components/common/OrderSuccessToast';
import { InventoryView } from './components/Inventory/InventoryView';
import { WasteView } from './components/Waste/WasteView';
import { ShiftsView } from './components/Shifts/ShiftsView';
import { AccountingView } from './components/Accounting/AccountingView';
import { HumanResourcesView } from './components/HR/HumanResourcesView';
import { OrdersView } from './components/Orders/OrdersView';
import { SpecsView } from './components/Specs/SpecsView';
import { SettingsView } from './components/Settings/SettingsView';
import { LoginScreen } from './components/Auth/LoginScreen';
import { FotopLogo } from './components/common/FotopLogo';

import { 
  INITIAL_MATERIALS, 
  INITIAL_SERVICES, 
  INITIAL_STAFF, 
  INITIAL_SHIFTS, 
  INITIAL_ORDERS, 
  INITIAL_WASTE_RECORDS, 
  INITIAL_EXPENSES,
  INITIAL_ATTENDANCE,
  INITIAL_STORES
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
  SalaryPayment,
  Store 
} from './types';

import { api } from './api';
import { soundManager } from './utils/audio';

export function App() {
  const DB_VERSION_KEY = 'fotop_backend_clean_v1';

  // State
  const [stores, setStores] = useState<Store[]>(INITIAL_STORES);
  const [currentStoreId, setCurrentStoreId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('fotop_active_store_id');
      if (saved) return saved;
    } catch {}
    return 'store_sidiamer';
  });

  const handleSelectStore = (storeId: string) => {
    if (currentStaff.role !== 'manager') return;
    setCurrentStoreId(storeId);
    try {
      localStorage.setItem('fotop_active_store_id', storeId);
    } catch {}
  };

  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  
  // Auth state & persistence
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return Boolean(sessionStorage.getItem('fotop_auth_staff_id'));
    } catch {
      return false;
    }
  });

  const [currentStaff, setCurrentStaff] = useState<Staff>(() => {
    try {
      const savedStaffId = sessionStorage.getItem('fotop_auth_staff_id');
      if (savedStaffId) {
        const found = INITIAL_STAFF.find(s => s.id === savedStaffId);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    return INITIAL_STAFF[0];
  });

  // Automatically lock store to worker's assigned store if they are a worker
  useEffect(() => {
    if (currentStaff.role === 'worker' && currentStaff.storeId) {
      setCurrentStoreId(currentStaff.storeId);
      try {
        localStorage.setItem('fotop_active_store_id', currentStaff.storeId);
      } catch {}
    }
  }, [currentStaff]);

  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>(INITIAL_WASTE_RECORDS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Routing & Navigation
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname.toLowerCase() === '/login';

  // Helper to map pathname to TabType
  const getTabFromPath = (pathname: string): TabType => {
    const cleanSegment = pathname.replace(/^\//, '').split('/')[0].toLowerCase();
    switch (cleanSegment) {
      case 'dashboard':
        return 'dashboard';
      case 'pos':
        return 'pos';
      case 'orders':
        return 'orders';
      case 'inventory':
        return 'inventory';
      case 'waste':
        return 'waste';
      case 'shifts':
        return 'shifts';
      case 'accounting':
        return 'accounting';
      case 'hr':
        return 'hr';
      case 'specs':
        return 'specs';
      case 'settings':
        return 'settings';
      default:
        return 'pos';
    }
  };

  const activeTab: TabType = getTabFromPath(location.pathname);

  // Synchronize route guards and redirects
  useEffect(() => {
    const rawSegment = location.pathname.replace(/^\//, '').split('/')[0].toLowerCase();

    // 1. If NOT authenticated, force redirect to /login unless already on /login
    if (!isAuthenticated) {
      if (rawSegment !== 'login') {
        navigate('/login', { replace: true, state: { from: location.pathname } });
      }
      return;
    }

    // 2. If authenticated and accessing root /, redirect to /dashboard (managers) or /pos
    if (!rawSegment) {
      const defaultDest = currentStaff.role === 'manager' ? '/dashboard' : '/pos';
      navigate(defaultDest, { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate, currentStaff.role]);

  const handleTabChange = (tab: TabType) => {
    navigate(`/${tab}`);
    setIsMobileNavOpen(false);
  };

  // UI state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.removeItem('fotop_header_compact');
    } catch {
      // ignore
    }
  }, []);

  const toggleHeaderCompact = () => {
    setIsHeaderCompact(prev => !prev);
  };
  const [printedOrder, setPrintedOrder] = useState<Order | null>(null);
  const [orderSuccessNotification, setOrderSuccessNotification] = useState<Order | null>(null);
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
          if (data.stores && data.stores.length > 0) {
            setStores(data.stores);
          }
          setMaterials(data.materials || []);
          setServices(data.services || []);
          const staff = data.staff && data.staff.length > 0 ? data.staff : INITIAL_STAFF;
          setStaffList(staff);
          const savedStaffId = sessionStorage.getItem('fotop_auth_staff_id');
          if (savedStaffId) {
            const found = staff.find(s => s.id === savedStaffId);
            if (found) setCurrentStaff(found);
            else setCurrentStaff(staff[0]);
          } else {
            setCurrentStaff(staff[0]);
          }
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

  // Enforce strict store isolation:
  // If current staff is worker, their effectiveStoreId is STRICTLY locked to their assigned storeId.
  // If current staff is manager, they can use the global currentStoreId ('store_sidiamer', 'store_labhour', or 'all').
  const isManager = currentStaff?.role === 'manager';
  const effectiveStoreId = React.useMemo(() => {
    if (!isManager && currentStaff?.storeId) {
      return currentStaff.storeId;
    }
    return currentStoreId;
  }, [isManager, currentStaff?.storeId, currentStoreId]);

  // Store-filtered collections & context calculations
  const filteredOrders = React.useMemo(() => {
    if (effectiveStoreId === 'all') return orders;
    return orders.filter(o => (o.storeId || 'store_sidiamer') === effectiveStoreId);
  }, [orders, effectiveStoreId]);

  const filteredExpenses = React.useMemo(() => {
    if (effectiveStoreId === 'all') return expenses;
    return expenses.filter(e => (e.storeId || 'store_sidiamer') === effectiveStoreId);
  }, [expenses, effectiveStoreId]);

  const filteredShifts = React.useMemo(() => {
    if (effectiveStoreId === 'all') return shifts;
    return shifts.filter(s => (s.storeId || 'store_sidiamer') === effectiveStoreId);
  }, [shifts, effectiveStoreId]);

  const filteredStaffList = React.useMemo(() => {
    if (effectiveStoreId === 'all') return staffList;
    return staffList.filter(s => s.role === 'manager' || (s.storeId || 'store_sidiamer') === effectiveStoreId);
  }, [staffList, effectiveStoreId]);

  const filteredMaterials = React.useMemo(() => {
    if (effectiveStoreId === 'all') return materials;
    return materials.filter(m => (m.storeId || 'store_sidiamer') === effectiveStoreId);
  }, [materials, effectiveStoreId]);

  const filteredServices = React.useMemo(() => {
    if (effectiveStoreId === 'all') return services;
    return services.filter(s => (s.storeId || 'store_sidiamer') === effectiveStoreId);
  }, [services, effectiveStoreId]);

  const filteredWasteRecords = React.useMemo(() => {
    if (effectiveStoreId === 'all') return wasteRecords;
    return wasteRecords.filter(w => (w.storeId || 'store_sidiamer') === effectiveStoreId);
  }, [wasteRecords, effectiveStoreId]);

  const filteredAttendanceLogs = React.useMemo(() => {
    if (effectiveStoreId === 'all') return attendanceLogs;
    const storeStaffIds = new Set(filteredStaffList.map(s => s.id));
    return attendanceLogs.filter(a => storeStaffIds.has(a.staffId));
  }, [attendanceLogs, filteredStaffList, effectiveStoreId]);

  const filteredSalaryPayments = React.useMemo(() => {
    if (effectiveStoreId === 'all') return salaryPayments;
    const storeStaffIds = new Set(filteredStaffList.map(s => s.id));
    return salaryPayments.filter(p => (p.storeId ? p.storeId === effectiveStoreId : storeStaffIds.has(p.staffId)));
  }, [salaryPayments, filteredStaffList, effectiveStoreId]);

  // Active shift calculation scoped to current active store
  const activeShift = (shifts || []).find(s => {
    if (s.status !== 'open') return false;
    if (effectiveStoreId === 'all') return true;
    return !s.storeId || s.storeId === effectiveStoreId;
  });

  const lowStockCount = (filteredMaterials || []).filter(m => m.currentStock <= m.minThreshold).length;
  const openOrdersCount = (filteredOrders || []).filter(o => o.status !== 'delivered').length;
  const activeAttendance = (attendanceLogs || []).find(l => l.staffId === currentStaff.id && !l.clockOut);

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
    const targetStoreId = newStaff.storeId || (effectiveStoreId !== 'all' ? effectiveStoreId : 'store_sidiamer');
    const targetStoreObj = stores.find(s => s.id === targetStoreId) || stores[0];
    const staffWithStore: Staff = {
      ...newStaff,
      storeId: targetStoreId,
      storeName: newStaff.storeName || targetStoreObj?.name || (targetStoreId === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer')
    };
    setStaffList(prev => [...(prev || []), staffWithStore]);
    try {
      const updated = await api.addStaff(staffWithStore);
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
    const targetStoreId = newService.storeId || (effectiveStoreId !== 'all' ? effectiveStoreId : 'store_sidiamer');
    const targetStoreObj = stores.find(s => s.id === targetStoreId) || stores[0];
    const serviceWithStore: ServiceItem = {
      ...newService,
      storeId: targetStoreId,
      storeName: newService.storeName || targetStoreObj?.name || (targetStoreId === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer')
    };
    setServices(prev => [serviceWithStore, ...(prev || [])]);
    try {
      const updated = await api.addService(serviceWithStore);
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

    const targetStoreId = orderData.storeId || (currentStaff.role === 'worker' && currentStaff.storeId 
      ? currentStaff.storeId 
      : (effectiveStoreId === 'all' ? 'store_sidiamer' : effectiveStoreId));
    const targetStoreObj = stores.find(s => s.id === targetStoreId) || stores[0];

    const newOrder: Order = {
      ...orderData,
      storeId: targetStoreId,
      storeName: orderData.storeName || targetStoreObj?.name || (targetStoreId === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer'),
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

    // Show professional Done message (no celebration confetti or sound)
    setOrderSuccessNotification(newOrder);

    // Call backend API
    try {
      const res = await api.createOrder(newOrder);
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
    const targetStoreId = record.storeId || (effectiveStoreId !== 'all' ? effectiveStoreId : 'store_sidiamer');
    const targetStoreObj = stores.find(s => s.id === targetStoreId) || stores[0];
    const newWaste: WasteRecord = {
      ...record,
      storeId: targetStoreId,
      storeName: record.storeName || targetStoreObj?.name || (targetStoreId === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer'),
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
      const res = await api.addWasteRecord(newWaste);
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
    const targetStoreId = newMat.storeId || (effectiveStoreId !== 'all' ? effectiveStoreId : 'store_sidiamer');
    const targetStoreObj = stores.find(s => s.id === targetStoreId) || stores[0];
    const mat: Material = {
      ...newMat,
      storeId: targetStoreId,
      storeName: newMat.storeName || targetStoreObj?.name || (targetStoreId === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer'),
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
  const handleOpenShift = async (staffId: string, staffName: string, openingCash: number, optStoreId?: string, optStoreName?: string) => {
    const targetStoreId = optStoreId || (currentStaff.role === 'worker' && currentStaff.storeId 
      ? currentStaff.storeId 
      : (effectiveStoreId === 'all' ? 'store_sidiamer' : effectiveStoreId));
    const targetStoreObj = stores.find(s => s.id === targetStoreId) || stores[0];
    const targetStoreName = optStoreName || targetStoreObj?.name || (targetStoreId === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer');

    const newShift: Shift = {
      id: `shf_${Date.now()}`,
      staffId,
      staffName,
      storeId: targetStoreId,
      storeName: targetStoreName,
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
      const updated = await api.openShift(staffId, staffName, openingCash, targetStoreId, targetStoreName);
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
    const targetStoreId = exp.storeId || (currentStaff.role === 'worker' && currentStaff.storeId 
      ? currentStaff.storeId 
      : (effectiveStoreId === 'all' ? 'store_sidiamer' : effectiveStoreId));
    const targetStoreObj = stores.find(s => s.id === targetStoreId) || stores[0];

    const newExp: Expense = {
      ...exp,
      storeId: targetStoreId,
      storeName: exp.storeName || targetStoreObj?.name || (targetStoreId === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer'),
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
      const res = await api.addExpense(newExp);
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

  // Auto Attendance Handlers for Manager in Settings
  const handleAutoClockInAll = async () => {
    try {
      const res = await api.autoClockInAll(currentStaff.id);
      if (res && res.attendanceLogs) {
        setAttendanceLogs(res.attendanceLogs);
      }
      return res;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleAutoClockOutAll = async () => {
    try {
      const res = await api.autoClockOutAll();
      if (res && res.attendanceLogs) {
        setAttendanceLogs(res.attendanceLogs);
      }
      return res;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleClockInStaff = async (staffId: string, staffName: string) => {
    try {
      const updated = await api.clockIn(staffId, staffName);
      if (updated) setAttendanceLogs(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClockOutStaff = async (staffId: string) => {
    try {
      const updated = await api.clockOut(staffId);
      if (updated) setAttendanceLogs(updated);
    } catch (e) {
      console.error(e);
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
    try {
      sessionStorage.setItem('fotop_auth_staff_id', staff.id);
    } catch {
      // ignore
    }
    if (autoClockIn) {
      handleClockIn(staff.id);
    }
    
    // Redirect to requested protected destination or default role page
    const requestedFrom = (location.state as any)?.from;
    const destination = (requestedFrom && requestedFrom.toLowerCase() !== '/login')
      ? requestedFrom
      : (staff.role === 'manager' ? '/dashboard' : '/pos');
    navigate(destination, { replace: true });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('fotop_auth_staff_id');
    } catch {
      // ignore
    }
    navigate('/login', { replace: true });
  };

  // If not authenticated OR explicitly visiting /login, show dedicated Login Screen
  if (!isAuthenticated || isLoginPage) {
    return (
      <LoginScreen
        staffList={staffList}
        onLogin={handleLogin}
        isAuthenticated={isAuthenticated}
        currentStaff={currentStaff}
        onReturnToApp={() => {
          navigate(currentStaff.role === 'manager' ? '/dashboard' : '/pos');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F0F0F0] text-[#292A34] flex flex-col lg:flex-row font-['Cairo',sans-serif]">
      
      {/* Navigation Component (Full-Height Sidebar on Desktop, Drawer on Mobile) */}
      <Navigation
        currentStaff={currentStaff}
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        lowStockCount={lowStockCount}
        openOrdersCount={openOrdersCount}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenSpecs={() => handleTabChange('specs')}
        onOpenExpense={() => setShowQuickExpenseModal(true)}
        onOpenWaste={() => setShowQuickWasteModal(true)}
        onLogout={handleLogout}
        activeAttendance={activeAttendance}
        stores={stores}
        currentStoreId={effectiveStoreId}
        onSelectStore={handleSelectStore}
      />

      {/* Main Responsive Body Layout (Header + Scrollable Workspace) */}
      <div className="flex-1 flex flex-col min-w-0 h-full lg:h-screen lg:overflow-hidden">
        
        {/* Top Global Header (Slim & Professional) */}
        <Header
          currentStaff={currentStaff}
          allStaff={filteredStaffList}
          onSwitchStaff={(staff) => {
            setCurrentStaff(staff);
            try {
              sessionStorage.setItem('fotop_auth_staff_id', staff.id);
            } catch {
              // ignore
            }
          }}
          onLogout={handleLogout}
          activeShift={activeShift}
          attendanceLogs={attendanceLogs}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          onOpenLogWaste={() => setShowQuickWasteModal(true)}
          onOpenExpenseModal={() => setShowQuickExpenseModal(true)}
          onOpenSpecsModal={() => handleTabChange('specs')}
          onResetData={handleResetData}
          materials={filteredMaterials}
          services={filteredServices}
          onNavigateToInventory={() => handleTabChange('inventory')}
          onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)}
          isMobileMenuOpen={isMobileNavOpen}
          isCompact={isHeaderCompact}
          onToggleCompact={toggleHeaderCompact}
          onNavigateToHome={() => handleTabChange('pos')}
          onNavigateToSettings={() => handleTabChange('settings')}
          stores={stores}
          currentStoreId={effectiveStoreId}
          onSelectStore={handleSelectStore}
        />

        {/* Dynamic Main Workspace with Motion Transitions */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 pb-24 lg:pb-6 overflow-y-auto flex flex-col justify-between">
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
                  {activeTab === 'dashboard' && (
                    <DashboardView
                      orders={filteredOrders || []}
                      materials={filteredMaterials || []}
                      wasteRecords={filteredWasteRecords || []}
                      expenses={filteredExpenses || []}
                      shifts={filteredShifts || []}
                      currentStaff={currentStaff}
                      allStaff={filteredStaffList || []}
                      attendanceLogs={filteredAttendanceLogs || []}
                      onNavigateTab={handleTabChange}
                      onOpenQuickExpense={() => setShowQuickExpenseModal(true)}
                      onOpenQuickWaste={() => setShowQuickWasteModal(true)}
                    />
                  )}

                  {activeTab === 'pos' && (
                    <PosView
                      services={filteredServices || []}
                      materials={filteredMaterials || []}
                      currentStaff={currentStaff}
                      activeShift={activeShift}
                      orders={filteredOrders || []}
                      onCheckoutOrder={handleCheckoutOrder}
                      onPrintLastReceipt={() => {
                        if (filteredOrders.length > 0) {
                          setPrintedOrder(filteredOrders[0]);
                        }
                      }}
                    />
                  )}

                  {activeTab === 'inventory' && (
                    <InventoryView
                      materials={filteredMaterials || []}
                      services={filteredServices || []}
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
                      wasteRecords={filteredWasteRecords || []}
                      materials={filteredMaterials || []}
                      staffList={filteredStaffList || []}
                      currentStaff={currentStaff}
                      onAddWasteRecord={handleAddWasteRecord}
                    />
                  )}

                  {activeTab === 'shifts' && (
                    <ShiftsView
                      shifts={filteredShifts || []}
                      activeShift={activeShift}
                      allStaff={filteredStaffList || []}
                      currentStaff={currentStaff}
                      onOpenShift={handleOpenShift}
                      onCloseShift={handleCloseShift}
                      onSwitchStaff={setCurrentStaff}
                    />
                  )}

                  {activeTab === 'hr' && (
                    <HumanResourcesView
                      allStaff={filteredStaffList || []}
                      salaryPayments={filteredSalaryPayments || []}
                      attendanceLogs={filteredAttendanceLogs || []}
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
                      orders={filteredOrders || []}
                      materials={filteredMaterials || []}
                      wasteRecords={filteredWasteRecords || []}
                      expenses={filteredExpenses || []}
                      shifts={filteredShifts || []}
                      currentStaff={currentStaff}
                      allStaff={filteredStaffList || []}
                      attendanceLogs={filteredAttendanceLogs || []}
                      salaryPayments={filteredSalaryPayments || []}
                      onAddExpense={handleAddExpense}
                      onAddStaff={handleAddStaff}
                      onUpdateStaff={handleUpdateStaff}
                      onDeleteStaff={handleDeleteStaff}
                      onAddManualAttendance={handleAddManualAttendance}
                      onDeleteAttendance={handleDeleteAttendance}
                      onAddSalaryPayment={handleAddSalaryPayment}
                      onUpdateSalaryPayment={handleUpdateSalaryPayment}
                      onDeleteSalaryPayment={handleDeleteSalaryPayment}
                      currentStoreId={effectiveStoreId}
                      stores={stores}
                    />
                  )}

                  {activeTab === 'orders' && (
                    <OrdersView
                      orders={filteredOrders || []}
                      allStaff={filteredStaffList || []}
                      currentStaff={currentStaff}
                      materials={filteredMaterials || []}
                      expenses={filteredExpenses || []}
                      wasteRecords={filteredWasteRecords || []}
                      onSelectOrderForPrint={setPrintedOrder}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                    />
                  )}

                  {activeTab === 'specs' && (
                    <SpecsView onGoToPOS={() => handleTabChange('pos')} />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsView
                      currentStaff={currentStaff}
                      allStaff={staffList || []}
                      attendanceLogs={attendanceLogs || []}
                      onAutoClockInAll={handleAutoClockInAll}
                      onAutoClockOutAll={handleAutoClockOutAll}
                      onClockInStaff={handleClockInStaff}
                      onClockOutStaff={handleClockOutStaff}
                      onGoToPOS={() => handleTabChange('pos')}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Footer Branding */}
          <footer className="bg-white/80 border border-slate-200/80 rounded-2xl py-3 px-5 text-center text-xs text-slate-500 mt-8 shadow-xs">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <FotopLogo className="w-6 h-6" />
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

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Instant 1-Tap Switching on Mobile Screens)  */}
      {/* ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#1f2029]/95 backdrop-blur-md border-t border-slate-700/80 px-1.5 py-1.5 flex items-center justify-around shadow-2xl safe-bottom select-none">
        
        {/* Dashboard Tab */}
        <button
          onClick={() => {
            soundManager.playClickSound();
            handleTabChange('dashboard');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-[#ff4d5a] font-black'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mb-0.5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">الرئيسية</span>
        </button>

        {/* POS Tab */}
        <button
          onClick={() => {
            soundManager.playClickSound();
            handleTabChange('pos');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'pos'
              ? 'text-[#ff4d5a] font-black'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Zap className={`w-5 h-5 mb-0.5 ${activeTab === 'pos' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">نقطة البيع</span>
        </button>

        {/* Orders Tab */}
        <button
          onClick={() => {
            soundManager.playClickSound();
            handleTabChange('orders');
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'text-[#ff4d5a] font-black'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <ReceiptText className={`w-5 h-5 mb-0.5 ${activeTab === 'orders' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">الطلبات</span>
          {openOrdersCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-amber-500 text-black text-[9px] font-black rounded-full flex items-center justify-center border border-[#1f2029]">
              {openOrdersCount}
            </span>
          )}
        </button>

        {/* Inventory Tab */}
        <button
          onClick={() => {
            soundManager.playClickSound();
            handleTabChange('inventory');
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'text-[#ff4d5a] font-black'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Layers className={`w-5 h-5 mb-0.5 ${activeTab === 'inventory' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">المخزن</span>
          {lowStockCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-[#E31C2B] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-[#1f2029] animate-pulse">
              {lowStockCount}
            </span>
          )}
        </button>

        {/* More / Menu Drawer Toggle */}
        <button
          onClick={() => {
            soundManager.playClickSound();
            setIsMobileNavOpen(!isMobileNavOpen);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            isMobileNavOpen
              ? 'text-[#ff4d5a] font-black'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">المزيد</span>
        </button>
      </nav>


      {/* Professional Order Success Notification (تم) */}
      <OrderSuccessToast
        order={orderSuccessNotification}
        onClose={() => setOrderSuccessNotification(null)}
        onPrintReceipt={(ord) => setPrintedOrder(ord)}
      />

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
              const m = (filteredMaterials || []).find(mat => mat.id === (quickWasteMatId || filteredMaterials[0]?.id));
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
                  value={quickWasteMatId || filteredMaterials[0]?.id}
                  onChange={(e) => setQuickWasteMatId(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                >
                  {(filteredMaterials || []).map(m => (
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
