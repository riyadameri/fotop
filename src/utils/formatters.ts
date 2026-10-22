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

// Compute Service Unit Material Cost based on active BOM and material unit costs (supports raw materials and merchandise goods)
export function calculateServiceBOMCost(bom: BOMItem[], materials: Material[], services: ServiceItem[] = []): number {
  if (!bom || bom.length === 0) return 0;
  let cost = 0;
  for (const item of bom) {
    const mat = materials.find(m => m.id === item.materialId);
    if (mat) {
      cost += mat.unitCost * item.quantity;
    } else {
      const good = services.find(s => s.id === item.materialId);
      if (good) {
        cost += (good.buyCost || 0) * item.quantity;
      } else if (typeof item.unitCost === 'number') {
        cost += item.unitCost * item.quantity;
      }
    }
  }
  return Number(cost.toFixed(2));
}

export interface AssociativeCostBreakdown {
  paperUnitCost: number;
  inkUnitCost: number;
  frameUnitCost: number;
  otherConsumablesCost: number;
  totalUnitCost: number;
  packageTotalCost: number;
  photosPerSheet: number;
  components: Array<{
    name: string;
    kind: 'raw_material' | 'merchandise';
    unitCost: number;
    perUnitQuantity: number;
    subtotalCost: number;
    consumptionMode: 'direct' | 'yield';
    yieldCount?: number;
    unit?: string;
  }>;
}

// Compute accurate unit cost and component breakdown for associative / linked photo products
// e.g., Paper = 100 DZD for 100 photos => 1 DZD; Ink = 100 DZD for 100 photos => 1 DZD; Unit Cost = 1 + 1 = 2 DZD per photo copy
export function getAssociativeProductUnitCostBreakdown(
  service: ServiceItem,
  materials: Material[] = [],
  services: ServiceItem[] = []
): AssociativeCostBreakdown {
  if (!service || !service.photoConfig) {
    const cost = service ? (service.itemType === 'direct_sale' ? Number(service.buyCost || 0) : calculateServiceBOMCost(service.bom || [], materials, services)) : 0;
    return {
      paperUnitCost: 0,
      inkUnitCost: 0,
      frameUnitCost: 0,
      otherConsumablesCost: cost,
      totalUnitCost: cost,
      packageTotalCost: cost,
      photosPerSheet: 1,
      components: []
    };
  }

  const cfg = service.photoConfig;
  const photosPerSheet = Math.max(1, cfg.photosPerSheet || 1);

  // 1. If rich components list is available
  if (cfg.components && cfg.components.length > 0) {
    let paperUnitCost = 0;
    let inkUnitCost = 0;
    let frameUnitCost = 0;
    let otherConsumablesCost = 0;

    const components = cfg.components.map(comp => {
      let currentCost = comp.unitCost;
      let unitLabel = comp.unit || 'قطعة';

      if (comp.kind === 'raw_material') {
        const mat = materials.find(m => m.id === comp.itemId) || materials.find(m => m.name.toLowerCase() === comp.name.toLowerCase());
        if (mat) {
          currentCost = mat.unitCost;
          unitLabel = mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة';
        }
      } else {
        const good = services.find(s => s.id === comp.itemId) || services.find(s => s.name.toLowerCase() === comp.name.toLowerCase());
        if (good) {
          currentCost = good.buyCost || 0;
        }
      }

      // Quantity needed per single unit/photo
      const perUnitQuantity = comp.consumptionMode === 'yield'
        ? (Number(comp.quantity || 1) / Math.max(1, Number(comp.yieldCount || 1)))
        : Number(comp.quantity || 1);

      const subtotalCost = Number((perUnitQuantity * currentCost).toFixed(2));

      // Classify component for breakdown
      const lowerName = comp.name.toLowerCase();
      if (lowerName.includes('ورق') || unitLabel === 'ورقة') {
        paperUnitCost += subtotalCost;
      } else if (lowerName.includes('حبر') || lowerName.includes('ribon') || lowerName.includes('ريبون') || unitLabel === 'مل') {
        inkUnitCost += subtotalCost;
      } else if (lowerName.includes('كادر') || lowerName.includes('إطار') || lowerName.includes('برواز')) {
        frameUnitCost += subtotalCost;
      } else {
        otherConsumablesCost += subtotalCost;
      }

      return {
        name: comp.name,
        kind: comp.kind,
        unitCost: currentCost,
        perUnitQuantity,
        subtotalCost,
        consumptionMode: comp.consumptionMode,
        yieldCount: comp.yieldCount,
        unit: unitLabel
      };
    });

    const totalUnitCost = Number((paperUnitCost + inkUnitCost + frameUnitCost + otherConsumablesCost).toFixed(2));
    const packageTotalCost = Number((totalUnitCost * photosPerSheet).toFixed(2));

    return {
      paperUnitCost: Number(paperUnitCost.toFixed(2)),
      inkUnitCost: Number(inkUnitCost.toFixed(2)),
      frameUnitCost: Number(frameUnitCost.toFixed(2)),
      otherConsumablesCost: Number(otherConsumablesCost.toFixed(2)),
      totalUnitCost,
      packageTotalCost,
      photosPerSheet,
      components
    };
  }

  // 2. Legacy configuration with paperMaterialId, inkMaterialId, frameMaterialId
  const pMat = materials.find(m => m.id === cfg.paperMaterialId);
  const iMat = materials.find(m => m.id === cfg.inkMaterialId);
  const fMat = cfg.frameMaterialId ? materials.find(m => m.id === cfg.frameMaterialId) : null;

  // Paper cost per single photo = paper sheet cost / photos per sheet
  // (e.g. paper cost 100 DZD, yields 100 photos => 1 DZD per photo)
  const pSheetCost = pMat ? pMat.unitCost : 0;
  const paperUnitCost = pMat ? Number((pSheetCost / photosPerSheet).toFixed(2)) : 0;

  // Ink cost per single photo = ink material cost / ink yield photos (WITHOUT any * 100 bug)
  // (e.g. ink cost 100 DZD, yields 100 photos => 100 / 100 = 1 DZD per photo)
  const inkYield = Math.max(1, cfg.inkYieldPhotos || 1);
  const inkUnitCost = iMat
    ? Number((iMat.unitCost / inkYield).toFixed(2))
    : (cfg.inkPerPhotoMl && iMat ? Number((iMat.unitCost * cfg.inkPerPhotoMl).toFixed(2)) : 0);

  const frameUnitCost = fMat ? Number(fMat.unitCost.toFixed(2)) : 0;
  const totalUnitCost = Number((paperUnitCost + inkUnitCost + frameUnitCost).toFixed(2));
  const packageTotalCost = Number((totalUnitCost * photosPerSheet).toFixed(2));

  return {
    paperUnitCost,
    inkUnitCost,
    frameUnitCost,
    otherConsumablesCost: 0,
    totalUnitCost,
    packageTotalCost,
    photosPerSheet,
    components: [
      ...(pMat ? [{
        name: pMat.name,
        kind: 'raw_material' as const,
        unitCost: pMat.unitCost,
        perUnitQuantity: 1 / photosPerSheet,
        subtotalCost: paperUnitCost,
        consumptionMode: 'yield' as const,
        yieldCount: photosPerSheet,
        unit: 'ورقة'
      }] : []),
      ...(iMat ? [{
        name: iMat.name,
        kind: 'raw_material' as const,
        unitCost: iMat.unitCost,
        perUnitQuantity: 1 / inkYield,
        subtotalCost: inkUnitCost,
        consumptionMode: 'yield' as const,
        yieldCount: inkYield,
        unit: 'صورة'
      }] : []),
      ...(fMat ? [{
        name: fMat.name,
        kind: 'raw_material' as const,
        unitCost: fMat.unitCost,
        perUnitQuantity: 1,
        subtotalCost: frameUnitCost,
        consumptionMode: 'direct' as const,
        yieldCount: 1,
        unit: 'قطعة'
      }] : [])
    ]
  };
}

