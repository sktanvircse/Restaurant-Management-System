'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useCart } from '@/context/CartContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, updateQty, removeItem, clearCart, subtotal, tableToken } = useCart();

  const [orderType, setOrderType] = useState<'DELIVERY' | 'TAKEAWAY' | 'DINE_IN'>(
    tableToken ? 'DINE_IN' : 'DELIVERY'
  );

  // Customer contact & address info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BKASH'>('CASH');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Fetch Delivery Zones
  const { data: zones = [] } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: async () => {
      const res = await api.get('/delivery/zones');
      return res.data.data;
    },
    enabled: orderType === 'DELIVERY',
  });

  // Calculate fees
  const selectedZone = zones.find((z: any) => z.id === selectedZoneId);
  const deliveryFee = orderType === 'DELIVERY' ? Number(selectedZone?.deliveryFee || 60) : 0;
  const tax = subtotal * 0.05;
  const grandTotal = Math.max(0, subtotal + tax + deliveryFee - discountAmount);

  // Validate coupon
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.post('/coupons/validate', { code: couponCode, orderAmount: subtotal });
      setDiscountAmount(Number(res.data.data.discountValue));
      alert(`Success! Coupon applied: ৳${res.data.data.discountValue} discount.`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invalid coupon code');
    }
  };

  // Submit Order Mutation
  const placeOrder = useMutation({
    mutationFn: async () => {
      // Pick Dhanmondi branch or default
      const branchId = 'branch-dhanmondi-001';

      const orderPayload: any = {
        branchId,
        orderType,
        tableToken: orderType === 'DINE_IN' ? tableToken : undefined,
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : undefined,
        zoneId: orderType === 'DELIVERY' ? selectedZoneId : undefined,
        couponCode: couponCode || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          variantId: c.variantId,
          quantity: c.quantity,
          notes: c.notes,
          addons: c.addons.map((a) => a.addonId),
        })),
      };

      const res = await api.post('/orders', orderPayload);
      const createdOrder = res.data.data;

      // Handle payment initiation
      if (paymentMethod === 'CARD' || paymentMethod === 'BKASH') {
        // SSLCommerz payment gateway redirect
        try {
          const initPay = await api.post('/payments/sslcommerz/initiate', {
            orderId: createdOrder.id,
            amount: grandTotal,
            customerName,
            customerEmail: customerEmail || 'guest@spicegarden.com',
            customerPhone,
          });
          if (initPay.data.data?.GatewayPageURL) {
            window.location.href = initPay.data.data.GatewayPageURL;
            return;
          }
        } catch (e) {
          console.warn('SSLCommerz initiation:', e);
        }
      }

      return createdOrder;
    },
    onSuccess: (order) => {
      if (order?.orderNumber) {
        clearCart();
        router.push(`/orders/track?orderNumber=${order.orderNumber}`);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to place order');
    },
  });

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <ShoppingBag className="w-16 h-16 text-stone-300 mb-4" />
          <h2 className="text-xl font-bold text-stone-900">Your Basket is Empty</h2>
          <p className="text-xs text-stone-500 mt-1 max-w-sm">
            Explore our rich biryanis, sizzling kebabs, and authentic curries to start your order.
          </p>
          <Link
            href="/menu"
            className="mt-6 px-6 py-3 bg-orange-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-orange-700 transition"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-16">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Checkout & Settlement</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT 7 COLS: Order details & contact */}
          <div className="lg:col-span-7 space-y-6">
            {/* Order Type Tabs */}
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Dining Option</span>
              <div className="grid grid-cols-3 gap-2">
                {(['DELIVERY', 'TAKEAWAY', 'DINE_IN'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition ${
                      orderType === type
                        ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Contact Details */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h2 className="text-base font-bold text-stone-900">Customer Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-600 uppercase">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Hossain"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 uppercase">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01700000000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-600 uppercase">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. user@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              {orderType === 'DELIVERY' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-stone-600 uppercase">Delivery Zone</label>
                    <select
                      value={selectedZoneId}
                      onChange={(e) => setSelectedZoneId(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm mt-1 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="">-- Select Your Area / Zone --</option>
                      {zones.map((z: any) => (
                        <option key={z.id} value={z.id}>
                          {z.name} (৳{Number(z.deliveryFee)} Fee • ~{z.estimatedMinutes || 35} mins)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 uppercase">Detailed Street Address</label>
                    <textarea
                      required
                      placeholder="House / Apartment number, Road number, Landmarks..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={2}
                      className="w-full border rounded-xl px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h2 className="text-base font-bold text-stone-900">Payment Option</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'CASH', label: 'Cash on Delivery', icon: Banknote },
                  { id: 'CARD', label: 'Card Payment', icon: CreditCard },
                  { id: 'BKASH', label: 'bKash / Nagad', icon: Smartphone },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition ${
                        paymentMethod === m.id
                          ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Order Items & Pricing Ledger */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h2 className="text-base font-bold text-stone-900 pb-3 border-b">Order Summary</h2>

              <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto pr-1">
                {cart.map((item, idx) => {
                  const itemPrice = isNaN(Number(item.price)) ? 0 : Number(item.price);
                  const addonsSum = (item.addons || []).reduce((a, b) => a + (isNaN(Number(b.price)) ? 0 : Number(b.price)), 0);
                  const lineTotal = (itemPrice + addonsSum) * (item.quantity || 1);

                  return (
                    <div key={idx} className="py-3 flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-stone-900">{item.name}</div>
                        {item.variantName && (
                          <div className="text-xs text-orange-600">• {item.variantName}</div>
                        )}
                        {(item.addons || []).map((a, i) => (
                          <div key={i} className="text-xs text-stone-500">
                            + {a.name} (৳{Number(a.price || 0).toFixed(2)})
                          </div>
                        ))}
                        <div className="text-xs text-stone-400">৳{lineTotal.toFixed(2)}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-lg bg-stone-50 p-0.5">
                          <button
                            onClick={() => updateQty(idx, -1)}
                            className="p-1 hover:bg-white rounded"
                          >
                            <Minus className="w-3 h-3 text-stone-600" />
                          </button>
                          <span className="text-xs font-bold px-2">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(idx, 1)}
                            className="p-1 hover:bg-white rounded"
                          >
                            <Plus className="w-3 h-3 text-stone-600" />
                          </button>
                        </div>
                        <button onClick={() => removeItem(idx)} className="text-stone-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Bar */}
              <div className="pt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 border rounded-xl px-3 py-1.5 text-xs font-mono uppercase bg-stone-50 outline-none"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-black"
                >
                  Apply
                </button>
              </div>

              {/* Ledger breakdown */}
              <div className="space-y-2 pt-4 border-t text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (5%)</span>
                  <span>৳{tax.toFixed(2)}</span>
                </div>
                {orderType === 'DELIVERY' && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>৳{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-orange-600 font-bold">
                    <span>Discount</span>
                    <span>-৳{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-stone-900 pt-2 border-t">
                  <span>Grand Total</span>
                  <span className="text-orange-600">৳{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                disabled={placeOrder.isPending || !customerName || !customerPhone}
                onClick={() => placeOrder.mutate()}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-orange-600/30 transition flex items-center justify-center gap-2"
              >
                {placeOrder.isPending ? 'Placing Order...' : `Confirm & Place Order (৳${grandTotal.toFixed(2)})`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
