import { Material, ServiceItem, Staff, Shift, Order, WasteRecord, Expense, AttendanceRecord } from '../types';

export const INITIAL_MATERIALS: Material[] = [];

export const INITIAL_SERVICES: ServiceItem[] = [];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'staff_fouad',
    name: 'فؤاد (fouad)',
    role: 'manager',
    password: 'fouad26911',
    workSchedule: 'إدارة وإشراف كامل (دوام مرن)',
    phone: '05 63 89 83 95',
    avatar: '👔',
    active: true
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_SHIFTS: Shift[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_WASTE_RECORDS: WasteRecord[] = [];

export const INITIAL_EXPENSES: Expense[] = [];
