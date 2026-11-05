'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { socket } from '@/lib/socket';
import {
  Search,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  ChefHat,
  Truck,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { Suspense } from 'react';

function OrderTrackerContent() {
  const searchParams = useSearchParams();
  const initialNumber = searchParams?.get('orderNumber') || '';
  const [orderNumber, setOrderNumber] = useState(initialNumber);
  const [lookupQuery, setLookupQuery] = useState(initialNumber);

  const { data: order, refetch, isLoading } = useQuery({
    queryKey: ['track-order', lookupQuery],
    queryFn: async () => {
      if (!lookupQuery) return null;
      const res = await api.get(`/orders/by-number/${lookupQuery}`);
      return res.data.data;
    },
    enabled: !!lookupQuery,
  });

  // Socket listener for live status updates
  useEffect(() => {
    if (!order?.id) return;

    socket.emit('join:order', order.id);

    const handleStatusUpdate = (payload: any) => {
      if (payload.orderId === order.id) {
        refetch();
      }
    };

    socket.on('order:status', handleStatusUpdate);
    socket.on('kitchen:ready', handleStatusUpdate);

    return () => {
      socket.off('order:status', handleStatusUpdate);
      socket.off('kitchen:ready', handleStatusUpdate);
    };
  }, [order?.id, refetch]);

  const stages = [
    { key: 'PENDING', label: 'Order Received', desc: 'Sent to the kitchen' },
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Approved by branch manager' },
    { key: 'PREPARING', label: 'In The Kitchen', desc: 'Chef is cooking' },
    { key: 'READY', label: 'Ready', desc: 'Plated / Packed' },
    { key: 'SERVED', label: 'Delivered / Served', desc: 'Enjoy your meal!' },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === order?.orderStatus);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Live Order Tracking</h1>
        <p className="text-xs text-stone-500 mt-1">Real-time status updates directly from our kitchen & riders</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Enter Order # (e.g. ORD-20261105-0001)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            className="w-full pl-9 pr-4 py-2.5 border rounded-xl font-mono uppercase text-sm bg-white outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button
          onClick={() => setLookupQuery(orderNumber)}
          className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-black transition"
        >
          Track
        </button>
      </div>

      {isLoading && (
        <div className="p-12 text-center text-stone-400 text-sm">Searching for order...</div>
      )}

      {order && (
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b gap-2">
            <div>
              <span className="font-mono font-black text-xl text-orange-600">#{order.orderNumber}</span>
              <div className="text-xs text-stone-500 mt-0.5">
                {order.orderType} • Placed {new Date(order.createdAt).toLocaleTimeString()}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-100 text-orange-800">
              {order.orderStatus}
            </span>
          </div>

          {/* Stepper Pipeline */}
          <div className="py-4 space-y-6">
            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage.key} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                        isCurrent
                          ? 'bg-orange-600 text-white ring-4 ring-orange-100 animate-pulse'
                          : isPast
                          ? 'bg-green-600 text-white'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      {isPast ? <CheckCheck className="w-4 h-4" /> : idx + 1}
                    </div>
                    {idx < stages.length - 1 && (
                      <div
                        className={`w-0.5 h-10 my-1 ${
                          isPast ? 'bg-green-500' : 'bg-stone-200'
                        }`}
                      ></div>
                    )}
                  </div>

                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-orange-600'
                          : isPast
                          ? 'text-stone-900'
                          : 'text-stone-400'
                      }`}
                    >
                      {stage.label}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Details list */}
          <div className="pt-4 border-t space-y-2">
            <h4 className="text-xs font-bold text-stone-500 uppercase">Items In This Order</h4>
            <div className="divide-y divide-stone-100 text-xs">
              {order.items?.map((it: any) => (
                <div key={it.id} className="py-2 flex justify-between">
                  <span>
                    {it.quantity}x {it.menuItem?.name} {it.variant?.name && `(${it.variant.name})`}
                  </span>
                  <span className="font-bold text-stone-900">৳{Number(it.totalPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-black text-sm pt-2 text-stone-900 border-t">
              <span>Total Amount</span>
              <span className="text-orange-600">৳{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackPage() {
  return (
    <div className="flex-1 flex flex-col pb-16">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center text-stone-400">Loading tracker...</div>}>
        <OrderTrackerContent />
      </Suspense>
    </div>
  );
}
