import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserCheck, 
  Users, 
  Image, 
  Maximize2, 
  Layers, 
  Frame, 
  Award, 
  ShieldCheck, 
  FileCheck, 
  Wand2, 
  Send, 
  Smile, 
  CopyCheck, 
  CreditCard, 
  Coins, 
  Sparkles, 
  Clock, 
  PackageCheck,
  Receipt,
  User,
  Phone,
  Tag,
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  Boxes,
  AlertTriangle,
  Keyboard,
  Printer,
  HelpCircle,
  Zap,
  Edit3,
  Check,
  X,
  Camera,
  Upload,
  ImageIcon,
  Link2,
  Wallet,
  ReceiptText
} from 'lucide-react';
import { 
  ServiceItem, 
  CartItem, 
  Material, 
  Order, 
  PaymentMethod, 
  Shift, 
  Staff,
  Expense,
  OFFICIAL_SERVICE_CATEGORIES,
  normalizeServiceCategory,
  OfficialServiceCategory
} from '../../types';
import { 
  formatCurrency, 
  calculateServiceBOMCost,
  getItemUnitCost,
  getItemProfit,
  getItemProfitMargin,
  getAssociativeProductUnitCostBreakdown
} from '../../utils/formatters';
import { soundManager } from '../../utils/audio';
import { usePosKeyboardShortcuts } from '../../hooks/usePosKeyboardShortcuts';
import { ShortcutsGuideModal } from '../common/ShortcutsGuideModal';
import { compressAndResizeImage } from '../../utils/imageCompressor';

