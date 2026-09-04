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
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ServiceItem, CartItem, Material, Order, PaymentMethod, Shift, Staff } from '../../types';
import { 
  formatCurrency, 
  calculateServiceBOMCost,
  getItemUnitCost,
  getItemProfit,
  getItemProfitMargin
} from '../../utils/formatters';
import { soundManager } from '../../utils/audio';
import { usePosKeyboardShortcuts } from '../../hooks/usePosKeyboardShortcuts';
import { ShortcutsGuideModal } from '../common/ShortcutsGuideModal';

interface PosViewProps {
  services: ServiceItem[];
  materials: Material[];
  currentStaff: Staff;
  activeShift: Shift | undefined;
  orders?: Order[];
  onCheckoutOrder: (orderData: Omit<Order, 'id' | 'ticketNumber' | 'createdAt'>) => void;
  onPrintLastReceipt?: () => void;
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
  onCheckoutOrder
}) => {
  const isManager = currentStaff?.role === 'manager';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Worker Today's Performance (إجمالي مبيعات العامل اليومية)
  const todayStr = new Date().toISOString().split('T')[0];
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

  const categories = [
    { id: 'all', label: 'جميع الخدمات والباقات', icon: Sparkles },
    { id: 'id_photos', label: 'صور شمسية وهوية', icon: UserCheck },
    { id: 'prints', label: 'طباعة وتكبير صور', icon: Image },
    { id: 'frames', label: 'إطارات وبراويز', icon: Frame },
    { id: 'lamination', label: 'تغليف حراري', icon: ShieldCheck },
    { id: 'digital', label: 'خدمات رقمية وترميم', icon: Wand2 },
    { id: 'packages', label: 'جلسات استوديو', icon: Smile }
  ];

  // Filter services
  const filteredServices = useMemo(() => {
    return (services || []).filter(service => {
      const matchesCat = selectedCategory === 'all' || service.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
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
        // Services with BOM
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
          }
        }
      }
    }

    return {
      deductionsList: Object.values(rawMaterialMap),
      totalBOMCost: calculatedCost
    };
  }, [cart, materials]);

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

    // Trigger celebration effect
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.75 },
      colors: ['#E31C2B', '#292A34', '#ffffff', '#fbbf24']
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
                    {/* Top Bar: Icon + Price */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shadow-inner ${
                        isDirectSale
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                          : 'bg-[#F0F0F0] border-slate-200 text-[#E31C2B] group-hover:bg-[#E31C2B] group-hover:text-white'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[#E31C2B] font-mono">
                          {formatCurrency(service.price)}
                        </div>
                        {isManager ? (
                          <div className="text-[11px] text-emerald-700 font-bold flex items-center justify-end gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>صافي: {formatCurrency(netProfit)} ({profitMargin}%)</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 font-medium text-right">
                            {service.itemType === 'direct_sale' ? 'سلعة بيع مباشر' : 'خدمة تصوير'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-black text-sm text-[#292A34] mb-1 group-hover:text-[#E31C2B] transition-colors leading-snug">
                      {service.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2.5">
                      {service.description}
                    </p>

                    {/* Stock Badge for Direct Sale Items */}
                    {isDirectSale && stock !== null && (
                      <div className="mb-2">
                        {stock > 3 ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                            <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                            <span>المخزون: <strong className="font-mono text-emerald-900">{stock}</strong> متوفرة</span>
                          </div>
                        ) : stock > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>مخزون منخفض: <strong className="font-mono text-amber-950">{stock}</strong> فقط!</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>نفذت الكمية من المخزن (0)</span>
                          </div>
                        )}
                      </div>
                    )}
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
                            {service.bom.length > 0 ? (
                              `خصم: ${service.bom.map(b => {
                                const m = materials.find(mat => mat.id === b.materialId);
                                return `${b.quantity} ${m?.name.split(' ')[0] || ''}`;
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
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#292A34] truncate">{item.service.name}</h4>
                  <div className="text-[11px] text-[#E31C2B] font-mono font-bold mt-0.5">
                    {formatCurrency(item.service.price)} × {item.quantity} = {formatCurrency(item.service.price * item.quantity)}
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
            <Sparkles className="w-4 h-4 fill-current" />
            <span>تسجيل الطلب وطباعة التذكرة</span>
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

    </div>
  );
};
