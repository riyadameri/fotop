import { Material, ServiceItem, BOMItem } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-DZ', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0
  }).format(amount) + ' دج';
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-DZ').format(num);
}

export function formatDate(isoDateString: string): string {
  try {
    const d = new Date(isoDateString);
    return d.toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoDateString;
  }
}

export function formatTime(isoDateString: string): string {
  try {
    const d = new Date(isoDateString);
    return d.toLocaleTimeString('ar-DZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoDateString;
  }
}

// Compute Service Unit Material Cost based on active BOM and material unit costs
export function calculateServiceBOMCost(bom: BOMItem[], materials: Material[]): number {
  if (!bom || bom.length === 0) return 0;
  let cost = 0;
  for (const item of bom) {
    const mat = materials.find(m => m.id === item.materialId);
    if (mat) {
      cost += mat.unitCost * item.quantity;
    }
  }
  return Number(cost.toFixed(2));
}

// Compute accurate item unit cost whether it is direct_sale or a custom service with BOM
export function getItemUnitCost(service: ServiceItem, materials: Material[] = []): number {
  if (!service) return 0;
  if (service.itemType === 'direct_sale') {
    return Number(service.buyCost || 0);
  }
  const bomCost = calculateServiceBOMCost(service.bom || [], materials);
  return bomCost > 0 ? bomCost : Number(service.buyCost || 0);
}

// Compute net profit for one unit of a service/item
export function getItemProfit(service: ServiceItem, materials: Material[] = []): number {
  if (!service) return 0;
  const cost = getItemUnitCost(service, materials);
  return Math.max(0, service.price - cost);
}

// Compute profit margin percentage
export function getItemProfitMargin(service: ServiceItem, materials: Material[] = []): number {
  if (!service || !service.price || service.price <= 0) return 0;
  const profit = getItemProfit(service, materials);
  return Math.round((profit / service.price) * 100);
}

// Compute BOM human-readable summary
export function getBOMSummaryText(bom: BOMItem[], materials: Material[]): string {
  if (!bom || bom.length === 0) return 'بدون استهلاك مواد (خدمة رقمية / عمالة فقط)';
  
  return bom
    .map(item => {
      const mat = materials.find(m => m.id === item.materialId);
      const name = mat ? mat.name.split('(')[0].trim() : 'مادة';
      const unit = mat?.unit === 'sheet' ? 'ورقة' : mat?.unit === 'ml' ? 'مل' : 'قطعة';
      return `${item.quantity} ${unit} ${name}`;
    })
    .join(' + ');
}

// Export array of objects to downloadable CSV
export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    // UTF-8 BOM for Excel Arabic support
    '\uFEFF' + headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        cell = cell.replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