interface PosViewProps {
  services: ServiceItem[];
  materials: Material[];
  currentStaff: Staff;
  activeShift: Shift | undefined;
  orders?: Order[];
  onCheckoutOrder: (orderData: Omit<Order, 'id' | 'ticketNumber' | 'createdAt'>) => void;
  onPrintLastReceipt?: () => void;
  onAddService?: (newService: ServiceItem) => void;
  onUpdateService?: (updatedService: ServiceItem) => void;
  onDeleteService?: (serviceId: string) => void;
  onOpenExpenseModal?: () => void;
  expenses?: Expense[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  UserCheck,
  Users,
  CopyCheck,
  Image,
  Maximize2,
  Layers,
  Frame,
  Award,
  ShieldCheck,
  FileCheck,
  Wand2,
  Send,
  Smile,
  ShoppingBag
};

export const PosView: React.FC<PosViewProps> = ({
  services = [],
  materials = [],
  currentStaff,
  activeShift,
  orders = [],
  onCheckoutOrder,
  onAddService,
  onUpdateService,
  onDeleteService,
  onOpenExpenseModal,
  expenses = []
}) => {
  const isManager = currentStaff?.role === 'manager';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPosExpensesModal, setShowPosExpensesModal] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = useMemo(() => {
    return (expenses || []).filter(e => e.createdAt && e.createdAt.startsWith(todayStr));
  }, [expenses, todayStr]);
  const todayExpensesTotal = useMemo(() => {
    return todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [todayExpenses]);

  // Quick Edit and Delete Product in POS State
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editServiceName, setEditServiceName] = useState<string>('');
  const [editServiceCategory, setEditServiceCategory] = useState<OfficialServiceCategory>('goods_and_accessories');
  const [editServicePrice, setEditServicePrice] = useState<string>('');
  const [editServiceBuyCost, setEditServiceBuyCost] = useState<string>('');
  const [editServiceStock, setEditServiceStock] = useState<string>('');
  const [editServiceDescription, setEditServiceDescription] = useState<string>('');
  const [editServiceImageUrl, setEditServiceImageUrl] = useState<string>('');
  const [editServiceFrameMatId, setEditServiceFrameMatId] = useState<string>('');
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);

  // Preset studio product images for quick selection in POS
  const PRODUCT_IMAGE_PRESETS = [
    { name: 'إطار صور أسود فاخر', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80' },
    { name: 'ألبوم صور كلاسيكي', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80' },
    { name: 'فلاش ديسك USB صور', url: 'https://images.unsplash.com/photo-1622954989659-52e69fce092e?w=400&auto=format&fit=crop&q=80' },
    { name: 'كوب مطبوع بصورة شخصية', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80' },
    { name: 'طباعة وتكبير صور فوتوغرافية', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80' },
    { name: 'لوحة كانفاس جدارية معلقة', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80' }
  ];

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAndResizeImage(file);
      setEditServiceImageUrl(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditProduct = (e: React.MouseEvent, s: ServiceItem) => {
    e.stopPropagation();
    setEditingService(s);
    setEditServiceName(s.name);
    setEditServiceCategory(normalizeServiceCategory(s.category));
    setEditServicePrice(String(s.price));
    setEditServiceBuyCost(String(s.buyCost ?? 0));
    setEditServiceStock(String(s.currentStock ?? 0));
    setEditServiceDescription(s.description || '');
    setEditServiceImageUrl(s.imageUrl || '');
    setEditServiceFrameMatId(s.photoConfig?.frameMaterialId || '');
  };

  const handleOpenDeleteProduct = (e: React.MouseEvent, s: ServiceItem) => {
    e.stopPropagation();
    setServiceToDelete(s);
  };
  
  // Worker Today's Performance (إجمالي مبيعات العامل اليومية)
  const workerTodayOrders = useMemo(() => {
    return (orders || []).filter(o => {
      const oDate = o.createdAt ? o.createdAt.split('T')[0] : '';
      const isMine = o.staffId === currentStaff.id || o.staffName === currentStaff.name;
      return isMine && oDate === todayStr;
    });
  }, [orders, currentStaff, todayStr]);

  const workerTodaySales = useMemo(() => {
    return workerTodayOrders.reduce((sum, o) => sum + o.total, 0);
  }, [workerTodayOrders]);
  
  // Customer & checkout form state
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('فوري (جاهز)');
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // 5 Official Categories per User Request:
  // 1. اخراج الصور الشمسية والعادية
  // 2. كوادر وتكبير الصور
  // 3. سلع وإكسسوارات
  // 4. خدمات الطباعة
  // 5. جلسة تصوير داخل الاستديو
  const categories = [
    { id: 'all', label: 'جميع الأقسام والخدمات', icon: Sparkles },
    { id: 'id_and_regular_photos', label: '1. اخراج الصور الشمسية والعادية', icon: UserCheck },
    { id: 'frames_and_enlargements', label: '2. كوادر وتكبير الصور', icon: Frame },
    { id: 'goods_and_accessories', label: '3. سلع وإكسسوارات', icon: ShoppingBag },
    { id: 'printing_services', label: '4. خدمات الطباعة', icon: Printer },
    { id: 'studio_sessions', label: '5. جلسة تصوير داخل الاستديو', icon: Smile }
  ];

  // Extract unique custom categories defined on services
  const customCategoriesInPOS = useMemo(() => {
    const cats = new Set<string>();
    (services || []).forEach(s => {
      if (s.customCategoryName && s.customCategoryName.trim()) {
        cats.add(s.customCategoryName.trim());
      }
    });
    return Array.from(cats);
  }, [services]);

  // Filter services with accurate normalization and custom categories support
  const filteredServices = useMemo(() => {
    return (services || []).filter(service => {
      const normCat = normalizeServiceCategory(service.category, service.name);
      const matchesCat = selectedCategory === 'all' 
        || normCat === selectedCategory
        || service.customCategoryName === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.customCategoryName && service.customCategoryName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (service: ServiceItem) => {
    if (service.itemType === 'direct_sale' && typeof service.currentStock === 'number' && service.currentStock <= 0) {
      alert(`السلعة "${service.name}" غير متوفرة في المخزن حالياً (الرصيد 0). يرجى إعادة تموين المخزون.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.service.id === service.id);
      if (existing) {
        if (service.itemType === 'direct_sale' && typeof service.currentStock === 'number' && existing.quantity >= service.currentStock) {
          alert(`لا يمكنك إضافة المزيد من "${service.name}". الكمية المتوفرة بالمخزن هي ${service.currentStock} قطعة فقط.`);
          return prev;
        }
        return prev.map(item =>
          item.service.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.service.id === serviceId) {
            const newQty = item.quantity + delta;
            if (delta > 0 && item.service.itemType === 'direct_sale' && typeof item.service.currentStock === 'number' && newQty > item.service.currentStock) {
              alert(`الكمية المتوفرة بالمخزن من "${item.service.name}" هي ${item.service.currentStock} قطعة فقط.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (serviceId: string) => {
    setCart(prev => prev.filter(item => item.service.id !== serviceId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscount(0);
    setPaidAmount('');
    setOrderNotes('');
  };

  // Computations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.customPrice ?? item.service.price) * item.quantity, 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  // Calculate live total BOM and goods deduction summary
  const { deductionsList, totalBOMCost } = useMemo(() => {
    const rawMaterialMap: Record<string, { materialId: string; materialName: string; quantity: number; unit: string; cost: number }> = {};
    let calculatedCost = 0;

    for (const item of cart) {
      if (item.service.itemType === 'direct_sale') {
        const itemBuyCost = Number(item.service.buyCost || 0);
        const itemTotalCost = Number((itemBuyCost * item.quantity).toFixed(2));
        calculatedCost += itemTotalCost;

        if (!rawMaterialMap[item.service.id]) {
          rawMaterialMap[item.service.id] = {
            materialId: item.service.id,
            materialName: item.service.name,
            quantity: 0,
            unit: 'قطعة',
            cost: 0
          };
        }
        rawMaterialMap[item.service.id].quantity += item.quantity;
        rawMaterialMap[item.service.id].cost += itemTotalCost;
      } else {
        // Services with BOM (Raw materials & merchandise components)
        for (const bomItem of (item.service.bom || [])) {
          const mat = materials.find(m => m.id === bomItem.materialId);
          if (mat) {
            const qty = Number((bomItem.quantity * item.quantity).toFixed(2));
            const cost = Number((qty * mat.unitCost).toFixed(2));
            calculatedCost += cost;

            if (!rawMaterialMap[mat.id]) {
              rawMaterialMap[mat.id] = {
                materialId: mat.id,
                materialName: mat.name,
                quantity: 0,
                unit: mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة',
                cost: 0
              };
            }
            rawMaterialMap[mat.id].quantity += qty;
            rawMaterialMap[mat.id].cost += cost;
          } else {
            const good = services.find(s => s.id === bomItem.materialId);
            if (good) {
              const qty = Number((bomItem.quantity * item.quantity).toFixed(2));
              const cost = Number((qty * (good.buyCost || 0)).toFixed(2));
              calculatedCost += cost;

              if (!rawMaterialMap[good.id]) {
                rawMaterialMap[good.id] = {
                  materialId: good.id,
                  materialName: `${good.name} (سلعة)`,
                  quantity: 0,
                  unit: 'قطعة',
                  cost: 0
                };
              }
              rawMaterialMap[good.id].quantity += qty;
              rawMaterialMap[good.id].cost += cost;
            } else if (bomItem.unitCost) {
              const qty = Number((bomItem.quantity * item.quantity).toFixed(2));
              const cost = Number((qty * bomItem.unitCost).toFixed(2));
              calculatedCost += cost;
            }
          }
        }
      }
    }

    return {
      deductionsList: Object.values(rawMaterialMap),
      totalBOMCost: calculatedCost
    };
  }, [cart, materials, services]);

  const netEstimatedProfit = useMemo(() => {
    return Math.max(0, total - totalBOMCost);
  }, [total, totalBOMCost]);

  // Handle Checkout
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const actualPaid = paidAmount === '' ? total : Number(paidAmount);

    onCheckoutOrder({
      customerName: customerName.trim() || 'زبون مباشر',
      customerPhone: customerPhone.trim(),
      estimatedPickupAt: pickupTime,
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      shiftId: activeShift?.id || 'shift_default',
      items: cart,
      subtotal,
      discount,
      total,
      paidAmount: actualPaid,
      paymentMethod,
      status: pickupTime.includes('فوري') ? 'delivered' : 'processing',
      notes: orderNotes,
      totalBOMCost,
      netProfit: total - totalBOMCost,
      materialsDeducted: deductionsList
    });

    clearCart();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left / Main Section: Services Catalog & Fast Grid (8 cols) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        
        {/* Worker Daily Sales Performance Banner (إجمالي مبيعات العامل اليومية) */}
        {!isManager && (
          <div className="bg-gradient-to-r from-[#292A34] to-[#1e1f27] text-white p-4 rounded-2xl border border-slate-700 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-300 font-bold">إجمالي مبيعاتك اليومية:</div>
                <div className="text-xl font-black text-emerald-400 font-mono tracking-wide">
                  {formatCurrency(workerTodaySales)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <span className="bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 font-mono font-bold text-white flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{workerTodayOrders.length} معاملة منجزة بيدك اليوم</span>
              </span>
            </div>
          </div>
        )}

        {/* Search & Fast Category Filters */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
          
          {/* Top Quick Bar: Petty Cash Summary & Quick Expense Button */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setShowPosExpensesModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="عرض سجل المصروفات النثرية لليوم"
            >
              <Wallet className="w-4 h-4 text-amber-700" />
              <span>المصروفات النثرية اليوم:</span>
              <span className="font-mono font-black text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                {formatCurrency(todayExpensesTotal)}
              </span>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                {todayExpenses.length} سند
              </span>
            </button>

            {onOpenExpenseModal && (
              <button
                type="button"
                onClick={onOpenExpenseModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="تسجيل إخراج نقدي / مصروف نثري سريع من الدرج"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ تسجيل مصروف نثري</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن باقة أو خدمة (مثال: 4 صور شمسية، A4، إطار، تغليف...)"
              className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl pr-11 pl-4 py-2.5 text-sm text-[#292A34] placeholder-slate-500 focus:outline-none focus:border-[#E31C2B] focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-[#E31C2B] cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#292A34] text-white shadow-md'
                      : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200 hover:text-[#292A34]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}

            {/* Custom Categories from products */}
            {customCategoriesInPOS.map(customCat => {
              const isSelected = selectedCategory === customCat;
              const count = (services || []).filter(s => s.customCategoryName === customCat).length;

              return (
                <button
                  key={customCat}
                  onClick={() => setSelectedCategory(customCat)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <Tag className="w-3 h-3 text-amber-600" />
                  <span>{customCat}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-amber-700 text-white' : 'bg-amber-200/80 text-amber-950'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-700">لا توجد خدمات أو منتجات معروضة حالياً</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              يمكنك إضافة خدمات طباعة مخصصة أو سلع بيع مباشر من تبويب "المخزن والمواد" للبدء في البيع فوراً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredServices.map(service => {
              const Icon = ICON_MAP[service.imageIcon] || Image;
              const unitCost = getItemUnitCost(service, materials);
              const netProfit = getItemProfit(service, materials);
              const profitMargin = getItemProfitMargin(service, materials);
              const isDirectSale = service.itemType === 'direct_sale';
              const stock = typeof service.currentStock === 'number' ? service.currentStock : null;
              const isOutOfStock = isDirectSale && stock !== null && stock <= 0;

              return (
                <div
                  key={service.id}
                  onClick={() => addToCart(service)}
                  className={`group relative bg-white hover:bg-white border-2 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between ${
                    isOutOfStock 
                      ? 'border-rose-200 opacity-80 hover:border-rose-400' 
                      : 'border-slate-200 hover:border-[#E31C2B]'
                  }`}
                >
                  <div>
                    {/* Product Image Banner with Resilient Fallback */}
                    <div className="w-full h-32 rounded-xl overflow-hidden mb-2.5 bg-slate-100 border border-slate-200 group-hover:opacity-95 transition-all relative">
                      <img 
                        src={service.imageUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80'} 
                        alt={service.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80';
                        }}
                      />
                      {(onUpdateService) && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditProduct(e, service)}
                          className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/75 hover:bg-black text-white text-[9px] font-bold flex items-center gap-1 backdrop-blur-xs transition-colors shadow-sm cursor-pointer opacity-85 hover:opacity-100"
                          title="تغيير أو تعديل صورة المنتج"
                        >
                          <Camera className="w-3 h-3 text-amber-400" />
                          <span>{service.imageUrl ? 'تعديل الصورة' : '+ إضافة صورة'}</span>
                        </button>
                      )}
                    </div>

                    {/* Top Bar: Icon + Action Buttons (Edit/Delete) + Price */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-inner ${
                          isDirectSale
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                            : 'bg-[#F0F0F0] border-slate-200 text-[#E31C2B] group-hover:bg-[#E31C2B] group-hover:text-white'
                        }`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        {/* Quick Edit & Delete Icons for Staff & Manager */}
                        {(onUpdateService || onDeleteService) && (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            {onUpdateService && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditProduct(e, service)}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-700 transition-colors shadow-2xs cursor-pointer"
                                title="تعديل السعر أو بيانات المنتج"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteService && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenDeleteProduct(e, service)}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition-colors shadow-2xs cursor-pointer"
                                title="حذف هذا المنتج"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl sm:text-3xl font-black text-[#E31C2B] font-mono tracking-tight leading-none">
                          {formatCurrency(service.price)}
                        </div>
                        {isManager ? (
                          <div className="text-xs text-emerald-700 font-black flex items-center justify-end gap-1 mt-1">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            <span>صافي: +{formatCurrency(netProfit)} (%{profitMargin})</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 font-bold text-right mt-1">
                            {service.itemType === 'direct_sale' ? 'سلعة بيع مباشر' : 'خدمة تصوير'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom Category Tag if present */}
                    {service.customCategoryName && (
                      <div className="mb-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold shadow-2xs">
                          <Tag className="w-3 h-3 text-amber-600" />
                          <span>{service.customCategoryName}</span>
                        </span>
                      </div>
                    )}

                    {/* Title & Description with enlarged, bold font */}
                    <h3 className="font-black text-xl sm:text-2xl text-[#292A34] mb-1 group-hover:text-[#E31C2B] transition-colors leading-snug tracking-tight">
                      {service.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-2 font-medium">
                      {service.description}
                    </p>

                    {/* Summary Row: Full Price + Net Profit side-by-side */}
                    <div className="flex items-center justify-between gap-1 py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-2 text-xs">
                      <div className="font-bold text-slate-700">
                        <span className="text-slate-500 text-[11px]">كامل المبلغ: </span>
                        <strong className="font-mono font-black text-slate-900 text-sm">{formatCurrency(service.price)}</strong>
                      </div>
                      {isManager && (
                        <div className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-lg font-mono text-xs border border-emerald-300">
                          الربح: +{formatCurrency(netProfit)}
                        </div>
                      )}
                    </div>

                    {/* Stock Badge for Direct Sale Items */}
                    {isDirectSale && stock !== null && (
                      <div className="mb-2">
                        {stock > 3 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                            <Boxes className="w-4 h-4 text-emerald-600" />
                            <span>المخزون: <strong className="font-mono text-emerald-950 font-black text-sm">{stock}</strong> متوفرة</span>
                          </div>
                        ) : stock > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>مخزون منخفض: <strong className="font-mono text-amber-950 font-black text-sm">{stock}</strong> فقط!</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            <span>نفذت الكمية من المخزن (0)</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Linked Photo Product: Accurate Per-Unit Photo Cost & Consumables Breakdown */}
                    {service.photoConfig && (() => {
                      const breakdown = getAssociativeProductUnitCostBreakdown(service, materials, services);
                      const cfg = service.photoConfig;
                      const pPerSheet = breakdown.photosPerSheet || cfg.photosPerSheet || 1;

                      return (
                        <div className="mb-2 p-2 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5 text-[11px] text-amber-950">
                              <Link2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>منتج ارتباطي ({cfg?.paperSize}):</span>
                            </span>
                            <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                              {pPerSheet} صور/ورقة
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[10px] pt-1 border-t border-amber-200/80 text-center">
                            <div className="bg-white p-1 rounded-lg border border-amber-200">
                              <span className="text-slate-500 block">ورق:</span>
                              <strong className="font-mono text-slate-700 font-bold">{formatCurrency(breakdown.paperUnitCost)}</strong>
                            </div>
                            <div className="bg-white p-1 rounded-lg border border-amber-300">
                              <span className="text-amber-800 block">حبر:</span>
                              <strong className="font-mono text-amber-800 font-bold">{formatCurrency(breakdown.inkUnitCost)}</strong>
                            </div>
                            <div className="bg-amber-100 p-1 rounded-lg border border-amber-300">
                              <span className="text-amber-950 font-bold block">تكلفة الصورة:</span>
                              <strong className="font-mono text-[#E31C2B] font-black">{formatCurrency(breakdown.totalUnitCost)}</strong>
                            </div>
                          </div>
                          {pPerSheet > 1 && (
                            <div className="text-[9px] text-slate-500 flex justify-between items-center px-1 font-mono">
                              <span>تكلفة الباقة ({pPerSheet} صور):</span>
                              <strong className="text-slate-700">{formatCurrency(breakdown.packageTotalCost)}</strong>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Bottom BOM or Good Deduction Badge */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      {isDirectSale ? (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold">
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="truncate max-w-[170px]">
                            {isManager ? `سلعة (شراء: ${formatCurrency(unitCost)})` : 'سلعة متجر الاستوديو'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#E31C2B]" />
                          <span className="truncate max-w-[170px]">
                            {Array.isArray(service.bom) && service.bom.length > 0 ? (
                              `خصم: ${service.bom.map(b => {
                                const m = (materials || []).find(mat => mat.id === b.materialId);
                                const g = (services || []).find(s => s.id === b.materialId);
                                const name = m ? m.name.split(' ')[0] : g ? `${g.name.split(' ')[0]} (سلعة)` : (b.name ? b.name.split(' ')[0] : 'مكون');
                                return `${b.quantity} ${name}`;
                              }).join(' + ')}`
                            ) : (
                              'خدمة رقمية (بدون ورق)'
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`p-1.5 rounded-lg font-bold transition-colors ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-[#F0F0F0] group-hover:bg-[#E31C2B] group-hover:text-white text-[#292A34]'
                    }`}>
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Right Section: Interactive Cart & Checkout Drawer (4-5 cols) */}
      <div id="pos-cart-section" className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 sm:p-5 sticky top-[135px] space-y-4">
        
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E31C2B] text-white">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#292A34]">سلة الطلب الحالي</h2>
              <p className="text-xs text-slate-500 font-medium">{cart.length} خدمات مضافة</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إفراغ السلة</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        {cart.length === 0 ? (
          <div className="py-10 text-center text-slate-400 space-y-2 bg-[#F0F0F0] rounded-xl border border-dashed border-slate-300">
            <PackageCheck className="w-10 h-10 mx-auto stroke-1 text-slate-400" />
            <p className="text-sm font-bold text-slate-600">السلة فارغة حالياً</p>
            <p className="text-xs text-slate-500">اضغط على أي خدمة لإضافتها وإصدار التذكرة</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div 
                key={item.service.id}
                className="bg-[#F0F0F0] border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {item.service.imageUrl ? (
                    <img 
                      src={item.service.imageUrl} 
                      alt={item.service.name} 
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-black text-[#292A34] truncate">{item.service.name}</h4>
                    <div className="text-xs text-[#E31C2B] font-mono font-black mt-0.5">
                      {formatCurrency(item.service.price)} × {item.quantity} = {formatCurrency(item.service.price * item.quantity)}
                    </div>
                  </div>
                </div>

                {/* Quantity Buttons */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5 shadow-sm">
                  <button
                    onClick={() => updateQuantity(item.service.id, -1)}
                    className="p-1 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-black font-mono px-2 text-[#292A34]">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.service.id, 1)}
                    className="p-1 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.service.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Live BOM Material Deduction Preview */}
        {deductionsList.length > 0 && (
          <div className="bg-[#292A34] text-white rounded-xl p-3 text-xs space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between font-bold text-slate-100">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#E31C2B]" />
                الخصم التلقائي للمخزون (BOM):
              </span>
              {isManager && (
                <span className="font-mono text-[11px] text-amber-400">تكلفة المواد: {formatCurrency(totalBOMCost)}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 text-[10px] text-slate-300">
              {deductionsList.map((b, idx) => (
                <span key={idx} className="bg-[#373946] border border-slate-600 px-2 py-0.5 rounded-md font-mono">
                  {b.materialName.split(' ')[0]}: -{b.quantity} {b.unit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Checkout Form */}
        <form onSubmit={handleCheckout} className="space-y-3 pt-2 border-t border-slate-200 text-xs">
          
          {/* Customer Name & Phone */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">اسم الزبون (اختياري)</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="زبون مباشر..."
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl pr-8 pl-2 py-2 text-[#292A34] placeholder-slate-400 focus:outline-none focus:border-[#E31C2B] focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">رقم الهاتف (للتواصل)</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="06 / 05 / 07..."
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl pr-8 pl-2 py-2 text-[#292A34] placeholder-slate-400 focus:outline-none focus:border-[#E31C2B] focus:bg-white font-mono dir-ltr text-right font-medium"
                />
              </div>
            </div>
          </div>

          {/* Pickup time presets */}
          <div>
            <label className="text-slate-700 block mb-1 font-bold">موعد استلام الصور</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['فوري (جاهز)', 'اليوم 17:00', 'غداً 10:00'].map(time => (
                <button
                  type="button"
                  key={time}
                  onClick={() => setPickupTime(time)}
                  className={`py-1.5 px-2 rounded-xl text-center font-bold text-[11px] transition-all cursor-pointer ${
                    pickupTime === time
                      ? 'bg-[#E31C2B] text-white shadow-sm'
                      : 'bg-[#F0F0F0] border border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method & Discount */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">طريقة الدفع</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1 font-bold text-[11px] cursor-pointer transition-all ${
                    paymentMethod === 'cash' ? 'bg-[#292A34] text-white shadow-sm' : 'bg-[#F0F0F0] text-slate-700 border border-slate-300'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  نقداً
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1 font-bold text-[11px] cursor-pointer transition-all ${
                    paymentMethod === 'card' ? 'bg-[#292A34] text-white shadow-sm' : 'bg-[#F0F0F0] text-slate-700 border border-slate-300'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                  بطاقة
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">تخفيض للزبون (دج)</label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl pr-8 pl-2 py-1.5 text-[#292A34] placeholder-slate-400 focus:outline-none focus:border-[#E31C2B] font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Paid Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-700 font-bold">المبلغ المستلم / المدفوع (دج)</label>
              <button
                type="button"
                onClick={() => setPaidAmount(String(total))}
                className="text-[11px] text-[#E31C2B] font-bold hover:underline cursor-pointer"
              >
                دفع كامل الحساب ({total} دج)
              </button>
            </div>
            <input
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder={`كامل المبلغ: ${total} دج`}
              className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] placeholder-slate-400 focus:outline-none focus:border-[#E31C2B] font-mono text-sm font-black"
            />
          </div>

          {/* Totals Summary */}
          <div className="bg-[#292A34] text-white rounded-xl p-3.5 space-y-1.5 shadow-md">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>المجموع الفرعي:</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-400 font-bold">
                <span>الخصم الممنوح:</span>
                <span className="font-mono">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-black text-white pt-1.5 border-t border-slate-700">
              <span>المبلغ الإجمالي:</span>
              <span className="text-amber-400 font-mono text-base">{formatCurrency(total)}</span>
            </div>
            {isManager && (
              <div className="flex justify-between text-[11px] text-emerald-400 font-bold">
                <span>صافي ربح الطلب التقديري:</span>
                <span className="font-mono">+{formatCurrency(netEstimatedProfit)}</span>
              </div>
            )}
          </div>

          {/* Big Checkout Button */}
          <button
            type="submit"
            disabled={cart.length === 0}
            className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              cart.length > 0
                ? 'bg-[#E31C2B] hover:bg-[#c91422] text-white shadow-[#E31C2B]/30 active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تسجيل وإتمام الطلب (تَـمّ)</span>
          </button>

        </form>

      </div>

      {/* Mobile Floating Cart Summary Button */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-16 inset-x-3 z-20 animate-in fade-in slide-in-from-bottom-3">
          <button
            onClick={() => {
              document.getElementById('pos-cart-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full bg-[#E31C2B] hover:bg-[#c91422] text-white py-2.5 px-4 rounded-2xl shadow-2xl flex items-center justify-between font-black text-xs transition-transform active:scale-98 border border-white/20 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              <span>سلة الطلب ({cart.reduce((s, i) => s + i.quantity, 0)} عنصر)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{formatCurrency(total)}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">إتمام المحاسبة ↵</span>
            </div>
          </button>
        </div>
      )}

      {/* Quick Edit Product Modal in POS */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs" dir="rtl" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white border border-slate-300 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#292A34]">تعديل بيانات وسعر السلعة</h3>
                  <p className="text-[11px] text-slate-500">{editingService.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingService || !onUpdateService) return;

                // Build updated BOM if frame was linked
                let updatedBom = [...(editingService.bom || [])];
                if (editingService.photoConfig) {
                  // Remove old frame material from BOM if present
                  const frameMatIds = materials.filter(m => m.category === 'frame').map(m => m.id);
                  updatedBom = updatedBom.filter(b => !frameMatIds.includes(b.materialId));
                  if (editServiceFrameMatId) {
                    updatedBom.push({
                      materialId: editServiceFrameMatId,
                      quantity: 1
                    });
                  }
                }

                const updated: ServiceItem = {
                  ...editingService,
                  name: editServiceName.trim() || editingService.name,
                  category: editServiceCategory,
                  price: Number(editServicePrice) || editingService.price,
                  buyCost: Number(editServiceBuyCost) >= 0 ? Number(editServiceBuyCost) : editingService.buyCost,
                  currentStock: Number(editServiceStock) >= 0 ? Number(editServiceStock) : editingService.currentStock,
                  description: editServiceDescription.trim() || editingService.description,
                  imageUrl: editServiceImageUrl.trim() || undefined,
                  bom: updatedBom,
                  photoConfig: editingService.photoConfig ? {
                    ...editingService.photoConfig,
                    frameMaterialId: editServiceFrameMatId || undefined
                  } : undefined
                };
                onUpdateService(updated);
                setEditingService(null);
              }}
              className="space-y-3.5 text-xs font-bold"
            >
              <div>
                <label className="text-slate-700 block mb-1">اسم المنتج أو الخدمة *</label>
                <input
                  type="text"
                  required
                  value={editServiceName}
                  onChange={(e) => setEditServiceName(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] text-sm font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Category Selector (5 Official Categories) */}
              <div>
                <label className="text-slate-700 block mb-1 font-bold">التصنيف الرسمي للخدمة/المنتج</label>
                <select
                  value={editServiceCategory}
                  onChange={(e) => setEditServiceCategory(e.target.value as OfficialServiceCategory)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold cursor-pointer focus:outline-none focus:border-blue-500"
                >
                  {OFFICIAL_SERVICE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">سعر الشراء / التكلفة (دج)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editServiceBuyCost}
                    onChange={(e) => setEditServiceBuyCost(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">سعر البيع للزبون (دج) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={editServicePrice}
                    onChange={(e) => setEditServicePrice(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-emerald-700 font-mono font-black text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Linked Product Frame & BOM Info in POS Edit Modal */}
              {editingService.photoConfig && (() => {
                const breakdown = getAssociativeProductUnitCostBreakdown(editingService, materials, services);
                const cfg = editingService.photoConfig;
                const currentFrameMat = materials.find(m => m.id === (editServiceFrameMatId || cfg.frameMaterialId));
                const availableFrames = materials.filter(m => m.category === 'frame');
                const pPerSheet = breakdown.photosPerSheet || cfg.photosPerSheet || 1;
                const frameCost = currentFrameMat ? currentFrameMat.unitCost : 0;
                const totalItemUnitCost = breakdown.paperUnitCost + breakdown.inkUnitCost + frameCost + breakdown.otherConsumablesCost;

                return (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-amber-900 font-bold">
                      <span className="text-[11px] flex items-center gap-1">
                        <Link2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>عناصر تكلفة الوحدة (ورق + حبر + كادر):</span>
                      </span>
                      <span className="text-[10px] font-mono bg-amber-200/80 px-2 py-0.5 rounded-full font-bold">
                        مقاس {cfg?.paperSize} ({pPerSheet} صور/ورقة)
                      </span>
                    </div>

                    {/* Frame Selection */}
                    <div>
                      <label className="text-amber-900 font-bold block mb-1 text-[11px]">
                        الكادر / الإطار المرتبط (BOM):
                      </label>
                      <select
                        value={editServiceFrameMatId}
                        onChange={(e) => setEditServiceFrameMatId(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs font-bold cursor-pointer"
                      >
                        <option value="">-- بدون كادر (طباعة صورة فقط) --</option>
                        {availableFrames.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name} (تكلفة الكادر: {formatCurrency(f.unitCost)} - المخزون: {f.currentStock} قطعة)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Breakdown Matrix */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                      <div className="bg-white p-1.5 rounded-lg border border-amber-200">
                        <span className="text-slate-500 block">ورق الصورة</span>
                        <strong className="font-mono text-slate-700 font-bold text-xs block">{formatCurrency(breakdown.paperUnitCost)}</strong>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-amber-300">
                        <span className="text-amber-800 font-bold block">حبر الصورة</span>
                        <strong className="font-mono text-amber-800 font-black text-xs block">{formatCurrency(breakdown.inkUnitCost)}</strong>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-purple-200">
                        <span className="text-purple-700 block">الكادر/الإطار</span>
                        <strong className="font-mono text-purple-700 font-bold text-xs block">{formatCurrency(frameCost)}</strong>
                      </div>
                      <div className="bg-amber-100 p-1.5 rounded-lg border border-amber-300">
                        <span className="text-amber-950 font-bold block">تكلفة الصورة الواحدة</span>
                        <strong className="font-mono text-[#E31C2B] font-black text-xs block">{formatCurrency(totalItemUnitCost)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {editingService.itemType === 'direct_sale' && (
                <div>
                  <label className="text-slate-700 block mb-1">الرصيد المتاح بالمخزن (قطعة)</label>
                  <input
                    type="number"
                    min="0"
                    value={editServiceStock}
                    onChange={(e) => setEditServiceStock(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Enhanced Product Image Section */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>صورة المنتج (رفع من الجهاز أو اختيار نموذج)</span>
                  </label>
                  {editServiceImageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditServiceImageUrl('')}
                      className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>حذف الصورة</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-3 items-start">
                  {/* Image preview box */}
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                    {editServiceImageUrl ? (
                      <img 
                        src={editServiceImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-1 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-0.5 text-slate-300" />
                        <span className="text-[9px] block font-bold">بدون صورة</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: File upload & URL input */}
                  <div className="flex-1 space-y-2">
                    <label className="w-full px-3 py-2 bg-white border border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer text-[11px] font-bold text-slate-700 hover:text-blue-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>اختر صورة من الهاتف أو الحاسوب</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileUpload}
                      />
                    </label>

                    <input
                      type="url"
                      value={editServiceImageUrl}
                      onChange={(e) => setEditServiceImageUrl(e.target.value)}
                      placeholder="أو الصق رابط صورة ويب (https://...)"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-[#292A34] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Quick Studio Presets */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">أو اختر صورة جاهزة بنقرة واحدة:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {PRODUCT_IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditServiceImageUrl(preset.url)}
                        className={`relative rounded-lg overflow-hidden border p-0.5 group text-left cursor-pointer transition-all ${
                          editServiceImageUrl === preset.url
                            ? 'border-blue-600 ring-2 ring-blue-500/30'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                        title={preset.name}
                      >
                        <div className="h-10 w-full overflow-hidden rounded bg-slate-100">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal in POS */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs" dir="rtl" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white border border-slate-300 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#292A34]">تأكيد حذف المنتج</h3>
                <p className="text-[11px] text-slate-500">حذف السلعة من شاشة المبيعات</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-[#292A34] flex justify-between">
                <span>اسم السلعة:</span>
                <span>{serviceToDelete.name}</span>
              </div>
              <div className="text-slate-500 flex justify-between font-mono">
                <span>سعر البيع:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(serviceToDelete.price)}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteService && serviceToDelete) {
                    onDeleteService(serviceToDelete.id);
                  }
                  setServiceToDelete(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، احذف</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS Daily Petty Cash Expenses Modal */}
      {showPosExpensesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Wallet className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">المصروفات النثرية اليومية (Petty Cash)</h3>
                  <p className="text-[11px] text-slate-500">سجل النثريات والمبالغ المصروفة من الدرج لليوم</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPosExpensesModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-800 font-bold block">إجمالي المصروفات النثرية لليوم</span>
                <span className="text-xl font-black font-mono text-amber-950">{formatCurrency(todayExpensesTotal)}</span>
              </div>
              {onOpenExpenseModal && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPosExpensesModal(false);
                    onOpenExpenseModal();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ سند صرف نثري جديد</span>
                </button>
              )}
            </div>

            {/* Expenses List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
              {todayExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">لا توجد مصروفات نثرية مسجلة لليوم حتى الآن.</p>
                  <p className="text-[11px] text-slate-400">يمكنك تسجيل أي إخراج نقدي للنثريات بنقر الزر أعلاه.</p>
                </div>
              ) : (
                todayExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 truncate">{exp.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {exp.category === 'materials' ? 'مواد ومستلزمات' : exp.category === 'tea_coffee' ? 'شاي وقهوة' : exp.category === 'maintenance' ? 'صيانة' : 'نثريات'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{exp.staffName}</span>
                        <span>•</span>
                        <span>{new Date(exp.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</span>
                        {exp.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[140px] text-slate-500">{exp.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black font-mono text-[#E31C2B]">{formatCurrency(exp.amount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPosExpensesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
