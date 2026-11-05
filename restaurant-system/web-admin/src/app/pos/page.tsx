'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { socket } from '@/lib/socket';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  DollarSign,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
  ChefHat,
  Search,
  CheckCircle,
  X,
  LogOut,
  Clock,
  ShieldAlert,
  Archive,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantName?: string;
  addons: Array<{ addonId: string; name: string; price: number }>;
  notes?: string;
}

export default function POSPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Modals state
  const [activeItemModal, setActiveItemModal] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  
  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BKASH' | 'SPLIT'>('CASH');
  const [paidCashAmount, setPaidCashAmount] = useState<number>(0);
  const [splitCardAmount, setSplitCardAmount] = useState<number>(0);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Cash Register Drawer Session Modal state
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [closingCashActual, setClosingCashActual] = useState(0);

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('branchId') || '' : '';

  // Load Categories & Menu Items
  const { data: menuData } = useQuery({
    queryKey: ['pos-menu', branchId],
    queryFn: async () => {
      const res = await api.get('/menu/categories');
      return res.data.data;
    },
  });

  // Load Tables for Dine-In
  const { data: tables = [] } = useQuery({
    queryKey: ['pos-tables', branchId],
    queryFn: async () => {
      const res = await api.get('/tables');
      return res.data.data;
    },
    enabled: orderType === 'DINE_IN',
  });

  // Load Active Cash Drawer Session
  const { data: activeDrawer, refetch: refetchDrawer } = useQuery({
    queryKey: ['pos-drawer-session', branchId],
    queryFn: async () => {
      try {
        const res = await api.get('/cash-register/current');
        return res.data.data;
      } catch (e) {
        return null;
      }
    },
  });

  // Open Drawer Mutation
  const openDrawerMutation = useMutation({
    mutationFn: async (openingBalance: number) => {
      await api.post('/cash-register/open', { openingBalance, branchId });
    },
    onSuccess: () => {
      refetchDrawer();
      setShowDrawerModal(false);
    },
  });

  // Close Drawer Mutation
  const closeDrawerMutation = useMutation({
    mutationFn: async (actualCash: number) => {
      await api.post('/cash-register/close', { closingCashActual: actualCash });
    },
    onSuccess: () => {
      refetchDrawer();
      setShowDrawerModal(false);
      alert('Cash register session closed and reconciled successfully!');
    },
  });

  // Calculate Cart Subtotals
  const subtotal = cart.reduce((acc, item) => {
    const addonsTotal = item.addons.reduce((a, ad) => a + Number(ad.price), 0);
    return acc + (Number(item.price) + addonsTotal) * item.quantity;
  }, 0);

  const tax = subtotal * 0.05; // 5% VAT
  const total = Math.max(0, subtotal + tax - discountAmount);

  // Validate coupon
  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.post('/coupons/validate', { code: couponCode, orderAmount: subtotal });
      setDiscountAmount(Number(res.data.data.discountValue));
      alert(`Coupon applied: ৳${res.data.data.discountValue} OFF`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invalid coupon code');
    }
  };

  // Add Item to Cart (from Modal or direct)
  const addItemToCart = () => {
    if (!activeItemModal) return;
    const basePrice = selectedVariant ? Number(selectedVariant.price) : Number(activeItemModal.price);

    const newItem: CartItem = {
      menuItemId: activeItemModal.id,
      name: activeItemModal.name,
      price: basePrice,
      quantity: 1,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      addons: selectedAddons.map((a) => ({ addonId: a.id, name: a.name, price: Number(a.price) })),
      notes: itemNotes,
    };

    setCart([...cart, newItem]);
    setActiveItemModal(null);
    setSelectedVariant(null);
    setSelectedAddons([]);
    setItemNotes('');
  };

  const updateCartQty = (idx: number, delta: number) => {
    const updated = [...cart];
    updated[idx].quantity += delta;
    if (updated[idx].quantity <= 0) {
      updated.splice(idx, 1);
    }
    setCart(updated);
  };

  const removeFromCart = (idx: number) => {
    const updated = [...cart];
    updated.splice(idx, 1);
    setCart(updated);
  };

  // Order & Payment Processing
  const processCheckout = useMutation({
    mutationFn: async () => {
      // 1. Create Order
      const payload: any = {
        branchId,
        orderType,
        tableId: orderType === 'DINE_IN' ? selectedTableId : undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          variantId: c.variantId,
          quantity: c.quantity,
          notes: c.notes,
          addons: c.addons.map((a) => a.addonId),
        })),
        couponCode: couponCode || undefined,
      };

      const orderRes = await api.post('/orders', payload);
      const createdOrder = orderRes.data.data;

      // 2. Process Payment
      if (paymentMethod === 'SPLIT') {
        await api.post(`/payments/${createdOrder.id}/split`, {
          payments: [
            { paymentMethod: 'CASH', amount: paidCashAmount },
            { paymentMethod: 'CARD', amount: splitCardAmount },
          ],
        });
      } else {
        await api.post(`/payments/${createdOrder.id}`, {
          paymentMethod,
          amount: total,
          tenderedAmount: paymentMethod === 'CASH' ? paidCashAmount : total,
        });
      }

      return createdOrder;
    },
    onSuccess: (order) => {
      setLastPlacedOrder(order);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      setCart([]);
      setDiscountAmount(0);
      setCouponCode('');
      queryClient.invalidateQueries({ queryKey: ['pos-tables'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to complete transaction');
    },
  });

  // Filter items
  const allItems = menuData
    ? menuData.flatMap((cat: any) => cat.menuItems.map((item: any) => ({ ...item, categoryId: cat.id })))
    : [];

  const filteredItems = allItems.filter((item: any) => {
    const matchesCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery && item.isAvailable;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans select-none">
      {/* POS Topbar */}
      <header className="bg-white border-b px-4 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-indigo-700 font-black text-xl tracking-tight">
            <span className="p-1.5 bg-indigo-600 text-white rounded-lg">POS</span>
            <span>SPICE GARDEN EXPRESS</span>
          </div>

          {/* Drawer Status Pill */}
          <button
            onClick={() => setShowDrawerModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              activeDrawer
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}
          >
            <Banknote className="w-4 h-4" />
            {activeDrawer
              ? `Drawer Open (Starting: ৳${Number(activeDrawer.openingBalance).toFixed(2)})`
              : 'Drawer Closed (Click to Open)'}
          </button>
        </div>

        {/* Order Type Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setOrderType(type);
                if (type !== 'DINE_IN') setSelectedTableId('');
              }}
              className={`px-4 py-1 rounded-md text-xs font-bold transition ${
                orderType === type ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          <Link
            href="/kitchen"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-black transition"
          >
            <ChefHat className="w-4 h-4 text-amber-400" /> KDS Screen
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            <LogOut className="w-4 h-4" /> Exit POS
          </Link>
        </div>
      </header>

      {/* Main Workspace: Left Catalog, Right Order Cart */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Catalog & Filter */}
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
          {/* Top Bar: Table Select + Search */}
          <div className="flex items-center gap-3">
            {orderType === 'DINE_IN' && (
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold bg-white text-indigo-900 focus:outline-none focus:border-indigo-600"
              >
                <option value="">-- Choose Dine-in Table --</option>
                {tables.map((t: any) => (
                  <option key={t.id} value={t.id} disabled={t.status === 'OCCUPIED'}>
                    Table {t.tableNumber} ({t.capacity} Pax) - {t.status}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search food, drinks, desserts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              All Items
            </button>
            {menuData?.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Fast Item Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item: any) => {
              const hasVariants = item.variants && item.variants.length > 0;
              const hasAddons = item.addonGroups && item.addonGroups.length > 0;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (hasVariants || hasAddons) {
                      setActiveItemModal(item);
                      setSelectedVariant(item.variants?.[0] || null);
                      setSelectedAddons([]);
                      setItemNotes('');
                    } else {
                      // Add directly
                      setCart([
                        ...cart,
                        {
                          menuItemId: item.id,
                          name: item.name,
                          price: Number(item.price),
                          quantity: 1,
                          addons: [],
                        },
                      ]);
                    }
                  }}
                  className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between active:scale-[0.98]"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-base font-black text-indigo-700">
                      ৳{Number(item.price).toFixed(2)}
                    </span>
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                      <Plus className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE: Cart & Checkout Ledger */}
        <div className="w-96 bg-white border-l flex flex-col shadow-lg">
          <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-gray-900 text-base">Current Bill</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {cart.reduce((a, b) => a + b.quantity, 0)} Items
            </span>
          </div>

          {/* Cart Item Stream */}
          <div className="flex-1 p-4 overflow-y-auto divide-y divide-gray-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                <ShoppingCart className="w-12 h-12 text-gray-200 mb-2" />
                <span>Cart is empty</span>
                <span className="text-xs text-gray-400">Click menu items to add</span>
              </div>
            ) : (
              cart.map((item, idx) => {
                const addonsCost = item.addons.reduce((sum, a) => sum + Number(a.price), 0);
                const lineTotal = (Number(item.price) + addonsCost) * item.quantity;

                return (
                  <div key={idx} className="py-3 flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-sm text-gray-900">{item.name}</div>
                      {item.variantName && (
                        <div className="text-xs text-indigo-600 font-medium">• {item.variantName}</div>
                      )}
                      {item.addons.map((a, i) => (
                        <div key={i} className="text-xs text-gray-500">
                          + {a.name} (৳{Number(a.price)})
                        </div>
                      ))}
                      {item.notes && (
                        <div className="text-xs text-amber-600 italic bg-amber-50 px-1 rounded mt-0.5">
                          Note: {item.notes}
                        </div>
                      )}
                      <div className="font-bold text-sm text-gray-900 mt-1">৳{lineTotal.toFixed(2)}</div>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => updateCartQty(idx, -1)}
                        className="p-1 rounded bg-white hover:bg-gray-200 text-gray-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black px-2">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(idx, 1)}
                        className="p-1 rounded bg-white hover:bg-gray-200 text-gray-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pricing Ledger & Actions */}
          <div className="p-4 border-t bg-gray-50/50 space-y-3">
            {/* Promo Code Entry */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Discount Coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 border rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase bg-white focus:outline-none"
              />
              <button
                onClick={applyCoupon}
                className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-black"
              >
                Apply
              </button>
            </div>

            {/* Subtotals */}
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (5%)</span>
                <span>৳{tax.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Discount</span>
                  <span>-৳{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t">
                <span>Total Payable</span>
                <span className="text-indigo-600">৳{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Charge Button */}
            <button
              disabled={cart.length === 0 || (orderType === 'DINE_IN' && !selectedTableId)}
              onClick={() => {
                setPaidCashAmount(total);
                setShowPaymentModal(true);
              }}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-sm tracking-wide uppercase hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition flex items-center justify-center gap-2"
            >
              <span>PAY & PLACE ORDER (৳{total.toFixed(2)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Variant & Addon Customizer */}
      {activeItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-gray-900">{activeItemModal.name}</h3>
                <p className="text-xs text-gray-500">{activeItemModal.description}</p>
              </div>
              <button onClick={() => setActiveItemModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Variants */}
            {activeItemModal.variants?.length > 0 && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Choose Variant</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {activeItemModal.variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                        selectedVariant?.id === v.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div>{v.name}</div>
                      <div className="text-gray-500">৳{Number(v.price).toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Addons */}
            {activeItemModal.addonGroups?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Custom Add-ons</label>
                {activeItemModal.addonGroups.map((grp: any) => (
                  <div key={grp.id} className="space-y-1">
                    <span className="text-[11px] font-semibold text-gray-400">{grp.name}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {grp.addons?.map((addon: any) => {
                        const isSelected = selectedAddons.some((a) => a.id === addon.id);
                        return (
                          <button
                            key={addon.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
                              } else {
                                setSelectedAddons([...selectedAddons, addon]);
                              }
                            }}
                            className={`p-2 rounded-lg border text-xs font-medium text-left flex justify-between transition ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <span>{addon.name}</span>
                            <span className="font-bold">+৳{Number(addon.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Item Special Instructions */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kitchen Notes</label>
              <input
                type="text"
                placeholder="e.g. Extra spicy, no onions..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 mt-1 text-xs"
              />
            </div>

            <button
              onClick={addItemToCart}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase hover:bg-indigo-700 shadow-md"
            >
              Add To Order
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Payment Settlement */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="text-lg font-black text-gray-900">Settle Payment (৳{total.toFixed(2)})</h3>
              <button onClick={() => setShowPaymentModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'BKASH', label: 'bKash / MFS', icon: Smartphone },
                { id: 'SPLIT', label: 'Split Pay', icon: Layers },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition ${
                      paymentMethod === m.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic tender input */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Tendered Cash Amount</label>
                  <input
                    type="number"
                    value={paidCashAmount}
                    onChange={(e) => setPaidCashAmount(Number(e.target.value))}
                    className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-xl font-black text-indigo-900 mt-1"
                  />
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>Change Due:</span>
                  <span className={paidCashAmount - total >= 0 ? 'text-green-600' : 'text-red-500'}>
                    ৳{Math.max(0, paidCashAmount - total).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'SPLIT' && (
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <label className="font-bold text-gray-600 uppercase">Cash Portion (৳)</label>
                  <input
                    type="number"
                    value={paidCashAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPaidCashAmount(val);
                      setSplitCardAmount(Math.max(0, total - val));
                    }}
                    className="w-full border rounded-lg px-2.5 py-1.5 font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 uppercase">Card Portion (৳)</label>
                  <input
                    type="number"
                    value={splitCardAmount}
                    onChange={(e) => setSplitCardAmount(Number(e.target.value))}
                    className="w-full border rounded-lg px-2.5 py-1.5 font-bold mt-1"
                  />
                </div>
              </div>
            )}

            <button
              disabled={processCheckout.isPending}
              onClick={() => processCheckout.mutate()}
              className="w-full py-3.5 bg-green-600 text-white rounded-xl font-black text-sm uppercase hover:bg-green-700 shadow-md transition"
            >
              {processCheckout.isPending ? 'Processing...' : 'Confirm & Complete'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: 80mm Thermal Receipt Preview & Print */}
      {showReceiptModal && lastPlacedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            {/* Printable 80mm Receipt Area */}
            <div id="receipt-print-area" className="border-2 border-dashed border-gray-300 p-4 text-center font-mono text-xs text-gray-900 bg-amber-50/20">
              <h2 className="text-base font-black tracking-widest uppercase">SPICE GARDEN</h2>
              <p className="text-[10px] text-gray-500">Dhaka, Bangladesh • Tel: +8801700000000</p>
              <div className="border-b border-dashed my-2"></div>
              <div className="flex justify-between text-[11px] font-bold">
                <span>ORDER #{lastPlacedOrder.orderNumber}</span>
                <span>{lastPlacedOrder.orderType}</span>
              </div>
              <div className="text-[10px] text-gray-500 text-left">
                Date: {new Date(lastPlacedOrder.createdAt).toLocaleString()}
              </div>
              <div className="border-b border-dashed my-2"></div>

              {/* Items */}
              <div className="space-y-1 text-left">
                {lastPlacedOrder.items?.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {it.quantity}x {it.menuItem?.name || 'Item'}
                    </span>
                    <span>৳{Number(it.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed my-2"></div>
              <div className="space-y-0.5 text-right font-bold">
                <div>Subtotal: ৳{Number(lastPlacedOrder.subtotal).toFixed(2)}</div>
                <div>VAT (5%): ৳{Number(lastPlacedOrder.taxAmount).toFixed(2)}</div>
                {Number(lastPlacedOrder.discountAmount) > 0 && (
                  <div>Discount: -৳{Number(lastPlacedOrder.discountAmount).toFixed(2)}</div>
                )}
                <div className="text-sm font-black pt-1">
                  TOTAL: ৳{Number(lastPlacedOrder.totalAmount).toFixed(2)}
                </div>
              </div>
              <div className="border-b border-dashed my-2"></div>
              <p className="text-[10px] text-gray-500">Thank you for dining with us!</p>
            </div>

            {/* Print & Close Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-indigo-700"
              >
                <Printer className="w-4 h-4" /> Print Thermal Receipt
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setLastPlacedOrder(null);
                }}
                className="px-4 py-2.5 border rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cash Drawer Register Session */}
      {showDrawerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="text-lg font-black text-gray-900">Cash Drawer Session</h3>
              <button onClick={() => setShowDrawerModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {!activeDrawer ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Open a new cash register shift session. Enter your opening float cash amount.
                </p>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">Opening Cash Float (৳)</label>
                  <input
                    type="number"
                    defaultValue={1000}
                    id="openingFloatInput"
                    className="w-full border-2 rounded-xl px-3 py-2 text-lg font-bold mt-1"
                  />
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('openingFloatInput') as HTMLInputElement;
                    openDrawerMutation.mutate(Number(el.value));
                  }}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-emerald-700"
                >
                  Start Register Shift
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-emerald-900">Shift In Progress</div>
                  <div className="text-emerald-700">
                    Opened at: {new Date(activeDrawer.openedAt).toLocaleTimeString()}
                  </div>
                  <div className="text-emerald-700">
                    Opening Float: ৳{Number(activeDrawer.openingBalance).toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Counted Physical Cash in Drawer (৳)
                  </label>
                  <input
                    type="number"
                    value={closingCashActual}
                    onChange={(e) => setClosingCashActual(Number(e.target.value))}
                    className="w-full border-2 rounded-xl px-3 py-2 text-lg font-bold mt-1"
                  />
                </div>

                <button
                  onClick={() => closeDrawerMutation.mutate(closingCashActual)}
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-red-700"
                >
                  Close & Reconcile Drawer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
