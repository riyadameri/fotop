import { Material, ServiceItem, Staff, Shift, Order, WasteRecord, Expense, AttendanceRecord, Store, DEFAULT_STORES } from '../types';

export const INITIAL_STORES: Store[] = DEFAULT_STORES;

export const INITIAL_MATERIALS: Material[] = [];

export const INITIAL_SERVICES: ServiceItem[] = [];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'staff_fouad',
    name: 'فؤاد (fouad)',
    role: 'manager',
    password: 'fouad26911',
    assignedStores: ['store_sidiamer', 'store_labhour'],
    workSchedule: 'إدارة عامة وإشراف على كلا المتجرين (دوام مرن)',
    phone: '05 63 89 83 95',
    avatar: '👔',
    active: true
  },
  // عمال متجر fotop sidiamer (سيدي عامر)
  {
    id: 'staff_amine',
    name: 'أمين (Amine - سيدي عامر)',
    role: 'worker',
    password: '123',
    storeId: 'store_sidiamer',
    storeName: 'fotop sidiamer',
    workSchedule: '08:30 - 17:00 (سيدي عامر)',
    shiftStartTime: '08:30',
    shiftEndTime: '17:00',
    workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    hourlyRate: 250,
    dailyRate: 2000,
    monthlySalaryBase: 45000,
    phone: '05 50 11 22 33',
    avatar: '📸',
    active: true
  },
  {
    id: 'staff_karim',
    name: 'كريم (Karim - سيدي عامر)',
    role: 'worker',
    password: '123',
    storeId: 'store_sidiamer',
    storeName: 'fotop sidiamer',
    workSchedule: '09:00 - 18:00 (سيدي عامر)',
    shiftStartTime: '09:00',
    shiftEndTime: '18:00',
    workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    hourlyRate: 250,
    dailyRate: 2000,
    monthlySalaryBase: 45000,
    phone: '05 50 22 33 44',
    avatar: '🖨️',
    active: true
  },
  // عمال متجر fotop labhour (الأبحور)
  {
    id: 'staff_yassine',
    name: 'ياسين (Yassine - الأبحور)',
    role: 'worker',
    password: '123',
    storeId: 'store_labhour',
    storeName: 'fotop labhour',
    workSchedule: '08:30 - 17:00 (الأبحور)',
    shiftStartTime: '08:30',
    shiftEndTime: '17:00',
    workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    hourlyRate: 250,
    dailyRate: 2000,
    monthlySalaryBase: 45000,
    phone: '06 60 44 55 66',
    avatar: '📷',
    active: true
  },
  {
    id: 'staff_souhaib',
    name: 'صهيب (Souhaib - الأبحور)',
    role: 'worker',
    password: '123',
    storeId: 'store_labhour',
    storeName: 'fotop labhour',
    workSchedule: '09:00 - 18:00 (الأبحور)',
    shiftStartTime: '09:00',
    shiftEndTime: '18:00',
    workingDays: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    hourlyRate: 250,
    dailyRate: 2000,
    monthlySalaryBase: 45000,
    phone: '06 60 77 88 99',
    avatar: '💻',
    active: true
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_SHIFTS: Shift[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_WASTE_RECORDS: WasteRecord[] = [];

export const INITIAL_EXPENSES: Expense[] = [];
