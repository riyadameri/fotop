import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  AlertTriangle, 
  Search, 
  ArrowDownToLine, 
  Boxes, 
  ShieldAlert, 
  FileSpreadsheet,
  PackagePlus,
  Sliders,
  Sparkles,
  Link2,
  Image as ImageIcon,
  ShoppingBag,
  Calculator,
  Trash2,
  Bell,
  BellRing,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Material, ServiceItem, PhotoLinkConfig, Staff, Expense } from '../../types';
import { formatCurrency, formatNumber, exportToCSV, calculateServiceBOMCost } from '../../utils/formatters';

interface InventoryViewProps {
  materials: Material[];
  services: ServiceItem[];
  currentStaff?: Staff;
  onUpdateMaterial: (updated: Material) => void;
  onAddMaterial: (newMat: Omit<Material, 'id'>) => void;
  onRestock: (materialId: string, quantityToAdd: number, newUnitCost?: number) => void;
  onAddService: (newService: ServiceItem) => void;
  onUpdateService?: (updatedService: ServiceItem) => void;
  onDeleteService?: (serviceId: string) => void;
  onAddExpense?: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  materials = [],
  services = [],
  currentStaff,
  onUpdateMaterial,
  onAddMaterial,
  onRestock,
  onAddService,
  onUpdateService,
  onDeleteService,
  onAddExpense
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'products'>('materials');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyLowStockFilter, setOnlyLowStockFilter] = useState<boolean>(false);
  const [isAlertBannerCollapsed, setIsAlertBannerCollapsed] = useState<boolean>(false);
  
  // Restock material modal state
  const [restockMat, setRestockMat] = useState<Material | null>(null);
  const [restockQty, setRestockQty] = useState<string>('');
  const [restockCost, setRestockCost] = useState<string>('');

  // Restock retail product modal state
  const [restockProduct, setRestockProduct] = useState<ServiceItem | null>(null);
  const [restockProductQty, setRestockProductQty] = useState<string>('');
  const [restockProductBuyCost, setRestockProductBuyCost] = useState<string>('');

  // Add material modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newMatName, setNewMatName] = useState<string>('');
  const [newMatCategory, setNewMatCategory] = useState<Material['category']>('paper');
  const [newMatUnit, setNewMatUnit] = useState<Material['unit']>('sheet');
  const [newMatStock, setNewMatStock] = useState<string>('100');
  const [newMatThreshold, setNewMatThreshold] = useState<string>('30');
  const [newMatUnitCost, setNewMatUnitCost] = useState<string>('15');
  const [newMatSku, setNewMatSku] = useState<string>('');
  const [newMatSupplier, setNewMatSupplier] = useState<string>('');

  // Add Direct Sale Item Modal State
  const [showAddDirectSaleModal, setShowAddDirectSaleModal] = useState<boolean>(false);
  const [directName, setDirectName] = useState<string>('');
  const [directCategory, setDirectCategory] = useState<ServiceItem['category']>('retail_goods');
  const [directBuyCost, setDirectBuyCost] = useState<string>('500');
  const [directSalePrice, setDirectSalePrice] = useState<string>('900');
  const [directStock, setDirectStock] = useState<string>('20');
  const [directDescription, setDirectDescription] = useState<string>('');

  // Add Associative Photo Item Modal State (BOM Photo & Ink Builder)
  const [showAddPhotoLinkModal, setShowAddPhotoLinkModal] = useState<boolean>(false);
  const [photoServiceName, setPhotoServiceName] = useState<string>('طباعة وتكبير صور مقاس A4');
  const [photoPaperSize, setPhotoPaperSize] = useState<'A4' | 'A3' | '10x15' | '13x18' | 'custom'>('A4');
  const [photoPaperMatId, setPhotoPaperMatId] = useState<string>((materials || []).find(m => m.category === 'paper')?.id || '');
  const [photosPerSheet, setPhotosPerSheet] = useState<string>('1');
  const [photoInkMatId, setPhotoInkMatId] = useState<string>((materials || []).find(m => m.category === 'ink')?.id || '');
  const [photoInkYield, setPhotoInkYield] = useState<string>('150');
  const [photoPrice, setPhotoPrice] = useState<string>('450');

  const categories = [
    { id: 'all', label: 'جميع المواد' },
    { id: 'paper', label: 'ورق فوتوغرافي' },
    { id: 'ink', label: 'أحبار طابعات' },
    { id: 'frame', label: 'إطارات وبراويز' },
    { id: 'lamination', label: 'تغليف حراري' },
    { id: 'packaging', label: 'أظرفة وتغليف' }
  ];

  const lowStockMaterials = (materials || []).filter(m => m.currentStock <= m.minThreshold);
  const lowStockProducts = (services || []).filter(
    s => s.itemType === 'direct_sale' && typeof s.currentStock === 'number' && s.currentStock <= (s.minThreshold || 3)
  );
  const totalAlertCount = lowStockMaterials.length + lowStockProducts.length;

  const filteredMaterials = (materials || []).filter(m => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.supplier && m.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLowStock = !onlyLowStockFilter || m.currentStock <= m.minThreshold;
    return matchesCat && matchesSearch && matchesLowStock;
  });

  const totalInventoryValue = (materials || []).reduce((acc, m) => acc + (m.currentStock * m.unitCost), 0);

  // Live calculation for associative photo formula modal
  const selectedPaperMat = (materials || []).find(m => m.id === (photoPaperMatId || (materials || [])[0]?.id));
  const selectedInkMat = (materials || []).find(m => m.id === (photoInkMatId || (materials || []).find(x => x.category === 'ink')?.id));

  const numPhotosPerSheet = Math.max(1, Number(photosPerSheet) || 1);
  const numInkYield = Math.max(1, Number(photoInkYield) || 1);
  const sellingPricePerPhoto = Number(photoPrice) || 0;

  const unitPaperCost = selectedPaperMat ? (selectedPaperMat.unitCost / numPhotosPerSheet) : 0;
  const unitInkCost = selectedInkMat ? (selectedInkMat.unitCost * (100 / numInkYield)) : 0;
  const totalFormulaCost = unitPaperCost + unitInkCost;
  const netFormulaProfit = Math.max(0, sellingPricePerPhoto - totalFormulaCost);
  const formulaMargin = sellingPricePerPhoto > 0 ? ((netFormulaProfit / sellingPricePerPhoto) * 100).toFixed(1) : '0';

  const handleExecuteRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockMat || !restockQty) return;
    const qty = Number(restockQty);
    const cost = restockCost ? Number(restockCost) : restockMat.unitCost;
    onRestock(restockMat.id, qty, cost);

    // Automatically record restock purchase expense
    if (onAddExpense && qty > 0 && cost > 0) {
      const totalExpenseAmount = qty * cost;
      const unitLabel = restockMat.unit === 'sheet' ? 'ورقة' : restockMat.unit === 'ml' ? 'مل' : 'قطعة';
      onAddExpense({
        title: `إعادة تموين مخزون: ${restockMat.name} (${qty} ${unitLabel} × ${formatCurrency(cost)})`,
        amount: totalExpenseAmount,
        category: 'materials',
        staffId: currentStaff?.id || 'staff_fouad',
        staffName: currentStaff?.name || 'فؤاد (fouad)',
        notes: `تم قيد المصروف آلياً عند إعادة شحن وتعبئة المخزون`
      });
    }

    setRestockMat(null);
    setRestockQty('');
    setRestockCost('');
  };

  const handleExecuteProductRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || !restockProductQty) return;
    const qty = Number(restockProductQty);
    const buyCost = restockProductBuyCost ? Number(restockProductBuyCost) : (restockProduct.buyCost || 0);

    const updatedProduct: ServiceItem = {
      ...restockProduct,
      currentStock: (restockProduct.currentStock || 0) + qty,
      buyCost: buyCost > 0 ? buyCost : restockProduct.buyCost
    };

    if (onUpdateService) {
      onUpdateService(updatedProduct);
    }

    // Automatically record product restock expense
    if (onAddExpense && qty > 0 && buyCost > 0) {
      const totalExpenseAmount = qty * buyCost;
      onAddExpense({
        title: `إعادة تموين بضاعة وسلعة: ${restockProduct.name} (${qty} قطعة × ${formatCurrency(buyCost)})`,
        amount: totalExpenseAmount,
        category: 'materials',
        staffId: currentStaff?.id || 'staff_fouad',
        staffName: currentStaff?.name || 'فؤاد (fouad)',
        notes: `تم قيد المصروف آلياً عند إعادة تعبئة مخزون السلعة`
      });
    }

    setRestockProduct(null);
    setRestockProductQty('');
    setRestockProductBuyCost('');
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    const stock = Number(newMatStock) || 0;
    const unitCost = Number(newMatUnitCost) || 0;

    onAddMaterial({
      name: newMatName.trim(),
      category: newMatCategory,
      unit: newMatUnit,
      currentStock: stock,
      minThreshold: Number(newMatThreshold) || 10,
      unitCost,
      sku: newMatSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      supplier: newMatSupplier.trim() || 'مورد محلي'
    });

    // Automatically record purchase expense if unitCost > 0 and stock > 0
    if (onAddExpense && unitCost > 0 && stock > 0) {
      const totalExpenseAmount = unitCost * stock;
      const unitLabel = newMatUnit === 'sheet' ? 'ورقة' : newMatUnit === 'ml' ? 'مل' : 'قطعة';
      onAddExpense({
        title: `شراء مواد أولية للمخزن: ${newMatName.trim()} (${stock} ${unitLabel} × ${formatCurrency(unitCost)})`,
        amount: totalExpenseAmount,
        category: 'materials',
        staffId: currentStaff?.id || 'staff_fouad',
        staffName: currentStaff?.name || 'فؤاد (fouad)',
        notes: `تم قيد المصروف آلياً عند إضافة المادة إلى المخزن (تكلفة إجمالية: ${formatCurrency(totalExpenseAmount)})`
      });
    }

    setShowAddModal(false);
    setNewMatName('');
  };

  const handleCreateDirectSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directName.trim()) return;

    const buyCost = Number(directBuyCost) || 0;
    const salePrice = Number(directSalePrice) || 0;
    const stock = Number(directStock) || 0;

    const newService: ServiceItem = {
      id: `retail_${Date.now()}`,
      name: directName.trim(),
      itemType: 'direct_sale',
      category: directCategory,
      buyCost,
      price: salePrice,
      currentStock: stock,
      minThreshold: 3,
      description: directDescription.trim() || 'سلعة بيع مباشر متوفرة بالمحل',
      imageIcon: 'ShoppingBag',
      bom: [],
      estimatedLaborMinutes: 1,
      popular: true
    };

    onAddService(newService);

    // Automatically record purchase expense if buyCost > 0 and stock > 0
    if (onAddExpense && buyCost > 0 && stock > 0) {
      const totalExpenseAmount = buyCost * stock;
      onAddExpense({
        title: `شراء سلعة وبضاعة للمحل: ${directName.trim()} (${stock} قطعة × ${formatCurrency(buyCost)})`,
        amount: totalExpenseAmount,
        category: 'materials',
        staffId: currentStaff?.id || 'staff_fouad',
        staffName: currentStaff?.name || 'فؤاد (fouad)',
        notes: `تم قيد المصروف آلياً عند إضافة السلعة إلى المخزن (تكلفة إجمالية: ${formatCurrency(totalExpenseAmount)})`
      });
    }

    setShowAddDirectSaleModal(false);
    setDirectName('');
    setDirectDescription('');
  };

  const handleCreatePhotoLinkService = (e: React.FormEvent) => {
    e.preventDefault();
    const paperId = photoPaperMatId || (materials || []).find(m => m.category === 'paper')?.id;
    const inkId = photoInkMatId || (materials || []).find(m => m.category === 'ink')?.id;
    if (!photoServiceName.trim() || !paperId || !inkId) return;

    const bomList = [
      { materialId: paperId, quantity: Number((1 / numPhotosPerSheet).toFixed(2)) },
      { materialId: inkId, quantity: Number((100 / numInkYield).toFixed(2)) }
    ];

    const photoConfig: PhotoLinkConfig = {
      paperSize: photoPaperSize,
      paperMaterialId: paperId,
      photosPerSheet: numPhotosPerSheet,
      inkMaterialId: inkId,
      inkYieldPhotos: numInkYield,
      inkPerPhotoMl: Number((100 / numInkYield).toFixed(2)),
      pricePerPhoto: sellingPricePerPhoto
    };

    const newService: ServiceItem = {
      id: `photo_link_${Date.now()}`,
      name: photoServiceName.trim(),
      itemType: 'custom_photo_service',
      category: 'prints',
      buyCost: Number(totalFormulaCost.toFixed(1)),
      price: sellingPricePerPhoto,
      description: `طباعة مقاس ${photoPaperSize} مع خصم تلقائي للورق والحبر (${numPhotosPerSheet} صورة/ورقة)`,
      imageIcon: 'Image',
      bom: bomList,
      photoConfig,
      estimatedLaborMinutes: 5,
      popular: true
    };

    onAddService(newService);
    setShowAddPhotoLinkModal(false);
    setPhotoServiceName('');
  };

  const handleExportCSV = () => {
    const rows = materials.map(m => ({
      'رمز المادة (SKU)': m.sku,
      'اسم المادة': m.name,
      'الصنف': m.category,
      'الرصيد الحالي': m.currentStock,
      'الوحدة': m.unit === 'sheet' ? 'ورقة' : m.unit === 'ml' ? 'ملل' : 'قطعة',
      'حد الأمان': m.minThreshold,
      'سعر تكلفة الوحدة (دج)': m.unitCost,
      'إجمالي القيمة المخزنية (دج)': m.currentStock * m.unitCost,
      'المورد': m.supplier || '',
      'حالة المخزون': m.currentStock <= m.minThreshold ? 'منخفض (تنبيه)' : 'متوفر وطبيعي'
    }));
    exportToCSV('Fotop_Inventory_Stock_Report', rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Inventory Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">إجمالي المواد والسلع</span>
            <div className="text-2xl font-black text-[#292A34] mt-1 font-mono">{materials.length} مادة + {services.length} خدمة</div>
            <span className="text-[11px] text-slate-500 font-medium">ورق، أحبار، إطارات، سلع بيع</span>
          </div>
          <div className="p-3 bg-[#F0F0F0] text-[#292A34] rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">القيمة المالية للمخزون</span>
            <div className="text-2xl font-black text-[#E31C2B] mt-1 font-mono">{formatCurrency(totalInventoryValue)}</div>
            <span className="text-[11px] text-slate-500 font-medium">وفق أسعار الشراء الحالية</span>
          </div>
          <div className="p-3 bg-rose-50 text-[#E31C2B] rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">تنبيهات حد الأمان</span>
            <div className={`text-2xl font-black mt-1 font-mono ${lowStockMaterials.length > 0 ? 'text-[#E31C2B]' : 'text-emerald-700'}`}>
              {lowStockMaterials.length} مواد منخفضة
            </div>
            <span className="text-[11px] text-slate-500 font-medium">تحتاج إلى طلبية توريد عاجلة</span>
          </div>
          <div className={`p-3 rounded-xl ${lowStockMaterials.length > 0 ? 'bg-[#E31C2B] text-white animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#292A34] text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-300">الخصم التلقائي (BOM)</span>
            <div className="text-xl font-black text-amber-400 mt-1">مفعّل آلياً 100%</div>
            <span className="text-[11px] text-slate-300">ربط مباشر بين المبيعات والمخزن</span>
          </div>
          <div className="p-3 bg-[#373946] text-amber-400 rounded-xl">
            <Sliders className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* AUTOMATIC SMART ALERT BANNER: Triggered when any item <= minThreshold */}
      {totalAlertCount > 0 ? (
        <div className="bg-gradient-to-r from-rose-950/90 via-[#292A34] to-rose-950/90 border-2 border-rose-500/80 rounded-2xl p-4 sm:p-5 shadow-xl text-white relative overflow-hidden animate-in fade-in">
          {/* Subtle glowing ambient background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            {/* Alert Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 animate-pulse">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                      <span>تنبيه تلقائي ذكي:</span>
                      <span className="text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded-lg border border-rose-500/40">
                        {totalAlertCount} مواد وسلع أقل من حد الأمان
                      </span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    النظام رصد مواد بلغت المستوى الحرج. يرجى المبادرة بإعادة الشحن والتوريد لضمان استمرارية الطباعة والخدمات.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    setActiveSubTab('materials');
                    setOnlyLowStockFilter(prev => !prev);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    onlyLowStockFilter 
                      ? 'bg-white text-rose-950 font-black shadow-md' 
                      : 'bg-rose-800/80 hover:bg-rose-700 text-white border border-rose-400'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{onlyLowStockFilter ? 'إلغاء التصفية (عرض الكل)' : 'تصفية الجدول (النواقص فقط)'}</span>
                </button>

                <button
                  onClick={() => setIsAlertBannerCollapsed(!isAlertBannerCollapsed)}
                  className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {isAlertBannerCollapsed ? 'توسيع القائمة ▼' : 'طي ▲'}
                </button>
              </div>
            </div>

            {/* Alert Cards Grid (Collapsed/Expanded) */}
            {!isAlertBannerCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {/* Critical Materials */}
                {lowStockMaterials.map(mat => {
                  const isZero = mat.currentStock <= 0;
                  const deficit = Math.max(0, mat.minThreshold - mat.currentStock);
                  const unitLabel = mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة';
                  const ratio = mat.minThreshold > 0 ? Math.min(100, Math.round((mat.currentStock / mat.minThreshold) * 100)) : 0;

                  return (
                    <div 
                      key={mat.id}
                      className="bg-[#1c1d25]/90 border border-rose-500/40 hover:border-rose-400 p-3.5 rounded-xl space-y-2.5 transition-all shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                            <span>{mat.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {mat.sku} • {mat.category === 'paper' ? 'ورق فوتوغرافي' : mat.category === 'ink' ? 'حبر طابعة' : 'مادة مخزن'}
                          </div>
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-black shrink-0 ${
                          isZero 
                            ? 'bg-rose-950 text-rose-200 border border-rose-500 animate-pulse' 
                            : 'bg-amber-950 text-amber-200 border border-amber-500'
                        }`}>
                          {isZero ? 'نفد تماماً ⚠️' : `عجز: ${deficit} ${unitLabel}`}
                        </span>
                      </div>

                      {/* Stock Level Progress */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-300">
                            المتبقي: <strong className={isZero ? 'text-rose-400 font-black' : 'text-amber-400 font-bold'}>{formatNumber(mat.currentStock)}</strong> / حد الأمان: {mat.minThreshold} {unitLabel}
                          </span>
                          <span className="font-mono text-[10px] text-rose-300 font-bold">%{ratio}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isZero ? 'bg-rose-600' : ratio < 30 ? 'bg-rose-500' : 'bg-amber-400'}`}
                            style={{ width: `${Math.max(4, ratio)}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Restock Trigger Button */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                        <span className="text-[10px] text-slate-400">
                          التكلفة: {formatCurrency(mat.unitCost)}/{unitLabel}
                        </span>
                        <button
                          onClick={() => {
                            setRestockMat(mat);
                            setRestockQty(String(Math.max(20, mat.minThreshold * 2)));
                            setRestockCost(String(mat.unitCost));
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>إعادة تعبئة فورية</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Critical Direct Sale Products */}
                {lowStockProducts.map(prod => (
                  <div 
                    key={prod.id}
                    className="bg-[#1c1d25]/90 border border-amber-500/40 hover:border-amber-400 p-3.5 rounded-xl space-y-2.5 transition-all shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                          <span>{prod.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          سلعة بيع مباشر بالمحل
                        </div>
                      </div>

                      <span className="text-[10px] bg-amber-950 text-amber-200 border border-amber-500 px-2 py-0.5 rounded-md font-black shrink-0">
                        متبقي: {prod.currentStock || 0} قطع
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                      <span className="text-[10px] text-slate-400">سعر البيع: {formatCurrency(prod.price)}</span>
                      <button
                        onClick={() => {
                          setRestockProduct(prod);
                          setRestockProductQty('10');
                          setRestockProductBuyCost(String(prod.buyCost || 0));
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        <span>تزويد مخزون</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-emerald-900 text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>حالة المخزون ممتازة: جميع المواد والسلع تقع ضمن مستويات الأمان المطلوبة ولا توجد نواقص حرجة.</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-mono bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
            حد الأمان مفعّل 100%
          </span>
        </div>
      )}

      {/* Sub-Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('materials')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'materials'
                ? 'bg-white text-[#292A34] shadow-sm'
                : 'text-slate-600 hover:text-[#292A34]'
            }`}
          >
            المواد الخام بالمخزن ({materials.length})
          </button>

          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'products'
                ? 'bg-[#E31C2B] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#292A34]'
            }`}
          >
            سلع البيع والخدمات ({services.length})
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Add Direct Retail Item Button */}
          <button
            onClick={() => setShowAddDirectSaleModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="إضافة سلعة للبيع المباشر مع تحديد سعر الشراء وسعر البيع وحساب صافي الربح"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>+ إضافة سلعة للبيع</span>
          </button>

          {/* Add Associative Photo Item Button */}
          <button
            onClick={() => setShowAddPhotoLinkModal(true)}
            className="px-3.5 py-2 bg-[#292A34] hover:bg-[#373946] text-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="ربط حبر صوري بورق حجم معين بعدد صور محدد واحتساب التكلفة وصافي الربح آلياً"
          >
            <Link2 className="w-4 h-4 text-amber-400" />
            <span>+ منتج ارتباطي (ورق + حبر)</span>
          </button>

          {/* Add Raw Material */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-[#E31C2B] hover:bg-[#c91422] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shadow-[#E31C2B]/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ مادة خام جديدة</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-2 text-slate-600 hover:text-[#292A34] hover:bg-slate-100 rounded-xl border border-slate-200"
            title="تصدير كشف المخزون كملف Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </button>
        </div>

      </div>

      {/* VIEW 1: RAW MATERIALS INVENTORY */}
      {activeSubTab === 'materials' && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-[#292A34] text-white'
                      : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}

              {/* Quick Filter: Low Stock Items */}
              {lowStockMaterials.length > 0 && (
                <button
                  onClick={() => setOnlyLowStockFilter(!onlyLowStockFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    onlyLowStockFilter
                      ? 'bg-[#E31C2B] text-white shadow-md shadow-[#E31C2B]/30'
                      : 'bg-rose-50 text-[#E31C2B] border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>تحت حد الأمان ({lowStockMaterials.length})</span>
                </button>
              )}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالمادة أو المورد أو SKU..."
                className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#292A34] text-white font-bold rounded-xl">
                  <th className="p-3 rounded-r-xl">رمز SKU</th>
                  <th className="p-3">اسم المادة والمواصفات</th>
                  <th className="p-3">الصنف</th>
                  <th className="p-3 text-center">الرصيد المتوفر</th>
                  <th className="p-3 text-center">حد الأمان</th>
                  <th className="p-3">سعر الشراء / التكلفة</th>
                  <th className="p-3">إجمالي القيمة</th>
                  <th className="p-3 text-center rounded-l-xl">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMaterials.map(m => {
                  const isLow = m.currentStock <= m.minThreshold;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-500 font-bold">{m.sku}</td>
                      <td className="p-3 font-bold text-[#292A34]">
                        <div className="flex items-center gap-2">
                          <span>{m.name}</span>
                          {isLow && (
                            <span className="bg-[#E31C2B] text-white text-[10px] px-1.5 py-0.5 rounded font-black animate-pulse">
                              منخفض
                            </span>
                          )}
                        </div>
                        {m.supplier && (
                          <span className="text-[10px] text-slate-500 font-normal block mt-0.5">
                            المورد: {m.supplier}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="bg-[#F0F0F0] text-[#292A34] px-2 py-0.5 rounded text-[11px] font-bold">
                          {m.category === 'paper' ? 'ورق' :
                           m.category === 'ink' ? 'حبر' :
                           m.category === 'frame' ? 'إطار' :
                           m.category === 'lamination' ? 'تغليف' : 'أخرى'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-mono text-sm font-black ${isLow ? 'text-[#E31C2B]' : 'text-[#292A34]'}`}>
                          {formatNumber(m.currentStock)}
                        </span>
                        <span className="text-[10px] text-slate-500 mr-1">
                          {m.unit === 'sheet' ? 'ورقة' : m.unit === 'ml' ? 'مل' : 'قطعة'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600 font-bold">
                        {m.minThreshold}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {formatCurrency(m.unitCost)}
                      </td>
                      <td className="p-3 font-mono font-black text-[#292A34]">
                        {formatCurrency(m.currentStock * m.unitCost)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setRestockMat(m)}
                          className="bg-[#292A34] hover:bg-[#E31C2B] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>تزويد</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (No Horizontal Scroll on Small Screens) */}
          <div className="md:hidden space-y-3">
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-bold text-xs">
                لا توجد مواد مطابقة للبحث
              </div>
            ) : (
              filteredMaterials.map(m => {
                const isLow = m.currentStock <= m.minThreshold;
                const unitLabel = m.unit === 'sheet' ? 'ورقة' : m.unit === 'ml' ? 'مل' : 'قطعة';
                return (
                  <div 
                    key={m.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isLow 
                        ? 'bg-red-50/40 border-red-200' 
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                            {m.sku}
                          </span>
                          <span className="text-[10px] bg-[#F0F0F0] text-slate-600 px-2 py-0.5 rounded font-medium">
                            {categories.find(c => c.id === m.category)?.label || m.category}
                          </span>
                          {isLow && (
                            <span className="bg-[#E31C2B] text-white text-[9px] px-1.5 py-0.2 rounded font-black animate-pulse">
                              تحت حد الأمان
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-sm text-[#292A34] mt-1">
                          {m.name}
                        </h4>
                        {m.supplier && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            المورد: {m.supplier}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => setRestockMat(m)}
                        className="bg-[#292A34] hover:bg-[#E31C2B] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        <span>تزويد</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-200 text-[11px]">
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">الرصيد</span>
                        <span className={`font-mono font-black ${isLow ? 'text-[#E31C2B]' : 'text-slate-800'}`}>
                          {formatNumber(m.currentStock)} {unitLabel}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">سعر الشراء</span>
                        <span className="font-mono font-bold text-slate-700">
                          {formatCurrency(m.unitCost)}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">إجمالي القيمة</span>
                        <span className="font-mono font-black text-[#292A34]">
                          {formatCurrency(m.currentStock * m.unitCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}
      {activeSubTab === 'products' && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-[#292A34]">دليل سلع البيع المباشر والخدمات الفوتوغرافية</h3>
              <p className="text-xs text-slate-500 font-medium">عرض أسعار الشراء، أسعار البيع، وصافي الربح المحسوب لكل سلعة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(s => {
              const rawCost = s.itemType === 'direct_sale' ? (s.buyCost || 0) : calculateServiceBOMCost(s.bom, materials);
              const profit = Math.max(0, s.price - rawCost);
              const margin = s.price > 0 ? ((profit / s.price) * 100).toFixed(0) : '0';

              return (
                <div key={s.id} className="bg-[#F9FAFB] border border-slate-200 rounded-2xl p-4 space-y-3 relative hover:border-[#E31C2B] transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl ${s.itemType === 'direct_sale' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-900 text-white'}`}>
                        {s.itemType === 'direct_sale' ? <ShoppingBag className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#292A34]">{s.name}</h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {s.itemType === 'direct_sale' ? 'سلعة بيع مباشر' : s.photoConfig ? `طباعة صور ارتباطية (${s.photoConfig.paperSize})` : 'خدمة مخصصة'}
                        </span>
                      </div>
                    </div>

                    {onDeleteService && s.id.startsWith('retail_') && (
                      <button
                        onClick={() => onDeleteService(s.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="حذف السلعة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{s.description}</p>

                  {/* Financial Breakdown per item */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">سعر التكلفة/الشراء</span>
                      <span className="text-xs font-mono font-bold text-slate-700">{formatCurrency(rawCost)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">سعر البيع للزبون</span>
                      <span className="text-xs font-mono font-bold text-[#292A34]">{formatCurrency(s.price)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold block">صافي الربح</span>
                      <span className="text-xs font-mono font-black text-emerald-600">+{formatCurrency(profit)}</span>
                    </div>
                  </div>

                  {/* Stock and Profit Margin Bar */}
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        %{margin} هامش ربح
                      </span>
                      {s.itemType === 'direct_sale' && typeof s.currentStock === 'number' && (
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          المخزون: <strong className={s.currentStock > 3 ? 'text-emerald-700' : 'text-rose-600'}>{s.currentStock}</strong> قطعة
                        </span>
                      )}
                    </div>

                    {s.itemType === 'direct_sale' && (
                      <button
                        onClick={() => {
                          setRestockProduct(s);
                          setRestockProductQty('10');
                          setRestockProductBuyCost(String(s.buyCost || 0));
                        }}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <PackagePlus className="w-3 h-3" />
                        <span>تزويد مخزون</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* MODAL 1: ADD DIRECT RETAIL SALE ITEM */}
      {showAddDirectSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <ShoppingBag className="w-5 h-5" />
                <span>إضافة سلعة جديدة للبيع المباشر</span>
              </div>
              <button 
                onClick={() => setShowAddDirectSaleModal(false)}
                className="text-emerald-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDirectSale} className="p-5 space-y-4 text-xs font-medium">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">اسم السلعة المعروضة للبيع</label>
                <input
                  type="text"
                  required
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  placeholder="مثال: ألبوم صور 100 صورة / فلاش ديسك 64GB / بطاريات..."
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">سعر الشراء من المورد (دج)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={directBuyCost}
                    onChange={(e) => setDirectBuyCost(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">سعر البيع النهائي للزبون (دج)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={directSalePrice}
                    onChange={(e) => setDirectSalePrice(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">الكمية المتوفرة بالمحل (المخزون الأولي)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={directStock}
                  onChange={(e) => setDirectStock(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Dynamic Live Profit Preview */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-bold text-xs text-emerald-900">
                  <span>صافي الربح التلقائي للقطعة الواحدة:</span>
                  <span className="font-mono text-sm text-emerald-700 font-black">
                    +{formatCurrency(Math.max(0, (Number(directSalePrice) || 0) - (Number(directBuyCost) || 0)))}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800">
                  يحسب تلقائياً ويضاف فوراً إلى شاشة المحاسبة عند كل عملية بيع.
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddDirectSaleModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md cursor-pointer"
                >
                  حفظ السلعة وعرضها للبيع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD ASSOCIATIVE PHOTO ITEM (Photo Paper + Ink Formula Engine) */}
      {showAddPhotoLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2 font-black text-sm">
                <Link2 className="w-5 h-5 text-amber-400" />
                <span>إنشاء منتج ارتباطي (ورق + حبر + استهلاك تلقائي)</span>
              </div>
              <button 
                onClick={() => setShowAddPhotoLinkModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePhotoLinkService} className="p-5 space-y-4 text-xs font-medium">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">اسم الخدمة أو مقاس الصورة</label>
                <input
                  type="text"
                  required
                  value={photoServiceName}
                  onChange={(e) => setPhotoServiceName(e.target.value)}
                  placeholder="مثال: طباعة صورة عائلية A4 فاخرة"
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">نوع ومقاس الورق المربوط</label>
                  <select
                    value={photoPaperMatId}
                    onChange={(e) => setPhotoPaperMatId(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  >
                    {(materials || []).filter(m => m.category === 'paper').map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.unitCost} دج/ورقة)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">كم صورة في الورقة الواحدة؟</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={photosPerSheet}
                    onChange={(e) => setPhotosPerSheet(e.target.value)}
                    placeholder="1 لـ A4، أو 4/8 للصور الشمسية"
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">الحبر الصوري المربوط</label>
                  <select
                    value={photoInkMatId}
                    onChange={(e) => setPhotoInkMatId(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  >
                    {(materials || []).filter(m => m.category === 'ink').map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.unitCost} دج/مل)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">عدد الصور الإجمالي الذي يطبعه الحبر</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={photoInkYield}
                    onChange={(e) => setPhotoInkYield(e.target.value)}
                    placeholder="مثال: 150 صورة / عبوة"
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">سعر بيع الصورة الواحدة للزبون (دج)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={photoPrice}
                  onChange={(e) => setPhotoPrice(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-black text-sm focus:outline-none focus:border-[#E31C2B]"
                />
              </div>

              {/* Dynamic Formula Calculation Box */}
              <div className="bg-[#1e1f27] text-white p-4 rounded-xl space-y-2 border border-slate-700">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Calculator className="w-4 h-4" />
                  <span>الاحتساب التلقائي لتكلفة وصافي ربح الصورة:</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-700 text-xs">
                  <div className="bg-slate-800 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">تكلفة الورق/الصورة</span>
                    <span className="font-mono font-bold text-slate-200">{formatCurrency(unitPaperCost)}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">تكلفة الحبر/الصورة</span>
                    <span className="font-mono font-bold text-slate-200">{formatCurrency(unitInkCost)}</span>
                  </div>
                  <div className="bg-emerald-950/80 border border-emerald-500/40 p-2 rounded-lg">
                    <span className="text-[10px] text-emerald-400 font-bold block">صافي الربح للصورة</span>
                    <span className="font-mono font-black text-emerald-300">+{formatCurrency(netFormulaProfit)}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center">
                  هامش الربح الصافي: <strong className="text-emerald-400 font-bold">%{formulaMargin}</strong> ─ يخصم تلقائياً من المخزون بمجرد تحديد عدد الصور!
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddPhotoLinkModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-black shadow-md shadow-[#E31C2B]/30 cursor-pointer"
                >
                  حفظ المنتج الارتباطي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Material Modal */}
      {restockMat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
                <span>تزويد وتوريد رصيد للمخزن</span>
              </div>
              <button 
                onClick={() => setRestockMat(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteRestock} className="p-5 space-y-4 text-xs font-medium">
              <div className="bg-[#F0F0F0] p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-bold">المادة المحددة:</span>
                <h4 className="text-sm font-black text-[#292A34] mt-0.5">{restockMat.name}</h4>
                <div className="text-[11px] text-slate-600 mt-1 font-mono">
                  الرصيد الحالي: <strong className="text-[#E31C2B]">{restockMat.currentStock}</strong> {restockMat.unit === 'sheet' ? 'ورقة' : 'وحدة'}
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">الكمية المشتراة المضافة ({restockMat.unit === 'sheet' ? 'عدد الأوراق' : restockMat.unit === 'ml' ? 'ملل الحبر' : 'عدد القطع'})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  placeholder="مثال: 500 ورقة / 100 مل..."
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">سعر تكلفة الوحدة الجديد (دج) ─ اختياري</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  placeholder={`الحالي: ${restockMat.unitCost} دج`}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRestockMat(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-black shadow-md shadow-[#E31C2B]/30 cursor-pointer"
                >
                  تأكيد إضافة الرصيد للمخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Retail Product Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <PackagePlus className="w-5 h-5 text-emerald-300" />
                <span>إعادة تزويد مخزون سلعة بضاعة</span>
              </div>
              <button 
                onClick={() => setRestockProduct(null)}
                className="text-slate-300 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteProductRestock} className="p-5 space-y-4 text-xs font-medium">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 block font-bold">السلعة المحددة:</span>
                <h4 className="text-sm font-black text-[#292A34] mt-0.5">{restockProduct.name}</h4>
                <div className="text-[11px] text-slate-600 mt-1 font-mono">
                  المخزون الحالي: <strong className="text-emerald-700">{restockProduct.currentStock || 0}</strong> قطعة
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">عدد القطع المشتراة والمضافة للمخزون</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockProductQty}
                  onChange={(e) => setRestockProductQty(e.target.value)}
                  placeholder="مثال: 10 أو 20 قطعة..."
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-[#292A34] focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">سعر الشراء للقطعة (دج) ─ سيتم قيده كمصروف</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={restockProductBuyCost}
                  onChange={(e) => setRestockProductBuyCost(e.target.value)}
                  placeholder={`الحالي: ${restockProduct.buyCost || 0} دج`}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-[#292A34] focus:outline-none focus:border-emerald-600"
                />
              </div>

              {Number(restockProductQty) > 0 && Number(restockProductBuyCost) > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  إجمالي مبلغ الشراء المقيد كمصروف: {formatCurrency(Number(restockProductQty) * Number(restockProductBuyCost))}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black shadow-md shadow-emerald-700/30 cursor-pointer"
                >
                  تأكيد الشراء وإضافة للمخزون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <Plus className="w-5 h-5 text-[#E31C2B]" />
                <span>تعريف مادة خام أو مستلزم جديد</span>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="p-5 space-y-3.5 text-xs font-medium">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">اسم المادة والمقاس / الموديل</label>
                <input
                  type="text"
                  required
                  value={newMatName}
                  onChange={(e) => setNewMatName(e.target.value)}
                  placeholder="مثال: ورق حريري Satin 15×21 سم 240g"
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">التصنيف</label>
                  <select
                    value={newMatCategory}
                    onChange={(e) => setNewMatCategory(e.target.value as any)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  >
                    <option value="paper">ورق فوتوغرافي</option>
                    <option value="ink">حبر طابعة</option>
                    <option value="frame">إطار وبراويز</option>
                    <option value="lamination">تغليف حراري</option>
                    <option value="packaging">أظرفة وتغليف</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">وحدة القياس</label>
                  <select
                    value={newMatUnit}
                    onChange={(e) => setNewMatUnit(e.target.value as any)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  >
                    <option value="sheet">ورقة (Sheet)</option>
                    <option value="ml">مليلتر حبر (ml)</option>
                    <option value="piece">قطعة / إطار (Piece)</option>
                    <option value="box">علبة / باقة (Box)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">الرصيد الابتدائي</label>
                  <input
                    type="number"
                    value={newMatStock}
                    onChange={(e) => setNewMatStock(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">حد الأمان (تنبيه)</label>
                  <input
                    type="number"
                    value={newMatThreshold}
                    onChange={(e) => setNewMatThreshold(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">تكلفة الوحدة (دج)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMatUnitCost}
                    onChange={(e) => setNewMatUnitCost(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">رمز التخزين (SKU)</label>
                  <input
                    type="text"
                    value={newMatSku}
                    onChange={(e) => setNewMatSku(e.target.value)}
                    placeholder="مثال: PAP-1521-SAT"
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">اسم المورد</label>
                  <input
                    type="text"
                    value={newMatSupplier}
                    onChange={(e) => setNewMatSupplier(e.target.value)}
                    placeholder="مثال: Epson Dist. DZ"
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-black shadow-md shadow-[#E31C2B]/30 cursor-pointer"
                >
                  حفظ المادة في المخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
