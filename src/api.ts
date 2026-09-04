import { 
  Material, 
  ServiceItem, 
  Staff, 
  Shift, 
  Order, 
  WasteRecord, 
  Expense, 
  AttendanceRecord,
  SalaryPayment,
  OrderStatus 
} from './types';

export interface AppStateData {
  materials: Material[];
  services: ServiceItem[];
  staff: Staff[];
  shifts: Shift[];
  orders: Order[];
  wasteRecords: WasteRecord[];
  expenses: Expense[];
  attendanceLogs: AttendanceRecord[];
  salaryPayments?: SalaryPayment[];
}

export const api = {
  async getAllData(): Promise<AppStateData> {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Failed to fetch data from backend');
    return res.json();
  },

  async resetAllData(): Promise<AppStateData> {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset data on backend');
    return res.json();
  },

  // Materials
  async addMaterial(material: Material): Promise<Material[]> {
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(material),
    });
    if (!res.ok) throw new Error('Failed to add material');
    return res.json();
  },

  async updateMaterial(material: Material): Promise<Material[]> {
    const res = await fetch(`/api/materials/${encodeURIComponent(material.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(material),
    });
    if (!res.ok) throw new Error('Failed to update material');
    return res.json();
  },

  async restockMaterial(materialId: string, quantity: number, unitCost?: number): Promise<Material[]> {
    const res = await fetch('/api/materials/restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId, quantity, unitCost }),
    });
    if (!res.ok) throw new Error('Failed to restock material');
    return res.json();
  },

  async deleteMaterial(id: string): Promise<Material[]> {
    const res = await fetch(`/api/materials/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete material');
    return res.json();
  },

  // Services
  async addService(service: ServiceItem): Promise<ServiceItem[]> {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    });
    if (!res.ok) throw new Error('Failed to add service');
    return res.json();
  },

  async updateService(service: ServiceItem): Promise<ServiceItem[]> {
    const res = await fetch(`/api/services/${encodeURIComponent(service.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    });
    if (!res.ok) throw new Error('Failed to update service');
    return res.json();
  },

  async deleteService(id: string): Promise<ServiceItem[]> {
    const res = await fetch(`/api/services/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete service');
    return res.json();
  },

  // Staff
  async addStaff(staff: Staff): Promise<Staff[]> {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff),
    });
    if (!res.ok) throw new Error('Failed to add staff');
    return res.json();
  },

  async updateStaff(staff: Staff): Promise<Staff[]> {
    const res = await fetch(`/api/staff/${encodeURIComponent(staff.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff),
    });
    if (!res.ok) throw new Error('Failed to update staff');
    return res.json();
  },

  async deleteStaff(id: string): Promise<Staff[]> {
    const res = await fetch(`/api/staff/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete staff');
    return res.json();
  },

  // Orders
  async createOrder(orderData: Omit<Order, 'id' | 'ticketNumber' | 'createdAt'>): Promise<{
    order: Order;
    orders: Order[];
    materials: Material[];
    shifts: Shift[];
  }> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order[]> {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  },

  // Shifts
  async openShift(staffId: string, staffName: string, openingCash: number): Promise<Shift[]> {
    const res = await fetch('/api/shifts/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, staffName, openingCash }),
    });
    if (!res.ok) throw new Error('Failed to open shift');
    return res.json();
  },

  async closeShift(shiftId: string, actualCash: number, notes?: string): Promise<Shift[]> {
    const res = await fetch('/api/shifts/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftId, actualCash, notes }),
    });
    if (!res.ok) throw new Error('Failed to close shift');
    return res.json();
  },

  // Waste
  async addWasteRecord(record: Omit<WasteRecord, 'id' | 'createdAt'>): Promise<{
    wasteRecords: WasteRecord[];
    materials: Material[];
  }> {
    const res = await fetch('/api/waste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error('Failed to add waste record');
    return res.json();
  },

  // Expenses
  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<{
    expenses: Expense[];
    shifts: Shift[];
  }> {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    if (!res.ok) throw new Error('Failed to add expense');
    return res.json();
  },

  // Attendance
  async clockIn(staffId: string, staffName: string): Promise<AttendanceRecord[]> {
    const res = await fetch('/api/attendance/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, staffName }),
    });
    if (!res.ok) throw new Error('Failed to clock in');
    return res.json();
  },

  async clockOut(staffId: string): Promise<AttendanceRecord[]> {
    const res = await fetch('/api/attendance/clock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId }),
    });
    if (!res.ok) throw new Error('Failed to clock out');
    return res.json();
  },

  async addManualAttendance(record: Partial<AttendanceRecord>): Promise<AttendanceRecord[]> {
    const res = await fetch('/api/attendance/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error('Failed to add manual attendance');
    return res.json();
  },

  async deleteAttendance(id: string): Promise<AttendanceRecord[]> {
    const res = await fetch(`/api/attendance/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete attendance record');
    return res.json();
  },

  // Salary Payments (Human Resources)
  async getSalaryPayments(): Promise<SalaryPayment[]> {
    const res = await fetch('/api/salary-payments');
    if (!res.ok) throw new Error('Failed to fetch salary payments');
    return res.json();
  },

  async addSalaryPayment(payment: Partial<SalaryPayment> & { recordAsStudioExpense?: boolean }): Promise<{
    salaryPayments: SalaryPayment[];
    expenses: Expense[];
    shifts: Shift[];
  }> {
    const res = await fetch('/api/salary-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });
    if (!res.ok) throw new Error('Failed to record salary payment');
    return res.json();
  },

  async updateSalaryPayment(id: string, payment: Partial<SalaryPayment>): Promise<{
    salaryPayments: SalaryPayment[];
    expenses: Expense[];
  }> {
    const res = await fetch(`/api/salary-payments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });
    if (!res.ok) throw new Error('Failed to update salary payment');
    return res.json();
  },

  async deleteSalaryPayment(id: string): Promise<{
    salaryPayments: SalaryPayment[];
    expenses: Expense[];
  }> {
    const res = await fetch(`/api/salary-payments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete salary payment');
    return res.json();
  }
};
