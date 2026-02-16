
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Search, Plus, Calendar, Truck, 
  Hash, Info, CheckCircle2, ChevronDown, 
  ArrowRight, ArrowLeft, Trash2, Loader2, AlertTriangle, FileText,
  Briefcase, Box, Download, Clock, Undo2, Sparkles, Import
} from 'lucide-react';
import { StockItem, Theme, PurchaseOrder, ActiveModule } from '../types';

interface CreateOrderWizardProps {
  theme: Theme;
  items: StockItem[];
  onNavigate: (module: ActiveModule) => void;
  onCreateOrder: (order: PurchaseOrder) => void;
  initialOrder?: PurchaseOrder | null;
  requireDeliveryDate: boolean;
  enableSmartImport?: boolean;
}

interface CartItem {
    sku: string;
    name: string;
    quantity: number;
    system: string;
    // Smart Edit Fields
    isAddedLater?: boolean;
    isDeleted?: boolean;
    isPersisted?: boolean; // Internal flag to track if item existed before this session
}

interface OrderFormData {
  orderId: string;
  supplier: string;
  orderDate: string;
  expectedDeliveryDate: string;
  poType: 'normal' | 'project' | null;
}
// --- SEARCHABLE DROPDOWN WITH ADD NEW ---
const SearchableDropdown = ({ 
  value, 
  onChange, 
  options, 
  onAddNew,
  placeholder = "Wählen...", 
  label,
  isDark = false 
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  onAddNew?: (newValue: string) => void;
  placeholder?: string;
  label?: string;
  isDark?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newItemInput, setNewItemInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setShowAddNew(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    setSearchTerm('');
    setShowAddNew(false);
  };

  const handleAddNew = () => {
    if (newItemInput.trim() && onAddNew) {
      onAddNew(newItemInput.trim());
      onChange(newItemInput.trim());
      setNewItemInput('');
      setShowAddNew(false);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {label && <label className={`text-sm font-bold block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${
          isDark 
            ? 'bg-slate-900 border-slate-700 text-white hover:border-slate-600' 
            : 'bg-white border-slate-300 hover:border-slate-400'
        } ${isOpen ? 'ring-2 ring-blue-500/20' : ''}`}
      >
        <span className={value ? '' : 'opacity-50'}>{value || placeholder}</span>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 w-full rounded-xl border shadow-2xl max-h-[300px] overflow-hidden flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className={`p-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <Search size={16} className="opacity-50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Suchen..."
                className="flex-1 bg-transparent outline-none text-sm"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                    value === opt 
                      ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                      : isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                  }`}
                >
                  <span>{opt}</span>
                  {value === opt && <CheckCircle2 size={16} />}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm opacity-50">Keine Ergebnisse</div>
            )}
          </div>

          {onAddNew && !showAddNew && (
            <button
              type="button"
              onClick={() => setShowAddNew(true)}
              className={`p-3 border-t flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                isDark 
                  ? 'border-slate-700 hover:bg-slate-800 text-blue-400' 
                  : 'border-slate-200 hover:bg-slate-50 text-blue-600'
              }`}
            >
              <Plus size={16} /> Neuen Lieferanten hinzufügen
            </button>
          )}

          {showAddNew && (
            <div className={`p-3 border-t ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
                  placeholder="Neuer Lieferant..."
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddNew}
                  disabled={!newItemInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-blue-500"
                >
                  <CheckCircle2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {setShowAddNew(false); setNewItemInput('');}}
                  className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
// --- PLUS/MINUS PICKER (Deutsche Post Style) ---
const PlusMinusPicker = ({ value, onChange, min = 0, max = 999, disabled = false, isDark = false }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; disabled?: boolean; isDark?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const inc = () => { if (!disabled && value < max) onChange(value + 1); };
  const dec = () => { if (!disabled && value > min) onChange(value - 1); };
  
  const handleNumberClick = () => {
    if (disabled) return;
    setIsEditing(true);
    setTempValue(String(value));
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseInt(tempValue) || 0;
    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(clamped);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className={`flex items-center gap-1 select-none ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* MINUS BUTTON - RED */}
      <button 
        onClick={dec} 
        disabled={disabled || value <= min}
        className={`min-w-[48px] min-h-[48px] flex items-center justify-center rounded-lg font-bold text-white text-2xl active:scale-95 transition-all ${
          disabled || value <= min 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-red-600 hover:bg-red-500 active:bg-red-700'
        }`}
      >
        −
      </button>

      {/* NUMBER - TAPPABLE */}
      <div className="relative">
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`w-20 h-12 text-center text-2xl font-bold font-mono rounded-lg border-2 ${
              isDark 
                ? 'bg-slate-900 border-blue-500 text-white' 
                : 'bg-white border-blue-500 text-slate-900'
            }`}
            style={{ appearance: 'none', MozAppearance: 'textfield' }}
          />
        ) : (
          <button
            onClick={handleNumberClick}
            disabled={disabled}
            className={`w-20 h-12 flex items-center justify-center text-2xl font-bold font-mono rounded-lg border-2 transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-600 text-white hover:border-slate-500' 
                : 'bg-white border-slate-300 text-slate-900 hover:border-slate-400'
            }`}
          >
            {value}
          </button>
        )}
      </div>

      {/* PLUS BUTTON - GREEN */}
      <button 
        onClick={inc} 
        disabled={disabled || value >= max}
        className={`min-w-[48px] min-h-[48px] flex items-center justify-center rounded-lg font-bold text-white text-2xl active:scale-95 transition-all ${
          disabled || value >= max 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
        }`}
      >
        +
      </button>
    </div>
  );
};
// --- UTILS: SMART PARSER ---
const cleanSku = (sku: string) => sku.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