// Compute accurate item unit cost whether it is direct_sale, custom photo service with linked consumables, or general BOM
export function getItemUnitCost(service: ServiceItem, materials: Material[] = [], services: ServiceItem[] = []): number {
  if (!service) return 0;
  if (service.itemType === 'direct_sale') {
    return Number(service.buyCost || 0);
  }
  if (service.photoConfig) {
    const breakdown = getAssociativeProductUnitCostBreakdown(service, materials, services);
    if (breakdown.totalUnitCost > 0) return breakdown.totalUnitCost;
  }
  const bomCost = calculateServiceBOMCost(service.bom || [], materials, services);
  return bomCost > 0 ? bomCost : Number(service.buyCost || 0);
}

// Compute net profit for one unit of a service/item
export function getItemProfit(service: ServiceItem, materials: Material[] = [], services: ServiceItem[] = []): number {
  if (!service) return 0;
  const cost = getItemUnitCost(service, materials, services);
  return Math.max(0, service.price - cost);
}

// Compute profit margin percentage
export function getItemProfitMargin(service: ServiceItem, materials: Material[] = [], services: ServiceItem[] = []): number {
  if (!service || !service.price || service.price <= 0) return 0;
  const profit = getItemProfit(service, materials, services);
  return Math.round((profit / service.price) * 100);
}

// Compute BOM human-readable summary
export function getBOMSummaryText(bom: BOMItem[], materials: Material[], services: ServiceItem[] = []): string {
  if (!bom || bom.length === 0) return 'بدون استهلاك مواد (خدمة رقمية / عمالة فقط)';
  
  return bom
    .map(item => {
      const mat = materials.find(m => m.id === item.materialId);
      if (mat) {
        const name = mat.name.split('(')[0].trim();
        const unit = mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة';
        return `${item.quantity} ${unit} ${name} (خام)`;
      }
      const good = services.find(s => s.id === item.materialId);
      if (good) {
        const name = good.name.split('(')[0].trim();
        return `${item.quantity} قطعة ${name} (سلعة)`;
      }
      return `${item.quantity} ${item.name || 'مكون'}`;
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
