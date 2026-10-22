import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
  ArrowRight,
  Upload,
  Camera,
  Check,
  Edit3,
  ImagePlus,
  X,
  Filter,
  Frame,
  BookmarkPlus,
  Tag,
  Bookmark,
  Layers2,
  Info,
  PlusCircle
} from 'lucide-react';
import { 
  Material, 
  ServiceItem, 
  PhotoLinkConfig, 
  Staff, 
  Expense, 
  Store, 
  checkStaffPermission,
  OFFICIAL_SERVICE_CATEGORIES,
  OfficialServiceCategory,
  normalizeServiceCategory,
  BOMItem,
  AssociativeComponent,
  AssociativeModelTemplate
} from '../../types';
import { formatCurrency, formatNumber, exportToCSV, calculateServiceBOMCost, getItemUnitCost, getAssociativeProductUnitCostBreakdown } from '../../utils/formatters';
import { compressAndResizeImage } from '../../utils/imageCompressor';

export const DEFAULT_CUSTOM_CATEGORIES: string[] = [
  'ألبومات وهدايا تذكارية',
  'مطبوعات حرارية وسابليميشن',
  'دروع وميداليات التخرج',
  'لوحات خشب وكانفاس',
  'باكيجات أعراس ومناسبات',
  'هدايا إعلانية ودعائية'
];

export const DEFAULT_ASSOCIATIVE_MODELS: AssociativeModelTemplate[] = [
  {
    id: 'tpl_a4_frame',
    name: 'كادر A4 فاخر مع صورة',
    customCategory: 'كوادر وتكبير الصور',
    officialCategory: 'frames_and_enlargements',
    defaultPrice: 1200,
    description: 'كادر خشبي مقاس A4 متكامل مع طباعة صورة فوتوغرافية عالية الدقة',
    paperSize: 'A4',
    icon: '🖼️',
    components: [
      {
        id: 'comp_paper_a4',
        kind: 'raw_material',
        itemId: 'mat_paper_a4',
        name: 'ورق صور فوتوغرافي A4',
        consumptionMode: 'yield',
        quantity: 1,
        yieldCount: 1,
        unit: 'ورقة',
        unitCost: 15
      },
      {
        id: 'comp_ink_a4',
        kind: 'raw_material',
        itemId: 'mat_ink_black',
        name: 'حبر فوتوغرافي عالي الدقة',
        consumptionMode: 'yield',
        quantity: 1,
        yieldCount: 150,
        unit: 'مل',
        unitCost: 15
      },
      {
        id: 'comp_frame_a4',
        kind: 'raw_material',
        itemId: 'mat_frame_a4',
        name: 'كادر خشب فاخر مقاس A4',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'قطعة',
        unitCost: 350
      }
    ]
  },
  {
    id: 'tpl_13x18_frame',
    name: 'كادر 13x18 مع صورة',
    customCategory: 'كوادر وتكبير الصور',
    officialCategory: 'frames_and_enlargements',
    defaultPrice: 700,
    description: 'كادر أنيق مقاس 13x18 سم مع طباعة صورة',
    paperSize: '13x18',
    icon: '🖼️',
    components: [
      {
        id: 'comp_paper_13x18',
        kind: 'raw_material',
        itemId: 'mat_paper_13x18',
        name: 'ورق صور 13x18',
        consumptionMode: 'yield',
        quantity: 1,
        yieldCount: 1,
        unit: 'ورقة',
        unitCost: 12
      },
      {
        id: 'comp_ink_13x18',
        kind: 'raw_material',
        itemId: 'mat_ink_black',
        name: 'حبر فوتوغرافي',
        consumptionMode: 'yield',
        quantity: 1,
        yieldCount: 200,
        unit: 'مل',
        unitCost: 15
      },
      {
        id: 'comp_frame_13x18',
        kind: 'raw_material',
        itemId: 'mat_frame_13x18',
        name: 'كادر 13x18',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'قطعة',
        unitCost: 200
      }
    ]
  },
  {
    id: 'tpl_id_photos',
    name: 'طباعة صور شمسية (8 صور هوية)',
    customCategory: 'إخراج الصور الشمسية والعادية',
    officialCategory: 'id_and_regular_photos',
    defaultPrice: 300,
    description: 'ورقة كاملة تحتوي على 8 صور بيومترية للهوية وجواز السفر',
    paperSize: 'A4',
    icon: '📷',
    components: [
      {
        id: 'comp_paper_id',
        kind: 'raw_material',
        itemId: 'mat_paper_a4',
        name: 'ورق صور فوتوغرافي A4',
        consumptionMode: 'yield',
        quantity: 1,
        yieldCount: 8,
        unit: 'ورقة',
        unitCost: 15
      },
      {
        id: 'comp_ink_id',
        kind: 'raw_material',
        itemId: 'mat_ink_black',
        name: 'حبر فوتوغرافي',
        consumptionMode: 'yield',
        quantity: 1,
        yieldCount: 600,
        unit: 'مل',
        unitCost: 15
      }
    ]
  },
  {
    id: 'tpl_gift_box',
    name: 'بوكس ألبوم هدايا (ألبوم + صور + تغليف)',
    customCategory: 'ألبومات وهدايا تذكارية',
    officialCategory: 'goods_and_accessories',
    defaultPrice: 2800,
    description: 'ألبوم صور فاخر مدمج مع طباعة 20 صورة وتغليف هدايا وشريط ستان',
    paperSize: '10x15',
    icon: '🎁',
    components: [
      {
        id: 'comp_paper_gift',
        kind: 'raw_material',
        itemId: 'mat_paper_10x15',
        name: 'ورق صور فوتوغرافي 10x15',
        consumptionMode: 'direct',
        quantity: 20,
        yieldCount: 1,
        unit: 'ورقة',
        unitCost: 8
      },
      {
        id: 'comp_album_gift',
        kind: 'merchandise',
        itemId: '',
        name: 'ألبوم صور كلاسيكي فاخر',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'قطعة',
        unitCost: 900
      },
      {
        id: 'comp_ribbon_gift',
        kind: 'raw_material',
        itemId: '',
        name: 'كيس وتغليف هدايا فاخر',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'قطعة',
        unitCost: 50
      }
    ]
  },
  {
    id: 'tpl_mug_print',
    name: 'كوب حراري شخصي مطبوع (ماغ)',
    customCategory: 'مطبوعات حرارية وسابليميشن',
    officialCategory: 'printing_services',
    defaultPrice: 850,
    description: 'كوب سيراميك أبيض مع طباعة حرارية ملونة ومقاومة للغسيل',
    paperSize: 'custom',
    icon: '☕',
    components: [
      {
        id: 'comp_mug_blank',
        kind: 'merchandise',
        itemId: '',
        name: 'كوب سيراميك أبيض جاهز للطباعة',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'قطعة',
        unitCost: 220
      },
      {
        id: 'comp_sublimation_paper',
        kind: 'raw_material',
        itemId: '',
        name: 'ورق نقل حراري سبليميشن',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'ورقة',
        unitCost: 35
      }
    ]
  },
  {
    id: 'tpl_graduation_shield',
    name: 'درع تخرج فاخر مع علبة قطيفة',
    customCategory: 'دروع وميداليات التخرج',
    officialCategory: 'goods_and_accessories',
    defaultPrice: 3200,
    description: 'درع تخرج فاخر مع صفيحة ميتاليك حرارية وعلبة مخملية شياكة',
    paperSize: 'custom',
    icon: '🎓',
    components: [
      {
        id: 'comp_shield_blank',
        kind: 'merchandise',
        itemId: '',
        name: 'درع خشبي/كريستال تخرج جاهز',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'قطعة',
        unitCost: 1100
      },
      {
        id: 'comp_metal_sheet',
        kind: 'raw_material',
        itemId: '',
        name: 'صفيحة ميتاليك ذهبية للطباعة',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'قطعة',
        unitCost: 250
      },
      {
        id: 'comp_velvet_box',
        kind: 'merchandise',
        itemId: '',
        name: 'علبة قطيفة مخملية للدرع',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'قطعة',
        unitCost: 450
      }
    ]
  },
  {
    id: 'tpl_sublimation_tshirt',
    name: 'تيشيرت شخصي مطبوع صورة/لوغو',
    customCategory: 'مطبوعات حرارية وسابليميشن',
    officialCategory: 'printing_services',
    defaultPrice: 1500,
    description: 'تيشيرت بوليستر مريح مع طباعة حرارية عالية الثبات للغسيل',
    paperSize: 'A4',
    icon: '👕',
    components: [
      {
        id: 'comp_tshirt_blank',
        kind: 'merchandise',
        itemId: '',
        name: 'تيشيرت بوليستر أبيض عالي الجودة',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'قطعة',
        unitCost: 450
      },
      {
        id: 'comp_sublimation_sheet',
        kind: 'raw_material',
        itemId: '',
        name: 'ورق طباعة حرارية سبليميشن A4',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'ورقة',
        unitCost: 35
      }
    ]
  }
];