const parsePOText = (text: string, inventory: StockItem[]) => {
  const lines = text.split('\n');
  let orderId = '';
  let orderDate = '';
  let supplier = '';
  const parsedItems: any[] = [];

  // Build Lookup Map (Clean SKU -> Item)
  const skuMap = new Map<string, StockItem>();
  // Also map Manufacturer -> First Item (to guess supplier)
  const supplierHintMap = new Map<string, string>(); 

  inventory.forEach(i => {
    if (i.sku) skuMap.set(cleanSku(i.sku), i);
    if (i.manufacturer) supplierHintMap.set(i.manufacturer.toLowerCase(), i.manufacturer);
  });

  // Regex Patterns
  // Date: Matches DD.MM.YYYY
  const dateRegex = /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/;
  
  // Order ID: Matches "Nr. 123" or "Bestellung 456" or "PO# 789"
  // Captures alphanumeric sequence of at least 3 chars
  const idRegex = /(?:Nr\.?|#|Bestellung|Order|Auftrag)\s*[:.]?\s*([A-Za-z0-9\-\/]{3,})/i;
  
  // Quantity: Matches "10x", "10 Stk", "10 pcs"
  const qtyRegex = /(\d+)\s*(?:x|stk|st|pcs|Pack)/i;

  lines.forEach(line => {
    // 1. Header Extraction
    if (!orderDate) {
      const d = line.match(dateRegex);
      if (d) {
         let year = d[3];
         if (year.length === 2) year = '20' + year;
         orderDate = `${year}-${d[2].padStart(2,'0')}-${d[1].padStart(2,'0')}`;
      }
    }
    if (!orderId) {
      const id = line.match(idRegex);
      if (id) orderId = id[1];
    }
    
    // Supplier Guessing (Naive: Check if known supplier name exists in line)
    if (!supplier) {
        for (const [key, val] of supplierHintMap.entries()) {
            if (line.toLowerCase().includes(key)) {
                supplier = val;
                break;
            }
        }
    }
    
    // 2. Item Extraction
    // Heuristic: Check if any word in the line matches a clean SKU
    // Tokenize by space and common delimiters
    const words = line.replace(/[^a-zA-Z0-9]/g, ' ').split(/\s+/);
    let foundItem: StockItem | undefined;
    
    for(const w of words) {
        if (w.length < 3) continue; // Skip short noise
        const clean = cleanSku(w);
        if (skuMap.has(clean)) {
            foundItem = skuMap.get(clean);
            break; // Found an item in this line
        }
    }

    if (foundItem) {
        // Try to find quantity in the SAME line
        let qty = 1;
        const q = line.match(qtyRegex);
        if (q) {
            qty = parseInt(q[1]);
        } else {
            // Fallback: Check if line starts with a number (e.g. "10   4000123   Item")
            const startNum = line.match(/^\s*(\d+)\s+/);
            if (startNum) qty = parseInt(startNum[1]);
        }
        
        parsedItems.push({
            sku: foundItem.sku,
            name: foundItem.name,
            quantity: qty,
            system: foundItem.system || 'Sonstiges',
            isAddedLater: false,
            isPersisted: true
        });
        
        // Secondary Supplier Guess: If we found an item, use its manufacturer if we still don't have a supplier
        if (!supplier && foundItem.manufacturer) {
            supplier = foundItem.manufacturer;
        }
    }
  });

  return {
      orderId: orderId,
      orderDate: orderDate || new Date().toISOString().split('T')[0],
      supplier: supplier || '',
      items: parsedItems
  };
};
// Supplier options for dropdown
const SUPPLIER_OPTIONS = [
  "Battery Kutter", 
  "Energy Solutions", 
  "Power Supply GmbH", 
  "Akku-Tech", 
  "Deutsche Batterie", 
  "Euro Power Systems",
  "Varta AG",
  "Bosch Automotive",
  "Continental",
  "Siemens Energy"
];
export const CreateOrderWizard: React.FC<CreateOrderWizardProps> = ({ 
  theme, 
  items, 
  onNavigate, 
  onCreateOrder,
  initialOrder,
  requireDeliveryDate,
  enableSmartImport = false
}) => {
  const isDark = theme === 'dark';
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // -- Data State --
  const [formData, setFormData] = useState<OrderFormData>({
    orderId: '',
    supplier: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    poType: null
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<string[]>(SUPPLIER_OPTIONS);

  // -- Initialize from Prop (Edit Mode) --
  useEffect(() => {
    if (initialOrder) {
        setFormData({
            orderId: initialOrder.id,
            supplier: initialOrder.supplier,
            orderDate: initialOrder.dateCreated,
            expectedDeliveryDate: initialOrder.expectedDeliveryDate || '',
            poType: initialOrder.status === 'Projekt' ? 'project' : 'normal'
        });
        setCart(initialOrder.items.map(i => {
            // Try to find original item to get System info, else fallback
            const original = items.find(x => x.sku === i.sku);
            return {
                sku: i.sku,
                name: i.name,
                quantity: i.quantityExpected,
                system: original ? original.system : 'Bestand',
                isDeleted: i.isDeleted,
                isAddedLater: i.isAddedLater,
                isPersisted: true // Mark as existing in DB
            };
        }));
    }
  }, [initialOrder, items]);

  // -- UI State: Dropdowns & Portals --
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // -- Smart Import State --
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  
  const [newItemData, setNewItemData] = useState({
    name: '',
    sku: '',
    system: ''
  });

  // Supplier Dropdown
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const supplierInputRef = useRef<HTMLDivElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const [supplierDropdownCoords, setSupplierDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  // Supplier Bottom Sheet (mobile-first)
  const [showSupplierSheet, setShowSupplierSheet] = useState(false);
  const [supplierSheetSearch, setSupplierSheetSearch] = useState('');
  const [showAddNewSupplier, setShowAddNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');

  // Search Dropdown
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [searchDropdownCoords, setSearchDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  // System Dropdown
  const [showSystemDropdown, setShowSystemDropdown] = useState(false);
  const systemInputRef = useRef<HTMLDivElement>(null);
  const systemDropdownRef = useRef<HTMLDivElement>(null);
  const [systemDropdownCoords, setSystemDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  // -- Event Listeners for Portals --
  useEffect(() => {
    if (!showSystemDropdown && !showSearchDropdown && !showSupplierDropdown) return;
    
    const handleScroll = (e: Event) => {
        if (showSystemDropdown && systemDropdownRef.current && !systemDropdownRef.current.contains(e.target as Node)) setShowSystemDropdown(false);
        if (showSearchDropdown && searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) setShowSearchDropdown(false);
        if (showSupplierDropdown && supplierDropdownRef.current && !supplierDropdownRef.current.contains(e.target as Node)) setShowSupplierDropdown(false);
    };

    const handleResize = () => {
        setShowSystemDropdown(false); 
        setShowSupplierDropdown(false);
        if (showSearchDropdown && searchInputRef.current) {
             const rect = searchInputRef.current.getBoundingClientRect();
             setSearchDropdownCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
             });
        }
    };
    
    window.addEventListener('scroll', handleScroll, true); 
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [showSystemDropdown, showSearchDropdown, showSupplierDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showSystemDropdown && !systemInputRef.current?.contains(target) && !systemDropdownRef.current?.contains(target)) setShowSystemDropdown(false);
      if (showSearchDropdown && !searchInputRef.current?.contains(target) && !searchDropdownRef.current?.contains(target)) setShowSearchDropdown(false);
      if (showSupplierDropdown && !supplierInputRef.current?.contains(target) && !supplierDropdownRef.current?.contains(target)) setShowSupplierDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSystemDropdown, showSearchDropdown, showSupplierDropdown]);

  // -- Computed Helpers --
  const suppliers = useMemo(() => {
    const unique = new Set<string>();
    items.forEach(item => { if (item.manufacturer) unique.add(item.manufacturer); });
    return Array.from(unique).sort();
  }, [items]);

  const filteredSuppliers = useMemo(() => {
    if (!formData.supplier) return suppliers;
    return suppliers.filter(s => s.toLowerCase().includes(formData.supplier.toLowerCase()));
  }, [suppliers, formData.supplier]);

  const sheetFilteredSuppliers = useMemo(() => {
    if (!supplierSheetSearch) return supplierOptions;
    return supplierOptions.filter(s => s.toLowerCase().includes(supplierSheetSearch.toLowerCase()));
  }, [supplierOptions, supplierSheetSearch]);

  const systems = useMemo(() => {
    const unique = new Set<string>();
    items.forEach(item => { if (item.system) unique.add(item.system); });
    return Array.from(unique).sort();
  }, [items]);

  const filteredSystems = useMemo(() => {
    if (!newItemData.system) return systems;
    return systems.filter(s => s.toLowerCase().includes(newItemData.system.toLowerCase()));
  }, [systems, newItemData.system]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return items.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50); 
  }, [searchTerm, items]);

  const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const updateSupplierDropdownPosition = () => {
    if (supplierInputRef.current) {
      const rect = supplierInputRef.current.getBoundingClientRect();
      setSupplierDropdownCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowSupplierDropdown(true);
    }
  };

  const updateSearchDropdownPosition = () => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setSearchDropdownCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowSearchDropdown(true);
    }
  };

  const updateSystemDropdownPosition = () => {
    if (systemInputRef.current) {
      const rect = systemInputRef.current.getBoundingClientRect();
      setSystemDropdownCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      setShowSystemDropdown(true);
    }
  };

  // -- Handlers --
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val) updateSearchDropdownPosition(); else setShowSearchDropdown(false);
  };

  const addToCart = (item: StockItem) => {
    const isEditMode = !!initialOrder;
    const existingIndex = cart.findIndex(c => c.sku === item.sku);
    if (existingIndex >= 0) {
        if (cart[existingIndex].isDeleted) {
            reactivateCartItem(existingIndex);
        } else {
            alert("Artikel befindet sich bereits in der Liste.");
        }
    } else {
        setCart(prev => [...prev, {
            sku: item.sku,
            name: item.name,
            system: item.system,
            quantity: 1,
            isAddedLater: isEditMode,
            isPersisted: false
        }]);
    }
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  const handleCreateNewItem = () => {
      if (!newItemData.name || !newItemData.sku) return;
      const isEditMode = !!initialOrder;
      setCart(prev => [...prev, {
          sku: newItemData.sku,
          name: newItemData.name,
          system: newItemData.system || 'Sonstiges',
          quantity: 1,
          isAddedLater: isEditMode,
          isPersisted: false
      }]);
      setIsCreatingNew(false);
      setNewItemData({ name: '', sku: '', system: '' });
  };

  const updateCartQty = (idx: number, qty: number) => {
      setCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
  };

  const removeCartItem = (idx: number) => {
      const item = cart[idx];
      if (item.isPersisted) {
          setCart(prev => prev.map((it, i) => i === idx ? { ...it, isDeleted: true } : it));
      } else {
          setCart(prev => prev.filter((_, i) => i !== idx));
      }
  };

  const reactivateCartItem = (idx: number) => {
      setCart(prev => prev.map((it, i) => i === idx ? { ...it, isDeleted: false } : it));
  };

  // --- PARSE HANDLER ---
  const handleParseImport = () => {
      const result = parsePOText(importText, items);
      
      // Update State
      setFormData(prev => ({
          ...prev,
          orderId: result.orderId || prev.orderId,
          orderDate: result.orderDate || prev.orderDate,
          supplier: result.supplier || prev.supplier
      }));
      
      if (result.items.length > 0) {
          setCart(result.items);
          alert(`${result.items.length} Positionen erkannt und importiert.`);
      } else {
          alert("Keine bekannten Artikel im Text gefunden.");
      }
      
      setShowImportModal(false);
      setImportText('');
  };

  const handleSubmit = async () => {
      setSubmissionStatus('submitting');
      try {
          await new Promise(resolve => setTimeout(resolve, 600));
          const newOrder: PurchaseOrder = {
              id: formData.orderId,
              supplier: formData.supplier,
              dateCreated: formData.orderDate,
              expectedDeliveryDate: formData.expectedDeliveryDate,
              status: formData.poType === 'project' ? 'Projekt' : 'Lager',
              isArchived: false,
              items: cart.map(c => {
                  const originalItem = initialOrder?.items.find(old => old.sku === c.sku);
                  return {
                      sku: c.sku,
                      name: c.name,
                      quantityExpected: c.quantity,
                      quantityReceived: originalItem ? originalItem.quantityReceived : 0,
                      isAddedLater: c.isAddedLater,
                      isDeleted: c.isDeleted
                  };
              })
          };
          onCreateOrder(newOrder);
          setSubmissionStatus('success');
      } catch (e) {
          console.error(e);
          setSubmissionStatus('error');
      }
  };

  const canGoNext = () => {
      if (step === 1) {
          const basicValid = formData.orderId && formData.supplier && formData.orderDate && formData.poType;
          if (!basicValid) return false;
          if (requireDeliveryDate && !formData.expectedDeliveryDate) return false;
          return true;
      }
      if (step === 2) {
          return cart.some(c => !c.isDeleted);
      }
      return false;
  };

  const inputClass = `w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ${
    isDark ? 'bg-slate-900 border-slate-700 text-slate-100 focus:ring-blue-500/30' : 'bg-white border-slate-200 text-[#313335] focus:ring-[#0077B5]/20'
  }`;

  return (
    <div className={`h-full flex flex-col overflow-hidden animate-in fade-in duration-200 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>

        {/* SUCCESS / ERROR OVERLAY */}
        {(submissionStatus === 'success' || submissionStatus === 'error') && createPortal(
            <div className="fixed inset-0 z-[100000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                {submissionStatus === 'success' && (
                    <div className={`rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={48} className="text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {initialOrder ? 'Bestellung aktualisiert' : 'Bestellung erfolgreich erstellt'}
                        </h2>
                        <p className={`mb-8 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Die Änderungen wurden gespeichert.
                        </p>
                        <div className="w-full space-y-3">
                             <button
                                onClick={() => alert("Mock PDF Download gestartet...")}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                             >
                                <Download size={18} /> PDF Herunterladen
                             </button>
                             <button
                               onClick={() => onNavigate('order-management')}
                               className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                             >
                               OK
                             </button>
                        </div>
                    </div>
                )}
            </div>,
            document.body
        )}

        {/* IMPORT MODAL */}
        {showImportModal && createPortal(
            <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowImportModal(false)} />
                <div className={`relative w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                    <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <h3 className={`font-bold text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <Sparkles size={18} className="text-[#0077B5]" /> Smart Import
                        </h3>
                        <button onClick={() => setShowImportModal(false)} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className={`p-3 rounded-xl border flex gap-2 ${isDark ? 'bg-blue-900/10 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                            <Info size={16} className="shrink-0 mt-0.5" />
                            <p className="text-xs leading-relaxed">
                                Text aus PDF/E-Mail einfügen. Wir erkennen automatisch <strong>Datum</strong>, <strong>Bestellnummer</strong> und <strong>Positionen</strong>.
                            </p>
                        </div>
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Text hier einfügen..."
                            className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[200px] resize-none font-mono text-sm transition-all ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            autoFocus
                        />
                    </div>
                    <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <button
                            onClick={() => setShowImportModal(false)}
                            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={handleParseImport}
                            disabled={!importText.trim()}
                            className="px-4 py-2.5 bg-[#0077B5] hover:bg-[#00A0DC] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                        >
                            <Sparkles size={16} /> Übernehmen
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* SUPPLIER BOTTOM SHEET */}
        {showSupplierSheet && createPortal(
            <div className="fixed inset-0 z-[100000]">
                <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => { setShowSupplierSheet(false); setSupplierSheetSearch(''); setShowAddNewSupplier(false); }}
                />
                <div className={`absolute bottom-0 left-0 right-0 rounded-t-3xl max-h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    {/* Handle bar */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                    </div>
                    {/* Title */}
                    <div className="px-5 pb-3">
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Lieferant wählen</h3>
                    </div>
                    {/* Search */}
                    <div className="px-5 pb-3">
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <Search size={16} className="opacity-50 shrink-0" />
                            <input
                                type="text"
                                value={supplierSheetSearch}
                                onChange={(e) => setSupplierSheetSearch(e.target.value)}
                                placeholder="Suchen..."
                                className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}
                                autoFocus
                            />
                        </div>
                    </div>
                    {/* Options list */}
                    <div className="flex-1 overflow-y-auto">
                        {sheetFilteredSuppliers.length > 0 ? (
                            sheetFilteredSuppliers.map((opt, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        setFormData({...formData, supplier: opt});
                                        setShowSupplierSheet(false);
                                        setSupplierSheetSearch('');
                                    }}
                                    className={`w-full px-5 py-3.5 text-left text-sm transition-colors flex items-center justify-between border-b ${
                                        formData.supplier === opt
                                            ? isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' : 'bg-blue-50 text-blue-600 border-blue-50'
                                            : isDark ? 'hover:bg-slate-800 border-slate-800/50' : 'hover:bg-slate-50 border-slate-100'
                                    }`}
                                >
                                    <span className="font-medium">{opt}</span>
                                    {formData.supplier === opt && <CheckCircle2 size={18} className="text-blue-500" />}
                                </button>
                            ))
                        ) : (
                            <div className="p-6 text-center text-sm opacity-50">Keine Ergebnisse</div>
                        )}
                    </div>
                    {/* Add New Supplier */}
                    <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        {!showAddNewSupplier ? (
                            <button
                                type="button"
                                onClick={() => setShowAddNewSupplier(true)}
                                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-blue-400' : 'bg-slate-100 hover:bg-slate-200 text-blue-600'
                                }`}
                            >
                                <Plus size={16} /> Neuer Lieferant
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSupplierName}
                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newSupplierName.trim()) {
                                            setSupplierOptions(prev => [...prev, newSupplierName.trim()]);
                                            setFormData({...formData, supplier: newSupplierName.trim()});
                                            setNewSupplierName('');
                                            setShowAddNewSupplier(false);
                                            setShowSupplierSheet(false);
                                            setSupplierSheetSearch('');
                                        }
                                    }}
                                    placeholder="Neuer Lieferant..."
                                    className={`flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (newSupplierName.trim()) {
                                            setSupplierOptions(prev => [...prev, newSupplierName.trim()]);
                                            setFormData({...formData, supplier: newSupplierName.trim()});
                                            setNewSupplierName('');
                                            setShowAddNewSupplier(false);
                                            setShowSupplierSheet(false);
                                            setSupplierSheetSearch('');
                                        }
                                    }}
                                    disabled={!newSupplierName.trim()}
                                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                                >
                                    <CheckCircle2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* ===== FIXED HEADER: Back Arrow + Step Indicator + Close ===== */}
        <div className={`shrink-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            {/* Navigation row */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                {/* Left: Back arrow (visible on step > 1) */}
                {step > 1 ? (
                    <button
                        onClick={() => setStep(prev => prev - 1 as any)}
                        className={`p-2 -ml-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                    >
                        <ArrowLeft size={22} />
                    </button>
                ) : (
                    <div className="w-10" />
                )}

                {/* Center: Step indicator dots */}
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map(s => (
                        <React.Fragment key={s}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                step >= s
                                    ? 'bg-[#0077B5] text-white'
                                    : isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400'
                            }`}>
                                {s}
                            </div>
                            {s < 3 && <div className={`w-6 h-0.5 rounded ${step > s ? 'bg-[#0077B5]' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Right: Close */}
                <button
                    onClick={() => onNavigate('dashboard')}
                    className={`p-2 -mr-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Warning banners (sticky in header) */}
            {formData.poType && (
                <div className="px-4 pb-2">
                    {formData.poType === 'normal' && (
                        <div className={`rounded-lg px-3 py-2 flex gap-2 items-start animate-in fade-in duration-200 ${isDark ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <p className="text-xs leading-relaxed">
                                <strong>Lager:</strong> Ware wird direkt dem Bestand hinzugefügt.
                            </p>
                        </div>
                    )}
                    {formData.poType === 'project' && (
                        <div className={`rounded-lg px-3 py-2 flex gap-2 items-start animate-in fade-in duration-200 ${isDark ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
                            <Info size={14} className="shrink-0 mt-0.5" />
                            <p className="text-xs leading-relaxed">
                                <strong>Projekt:</strong> Ware reserviert — Technik wird benachrichtigt.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* ===== CONTENT AREA ===== */}
        <div className="flex-1 overflow-hidden relative">

            {/* ── STEP 1: Compact fields, NO scroll ── */}
            {step === 1 && (
                <div className="h-full flex flex-col px-4 pt-2 pb-24 overflow-hidden animate-in fade-in duration-200">
                    {/* Section header */}
                    <div className="shrink-0 mb-3 flex items-center justify-between">
                        <div>
                            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {initialOrder ? 'Bestellung bearbeiten' : 'Kopfdaten'}
                            </h3>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Basisdaten der Bestellung.</p>
                        </div>
                        {enableSmartImport && !initialOrder && (
                            <button
                                onClick={() => setShowImportModal(true)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                    isDark
                                    ? 'text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
                                    : 'text-slate-500 border-slate-300 hover:text-slate-800 hover:border-slate-400'
                                }`}
                            >
                                <FileText size={12} /> Import
                            </button>
                        )}
                    </div>

                    {/* Compact form fields */}
                    <div className="space-y-3">
                        {/* PO Type selector */}
                        <div>
                            <label className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Art <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setFormData({...formData, poType: 'normal'})} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 ${formData.poType === 'normal' ? 'bg-[#0077B5] border-[#0077B5] text-white shadow-sm shadow-blue-500/20' : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                    <Box size={14} /> Lager
                                </button>
                                <button onClick={() => setFormData({...formData, poType: 'project'})} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 ${formData.poType === 'project' ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20' : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                    <Briefcase size={14} /> Projekt
                                </button>
                            </div>
                        </div>

                        {/* Order Number */}
                        <div>
                            <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bestell Nr. <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={14} />
                                <input value={formData.orderId} onChange={e => setFormData({...formData, orderId: e.target.value})} className={`${inputClass} pl-9 py-2`} placeholder="PO-202X-..." disabled={!!initialOrder} />
                            </div>
                        </div>

                        {/* Supplier — opens bottom sheet */}
                        <div>
                            <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lieferant <span className="text-red-500">*</span></label>
                            <button
                                type="button"
                                onClick={() => setShowSupplierSheet(true)}
                                className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between text-sm transition-all ${
                                    isDark
                                        ? 'bg-slate-900 border-slate-700 text-white hover:border-slate-600'
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <span className={formData.supplier ? '' : 'opacity-40'}>{formData.supplier || 'Lieferant wählen...'}</span>
                                <ChevronDown size={16} className="opacity-40" />
                            </button>
                        </div>

                        {/* Date fields row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Datum <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" size={14} />
                                    <input
                                        type="date"
                                        value={formData.orderDate}
                                        onChange={e => setFormData({...formData, orderDate: e.target.value})}
                                        className={`${inputClass} pl-9 py-2`}
                                        style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Liefertermin {requireDeliveryDate ? <span className="text-red-500">*</span> : <span className="opacity-50 font-normal normal-case">(Opt.)</span>}
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" size={14} />
                                    <input
                                        type="date"
                                        value={formData.expectedDeliveryDate}
                                        onChange={e => setFormData({...formData, expectedDeliveryDate: e.target.value})}
                                        className={`${inputClass} pl-9 py-2`}
                                        required={requireDeliveryDate}
                                        style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Items — only cards scroll ── */}
            {step === 2 && (
                <div className="h-full flex flex-col px-4 pt-2 pb-24 animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="shrink-0 mb-3 flex justify-between items-end">
                        <div>
                            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Artikel hinzufügen</h3>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Positionen zur Bestellung.</p>
                        </div>
                        <button
                            onClick={() => setIsCreatingNew(!isCreatingNew)}
                            className="text-xs text-[#0077B5] font-bold hover:underline flex items-center gap-1"
                        >
                            <Plus size={14} /> {isCreatingNew ? 'Suche' : 'Neu'}
                        </button>
                    </div>

                    {/* Search / Create area (sticky) */}
                    <div className="shrink-0 mb-3 relative z-[50]">
                        {isCreatingNew ? (
                            <div className={`p-4 rounded-xl border space-y-3 animate-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <input value={newItemData.name} onChange={e => setNewItemData({...newItemData, name: e.target.value})} placeholder="Artikelbezeichnung" className={inputClass} autoFocus />
                                <div className="grid grid-cols-2 gap-3">
                                    <input value={newItemData.sku} onChange={e => setNewItemData({...newItemData, sku: e.target.value})} placeholder="SKU" className={inputClass} />
                                    <div className="relative" ref={systemInputRef}>
                                        <input value={newItemData.system} onChange={e => { setNewItemData({...newItemData, system: e.target.value}); updateSystemDropdownPosition(); }} onFocus={updateSystemDropdownPosition} placeholder="System" className={`${inputClass} pr-8`} />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" size={14} />
                                        {showSystemDropdown && filteredSystems.length > 0 && createPortal(
                                            <div ref={systemDropdownRef} style={{ position: 'absolute', top: systemDropdownCoords.top + 4, left: systemDropdownCoords.left, width: systemDropdownCoords.width, zIndex: 9999 }} className={`max-h-40 overflow-y-auto rounded-xl border shadow-xl animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                                {filteredSystems.map(sys => (<button key={sys} onClick={() => { setNewItemData({...newItemData, system: sys}); setShowSystemDropdown(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-all ${isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'}`}><span>{sys}</span></button>))}
                                            </div>, document.body
                                        )}
                                    </div>
                                </div>
                                <button onClick={handleCreateNewItem} disabled={!newItemData.name || !newItemData.sku} className="w-full py-2.5 bg-[#0077B5] text-white rounded-xl font-bold text-sm hover:bg-[#00A0DC] disabled:opacity-50 transition-colors">Erstellen & hinzufügen</button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input ref={searchInputRef} value={searchTerm} onChange={e => handleSearchChange(e.target.value)} onFocus={() => { if(searchTerm) updateSearchDropdownPosition(); }} placeholder="Artikel suchen..." className={`${inputClass} pl-10 py-2.5`} autoFocus />
                                {showSearchDropdown && searchResults.length > 0 && createPortal(
                                    <div ref={searchDropdownRef} style={{ position: 'absolute', top: searchDropdownCoords.top + 8, left: searchDropdownCoords.left, width: searchDropdownCoords.width, zIndex: 9999, maxHeight: '300px' }} className={`rounded-xl border shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'bg-[#1e293b] border-slate-600' : 'bg-white border-slate-300'}`}>
                                        {searchResults.map(item => (
                                            <button key={item.id} onClick={() => addToCart(item)} className={`w-full text-left p-3 flex justify-between items-center border-b last:border-0 transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-200' : 'border-slate-100 hover:bg-slate-50 text-slate-800'}`}>
                                                <div>
                                                    <div className="font-bold text-sm">{item.name}</div>
                                                    <div className="text-xs opacity-60 mt-0.5">#{item.sku} · {item.system}</div>
                                                </div>
                                                <div className="bg-[#0077B5]/10 p-1.5 rounded-full"><Plus size={16} className="text-[#0077B5]" /></div>
                                            </button>
                                        ))}
                                    </div>, document.body
                                )}
                            </div>
                        )}
                    </div>

                    {/* Scrollable product cards */}
                    <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-2 relative z-0">
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 sticky top-0 py-1 ${isDark ? 'text-slate-500 bg-slate-900' : 'text-slate-400 bg-white'}`}>
                            Positionen ({cart.filter(c => !c.isDeleted).length})
                        </h4>
                        {cart.length === 0 ? (
                            <div className={`p-6 border rounded-xl border-dashed text-center text-sm ${isDark ? 'text-slate-500 border-slate-700' : 'text-slate-400 border-slate-300'}`}>Keine Artikel ausgewählt.</div>
                        ) : (
                            <div className="space-y-2">
                                {cart.map((line, idx) => {
                                    const isDeleted = line.isDeleted;
                                    const isAdded = line.isAddedLater && !line.isDeleted;
                                    return (
                                        <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                            isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'
                                        } ${isDeleted ? 'opacity-50' : ''} ${isAdded ? 'border-blue-500/20' : ''}`}>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-bold text-sm truncate flex items-center gap-1.5 ${isDeleted ? 'line-through text-slate-500' : isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                                    {line.name}
                                                    {isAdded && <span className="px-1 py-0.5 rounded text-[9px] bg-blue-500 text-white font-bold shrink-0">NEU</span>}
                                                    {isDeleted && <span className="px-1 py-0.5 rounded text-[9px] bg-red-500/20 text-red-500 font-bold shrink-0">STORNO</span>}
                                                </div>
                                                <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>#{line.sku} · {line.system}</div>
                                            </div>
                                            <PlusMinusPicker
                                                value={line.quantity}
                                                onChange={(val) => updateCartQty(idx, val)}
                                                min={1} max={9999}
                                                disabled={isDeleted}
                                                isDark={isDark}
                                            />
                                            {isDeleted ? (
                                                <button onClick={() => reactivateCartItem(idx)} className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg transition-colors" title="Wiederherstellen"><Undo2 size={16} /></button>
                                            ) : (
                                                <button onClick={() => removeCartItem(idx)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="Löschen"><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── STEP 3: Summary — only cards scroll ── */}
            {step === 3 && (
                <div className="h-full flex flex-col px-4 pt-2 pb-24 animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="shrink-0 mb-3">
                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Zusammenfassung</h3>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Überprüfen Sie die Bestellung.</p>
                    </div>

                    {/* Summary card (sticky) */}
                    <div className={`shrink-0 p-4 rounded-xl border mb-3 ${isDark ? 'bg-[#1f2937] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Bestell Nr.</div>
                                <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formData.orderId}</div>
                            </div>
                            <div>
                                <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Datum</div>
                                <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(formData.orderDate)}</div>
                            </div>
                            <div>
                                <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Typ</div>
                                <div className={`font-bold text-sm flex items-center gap-1 ${formData.poType === 'project' ? 'text-blue-500' : (isDark ? 'text-white' : 'text-gray-900')}`}>
                                    {formData.poType === 'project' ? <Briefcase size={12} /> : <Box size={12}/>}
                                    {formData.poType === 'project' ? 'Projekt' : 'Lager'}
                                </div>
                            </div>
                            <div>
                                <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Lieferant</div>
                                <div className={`font-bold text-sm flex items-center gap-1 ${isDark ? 'text-white' : 'text-gray-900'}`}><Truck size={12}/> {formData.supplier}</div>
                            </div>
                            {formData.expectedDeliveryDate && (
                                <div className="col-span-2 pt-2 border-t border-slate-500/10">
                                    <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Liefertermin</div>
                                    <div className={`font-bold text-sm flex items-center gap-1 ${isDark ? 'text-white' : 'text-gray-900'}`}><Clock size={12} className="text-[#0077B5]"/> {formatDate(formData.expectedDeliveryDate)}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scrollable position cards */}
                    <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-2">
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 sticky top-0 py-1 ${isDark ? 'text-slate-500 bg-slate-900' : 'text-slate-400 bg-white'}`}>
                            Positionen ({cart.filter(c => !c.isDeleted).length})
                        </h4>
                        <div className="space-y-2">
                            {cart.map((line, idx) => (
                                <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 ${
                                    isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200'
                                } ${line.isDeleted ? 'opacity-50' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-bold text-sm truncate flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'} ${line.isDeleted ? 'line-through text-slate-500' : ''}`}>
                                            {line.name}
                                            {line.isAddedLater && !line.isDeleted && <span className="px-1 py-0.5 rounded text-[9px] bg-blue-500 text-white font-bold shrink-0">NEU</span>}
                                            {line.isDeleted && <span className="px-1 py-0.5 rounded text-[9px] bg-red-500 text-white font-bold shrink-0">STORNO</span>}
                                        </div>
                                        <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>#{line.sku} · {line.system}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Menge</span>
                                        <span className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'} ${line.isDeleted ? 'line-through opacity-50' : ''}`}>
                                            {line.quantity}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* ===== FIXED BOTTOM-RIGHT BUTTON (always visible) ===== */}
        <div className="fixed bottom-6 right-6 z-[1000]">
            {step < 3 ? (
                <button
                    onClick={() => setStep(prev => prev + 1 as any)}
                    disabled={!canGoNext()}
                    className="px-6 py-3 bg-[#0077B5] hover:bg-[#00A0DC] text-white rounded-2xl font-bold shadow-xl shadow-blue-500/25 disabled:opacity-40 disabled:shadow-none flex items-center gap-2 transition-all active:scale-95 text-sm"
                >
                    Weiter <ArrowRight size={18} />
                </button>
            ) : (
                <button
                    onClick={handleSubmit}
                    disabled={submissionStatus === 'submitting'}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/25 disabled:opacity-40 flex items-center gap-2 transition-all active:scale-95 text-sm"
                >
                    {submissionStatus === 'submitting' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    Speichern
                </button>
            )}
        </div>
    </div>
  );
};