interface InventoryViewProps {
  materials: Material[];
  services: ServiceItem[];
  currentStaff?: Staff;
  currentStoreId?: string;
  stores?: Store[];
  onUpdateMaterial: (updated: Material) => void;
  onAddMaterial: (newMat: Omit<Material, 'id'>) => void;
  onDeleteMaterial?: (materialId: string) => void;
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
  currentStoreId,
  stores = [],
  onUpdateMaterial,
  onAddMaterial,
  onDeleteMaterial,
  onRestock,
  onAddService,
  onUpdateService,
  onDeleteService,
  onAddExpense
}) => {
  const location = useLocation();
  const isManager = currentStaff?.role === 'manager';
  const defaultBranch = (currentStoreId && currentStoreId !== 'all') ? currentStoreId : 'store_sidiamer';
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'products'>('materials');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyLowStockFilter, setOnlyLowStockFilter] = useState<boolean>(false);
  const [isAlertBannerCollapsed, setIsAlertBannerCollapsed] = useState<boolean>(false);

  // Sync incoming navigation from Dashboard alert clicks
  useEffect(() => {
    if (location.state) {
      const state = location.state as { filter?: string; searchQuery?: string; subTab?: 'materials' | 'products' };
      if (state.filter === 'low_stock') {
        setOnlyLowStockFilter(true);
      }
      if (state.searchQuery) {
        setSearchQuery(state.searchQuery);
      }
      if (state.subTab) {
        setActiveSubTab(state.subTab);
      }
    }
  }, [location.state]);
  
  // Branch assignment state for new materials and retail goods
  const [newMatStoreId, setNewMatStoreId] = useState<string>(defaultBranch);
  const [directStoreId, setDirectStoreId] = useState<string>(defaultBranch);
  
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
  const [directCategory, setDirectCategory] = useState<OfficialServiceCategory>('goods_and_accessories');
  const [directBuyCost, setDirectBuyCost] = useState<string>('500');
  const [directSalePrice, setDirectSalePrice] = useState<string>('900');
  const [directStock, setDirectStock] = useState<string>('20');
  const [directDescription, setDirectDescription] = useState<string>('');
  const [directImageUrl, setDirectImageUrl] = useState<string>('');

  // Custom Categories & Associative Model Templates State
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fotop_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_CUSTOM_CATEGORIES;
  });

  const [modelTemplates, setModelTemplates] = useState<AssociativeModelTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('fotop_associative_models');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_ASSOCIATIVE_MODELS;
  });

  const handleAddCustomCategory = (newCat: string): string => {
    const trimmed = newCat.trim();
    if (!trimmed) return '';
    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('fotop_custom_categories', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }
    return trimmed;
  };

  const handleDeleteCustomCategory = (catToDelete: string) => {
    const updated = customCategories.filter(c => c !== catToDelete);
    setCustomCategories(updated);
    try {
      localStorage.setItem('fotop_custom_categories', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSaveModelTemplate = (newTpl: AssociativeModelTemplate) => {
    const updated = [newTpl, ...modelTemplates.filter(t => t.id !== newTpl.id)];
    setModelTemplates(updated);
    try {
      localStorage.setItem('fotop_associative_models', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteModelTemplate = (templateId: string) => {
    const updated = modelTemplates.filter(t => t.id !== templateId);
    setModelTemplates(updated);
    try {
      localStorage.setItem('fotop_associative_models', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  // Add Associative Photo Item Modal State (BOM Photo & Ink & Frame & Merchandise Builder)
  const [showAddPhotoLinkModal, setShowAddPhotoLinkModal] = useState<boolean>(false);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState<boolean>(false);
  const [photoServiceName, setPhotoServiceName] = useState<string>('كادر A4 فاخر مع صورة');
  const [photoCustomCategory, setPhotoCustomCategory] = useState<string>('كوادر وتكبير الصور');
  const [newCustomCategoryInput, setNewCustomCategoryInput] = useState<string>('');
  const [showNewCatInput, setShowNewCatInput] = useState<boolean>(false);
  const [photoCategory, setPhotoCategory] = useState<OfficialServiceCategory>('frames_and_enlargements');
  const [photoPaperSize, setPhotoPaperSize] = useState<'A4' | 'A3' | '10x15' | '13x18' | 'custom'>('A4');
  const [photoPaperMatId, setPhotoPaperMatId] = useState<string>((materials || []).find(m => m.category === 'paper')?.id || '');
  const [photosPerSheet, setPhotosPerSheet] = useState<string>('1');
  const [photoInkMatId, setPhotoInkMatId] = useState<string>((materials || []).find(m => m.category === 'ink')?.id || '');
  const [photoInkYield, setPhotoInkYield] = useState<string>('150');
  const [photoFrameMatId, setPhotoFrameMatId] = useState<string>((materials || []).find(m => m.category === 'frame')?.id || '');
  const [photoPrice, setPhotoPrice] = useState<string>('1200');
  const [photoImageUrl, setPhotoImageUrl] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl_a4_frame');
  const [saveAsTemplate, setSaveAsTemplate] = useState<boolean>(false);

  // Dedicated Associative Model Template & Custom Category Builder State
  const [templateTab, setTemplateTab] = useState<'create' | 'manage'>('create');
  const [tplBuilderName, setTplBuilderName] = useState<string>('درع تخرج فاخر مع صفيحة ميتاليك');
  const [tplBuilderCustomCategory, setTplBuilderCustomCategory] = useState<string>(customCategories[0] || 'دروع وميداليات التخرج');
  const [tplBuilderNewCatInput, setTplBuilderNewCatInput] = useState<string>('');
  const [tplBuilderShowNewCat, setTplBuilderShowNewCat] = useState<boolean>(false);
  const [tplBuilderOfficialCategory, setTplBuilderOfficialCategory] = useState<OfficialServiceCategory>('goods_and_accessories');
  const [tplBuilderDefaultPrice, setTplBuilderDefaultPrice] = useState<string>('3200');
  const [tplBuilderDescription, setTplBuilderDescription] = useState<string>('درع تخرج فاخر مع صفيحة ميتاليك حرارية وعلبة مخملية شياكة');
  const [tplBuilderPaperSize, setTplBuilderPaperSize] = useState<'A4' | 'A3' | '10x15' | '13x18' | 'custom'>('custom');
  const [tplBuilderIcon, setTplBuilderIcon] = useState<string>('🎓');
  const [tplBuilderComponents, setTplBuilderComponents] = useState<AssociativeComponent[]>(() => {
    return DEFAULT_ASSOCIATIVE_MODELS[4]?.components || [];
  });

  // Active associative consumable components (raw materials & merchandise goods)
  const [associativeComponents, setAssociativeComponents] = useState<AssociativeComponent[]>(() => {
    return DEFAULT_ASSOCIATIVE_MODELS[0]?.components || [];
  });

  // Apply a template to the builder
  const applyModelTemplate = (tpl: AssociativeModelTemplate) => {
    setSelectedTemplateId(tpl.id);
    setPhotoServiceName(tpl.name);
    setPhotoCustomCategory(tpl.customCategory || customCategories[0] || 'نماذج مخصصة');
    setPhotoCategory(tpl.officialCategory);
    setPhotoPaperSize(tpl.paperSize || 'A4');
    setPhotoPrice(String(tpl.defaultPrice));
    
    // Resolve components against current materials and services
    const resolvedComponents = (tpl.components || []).map((comp, idx) => {
      let resolvedId = comp.itemId;
      let resolvedCost = comp.unitCost;
      let resolvedUnit = comp.unit;
      let resolvedName = comp.name;

      if (comp.kind === 'raw_material') {
        const mat = materials.find(m => m.id === comp.itemId) 
          || materials.find(m => m.name.toLowerCase().includes(comp.name.toLowerCase()))
          || materials.find(m => m.name.toLowerCase().includes('a4') && comp.name.toLowerCase().includes('a4'))
          || materials.find(m => m.category === 'paper');
        if (mat) {
          resolvedId = mat.id;
          resolvedCost = mat.unitCost;
          resolvedUnit = mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة';
          resolvedName = mat.name;
        }
      } else {
        const good = services.find(s => s.id === comp.itemId)
          || services.find(s => s.name.toLowerCase().includes(comp.name.toLowerCase()))
          || services.find(s => s.itemType === 'direct_sale');
        if (good) {
          resolvedId = good.id;
          resolvedCost = good.buyCost || 0;
          resolvedUnit = 'قطعة';
          resolvedName = good.name;
        }
      }

      return {
        ...comp,
        id: comp.id || `comp_${Date.now()}_${idx}`,
        itemId: resolvedId,
        name: resolvedName,
        unit: resolvedUnit,
        unitCost: resolvedCost
      };
    });

    setAssociativeComponents(resolvedComponents);

    // Sync legacy paper/frame states if matched
    const paper = resolvedComponents.find(c => c.kind === 'raw_material' && (c.name.includes('ورق') || c.unit === 'ورقة'));
    if (paper) {
      setPhotoPaperMatId(paper.itemId);
      setPhotosPerSheet(String(paper.yieldCount || 1));
    }
    const ink = resolvedComponents.find(c => c.kind === 'raw_material' && (c.name.includes('حبر') || c.unit === 'مل'));
    if (ink) {
      setPhotoInkMatId(ink.itemId);
      setPhotoInkYield(String(ink.yieldCount || 150));
    }
    const frame = resolvedComponents.find(c => c.kind === 'raw_material' && (c.name.includes('كادر') || c.name.includes('إطار')));
    if (frame) {
      setPhotoFrameMatId(frame.itemId);
    } else {
      setPhotoFrameMatId('');
    }
  };

  const handleAddAssociativeComponent = (kind: 'raw_material' | 'merchandise' = 'raw_material') => {
    if (kind === 'raw_material') {
      const defaultMat = materials[0];
      const newComp: AssociativeComponent = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        kind: 'raw_material',
        itemId: defaultMat?.id || '',
        name: defaultMat?.name || 'مادة خام جديدة',
        consumptionMode: defaultMat?.unit === 'sheet' || defaultMat?.unit === 'ml' ? 'yield' : 'direct',
        quantity: 1,
        yieldCount: defaultMat?.unit === 'sheet' ? 1 : defaultMat?.unit === 'ml' ? 150 : 1,
        unit: defaultMat ? (defaultMat.unit === 'sheet' ? 'ورقة' : defaultMat.unit === 'ml' ? 'مل' : 'قطعة') : 'قطعة',
        unitCost: defaultMat?.unitCost || 0
      };
      setAssociativeComponents(prev => [...prev, newComp]);
    } else {
      const defaultGood = services.find(s => s.itemType === 'direct_sale') || services[0];
      const newComp: AssociativeComponent = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        kind: 'merchandise',
        itemId: defaultGood?.id || '',
        name: defaultGood?.name || 'سلعة تجارية جديدة',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'قطعة',
        unitCost: defaultGood?.buyCost || 0
      };
      setAssociativeComponents(prev => [...prev, newComp]);
    }
  };

  const handleUpdateComponent = (id: string, updates: Partial<AssociativeComponent>) => {
    setAssociativeComponents(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...updates };

      // If itemId changed, sync name, unitCost, unit
      if (updates.itemId && updates.itemId !== c.itemId) {
        if (updated.kind === 'raw_material') {
          const mat = materials.find(m => m.id === updates.itemId);
          if (mat) {
            updated.name = mat.name;
            updated.unitCost = mat.unitCost;
            updated.unit = mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة';
          }
        } else {
          const good = services.find(s => s.id === updates.itemId);
          if (good) {
            updated.name = good.name;
            updated.unitCost = good.buyCost || 0;
            updated.unit = 'قطعة';
          }
        }
      }

      // If kind changed
      if (updates.kind && updates.kind !== c.kind) {
        if (updates.kind === 'raw_material') {
          const mat = materials[0];
          updated.itemId = mat?.id || '';
          updated.name = mat?.name || 'مادة خام';
          updated.unitCost = mat?.unitCost || 0;
          updated.unit = mat ? (mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة') : 'قطعة';
          updated.consumptionMode = mat?.unit === 'sheet' || mat?.unit === 'ml' ? 'yield' : 'direct';
          updated.yieldCount = mat?.unit === 'sheet' ? 1 : 150;
        } else {
          const good = services.find(s => s.itemType === 'direct_sale') || services[0];
          updated.itemId = good?.id || '';
          updated.name = good?.name || 'سلعة تجارية';
          updated.unitCost = good?.buyCost || 0;
          updated.unit = 'قطعة';
          updated.consumptionMode = 'direct';
          updated.quantity = 1;
          updated.yieldCount = 1;
        }
      }

      return updated;
    }));
  };

  const handleRemoveComponent = (id: string) => {
    setAssociativeComponents(prev => prev.filter(c => c.id !== id));
  };

  // Live calculation for template builder components
  const calculatedTemplateComponents = useMemo(() => {
    return tplBuilderComponents.map(comp => {
      let currentCost = comp.unitCost;
      let availableStock = 0;
      let actualName = comp.name;
      let unitLabel = comp.unit;

      if (comp.kind === 'raw_material') {
        const mat = materials.find(m => m.id === comp.itemId) 
          || materials.find(m => m.name.toLowerCase() === comp.name.toLowerCase());
        if (mat) {
          currentCost = mat.unitCost;
          availableStock = mat.currentStock;
          actualName = mat.name;
          unitLabel = mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة';
        }
      } else {
        const good = services.find(s => s.id === comp.itemId) 
          || services.find(s => s.name.toLowerCase() === comp.name.toLowerCase());
        if (good) {
          currentCost = good.buyCost || 0;
          availableStock = good.currentStock ?? 0;
          actualName = good.name;
          unitLabel = 'قطعة';
        }
      }

      const perUnitQuantity = comp.consumptionMode === 'yield'
        ? (Number(comp.quantity || 1) / Math.max(1, Number(comp.yieldCount || 1)))
        : Number(comp.quantity || 1);

      const subtotalCost = perUnitQuantity * currentCost;

      return {
        ...comp,
        name: actualName,
        unit: unitLabel,
        unitCost: currentCost,
        availableStock,
        perUnitQuantity,
        subtotalCost
      };
    });
  }, [tplBuilderComponents, materials, services]);

  const tplTotalRawCost = useMemo(() => {
    return calculatedTemplateComponents
      .filter(c => c.kind === 'raw_material')
      .reduce((sum, c) => sum + c.subtotalCost, 0);
  }, [calculatedTemplateComponents]);

  const tplTotalGoodsCost = useMemo(() => {
    return calculatedTemplateComponents
      .filter(c => c.kind === 'merchandise')
      .reduce((sum, c) => sum + c.subtotalCost, 0);
  }, [calculatedTemplateComponents]);

  const tplTotalCost = tplTotalRawCost + tplTotalGoodsCost;
  const tplSellingPrice = Number(tplBuilderDefaultPrice) || 0;
  const tplNetProfit = Math.max(0, tplSellingPrice - tplTotalCost);
  const tplMargin = tplSellingPrice > 0 ? ((tplNetProfit / tplSellingPrice) * 100).toFixed(1) : '0';

  const handleAddTemplateComponent = (kind: 'raw_material' | 'merchandise' = 'raw_material') => {
    if (kind === 'raw_material') {
      const defaultMat = materials[0];
      const newComp: AssociativeComponent = {
        id: `tpl_comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        kind: 'raw_material',
        itemId: defaultMat?.id || '',
        name: defaultMat?.name || 'مادة خام جديدة',
        consumptionMode: defaultMat?.unit === 'sheet' || defaultMat?.unit === 'ml' ? 'yield' : 'direct',
        quantity: 1,
        yieldCount: defaultMat?.unit === 'sheet' ? 1 : defaultMat?.unit === 'ml' ? 150 : 1,
        unit: defaultMat ? (defaultMat.unit === 'sheet' ? 'ورقة' : defaultMat.unit === 'ml' ? 'مل' : 'قطعة') : 'قطعة',
        unitCost: defaultMat?.unitCost || 0
      };
      setTplBuilderComponents(prev => [...prev, newComp]);
    } else {
      const defaultGood = services.find(s => s.itemType === 'direct_sale') || services[0];
      const newComp: AssociativeComponent = {
        id: `tpl_comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        kind: 'merchandise',
        itemId: defaultGood?.id || '',
        name: defaultGood?.name || 'سلعة تجارية جديدة',
        consumptionMode: 'direct',
        quantity: 1,
        yieldCount: 1,
        unit: 'قطعة',
        unitCost: defaultGood?.buyCost || 0
      };
      setTplBuilderComponents(prev => [...prev, newComp]);
    }
  };

  const handleUpdateTemplateComponent = (id: string, updates: Partial<AssociativeComponent>) => {
    setTplBuilderComponents(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...updates };

      if (updates.itemId && updates.itemId !== c.itemId) {
        if (updated.kind === 'raw_material') {
          const mat = materials.find(m => m.id === updates.itemId);
          if (mat) {
            updated.name = mat.name;
            updated.unitCost = mat.unitCost;
            updated.unit = mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة';
          }
        } else {
          const good = services.find(s => s.id === updates.itemId);
          if (good) {
            updated.name = good.name;
            updated.unitCost = good.buyCost || 0;
            updated.unit = 'قطعة';
          }
        }
      }

      if (updates.kind && updates.kind !== c.kind) {
        if (updates.kind === 'raw_material') {
          const mat = materials[0];
          updated.itemId = mat?.id || '';
          updated.name = mat?.name || 'مادة خام';
          updated.unitCost = mat?.unitCost || 0;
          updated.unit = mat ? (mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة') : 'قطعة';
          updated.consumptionMode = mat?.unit === 'sheet' || mat?.unit === 'ml' ? 'yield' : 'direct';
          updated.yieldCount = mat?.unit === 'sheet' ? 1 : 150;
        } else {
          const good = services.find(s => s.itemType === 'direct_sale') || services[0];
          updated.itemId = good?.id || '';
          updated.name = good?.name || 'سلعة تجارية';
          updated.unitCost = good?.buyCost || 0;
          updated.unit = 'قطعة';
          updated.consumptionMode = 'direct';
          updated.quantity = 1;
          updated.yieldCount = 1;
        }
      }

      return updated;
    }));
  };

  const handleRemoveTemplateComponent = (id: string) => {
    setTplBuilderComponents(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveNewTemplate = (applyAsProductImmediately: boolean = false) => {
    if (!tplBuilderName.trim()) {
      alert('يرجى كتابة اسم النموذج الارتباطي');
      return;
    }

    const finalCategory = tplBuilderCustomCategory.trim() || 'نماذج مخصصة';
    handleAddCustomCategory(finalCategory);

    const newTemplate: AssociativeModelTemplate = {
      id: `tpl_custom_${Date.now()}`,
      name: tplBuilderName.trim(),
      customCategory: finalCategory,
      officialCategory: tplBuilderOfficialCategory,
      defaultPrice: Number(tplBuilderDefaultPrice) || 0,
      description: tplBuilderDescription.trim() || `نموذج ارتباطي مخصص [${finalCategory}] يشمل استهلاك (${calculatedTemplateComponents.map(c => c.name).join(' + ')})`,
      icon: tplBuilderIcon || '✨',
      paperSize: tplBuilderPaperSize,
      isCustom: true,
      components: calculatedTemplateComponents.map(c => ({
        id: c.id,
        kind: c.kind,
        itemId: c.itemId,
        name: c.name,
        consumptionMode: c.consumptionMode,
        quantity: c.quantity,
        yieldCount: c.yieldCount,
        unit: c.unit,
        unitCost: c.unitCost
      }))
    };

    handleSaveModelTemplate(newTemplate);

    if (applyAsProductImmediately) {
      applyModelTemplate(newTemplate);
      setShowAddTemplateModal(false);
      setShowAddPhotoLinkModal(true);
    } else {
      setShowAddTemplateModal(false);
    }
  };

  // Products Category Filter
  const [productSelectedCategory, setProductSelectedCategory] = useState<string>('all');

  // Edit Material State
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editMatName, setEditMatName] = useState<string>('');
  const [editMatCategory, setEditMatCategory] = useState<Material['category']>('paper');
  const [editMatUnit, setEditMatUnit] = useState<Material['unit']>('sheet');
  const [editMatStock, setEditMatStock] = useState<string>('');
  const [editMatThreshold, setEditMatThreshold] = useState<string>('');
  const [editMatUnitCost, setEditMatUnitCost] = useState<string>('');
  const [editMatSku, setEditMatSku] = useState<string>('');
  const [editMatSupplier, setEditMatSupplier] = useState<string>('');
  const [editMatStoreId, setEditMatStoreId] = useState<string>('');

  // Delete Confirmations State
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);
  const [permissionAlert, setPermissionAlert] = useState<string | null>(null);

  const canManageMaterials = checkStaffPermission(currentStaff, 'canManageMaterials');
  const canManageServices = checkStaffPermission(currentStaff, 'canManageServices');

  const handleOpenEditMaterial = (m: Material) => {
    if (!canManageMaterials) {
      setPermissionAlert('ليس لديك صلاحية تعديل المواد الخام والمخزون. يرجى مراجعة الإدارة لمنحك الصلاحية.');
      return;
    }
    setEditingMaterial(m);
    setEditMatName(m.name);
    setEditMatCategory(m.category);
    setEditMatUnit(m.unit);
    setEditMatStock(String(m.currentStock));
    setEditMatThreshold(String(m.minThreshold));
    setEditMatUnitCost(String(m.unitCost));
    setEditMatSku(m.sku || '');
    setEditMatSupplier(m.supplier || '');
    setEditMatStoreId(m.storeId || defaultBranch);
  };

  const handleAttemptDeleteMaterial = (m: Material) => {
    if (!canManageMaterials) {
      setPermissionAlert('ليس لديك صلاحية حذف المواد من المخزن. يرجى مراجعة الإدارة لمنحك الصلاحية.');
      return;
    }
    setMaterialToDelete(m);
  };

  const handleOpenEditProduct = (p: ServiceItem) => {
    if (!canManageServices) {
      setPermissionAlert('ليس لديك صلاحية تعديل الخدمات والمنتجات. يرجى مراجعة الإدارة لمنحك الصلاحية.');
      return;
    }
    openEditProduct(p);
  };

  const handleAttemptDeleteService = (p: ServiceItem) => {
    if (!canManageServices) {
      setPermissionAlert('ليس لديك صلاحية حذف الخدمات أو المنتجات. يرجى مراجعة الإدارة لمنحك الصلاحية.');
      return;
    }
    setServiceToDelete(p);
  };

  // Edit Product / Update Image Modal State
  const [editingProduct, setEditingProduct] = useState<ServiceItem | null>(null);
  const [editProductName, setEditProductName] = useState<string>('');
  const [editProductPrice, setEditProductPrice] = useState<string>('');
  const [editProductBuyCost, setEditProductBuyCost] = useState<string>('');
  const [editProductStock, setEditProductStock] = useState<string>('');
  const [editProductMinThreshold, setEditProductMinThreshold] = useState<string>('3');
  const [editProductCategory, setEditProductCategory] = useState<ServiceItem['category']>('retail_goods');
  const [editProductItemType, setEditProductItemType] = useState<ServiceItem['itemType']>('direct_sale');
  const [editProductStoreId, setEditProductStoreId] = useState<string>('all');
  const [editProductDescription, setEditProductDescription] = useState<string>('');
  const [editProductImageUrl, setEditProductImageUrl] = useState<string>('');
  const [editProductCustomCategory, setEditProductCustomCategory] = useState<string>('');

  // Preset studio product images for fast 1-click selection
  const PRODUCT_IMAGE_PRESETS = [
    {
      name: 'إطار صور أسود فاخر',
      url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80'
    },
    {
      name: 'ألبوم صور كلاسيكي',
      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80'
    },
    {
      name: 'فلاش ديسك USB صور',
      url: 'https://images.unsplash.com/photo-1622954989659-52e69fce092e?w=400&auto=format&fit=crop&q=80'
    },
    {
      name: 'كوب مطبوع بصورة شخصية',
      url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80'
    },
    {
      name: 'طباعة وتكبير صور فوتوغرافية',
      url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80'
    },
    {
      name: 'لوحة كانفاس جدارية معلقة',
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80'
    }
  ];

  const [editProductFrameMatId, setEditProductFrameMatId] = useState<string>('');

  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAndResizeImage(file);
      setter(compressed);
    } catch (err) {
      console.warn('Compression fallback to FileReader:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditProduct = (prod: ServiceItem) => {
    setEditingProduct(prod);
    setEditProductName(prod.name);
    setEditProductPrice(String(prod.price));
    setEditProductBuyCost(String(prod.buyCost ?? 0));
    setEditProductStock(String(prod.currentStock ?? 0));
    setEditProductMinThreshold(String(prod.minThreshold ?? 3));
    setEditProductCategory(normalizeServiceCategory(prod.category, prod.name));
    setEditProductItemType(prod.itemType || 'direct_sale');
    setEditProductStoreId(prod.storeId || defaultBranch);
    setEditProductDescription(prod.description || '');
    setEditProductImageUrl(prod.imageUrl || '');
    setEditProductFrameMatId(prod.photoConfig?.frameMaterialId || '');
    setEditProductCustomCategory(prod.customCategoryName || '');
  };

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Ensure custom category is in list if non-empty
    const trimmedCustomCat = editProductCustomCategory.trim();
    if (trimmedCustomCat) {
      handleAddCustomCategory(trimmedCustomCat);
    }

    let updatedBom: BOMItem[] = [...(editingProduct.bom || [])];
    if (editingProduct.photoConfig) {
      const frameMatIds = materials.filter(m => m.category === 'frame').map(m => m.id);
      updatedBom = updatedBom.filter(b => !frameMatIds.includes(b.materialId));
      if (editProductFrameMatId) {
        updatedBom.push({
          materialId: editProductFrameMatId,
          quantity: 1
        });
      }
    }

    const updated: ServiceItem = {
      ...editingProduct,
      name: editProductName.trim() || editingProduct.name,
      category: editProductCategory,
      customCategoryName: trimmedCustomCat || undefined,
      itemType: editProductItemType,
      storeId: editProductStoreId !== 'all' ? editProductStoreId : (editingProduct.storeId || defaultBranch),
      storeName: stores?.find(st => st.id === (editProductStoreId !== 'all' ? editProductStoreId : (editingProduct.storeId || defaultBranch)))?.name || editingProduct.storeName,
      minThreshold: Number(editProductMinThreshold) || 3,
      price: Number(editProductPrice) || editingProduct.price,
      buyCost: Number(editProductBuyCost) >= 0 ? Number(editProductBuyCost) : editingProduct.buyCost,
      currentStock: Number(editProductStock) >= 0 ? Number(editProductStock) : editingProduct.currentStock,
      description: editProductDescription.trim() || editingProduct.description,
      imageUrl: editProductImageUrl.trim() || undefined,
      bom: updatedBom,
      photoConfig: editingProduct.photoConfig ? {
        ...editingProduct.photoConfig,
        frameMaterialId: editProductFrameMatId || undefined,
        framePerPhoto: editProductFrameMatId ? 1 : 0,
        customCategoryName: trimmedCustomCat || undefined
      } : undefined
    };

    if (onUpdateService) {
      onUpdateService(updated);
    }
    setEditingProduct(null);
  };

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

  // Live calculation for associative components (raw materials & merchandise goods)
  const calculatedComponents = useMemo(() => {
    return associativeComponents.map(comp => {
      let currentCost = comp.unitCost;
      let availableStock = 0;
      let actualName = comp.name;
      let unitLabel = comp.unit;

      if (comp.kind === 'raw_material') {
        const mat = materials.find(m => m.id === comp.itemId) 
          || materials.find(m => m.name.toLowerCase() === comp.name.toLowerCase());
        if (mat) {
          currentCost = mat.unitCost;
          availableStock = mat.currentStock;
          actualName = mat.name;
          unitLabel = mat.unit === 'sheet' ? 'ورقة' : mat.unit === 'ml' ? 'مل' : 'قطعة';
        }
      } else {
        const good = services.find(s => s.id === comp.itemId) 
          || services.find(s => s.name.toLowerCase() === comp.name.toLowerCase());
        if (good) {
          currentCost = good.buyCost || 0;
          availableStock = good.currentStock ?? 0;
          actualName = good.name;
          unitLabel = 'قطعة';
        }
      }

      const perUnitQuantity = comp.consumptionMode === 'yield'
        ? (Number(comp.quantity || 1) / Math.max(1, Number(comp.yieldCount || 1)))
        : Number(comp.quantity || 1);

      const subtotalCost = perUnitQuantity * currentCost;

      return {
        ...comp,
        name: actualName,
        unit: unitLabel,
        unitCost: currentCost,
        availableStock,
        perUnitQuantity,
        subtotalCost
      };
    });
  }, [associativeComponents, materials, services]);

  const totalRawCost = useMemo(() => {
    return calculatedComponents
      .filter(c => c.kind === 'raw_material')
      .reduce((sum, c) => sum + c.subtotalCost, 0);
  }, [calculatedComponents]);

  const totalGoodsCost = useMemo(() => {
    return calculatedComponents
      .filter(c => c.kind === 'merchandise')
      .reduce((sum, c) => sum + c.subtotalCost, 0);
  }, [calculatedComponents]);

  const totalAssociativeCost = totalRawCost + totalGoodsCost;
  const sellingPricePerPhoto = Number(photoPrice) || 0;
  const netAssociativeProfit = Math.max(0, sellingPricePerPhoto - totalAssociativeCost);
  const associativeMargin = sellingPricePerPhoto > 0 ? ((netAssociativeProfit / sellingPricePerPhoto) * 100).toFixed(1) : '0';

  // Legacy variables for backwards compatibility
  const selectedPaperMat = (materials || []).find(m => m.id === (photoPaperMatId || (materials || [])[0]?.id));
  const selectedInkMat = (materials || []).find(m => m.id === (photoInkMatId || (materials || []).find(x => x.category === 'ink')?.id));
  const selectedFrameMat = (materials || []).find(m => m.id === photoFrameMatId);

  const numPhotosPerSheet = Math.max(1, Number(photosPerSheet) || 1);
  const numInkYield = Math.max(1, Number(photoInkYield) || 1);

  const unitPaperCost = selectedPaperMat ? (selectedPaperMat.unitCost / numPhotosPerSheet) : 0;
  const unitInkCost = selectedInkMat ? (selectedInkMat.unitCost / numInkYield) : 0;
  const unitFrameCost = selectedFrameMat ? selectedFrameMat.unitCost : 0;
  const totalItemCost = totalAssociativeCost > 0 ? totalAssociativeCost : (unitPaperCost + unitInkCost + unitFrameCost);

  const sheetInkCost = unitInkCost * numPhotosPerSheet;
  const sheetPaperCost = selectedPaperMat ? selectedPaperMat.unitCost : 0;
  const totalSheetCost = sheetPaperCost + sheetInkCost;
  const totalFormulaCost = totalItemCost;
  const netFormulaProfit = netAssociativeProfit;
  const formulaMargin = associativeMargin;

  // Filtered Products List for SubTab 'products'
  const filteredProducts = (services || []).filter(s => {
    const normCat = normalizeServiceCategory(s.category, s.name);
    const matchesCat = productSelectedCategory === 'all' 
      || normCat === productSelectedCategory
      || s.customCategoryName === productSelectedCategory;
    const matchesSearch = searchQuery === '' || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customCategoryName && s.customCategoryName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

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
    const targetStore = newMatStoreId || defaultBranch;
    const storeObj = stores?.find(s => s.id === targetStore);

    onAddMaterial({
      name: newMatName.trim(),
      category: newMatCategory,
      unit: newMatUnit,
      currentStock: stock,
      minThreshold: Number(newMatThreshold) || 10,
      unitCost,
      sku: newMatSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      supplier: newMatSupplier.trim() || 'مورد محلي',
      storeId: targetStore,
      storeName: storeObj?.name || (targetStore === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer')
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
        notes: `تم قيد المصروف آلياً عند إضافة المادة إلى المخزن (تكلفة إجمالية: ${formatCurrency(totalExpenseAmount)})`,
        storeId: targetStore,
        storeName: storeObj?.name || (targetStore === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer')
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
    const targetStore = directStoreId || defaultBranch;
    const storeObj = stores?.find(s => s.id === targetStore);

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
      imageUrl: directImageUrl.trim() || undefined,
      bom: [],
      estimatedLaborMinutes: 1,
      popular: true,
      storeId: targetStore,
      storeName: storeObj?.name || (targetStore === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer')
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
        notes: `تم قيد المصروف آلياً عند إضافة السلعة إلى المخزن (تكلفة إجمالية: ${formatCurrency(totalExpenseAmount)})`,
        storeId: targetStore,
        storeName: storeObj?.name || (targetStore === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer')
      });
    }

    setShowAddDirectSaleModal(false);
    setDirectName('');
    setDirectDescription('');
    setDirectImageUrl('');
  };

  const handleCreatePhotoLinkService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoServiceName.trim()) return;

    const targetStore = defaultBranch;
    const storeObj = stores?.find(s => s.id === targetStore);

    // Ensure custom category is registered
    const finalCustomCategory = photoCustomCategory.trim();
    if (finalCustomCategory) {
      handleAddCustomCategory(finalCustomCategory);
    }

    // Build BOM from all calculated consumable components (raw materials & merchandise goods)
    const bomList: BOMItem[] = calculatedComponents.map(c => ({
      materialId: c.itemId,
      quantity: Number(c.perUnitQuantity.toFixed(3)),
      itemKind: c.kind,
      name: c.name,
      unitCost: c.unitCost,
      unit: c.unit
    }));

    // Find primary paper, ink, frame for backward compatibility with photo print cards
    const paperComp = calculatedComponents.find(c => c.kind === 'raw_material' && (c.name.includes('ورق') || c.unit === 'ورقة'));
    const inkComp = calculatedComponents.find(c => c.kind === 'raw_material' && (c.name.includes('حبر') || c.unit === 'مل'));
    const frameComp = calculatedComponents.find(c => c.kind === 'raw_material' && (c.name.includes('كادر') || c.name.includes('إطار')));

    const paperId = paperComp?.itemId || photoPaperMatId || (materials || []).find(m => m.category === 'paper')?.id || '';
    const inkId = inkComp?.itemId || photoInkMatId || (materials || []).find(m => m.category === 'ink')?.id || '';
    const frameId = frameComp?.itemId || photoFrameMatId || undefined;

    const photoConfig: PhotoLinkConfig = {
      paperSize: photoPaperSize,
      paperMaterialId: paperId,
      photosPerSheet: paperComp ? Math.max(1, paperComp.yieldCount) : numPhotosPerSheet,
      inkMaterialId: inkId,
      inkYieldPhotos: inkComp ? Math.max(1, inkComp.yieldCount) : numInkYield,
      inkPerPhotoMl: inkComp ? Number((100 / Math.max(1, inkComp.yieldCount)).toFixed(2)) : undefined,
      pricePerPhoto: sellingPricePerPhoto,
      frameMaterialId: frameId,
      framePerPhoto: frameComp ? frameComp.quantity : (photoFrameMatId ? 1 : 0),
      customCategoryName: finalCustomCategory || undefined,
      templateModelId: selectedTemplateId || undefined,
      components: calculatedComponents.map(c => ({
        id: c.id,
        kind: c.kind,
        itemId: c.itemId,
        name: c.name,
        consumptionMode: c.consumptionMode,
        quantity: c.quantity,
        yieldCount: c.yieldCount,
        unit: c.unit,
        unitCost: c.unitCost
      }))
    };

    const componentNamesSummary = calculatedComponents.map(c => `${c.name} (${c.kind === 'raw_material' ? 'خام' : 'سلعة'})`).join(' + ');

    const newService: ServiceItem = {
      id: `photo_link_${Date.now()}`,
      name: photoServiceName.trim(),
      itemType: 'custom_photo_service',
      category: photoCategory || 'frames_and_enlargements',
      customCategoryName: finalCustomCategory || undefined,
      buyCost: Number(totalAssociativeCost.toFixed(1)),
      price: sellingPricePerPhoto,
      description: finalCustomCategory
        ? `منتج ارتباطي [${finalCustomCategory}]: يشمل استهلاك (${componentNamesSummary})`
        : `منتج ارتباطي مركب: يشمل استهلاك (${componentNamesSummary})`,
      imageIcon: 'Image',
      imageUrl: photoImageUrl.trim() || undefined,
      bom: bomList,
      photoConfig,
      estimatedLaborMinutes: 5,
      popular: true,
      storeId: targetStore,
      storeName: storeObj?.name || (targetStore === 'store_labhour' ? 'fotop labhour' : 'fotop sidiamer')
    };

    onAddService(newService);

    // If user asked to also save this composition as a reusable template model
    if (saveAsTemplate) {
      const newTemplate: AssociativeModelTemplate = {
        id: `tpl_custom_${Date.now()}`,
        name: photoServiceName.trim(),
        customCategory: finalCustomCategory || 'نماذج مخصصة',
        officialCategory: photoCategory,
        defaultPrice: sellingPricePerPhoto,
        description: newService.description,
        paperSize: photoPaperSize,
        icon: '✨',
        isCustom: true,
        components: calculatedComponents.map(c => ({
          id: c.id,
          kind: c.kind,
          itemId: c.itemId,
          name: c.name,
          consumptionMode: c.consumptionMode,
          quantity: c.quantity,
          yieldCount: c.yieldCount,
          unit: c.unit,
          unitCost: c.unitCost
        }))
      };
      handleSaveModelTemplate(newTemplate);
    }

    setShowAddPhotoLinkModal(false);
    setPhotoServiceName('');
    setPhotoImageUrl('');
    setPhotoFrameMatId('');
    setSaveAsTemplate(false);
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

          {/* Add Reusable Model Template & Custom Category Button */}
          <button
            onClick={() => setShowAddTemplateModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="إنشاء نموذج ارتباطي جديد وتحديد تصنيفه الخاص والمواد الاستهلاكية الداخلة فيه (خام وسلع)"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>+ نموذج ارتباطي وتصنيف مخصص</span>
          </button>

          {/* Add Associative Photo Item Button */}
          <button
            onClick={() => setShowAddPhotoLinkModal(true)}
            className="px-3.5 py-2 bg-[#292A34] hover:bg-[#373946] text-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="إنشاء منتج ارتباطي متكامل مع تحديد المواد الاستهلاكية (خام وسلع) وحساب التكلفة وصافي الربح"
          >
            <Link2 className="w-4 h-4 text-amber-400" />
            <span>+ منتج ارتباطي (خام + سلع)</span>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{m.name}</span>
                          {isLow && (
                            <span className="bg-[#E31C2B] text-white text-[10px] px-1.5 py-0.5 rounded font-black animate-pulse">
                              منخفض
                            </span>
                          )}
                          {m.storeId && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              m.storeId === 'store_labhour' 
                                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {m.storeId === 'store_labhour' ? 'الأبحور' : 'سيدي عامر'}
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
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setRestockMat(m)}
                            className="bg-[#292A34] hover:bg-[#E31C2B] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="تزويد رصيد المادة"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>تزويد</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditMaterial(m)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer transition-colors"
                            title="تعديل المادة وبياناتها"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteMaterial && (
                            <button
                              onClick={() => handleAttemptDeleteMaterial(m)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition-colors"
                              title="حذف المادة من المخزن"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setRestockMat(m)}
                          className="bg-[#292A34] hover:bg-[#E31C2B] text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          title="تزويد المادة"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>تزويد</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditMaterial(m)}
                          className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer"
                          title="تعديل المادة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteMaterial && (
                          <button
                            onClick={() => handleAttemptDeleteMaterial(m)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                            title="حذف المادة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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

          {/* Category Filter Bar for Products */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100">
            <button
              onClick={() => setProductSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                productSelectedCategory === 'all'
                  ? 'bg-[#292A34] text-white shadow-xs'
                  : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
              }`}
            >
              جميع الأقسام والخدمات ({services.length})
            </button>
            {OFFICIAL_SERVICE_CATEGORIES.map(cat => {
              const count = (services || []).filter(s => normalizeServiceCategory(s.category, s.name) === cat.id).length;
              const isSelected = productSelectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setProductSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#292A34] text-white shadow-xs'
                      : 'bg-[#F0F0F0] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}

            {/* Custom Categories filter buttons */}
            {customCategories.map(cat => {
              const count = (services || []).filter(s => s.customCategoryName === cat).length;
              if (count === 0 && productSelectedCategory !== cat) return null;
              const isSelected = productSelectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setProductSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Tag className="w-3 h-3 text-amber-500" />
                  <span>{cat}</span>
                  <span className="text-[10px] font-mono px-1 rounded-full bg-amber-200/60 text-amber-950 font-bold">{count}</span>
                </button>
              );
            })}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Boxes className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold">لا توجد منتجات أو خدمات متوفرة في هذا التصنيف حالياً.</p>
              <p className="text-[11px] text-slate-400">يمكنك إضافة سلعة أو خدمة جديدة بنقر أزرار الإضافة أعلاه.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(s => {
                const associativeBreakdown = s.photoConfig ? getAssociativeProductUnitCostBreakdown(s, materials, services) : null;
                const rawCost = associativeBreakdown ? associativeBreakdown.totalUnitCost : getItemUnitCost(s, materials, services);
                const profit = Math.max(0, s.price - rawCost);
                const margin = s.price > 0 ? ((profit / s.price) * 100).toFixed(0) : '0';

                const linkedConfig = s.photoConfig;
                const pPerSheet = associativeBreakdown?.photosPerSheet || linkedConfig?.photosPerSheet || 1;

                return (
                  <div key={s.id} className="bg-[#F9FAFB] border border-slate-200 rounded-2xl p-4 space-y-3 relative hover:border-[#E31C2B] transition-all flex flex-col justify-between">
                    <div>
                      {/* Product Image Banner if available, or image adder */}
                      {s.imageUrl ? (
                        <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-3 relative group">
                          <img 
                            src={s.imageUrl} 
                            alt={s.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80';
                            }}
                          />
                          <button
                            onClick={() => handleOpenEditProduct(s)}
                            className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-xs transition-colors shadow-sm cursor-pointer"
                            title="تغيير صورة المنتج"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-400" />
                            <span>تغيير الصورة</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 bg-white/70 hover:bg-white flex items-center justify-between mb-3 transition-colors">
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                            <span>لا توجد صورة لهذا المنتج</span>
                          </div>
                          <button
                            onClick={() => handleOpenEditProduct(s)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 text-[11px] font-bold flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+ إضافة صورة</span>
                          </button>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2.5 rounded-xl ${s.itemType === 'direct_sale' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-900 text-white'}`}>
                            {s.itemType === 'direct_sale' ? <ShoppingBag className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-base sm:text-lg font-black text-[#292A34] tracking-tight">{s.name}</h4>
                              {s.storeId && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  s.storeId === 'store_labhour' 
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}>
                                  {s.storeId === 'store_labhour' ? 'الأبحور' : 'سيدي عامر'}
                                </span>
                              )}
                              {s.customCategoryName && (
                                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Tag className="w-2.5 h-2.5 text-amber-700" />
                                  <span>{s.customCategoryName}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                              <span className="text-[10px] text-slate-500 font-medium">
                                {s.itemType === 'direct_sale' ? 'سلعة بيع مباشر' : s.photoConfig ? `طباعة صور ارتباطية (${s.photoConfig.paperSize})` : 'خدمة مخصصة'}
                              </span>
                              {/* Consumable Components Preview (خام وسلع) */}
                              {s.photoConfig?.components && s.photoConfig.components.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {s.photoConfig.components.map((comp, cIdx) => (
                                    <span 
                                      key={cIdx} 
                                      className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold border ${
                                        comp.kind === 'raw_material'
                                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      }`}
                                      title={`${comp.name} - ${comp.kind === 'raw_material' ? 'مادة خام مستهلكة' : 'سلعة تجارية مستهلكة'}`}
                                    >
                                      {comp.kind === 'raw_material' ? '🧪' : '🛍️'} {comp.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditProduct(s)}
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title="تعديل بيانات وصورة المنتج/الخدمة"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {onDeleteService && (
                            <button
                              onClick={() => handleAttemptDeleteService(s)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف المنتج أو الخدمة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 mt-2">{s.description}</p>
                    </div>

                    {/* Financial Breakdown per item */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">
                          {s.photoConfig ? 'تكلفة النسخة/الصورة' : 'سعر التكلفة/الشراء'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">{formatCurrency(rawCost)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">سعر البيع للعميل</span>
                        <span className="text-xs font-mono font-bold text-[#292A34]">{formatCurrency(s.price)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 font-bold block">صافي الربح</span>
                        <span className="text-xs font-mono font-black text-emerald-600">+{formatCurrency(profit)}</span>
                      </div>
                    </div>

                    {/* Linked Photo Product Breakdown (Paper + Ink + Frame) */}
                    {associativeBreakdown && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/90 rounded-xl p-2.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-amber-900 font-bold">
                          <div className="flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[11px]">تحليل تكلفة الوحدة للمنتج الارتباطي:</span>
                          </div>
                          <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-mono font-bold">
                            {linkedConfig?.paperSize} ({pPerSheet} صور/ورقة)
                          </span>
                        </div>

                        {/* Breakdown matrix: Per Photo Consumables */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-[10px] pt-1 border-t border-amber-200/70">
                          <div className="bg-white p-1.5 rounded-lg border border-amber-200 shadow-2xs">
                            <span className="text-slate-500 block">ورق الصورة:</span>
                            <strong className="font-mono text-slate-700 font-bold text-xs block">{formatCurrency(associativeBreakdown.paperUnitCost)}</strong>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-amber-300 shadow-2xs">
                            <span className="text-amber-800 font-bold block">حبر الصورة:</span>
                            <strong className="font-mono text-amber-700 font-black text-xs block">{formatCurrency(associativeBreakdown.inkUnitCost)}</strong>
                          </div>
                          {(associativeBreakdown.frameUnitCost > 0 || associativeBreakdown.otherConsumablesCost > 0) && (
                            <div className="bg-white p-1.5 rounded-lg border border-purple-200 shadow-2xs">
                              <span className="text-purple-700 font-bold block">كادر / سلع:</span>
                              <strong className="font-mono text-purple-700 font-black text-xs block">
                                {formatCurrency(associativeBreakdown.frameUnitCost + associativeBreakdown.otherConsumablesCost)}
                              </strong>
                            </div>
                          )}
                          <div className="bg-amber-100/70 p-1.5 rounded-lg border border-amber-300 shadow-2xs">
                            <span className="text-amber-950 font-bold block">تكلفة الصورة:</span>
                            <strong className="font-mono text-[#E31C2B] font-black text-xs block">{formatCurrency(associativeBreakdown.totalUnitCost)}</strong>
                          </div>
                        </div>

                        {/* Summary Pill for Packages */}
                        <div className="text-[9px] text-amber-900 flex items-center justify-between pt-0.5 px-0.5 border-t border-amber-200/50">
                          <span>
                            حساب الوحدة: ({formatCurrency(associativeBreakdown.paperUnitCost)} ورق + {formatCurrency(associativeBreakdown.inkUnitCost)} حبر) = <strong>{formatCurrency(associativeBreakdown.totalUnitCost)} للصورة</strong>
                          </span>
                          {pPerSheet > 1 && (
                            <span className="font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-amber-200 font-mono">
                              باقة {pPerSheet} صور: {formatCurrency(associativeBreakdown.packageTotalCost)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

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
                      {s.itemType === 'direct_sale' && typeof s.currentStock === 'number' && (
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          المخزون: <strong className={s.currentStock > 3 ? 'text-emerald-700' : 'text-rose-600'}>{s.currentStock}</strong> قطعة
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditProduct(s)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-200"
                        title="تعديل صورة أو سعر السلعة"
                      >
                        <Camera className="w-3 h-3 text-slate-500" />
                        <span>الصورة / السعر</span>
                      </button>

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
                          <span>تزويد</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
              {isManager && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <label className="text-slate-700 block mb-1 font-bold">الفرع المخصص لهذه السلعة</label>
                  <select
                    value={directStoreId}
                    onChange={(e) => setDirectStoreId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="store_sidiamer">🏢 استوديو فوتوب - سيدي عامر (fotop sidiamer)</option>
                    <option value="store_labhour">🏢 استوديو فوتوب - الأبحور (fotop labhour)</option>
                  </select>
                </div>
              )}

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

              <div>
                <label className="text-slate-700 block mb-1 font-bold">التصنيف والقسم في الاستوديو *</label>
                <select
                  value={directCategory}
                  onChange={(e) => setDirectCategory(e.target.value as OfficialServiceCategory)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {OFFICIAL_SERVICE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
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

              {/* Product Image Section */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>صورة المنتج (اختياري)</span>
                  </label>
                  {directImageUrl && (
                    <button
                      type="button"
                      onClick={() => setDirectImageUrl('')}
                      className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" />
                      <span>إلغاء الصورة</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-3 items-start">
                  {/* Image preview box */}
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                    {directImageUrl ? (
                      <img 
                        src={directImageUrl} 
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
                    <label className="w-full px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 rounded-xl cursor-pointer text-[11px] font-bold text-slate-700 hover:text-emerald-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>رفع صورة من الجهاز</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileUpload(e, setDirectImageUrl)}
                      />
                    </label>

                    <input
                      type="url"
                      value={directImageUrl}
                      onChange={(e) => setDirectImageUrl(e.target.value)}
                      placeholder="أو الصق رابط صورة ويب (https://...)"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-[#292A34] focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Quick Studio Presets */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">نماذج سريعة لمنتجات الاستوديو:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {PRODUCT_IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDirectImageUrl(preset.url)}
                        className={`relative rounded-lg overflow-hidden border p-0.5 group text-left cursor-pointer transition-all ${
                          directImageUrl === preset.url ? 'border-emerald-600 ring-2 ring-emerald-500' : 'border-slate-200 hover:border-slate-400'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-10 object-cover rounded" referrerPolicy="no-referrer" />
                        <span className="text-[8px] line-clamp-1 text-slate-700 font-medium px-0.5 mt-0.5 block">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
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

      {/* MODAL 2: ADD ASSOCIATIVE PRODUCT & MODEL ENGINE (Raw Materials + Merchandise Goods + Custom Categories) */}
      {showAddPhotoLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2 font-black text-sm">
                <Link2 className="w-5 h-5 text-amber-400" />
                <span>منشئ المنتجات والنماذج الارتباطية (مواد خام وسلع تجارية)</span>
              </div>
              <button 
                onClick={() => setShowAddPhotoLinkModal(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePhotoLinkService} className="p-5 space-y-4 text-xs font-medium max-h-[85vh] overflow-y-auto">
              
              {/* 1. Interactive Models & Presets Bar */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>نماذج ارتباطية جاهزة بنقرة واحدة (اختر للتحميل الفوري):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoServiceName('');
                      setPhotoPrice('1000');
                      setAssociativeComponents([]);
                    }}
                    className="text-[10px] text-amber-900 hover:text-rose-600 font-bold underline cursor-pointer"
                  >
                    تفريغ البدء من الصفر
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {modelTemplates.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <div key={tpl.id} className="relative group inline-flex items-center">
                        <button
                          type="button"
                          onClick={() => applyModelTemplate(tpl)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs border ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                              : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                          title={tpl.description}
                        >
                          <span>{tpl.icon || '📦'}</span>
                          <span>{tpl.name}</span>
                          <span className={`font-mono text-[9px] px-1 rounded ${isSelected ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-900'}`}>
                            {formatCurrency(tpl.defaultPrice)}
                          </span>
                        </button>
                        {tpl.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteModelTemplate(tpl.id);
                            }}
                            className="mr-0.5 text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                            title="حذف هذا النموذج المخصص"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Product Name & Category Selectors */}
              <div className="space-y-3">
                <div>
                  <label className="text-slate-800 block mb-1 font-bold">اسم المنتج أو الخدمة الارتباطية *</label>
                  <input
                    type="text"
                    required
                    value={photoServiceName}
                    onChange={(e) => setPhotoServiceName(e.target.value)}
                    placeholder="مثال: كادر A4 كامل مع صورة / بوكس ألبوم هدايا / كوب حراري شخصي..."
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold text-sm focus:outline-none focus:border-[#E31C2B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Custom Category with inline adder */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-amber-950 font-bold text-xs flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>التصنيف الخاص بالمنتج (Custom Category):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewCatInput(!showNewCatInput)}
                        className="text-[10px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 underline cursor-pointer"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>{showNewCatInput ? 'إلغاء' : '+ تصنيف جديد'}</span>
                      </button>
                    </div>

                    {!showNewCatInput ? (
                      <div className="relative">
                        <select
                          value={photoCustomCategory}
                          onChange={(e) => setPhotoCustomCategory(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-[#292A34] font-bold text-xs focus:outline-none focus:border-amber-600 cursor-pointer"
                        >
                          {customCategories.map((cat, idx) => (
                            <option key={idx} value={cat}>🏷️ {cat}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <input
                          type="text"
                          value={newCustomCategoryInput}
                          onChange={(e) => setNewCustomCategoryInput(e.target.value)}
                          placeholder="اكتب اسم التصنيف الجديد..."
                          className="flex-1 bg-white border border-amber-400 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#292A34] focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCustomCategoryInput.trim()) {
                              const created = handleAddCustomCategory(newCustomCategoryInput);
                              if (created) {
                                setPhotoCustomCategory(created);
                                setNewCustomCategoryInput('');
                                setShowNewCatInput(false);
                              }
                            }
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          حفظ
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] text-amber-800 block">
                      يسمح لك هذا التصنيف بتجميع وفرز منتجاتك الارتباطية في قائمة مخصصة.
                    </span>
                  </div>

                  {/* Official Studio Category */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                      <Layers2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>القسم والتصنيف الرسمي في الاستوديو:</span>
                    </label>
                    <select
                      value={photoCategory}
                      onChange={(e) => setPhotoCategory(e.target.value as OfficialServiceCategory)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold text-xs focus:outline-none focus:border-[#E31C2B] cursor-pointer"
                    >
                      {OFFICIAL_SERVICE_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 block">
                      التصنيف المحاسبي المعتمد للإحصائيات وتقارير المبيعات.
                    </span>
                  </div>

                </div>
              </div>

              {/* 3. Consumable Materials & Goods Engine (تحديد المواد الاستهلاكية: خام أم سلع) */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div>
                    <h4 className="text-xs font-black text-[#292A34] flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-[#E31C2B]" />
                      <span>المواد الاستهلاكية الداخلة في هذا المنتج (خام وسلع تجارية):</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      حدد كل مادة تُخصم تلقائياً من رصيد المخزن أو السلع عند كل عملية بيع
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddAssociativeComponent('raw_material')}
                      className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3 h-3 text-blue-600" />
                      <span>+ إضافة مادة خام 🧪</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddAssociativeComponent('merchandise')}
                      className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3 h-3 text-emerald-600" />
                      <span>+ إضافة سلعة تجارية 🛍️</span>
                    </button>
                  </div>
                </div>

                {/* Components List */}
                {associativeComponents.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300 space-y-1.5">
                    <Boxes className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-bold text-xs">لم تتم إضافة أي مادة استهلاكية بعد.</p>
                    <p className="text-[11px] text-slate-400">انقر على الأزرار أعلاه لإضافة مواد خام (ورق، حبر، كادر...) أو سلع تجارية (أكواب، ألبومات...).</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {associativeComponents.map((comp, idx) => {
                      const calculated = calculatedComponents.find(c => c.id === comp.id);
                      const isRaw = comp.kind === 'raw_material';

                      return (
                        <div key={comp.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            
                            {/* Kind Selector Switch */}
                            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleUpdateComponent(comp.id, { kind: 'raw_material' })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                  isRaw ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-blue-700'
                                }`}
                              >
                                🧪 مادة خام
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateComponent(comp.id, { kind: 'merchandise' })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                  !isRaw ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
                                }`}
                              >
                                🛍️ سلعة تجارية
                              </button>
                            </div>

                            {/* Item Selector Dropdown */}
                            <div className="flex-1 min-w-[200px]">
                              {isRaw ? (
                                <select
                                  value={comp.itemId}
                                  onChange={(e) => handleUpdateComponent(comp.id, { itemId: e.target.value })}
                                  className="w-full bg-[#F0F0F0] border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                  <option value="">-- اختر مادة خام من المخزن --</option>
                                  {materials.map(m => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} ({formatCurrency(m.unitCost)}/{m.unit === 'sheet' ? 'ورقة' : m.unit === 'ml' ? 'مل' : 'قطعة'} | متاح: {m.currentStock})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <select
                                  value={comp.itemId}
                                  onChange={(e) => handleUpdateComponent(comp.id, { itemId: e.target.value })}
                                  className="w-full bg-[#F0F0F0] border border-emerald-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                                >
                                  <option value="">-- اختر سلعة تجارية من القائمة --</option>
                                  {services.filter(s => s.itemType === 'direct_sale').map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} (تكلفة الشراء: {formatCurrency(s.buyCost || 0)} | متاح: {s.currentStock ?? 0} قطعة)
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(comp.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                              title="حذف هذا المكون الاستهلاكي"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Consumption Mode & Quantities */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1.5 border-t border-slate-100 items-center">
                            
                            {/* Mode toggle */}
                            <div className="sm:col-span-5 flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-bold ml-1">نمط الاستهلاك:</span>
                              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateComponent(comp.id, { consumptionMode: 'direct', yieldCount: 1 })}
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                                    comp.consumptionMode === 'direct' ? 'bg-[#292A34] text-white shadow-2xs' : 'text-slate-600'
                                  }`}
                                >
                                  📦 مباشر (بالقطعة)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateComponent(comp.id, { consumptionMode: 'yield', yieldCount: comp.yieldCount > 1 ? comp.yieldCount : 8 })}
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                                    comp.consumptionMode === 'yield' ? 'bg-[#292A34] text-white shadow-2xs' : 'text-slate-600'
                                  }`}
                                >
                                  🔄 إنتاجية وتوزيع
                                </button>
                              </div>
                            </div>

                            {/* Numbers input */}
                            <div className="sm:col-span-4 flex items-center gap-1.5">
                              {comp.consumptionMode === 'direct' ? (
                                <div className="flex items-center gap-1 w-full">
                                  <label className="text-[10px] text-slate-500 font-bold whitespace-nowrap">الكمية:</label>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="0.1"
                                    value={comp.quantity}
                                    onChange={(e) => handleUpdateComponent(comp.id, { quantity: Number(e.target.value) || 1 })}
                                    className="w-20 bg-[#F0F0F0] border border-slate-300 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs"
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold">{comp.unit}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 w-full">
                                  <input
                                    type="number"
                                    min="1"
                                    value={comp.quantity}
                                    onChange={(e) => handleUpdateComponent(comp.id, { quantity: Number(e.target.value) || 1 })}
                                    className="w-12 bg-[#F0F0F0] border border-slate-300 rounded-lg px-1 py-1 text-center font-mono font-bold text-xs"
                                    title="كمية المادة المستهلكة (مثلاً 1 ورقة أو 1 عبوة)"
                                  />
                                  <span className="text-[10px] text-slate-500 font-bold">تنتج</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={comp.yieldCount}
                                    onChange={(e) => handleUpdateComponent(comp.id, { yieldCount: Number(e.target.value) || 1 })}
                                    className="w-14 bg-[#F0F0F0] border border-slate-300 rounded-lg px-1 py-1 text-center font-mono font-bold text-xs"
                                    title="عدد الوحدات أو الصور الناتجة"
                                  />
                                  <span className="text-[10px] text-slate-500 font-bold">وحدات</span>
                                </div>
                              )}
                            </div>

                            {/* Cost display */}
                            <div className="sm:col-span-3 text-left bg-slate-50 p-1 rounded-lg border border-slate-200">
                              <span className="text-[9px] text-slate-400 block font-bold">التكلفة للقطعة:</span>
                              <span className="font-mono font-black text-slate-800 text-xs">
                                {formatCurrency(calculated?.subtotalCost || 0)}
                              </span>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Selling Price & Product Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                
                {/* Selling Price */}
                <div>
                  <label className="text-slate-800 block mb-1 font-bold">سعر بيع المنتج النهائي للزبون (دج) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={photoPrice}
                    onChange={(e) => setPhotoPrice(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-black text-base focus:outline-none focus:border-[#E31C2B]"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    السعر الإجمالي الذي يدفعه الزبون شاملاً كل المواد والسلع
                  </span>
                </div>

                {/* Product Image preview & upload */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#E31C2B]" />
                      <span>صورة توضيحية للمنتج (اختياري)</span>
                    </label>
                    {photoImageUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoImageUrl('')}
                        className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                      {photoImageUrl ? (
                        <img src={photoImageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <label className="flex-1 px-3 py-2 bg-white border border-slate-300 hover:border-[#E31C2B] rounded-xl cursor-pointer text-[11px] font-bold text-slate-700 hover:text-[#E31C2B] flex items-center justify-center gap-1.5 shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#E31C2B]" />
                      <span>رفع صورة من الجهاز</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileUpload(e, setPhotoImageUrl)}
                      />
                    </label>
                  </div>
                </div>

              </div>

              {/* 5. Comprehensive Financial Summary Box (La Somme, Costs, Margins) */}
              <div className="bg-[#1e1f27] text-white p-4 rounded-xl space-y-3 border border-slate-700 shadow-md">
                <div className="flex items-center justify-between text-xs border-b border-slate-700/80 pb-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Calculator className="w-4 h-4" />
                    <span>الملخص المالي واحتساب التكلفة الإجمالية (La Somme):</span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-mono">
                    {associativeComponents.length} عناصر استهلاكية مربوطة
                  </span>
                </div>

                {/* Subtotals breakdown: Raw Materials vs Merchandise Goods */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-800/90 border border-blue-500/40 p-2 rounded-lg">
                    <span className="text-[10px] text-blue-300 font-bold block">1. تكلفة المواد الخام (المخزن)</span>
                    <span className="font-mono font-bold text-blue-200 text-sm mt-0.5 block">{formatCurrency(totalRawCost)}</span>
                  </div>

                  <div className="bg-slate-800/90 border border-emerald-500/40 p-2 rounded-lg">
                    <span className="text-[10px] text-emerald-300 font-bold block">2. تكلفة السلع التجارية (البضاعة)</span>
                    <span className="font-mono font-bold text-emerald-200 text-sm mt-0.5 block">{formatCurrency(totalGoodsCost)}</span>
                  </div>
                </div>

                {/* Section B: Grand Total Cost (La Somme) + Price + Profit */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-rose-950/70 border border-rose-500/60 p-2.5 rounded-xl">
                    <span className="text-[10px] text-rose-300 font-bold block">مجموع التكلفة (La Somme)</span>
                    <span className="font-mono font-black text-rose-200 text-sm">{formatCurrency(totalAssociativeCost)}</span>
                    <span className="text-[9px] text-rose-300/80 block mt-0.5 font-bold">خام + سلع</span>
                  </div>

                  <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 block font-bold">سعر البيع النهائي</span>
                    <span className="font-mono font-black text-white text-sm">{formatCurrency(sellingPricePerPhoto)}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">كامل المبلغ للزبون</span>
                  </div>

                  <div className="bg-emerald-950/80 border border-emerald-500/60 p-2.5 rounded-xl">
                    <span className="text-[10px] text-emerald-400 font-bold block">صافي الربح المحقق</span>
                    <span className="font-mono font-black text-emerald-300 text-sm">+{formatCurrency(netAssociativeProfit)}</span>
                    <span className="text-[9px] text-emerald-400/80 block mt-0.5 font-bold">%{associativeMargin} هامش الربح</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-300 text-center flex items-center justify-between pt-1 border-t border-slate-700">
                  <span>التصنيف الخاص: <strong className="text-amber-400 font-bold">{photoCustomCategory || 'غير محدد'}</strong></span>
                  <span className="text-emerald-400 font-medium">خصم متزامن للمواد الخام والسلع عند البيع بالـ POS</span>
                </div>
              </div>

              {/* 6. Save as Template Checkbox */}
              <div className="bg-amber-50/80 border border-amber-300/80 rounded-xl p-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="saveAsTemplateCheckbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="saveAsTemplateCheckbox" className="text-xs text-amber-950 font-bold cursor-pointer">
                  ✨ حفظ هذه التركيبة أيضاً كـ <strong>نموذج ارتباطي دائم (Template Model)</strong> للرجوع إليه وتطبيقه بنقرة واحدة مستقبلاً
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddPhotoLinkModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#E31C2B] hover:bg-[#c91422] text-white font-black shadow-md shadow-[#E31C2B]/30 cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ المنتج الارتباطي</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSOCIATIVE MODEL TEMPLATES & CUSTOM CATEGORIES ENGINE */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400 shrink-0">
              <div className="flex items-center gap-2 font-black text-sm">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>منشئ النماذج الارتباطية والتصنيفات المخصصة</span>
              </div>
              <button 
                onClick={() => setShowAddTemplateModal(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sub-Tab Navigation Header inside Modal */}
            <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTemplateTab('create')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  templateTab === 'create'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. تصميم نموذج ارتباطي جديد</span>
              </button>

              <button
                type="button"
                onClick={() => setTemplateTab('manage')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  templateTab === 'manage'
                    ? 'bg-[#292A34] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>2. إدارة التصنيفات ({customCategories.length}) والنماذج ({modelTemplates.length})</span>
              </button>
            </div>

            {/* TAB 1: CREATE NEW MODEL TEMPLATE */}
            {templateTab === 'create' && (
              <div className="p-5 space-y-4 text-xs font-medium overflow-y-auto">
                <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl">
                  <p className="text-amber-950 font-bold text-xs leading-relaxed">
                    💡 <strong>ما هو النموذج الارتباطي؟</strong> هو قالب جاهز يمكنك من ربط أي مادة خام (ورق، حبر، براويز، صفيحة ميتاليك...) مع أي سلعة تجارية (أكواب، تيشيرت، ألبوم، دروع...) وتحديد نمط استهلاكها وتصنيفها الخاص، لتتمكن من إنشاء منتجات جاهزة للبيع بنقرة واحدة مستقبلاً!
                  </p>
                </div>

                {/* 1. Model Name & Emoji Icon */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-9">
                    <label className="text-slate-800 block mb-1 font-bold">اسم النموذج الارتباطي *</label>
                    <input
                      type="text"
                      required
                      value={tplBuilderName}
                      onChange={(e) => setTplBuilderName(e.target.value)}
                      placeholder="مثال: درع تخرج فاخر مع صفيحة ميتاليك / بوكس ألبوم هدايا..."
                      className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold text-sm focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-slate-800 block mb-1 font-bold">أيقونة النموذج</label>
                    <div className="flex items-center gap-1 flex-wrap bg-[#F0F0F0] p-1 rounded-xl border border-slate-300">
                      {['🎓', '🎁', '🖼️', '☕', '👕', '🏆', '📦', '✨'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setTplBuilderIcon(emoji)}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-transform ${
                            tplBuilderIcon === emoji ? 'bg-amber-500 text-white scale-110 shadow-xs' : 'hover:bg-slate-200'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Custom Category & Official Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Custom Category with inline adder */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-amber-950 font-bold text-xs flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>التصنيف الخاص بالنموذج (Custom Category):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setTplBuilderShowNewCat(!tplBuilderShowNewCat)}
                        className="text-[10px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                      >
                        {tplBuilderShowNewCat ? 'إلغاء' : '+ تصنيف جديد'}
                      </button>
                    </div>

                    {!tplBuilderShowNewCat ? (
                      <select
                        value={tplBuilderCustomCategory}
                        onChange={(e) => setTplBuilderCustomCategory(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-[#292A34] font-bold text-xs focus:outline-none focus:border-amber-600 cursor-pointer"
                      >
                        {customCategories.map((cat, idx) => (
                          <option key={idx} value={cat}>🏷️ {cat}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <input
                          type="text"
                          value={tplBuilderNewCatInput}
                          onChange={(e) => setTplBuilderNewCatInput(e.target.value)}
                          placeholder="اكتب اسم التصنيف الجديد..."
                          className="flex-1 bg-white border border-amber-400 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#292A34] focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (tplBuilderNewCatInput.trim()) {
                              const created = handleAddCustomCategory(tplBuilderNewCatInput);
                              if (created) {
                                setTplBuilderCustomCategory(created);
                                setTplBuilderNewCatInput('');
                                setTplBuilderShowNewCat(false);
                              }
                            }
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          حفظ
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] text-amber-800 block">
                      سيتم ربط هذا النموذج بهذا التصنيف لتنظيم الفرز تلقائياً.
                    </span>
                  </div>

                  {/* Official Category */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                      <Layers2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>القسم المحاسبي المعتمد في الاستوديو:</span>
                    </label>
                    <select
                      value={tplBuilderOfficialCategory}
                      onChange={(e) => setTplBuilderOfficialCategory(e.target.value as OfficialServiceCategory)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold text-xs focus:outline-none focus:border-[#E31C2B] cursor-pointer"
                    >
                      {OFFICIAL_SERVICE_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 block">
                      القسم المعتمد في التقارير المحاسبية والمبيعات.
                    </span>
                  </div>

                </div>

                {/* 3. Consumable Materials & Goods Engine (تحديد المواد الاستهلاكية: خام وسلع) */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                    <div>
                      <h4 className="text-xs font-black text-[#292A34] flex items-center gap-1.5">
                        <Boxes className="w-4 h-4 text-[#E31C2B]" />
                        <span>المواد الاستهلاكية الداخلة في هذا النموذج (خام وسلع تجارية):</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        حدد المواد المستهلكة (مواد خام من المخزن أو سلع تجارية) وطريقة الاستهلاك
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddTemplateComponent('raw_material')}
                        className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Plus className="w-3 h-3 text-blue-600" />
                        <span>+ إضافة مادة خام 🧪</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddTemplateComponent('merchandise')}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Plus className="w-3 h-3 text-emerald-600" />
                        <span>+ إضافة سلعة تجارية 🛍️</span>
                      </button>
                    </div>
                  </div>

                  {/* Components List */}
                  {tplBuilderComponents.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300 space-y-1.5">
                      <Boxes className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-xs">لم تتم إضافة أي مكون استهلاكي في هذا النموذج بعد.</p>
                      <p className="text-[11px] text-slate-400">انقر على الأزرار أعلاه لتحديد المواد الخام (ورق، حبر، كادر...) أو السلع التجارية (أكواب، دروع، ألبومات...).</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {tplBuilderComponents.map((comp, idx) => {
                        const calculated = calculatedTemplateComponents.find(c => c.id === comp.id);
                        const isRaw = comp.kind === 'raw_material';

                        return (
                          <div key={comp.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              
                              {/* Kind Selector Switch */}
                              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateTemplateComponent(comp.id, { kind: 'raw_material' })}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                    isRaw ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-blue-700'
                                  }`}
                                >
                                  🧪 مادة خام
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateTemplateComponent(comp.id, { kind: 'merchandise' })}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                    !isRaw ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
                                  }`}
                                >
                                  🛍️ سلعة تجارية
                                </button>
                              </div>

                              {/* Item Selector Dropdown */}
                              <div className="flex-1 min-w-[200px]">
                                {isRaw ? (
                                  <select
                                    value={comp.itemId}
                                    onChange={(e) => handleUpdateTemplateComponent(comp.id, { itemId: e.target.value })}
                                    className="w-full bg-[#F0F0F0] border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                                  >
                                    <option value="">-- اختر مادة خام من المخزن --</option>
                                    {materials.map(m => (
                                      <option key={m.id} value={m.id}>
                                        {m.name} ({formatCurrency(m.unitCost)}/{m.unit === 'sheet' ? 'ورقة' : m.unit === 'ml' ? 'مل' : 'قطعة'} | متاح: {m.currentStock})
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <select
                                    value={comp.itemId}
                                    onChange={(e) => handleUpdateTemplateComponent(comp.id, { itemId: e.target.value })}
                                    className="w-full bg-[#F0F0F0] border border-emerald-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                                  >
                                    <option value="">-- اختر سلعة تجارية من القائمة --</option>
                                    {services.filter(s => s.itemType === 'direct_sale').map(s => (
                                      <option key={s.id} value={s.id}>
                                        {s.name} (تكلفة الشراء: {formatCurrency(s.buyCost || 0)} | متاح: {s.currentStock ?? 0} قطعة)
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveTemplateComponent(comp.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                                title="حذف هذا المكون من النموذج"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Consumption Mode & Quantities */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1.5 border-t border-slate-100 items-center">
                              
                              {/* Mode toggle */}
                              <div className="sm:col-span-5 flex items-center gap-1">
                                <span className="text-[10px] text-slate-500 font-bold ml-1">نمط الاستهلاك:</span>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTemplateComponent(comp.id, { consumptionMode: 'direct', yieldCount: 1 })}
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                                      comp.consumptionMode === 'direct' ? 'bg-[#292A34] text-white shadow-2xs' : 'text-slate-600'
                                    }`}
                                  >
                                    📦 مباشر (بالقطعة)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTemplateComponent(comp.id, { consumptionMode: 'yield', yieldCount: comp.yieldCount > 1 ? comp.yieldCount : 8 })}
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all ${
                                      comp.consumptionMode === 'yield' ? 'bg-[#292A34] text-white shadow-2xs' : 'text-slate-600'
                                    }`}
                                  >
                                    🔄 إنتاجية وتوزيع
                                  </button>
                                </div>
                              </div>

                              {/* Numbers input */}
                              <div className="sm:col-span-4 flex items-center gap-1.5">
                                {comp.consumptionMode === 'direct' ? (
                                  <div className="flex items-center gap-1 w-full">
                                    <label className="text-[10px] text-slate-500 font-bold whitespace-nowrap">الكمية:</label>
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="0.1"
                                      value={comp.quantity}
                                      onChange={(e) => handleUpdateTemplateComponent(comp.id, { quantity: Number(e.target.value) || 1 })}
                                      className="w-20 bg-[#F0F0F0] border border-slate-300 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs"
                                    />
                                    <span className="text-[10px] text-slate-400 font-bold">{comp.unit}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 w-full">
                                    <input
                                      type="number"
                                      min="1"
                                      value={comp.quantity}
                                      onChange={(e) => handleUpdateTemplateComponent(comp.id, { quantity: Number(e.target.value) || 1 })}
                                      className="w-12 bg-[#F0F0F0] border border-slate-300 rounded-lg px-1 py-1 text-center font-mono font-bold text-xs"
                                      title="كمية المادة المستهلكة"
                                    />
                                    <span className="text-[10px] text-slate-500 font-bold">تنتج</span>
                                    <input
                                      type="number"
                                      min="1"
                                      value={comp.yieldCount}
                                      onChange={(e) => handleUpdateTemplateComponent(comp.id, { yieldCount: Number(e.target.value) || 1 })}
                                      className="w-14 bg-[#F0F0F0] border border-slate-300 rounded-lg px-1 py-1 text-center font-mono font-bold text-xs"
                                      title="عدد الوحدات أو الصور المنتجة"
                                    />
                                    <span className="text-[10px] text-slate-500 font-bold">وحدات</span>
                                  </div>
                                )}
                              </div>

                              {/* Cost display */}
                              <div className="sm:col-span-3 text-left bg-slate-50 p-1 rounded-lg border border-slate-200">
                                <span className="text-[9px] text-slate-400 block font-bold">التكلفة للوحدة:</span>
                                <span className="font-mono font-black text-slate-800 text-xs">
                                  {formatCurrency(calculated?.subtotalCost || 0)}
                                </span>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Default Price & Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <div>
                    <label className="text-slate-800 block mb-1 font-bold">سعر البيع الافتراضي للزبون (دج) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={tplBuilderDefaultPrice}
                      onChange={(e) => setTplBuilderDefaultPrice(e.target.value)}
                      className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-black text-base focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-800 block mb-1 font-bold">مقاس أو صيغة النموذج</label>
                    <select
                      value={tplBuilderPaperSize}
                      onChange={(e) => setTplBuilderPaperSize(e.target.value as any)}
                      className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold text-xs focus:outline-none focus:border-amber-600 cursor-pointer"
                    >
                      <option value="custom">مخصص (حسب الطلب)</option>
                      <option value="A4">A4 (21x29.7 سم)</option>
                      <option value="A3">A3 (30x42 سم)</option>
                      <option value="10x15">10x15 سم (عادي)</option>
                      <option value="13x18">13x18 سم (متوسط)</option>
                    </select>
                  </div>
                </div>

                {/* 5. Financial Summary Box (La Somme) */}
                <div className="bg-[#1e1f27] text-white p-4 rounded-xl space-y-3 border border-slate-700 shadow-md">
                  <div className="flex items-center justify-between text-xs border-b border-slate-700/80 pb-2">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Calculator className="w-4 h-4" />
                      <span>الملخص المالي واحتساب التكلفة الإجمالية (La Somme):</span>
                    </div>
                    <span className="text-[11px] text-slate-300 font-mono">
                      {tplBuilderComponents.length} عناصر استهلاكية مربوطة
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-slate-800/90 border border-blue-500/40 p-2 rounded-lg">
                      <span className="text-[10px] text-blue-300 font-bold block">1. تكلفة المواد الخام (المخزن)</span>
                      <span className="font-mono font-bold text-blue-200 text-sm mt-0.5 block">{formatCurrency(tplTotalRawCost)}</span>
                    </div>

                    <div className="bg-slate-800/90 border border-emerald-500/40 p-2 rounded-lg">
                      <span className="text-[10px] text-emerald-300 font-bold block">2. تكلفة السلع التجارية (البضاعة)</span>
                      <span className="font-mono font-bold text-emerald-200 text-sm mt-0.5 block">{formatCurrency(tplTotalGoodsCost)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-rose-950/70 border border-rose-500/60 p-2.5 rounded-xl">
                      <span className="text-[10px] text-rose-300 font-bold block">مجموع التكلفة (La Somme)</span>
                      <span className="font-mono font-black text-rose-200 text-sm">{formatCurrency(tplTotalCost)}</span>
                      <span className="text-[9px] text-rose-300/80 block mt-0.5 font-bold">خام + سلع</span>
                    </div>

                    <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700/80">
                      <span className="text-[10px] text-slate-400 block font-bold">سعر البيع النهائي</span>
                      <span className="font-mono font-black text-white text-sm">{formatCurrency(tplSellingPrice)}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">كامل المبلغ للزبون</span>
                    </div>

                    <div className="bg-emerald-950/80 border border-emerald-500/60 p-2.5 rounded-xl">
                      <span className="text-[10px] text-emerald-400 font-bold block">صافي الربح المتوقع</span>
                      <span className="font-mono font-black text-emerald-300 text-sm">+{formatCurrency(tplNetProfit)}</span>
                      <span className="text-[9px] text-emerald-400/80 block mt-0.5 font-bold">%{tplMargin} هامش الربح</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowAddTemplateModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveNewTemplate(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>حفظ كنموذج ارتباطي دائم</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleSaveNewTemplate(true)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-md cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>حفظ وتطبيق كمنتج فوراً ⚡</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MANAGE SAVED CUSTOM CATEGORIES & MODEL TEMPLATES */}
            {templateTab === 'manage' && (
              <div className="p-5 space-y-5 text-xs font-medium overflow-y-auto">
                
                {/* 1. Custom Categories Management */}
                <div className="space-y-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-amber-950 flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-amber-600" />
                        <span>التصنيفات الخاصة المعتمدة ({customCategories.length}):</span>
                      </h4>
                      <p className="text-[11px] text-amber-900 mt-0.5">
                        يمكنك إضافة تصنيفات جديدة لتجميع منتجاتك الارتباطية، أو حذف التصنيفات التي لم تعد بحاجة إليها.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tplBuilderNewCatInput}
                        onChange={(e) => setTplBuilderNewCatInput(e.target.value)}
                        placeholder="اسم تصنيف جديد..."
                        className="bg-white border border-amber-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tplBuilderNewCatInput.trim()) {
                            handleAddCustomCategory(tplBuilderNewCatInput);
                            setTplBuilderNewCatInput('');
                          }
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        + إضافة
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-2">
                    {customCategories.map(cat => {
                      const count = (services || []).filter(s => s.customCategoryName === cat).length;
                      const modelCount = modelTemplates.filter(t => t.customCategory === cat).length;

                      return (
                        <div key={cat} className="flex items-center gap-1.5 bg-white border border-amber-300 px-3 py-1.5 rounded-xl shadow-2xs">
                          <Tag className="w-3 h-3 text-amber-600" />
                          <span className="font-bold text-amber-950 text-xs">{cat}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold" title="عدد المنتجات والنماذج في هذا التصنيف">
                            {count} منتج / {modelCount} نماذج
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomCategory(cat)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer ml-1"
                            title="حذف هذا التصنيف"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Reusable Model Templates Management */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-[#292A34] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>النماذج الارتباطية المحفوظة ({modelTemplates.length}):</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        انقر على أي نموذج لتحميله فوراً في منشئ المنتجات لإنشاء منتج ارتباطي مع خصم آلي للمواد.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modelTemplates.map((tpl) => {
                      const rawComps = (tpl.components || []).filter(c => c.kind === 'raw_material');
                      const goodsComps = (tpl.components || []).filter(c => c.kind === 'merchandise');

                      return (
                        <div key={tpl.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 hover:border-amber-400 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{tpl.icon || '📦'}</span>
                              <div>
                                <h5 className="font-black text-xs text-[#292A34]">{tpl.name}</h5>
                                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-900 border border-amber-300 mt-0.5">
                                  <Tag className="w-2.5 h-2.5 text-amber-700" />
                                  <span>{tpl.customCategory || 'نماذج عامة'}</span>
                                </span>
                              </div>
                            </div>

                            <span className="font-mono font-black text-xs text-[#E31C2B]">
                              {formatCurrency(tpl.defaultPrice)}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-600 line-clamp-1">{tpl.description}</p>

                          {/* Components preview */}
                          <div className="flex items-center gap-1 text-[9px] text-slate-500 pt-1 border-t border-slate-200">
                            <span className="font-bold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                              🧪 {rawComps.length} مواد خام
                            </span>
                            <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              🛍️ {goodsComps.length} سلع تجارية
                            </span>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                applyModelTemplate(tpl);
                                setShowAddTemplateModal(false);
                                setShowAddPhotoLinkModal(true);
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px] cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Sparkles className="w-3 h-3 text-slate-950" />
                              <span>تحميل وتطبيق كمنتج ⚡</span>
                            </button>

                            {tpl.isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteModelTemplate(tpl.id)}
                                className="text-slate-400 hover:text-rose-600 text-[10px] font-bold p-1 cursor-pointer"
                                title="حذف هذا النموذج"
                              >
                                حذف النموذج ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowAddTemplateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold cursor-pointer hover:bg-slate-900"
                  >
                    إغلاق النافذة
                  </button>
                </div>
              </div>
            )}

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
              {isManager && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <label className="text-slate-700 block mb-1 font-bold">الفرع المخصص لهذه المادة</label>
                  <select
                    value={newMatStoreId}
                    onChange={(e) => setNewMatStoreId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-[#E31C2B]"
                  >
                    <option value="store_sidiamer">🏢 استوديو فوتوب - سيدي عامر (fotop sidiamer)</option>
                    <option value="store_labhour">🏢 استوديو فوتوب - الأبحور (fotop labhour)</option>
                  </select>
                </div>
              )}

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

      {/* MODAL: EDIT PRODUCT & IMAGE */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white border border-slate-300 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#292A34] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <Camera className="w-5 h-5 text-amber-400" />
                <span>تعديل بيانات وصورة المنتج: {editingProduct.name}</span>
              </div>
              <button 
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="p-5 space-y-4 text-xs font-medium max-h-[85vh] overflow-y-auto">
              {/* Image Editor */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>صورة المنتج</span>
                  </label>
                  {editProductImageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditProductImageUrl('')}
                      className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف الصورة</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-24 h-24 rounded-xl bg-white border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                    {editProductImageUrl ? (
                      <img 
                        src={editProductImageUrl} 
                        alt="Product Preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                        <span className="text-[10px] block font-bold">بدون صورة</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="w-full px-3 py-2 bg-white border border-slate-300 hover:border-amber-500 rounded-xl cursor-pointer text-xs font-bold text-slate-700 hover:text-amber-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors">
                      <Upload className="w-4 h-4 text-amber-600" />
                      <span>رفع صورة جديدة من الجهاز</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFileUpload(e, setEditProductImageUrl)}
                      />
                    </label>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">أو رابط صورة إنترنت:</label>
                      <input
                        type="url"
                        value={editProductImageUrl}
                        onChange={(e) => setEditProductImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#292A34] focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1.5">أو اختر صورة جاهزة من تصنيفات الاستوديو:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {PRODUCT_IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditProductImageUrl(preset.url)}
                        className={`relative rounded-lg overflow-hidden border p-0.5 group text-left cursor-pointer transition-all ${
                          editProductImageUrl === preset.url ? 'border-amber-500 ring-2 ring-amber-400' : 'border-slate-200 hover:border-slate-400'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-10 object-cover rounded" referrerPolicy="no-referrer" />
                        <span className="text-[8px] line-clamp-1 text-slate-700 font-medium px-0.5 mt-0.5 block">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Info Inputs */}
              <div>
                <label className="text-slate-700 block mb-1 font-bold">اسم المنتج / الخدمة *</label>
                <input
                  type="text"
                  required
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">التصنيف والقسم في الاستوديو *</label>
                  <select
                    value={editProductCategory}
                    onChange={(e) => setEditProductCategory(e.target.value as any)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold cursor-pointer"
                  >
                    {OFFICIAL_SERVICE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">نوع السلعة</label>
                  <select
                    value={editProductItemType}
                    onChange={(e) => setEditProductItemType(e.target.value as ServiceItem['itemType'])}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold cursor-pointer"
                  >
                    <option value="direct_sale">سلعة بيع مباشر</option>
                    <option value="custom_photo_service">خدمة استوديو وطباعة</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">الفرع المتاح فيه</label>
                  <select
                    value={editProductStoreId}
                    onChange={(e) => setEditProductStoreId(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-bold cursor-pointer"
                  >
                    <option value="all">كلا الفرعين (مشترك)</option>
                    <option value="store_sidiamer">فرع سيدي عامر</option>
                    <option value="store_labhour">فرع الأبحور</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">سعر الشراء / التكلفة (دج)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editProductBuyCost}
                    onChange={(e) => setEditProductBuyCost(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">سعر البيع النهائي (دج) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={editProductPrice}
                    onChange={(e) => setEditProductPrice(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-black text-emerald-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Linked Photo Product Breakdown (If photoConfig exists) */}
              {editingProduct.photoConfig && (() => {
                const breakdown = getAssociativeProductUnitCostBreakdown(editingProduct, materials, services);
                const cfg = editingProduct.photoConfig;
                const pPerSheet = breakdown.photosPerSheet;

                return (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-amber-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Link2 className="w-4 h-4 text-amber-600" />
                        <span>بيانات التكلفة الارتباطية (لكل صورة مستهلكة):</span>
                      </span>
                      <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                        مقاس {cfg?.paperSize} ({pPerSheet} صور/ورقة)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                      <div className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs">
                        <span className="text-[10px] text-slate-500 block">تكلفة ورق الصورة:</span>
                        <strong className="font-mono text-slate-800 font-bold text-sm block mt-0.5">{formatCurrency(breakdown.paperUnitCost)}</strong>
                        <span className="text-[9px] text-slate-400 block font-mono">سعر الورقة ÷ {pPerSheet}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-amber-300 shadow-2xs">
                        <span className="text-[10px] text-amber-800 font-bold block">تكلفة حبر الصورة:</span>
                        <strong className="font-mono text-amber-700 font-black text-sm block mt-0.5">{formatCurrency(breakdown.inkUnitCost)}</strong>
                        <span className="text-[9px] text-slate-400 block font-mono">سعر الحبر ÷ إنتاجية الصور</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-purple-200 shadow-2xs">
                        <span className="text-[10px] text-purple-700 font-bold block">كادر / مستلزمات:</span>
                        <strong className="font-mono text-purple-700 font-bold text-sm block mt-0.5">
                          {formatCurrency(breakdown.frameUnitCost + breakdown.otherConsumablesCost)}
                        </strong>
                        <span className="text-[9px] text-slate-400 block font-mono">ملحقات الوحدة</span>
                      </div>
                      <div className="bg-amber-100/80 p-2 rounded-lg border border-amber-400 shadow-2xs">
                        <span className="text-[10px] text-amber-950 font-black block">إجمالي تكلفة الصورة:</span>
                        <strong className="font-mono text-[#E31C2B] font-black text-sm block mt-0.5">{formatCurrency(breakdown.totalUnitCost)}</strong>
                        <span className="text-[9px] text-amber-800 font-bold block font-mono">ورق + حبر + كادر</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-amber-900 bg-white/80 p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                      <span>
                        المعادلة: تكلفة الورقة ({formatCurrency(breakdown.paperUnitCost)}) + تكلفة الحبر ({formatCurrency(breakdown.inkUnitCost)}) = <strong>{formatCurrency(breakdown.totalUnitCost)} للنسخة الواحدة</strong>
                      </span>
                      {pPerSheet > 1 && (
                        <span className="font-mono font-bold text-slate-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                          باقة {pPerSheet} صور: {formatCurrency(breakdown.packageTotalCost)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {editProductItemType === 'direct_sale' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 block mb-1 font-bold">الكمية المتوفرة بالمخزن</label>
                    <input
                      type="number"
                      min="0"
                      value={editProductStock}
                      onChange={(e) => setEditProductStock(e.target.value)}
                      className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 block mb-1 font-bold">حد الأمان للتنبيه (نواقص)</label>
                    <input
                      type="number"
                      min="0"
                      value={editProductMinThreshold}
                      onChange={(e) => setEditProductMinThreshold(e.target.value)}
                      className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Custom Category Selection in Edit Modal */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-amber-950 font-bold text-xs flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>التصنيف الخاص بالمنتج (Custom Category):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const val = prompt('أدخل اسم التصنيف الخاص الجديد:');
                      if (val && val.trim()) {
                        const added = handleAddCustomCategory(val.trim());
                        setEditProductCustomCategory(added);
                      }
                    }}
                    className="text-[10px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                  >
                    + تصنيف جديد
                  </button>
                </div>
                <select
                  value={editProductCustomCategory}
                  onChange={(e) => setEditProductCustomCategory(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-[#292A34] font-bold text-xs focus:outline-none focus:border-amber-600 cursor-pointer"
                >
                  <option value="">-- بدون تصنيف خاص (افتراضي) --</option>
                  {customCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>🏷️ {cat}</option>
                  ))}
                </select>
                <span className="text-[10px] text-amber-800 block">
                  يمكنك تخصيص وتعيين تصنيف خاص لهذا المنتج لتصنيفه وعرضه في القوائم المخصصة
                </span>
              </div>

              {/* Display Consumables List if editing an associative product */}
              {editingProduct.photoConfig?.components && editingProduct.photoConfig.components.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-[#E31C2B]" />
                    <span>المكونات الاستهلاكية المرتبطة بهذا المنتج:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {editingProduct.photoConfig.components.map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span>{c.kind === 'raw_material' ? '🧪' : '🛍️'}</span>
                          <span>{c.name}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {c.consumptionMode === 'yield' ? `1/${c.yieldCount || 1}` : c.quantity} {c.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-700 block mb-1 font-bold">الوصف والتفاصيل</label>
                <textarea
                  rows={2}
                  value={editProductDescription}
                  onChange={(e) => setEditProductDescription(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#292A34] font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديلات والصورة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          EDIT RAW MATERIAL MODAL
      ===================================================================== */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#292A34]">تعديل بيانات المادة والمخزون</h3>
                  <p className="text-xs text-slate-500">تعديل الاسم، الفئة، التكلفة، الرصيد وحد الأمان</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMaterial(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingMaterial) return;
                const updated: Material = {
                  ...editingMaterial,
                  name: editMatName.trim(),
                  category: editMatCategory,
                  unit: editMatUnit,
                  currentStock: Number(editMatStock) || 0,
                  minThreshold: Number(editMatThreshold) || 0,
                  unitCost: Number(editMatUnitCost) || 0,
                  sku: editMatSku.trim(),
                  supplier: editMatSupplier.trim() || undefined,
                  storeId: editMatStoreId || undefined,
                };
                onUpdateMaterial(updated);
                setEditingMaterial(null);
              }}
              className="space-y-4 text-xs font-bold"
            >
              <div>
                <label className="text-slate-700 block mb-1">اسم المادة الخام *</label>
                <input
                  type="text"
                  required
                  value={editMatName}
                  onChange={(e) => setEditMatName(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">التصنيف</label>
                  <select
                    value={editMatCategory}
                    onChange={(e) => setEditMatCategory(e.target.value as Material['category'])}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] cursor-pointer"
                  >
                    <option value="paper">ورق طباعة</option>
                    <option value="ink">حبر سائل / ليزر</option>
                    <option value="frame">إطارات وبراويز</option>
                    <option value="lamination">تغليف وسلوفان</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">وحدة القياس</label>
                  <select
                    value={editMatUnit}
                    onChange={(e) => setEditMatUnit(e.target.value as Material['unit'])}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] cursor-pointer"
                  >
                    <option value="sheet">ورقة / لوح</option>
                    <option value="ml">مليلتر (حبر)</option>
                    <option value="piece">قطعة / إطار</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">الرصيد الفعلي</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editMatStock}
                    onChange={(e) => setEditMatStock(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">حد الأمان (التنبيه)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editMatThreshold}
                    onChange={(e) => setEditMatThreshold(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">سعر الوحدة (دج)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={editMatUnitCost}
                    onChange={(e) => setEditMatUnitCost(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono font-bold text-emerald-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1">رمز المادة (SKU)</label>
                  <input
                    type="text"
                    value={editMatSku}
                    onChange={(e) => setEditMatSku(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1">المورد المعتمد</label>
                  <input
                    type="text"
                    value={editMatSupplier}
                    onChange={(e) => setEditMatSupplier(e.target.value)}
                    className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34]"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1">الفرع التابع له</label>
                <select
                  value={editMatStoreId}
                  onChange={(e) => setEditMatStoreId(e.target.value)}
                  className="w-full bg-[#F0F0F0] border border-slate-300 rounded-xl px-3 py-2 text-[#292A34] cursor-pointer"
                >
                  <option value="store_sidiamer">فرع سيدي عامر</option>
                  <option value="store_labhour">فرع الأبحور</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          DELETE MATERIAL CONFIRMATION MODAL
      ===================================================================== */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" dir="rtl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#292A34]">تأكيد حذف المادة الخام</h3>
                <p className="text-xs text-slate-500">حذف نهائي من قاعدة بيانات المخزن</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-[#292A34] flex items-center justify-between">
                <span>اسم المادة:</span>
                <span>{materialToDelete.name}</span>
              </div>
              <div className="text-slate-500 flex items-center justify-between">
                <span>الرصيد المتبقي:</span>
                <span className="font-mono font-bold">{formatNumber(materialToDelete.currentStock)} {materialToDelete.unit}</span>
              </div>
              <div className="text-slate-500 flex items-center justify-between">
                <span>القيمة الإجمالية:</span>
                <span className="font-mono font-bold text-rose-600">{formatCurrency(materialToDelete.currentStock * materialToDelete.unitCost)}</span>
              </div>
            </div>

            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              تحذير: سيتم حذف المادة ولن تظهر في حسابات التكلفة أو قوائم التزويد بعد الآن.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteMaterial && materialToDelete) {
                    onDeleteMaterial(materialToDelete.id);
                  }
                  setMaterialToDelete(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، احذف المادة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DELETE SERVICE CONFIRMATION MODAL
      ===================================================================== */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4" dir="rtl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#292A34]">تأكيد حذف الخدمة أو المنتج</h3>
                <p className="text-xs text-slate-500">حذف السلعة من قائمة المبيعات ونقطة البيع</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-[#292A34] flex items-center justify-between">
                <span>اسم السلعة/الخدمة:</span>
                <span>{serviceToDelete.name}</span>
              </div>
              <div className="text-slate-500 flex items-center justify-between">
                <span>سعر البيع:</span>
                <span className="font-mono font-bold text-emerald-700">{formatCurrency(serviceToDelete.price)}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteService && serviceToDelete) {
                    onDeleteService(serviceToDelete.id);
                  }
                  setServiceToDelete(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، احذف السلعة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PERMISSION ALERT MODAL
      ===================================================================== */}
      {permissionAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-3 text-center" dir="rtl">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-[#292A34]">صلاحية غير متوفرة</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{permissionAlert}</p>
            <button
              onClick={() => setPermissionAlert(null)}
              className="w-full py-2 bg-[#292A34] hover:bg-[#1a1b22] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
