'use client';

import { useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Truck, MapPin, Phone, UserCheck, ShieldCheck } from 'lucide-react';

export default function DeliveryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'deliveries' | 'riders' | 'zones'>('deliveries');

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const res = await api.get('/delivery');
      return res.data.data;
    },
  });

  const { data: riders = [] } = useQuery({
    queryKey: ['riders'],
    queryFn: async () => {
      const res = await api.get('/delivery/riders');
      return res.data.data;
    },
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: async () => {
      const res = await api.get('/delivery/zones');
      return res.data.data;
    },
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery & Rider Dispatch</h1>
            <p className="text-sm text-gray-500">Track delivery orders, rider fleets, and geographical delivery zones</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['deliveries', 'riders', 'zones'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                  activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'deliveries' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Address & Zone</th>
                  <th className="p-4">Assigned Rider</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">COD Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">No active delivery orders</td>
                  </tr>
                ) : (
                  deliveries.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono font-semibold text-indigo-600">
                        {d.order?.orderNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{d.recipientName}</div>
                        <div className="text-xs text-gray-500">{d.recipientPhone}</div>
                      </td>
                      <td className="p-4 text-xs text-gray-600 max-w-xs truncate">
                        <MapPin className="w-3 h-3 inline text-red-500 mr-1" />
                        {d.deliveryAddress}
                        {d.zone && <span className="ml-1 text-gray-400 font-semibold">({d.zone.name})</span>}
                      </td>
                      <td className="p-4">
                        {d.rider ? (
                          <div className="font-medium text-gray-900 flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-indigo-500" />
                            {d.rider.user?.fullName}
                          </div>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          d.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          d.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-800' :
                          d.status === 'PICKED_UP' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        {d.codAmount ? `৳${Number(d.codAmount).toFixed(2)}` : 'Prepaid'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'riders' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {riders.map((r: any) => (
              <div key={r.id} className="bg-white border rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{r.user?.fullName}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {r.user?.phone || 'No phone'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    r.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {r.isAvailable ? 'Available' : 'Busy / Off'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg space-y-1">
                  <div>Vehicle: <span className="font-semibold text-gray-900">{r.vehicleType || 'Bike'}</span></div>
                  <div>Plate #: <span className="font-mono text-gray-900">{r.vehicleNumber || 'N/A'}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'zones' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="p-4">Zone Name</th>
                  <th className="p-4">Delivery Fee</th>
                  <th className="p-4">Estimated Delivery Time</th>
                  <th className="p-4">Min Order Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {zones.map((z: any) => (
                  <tr key={z.id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-900">{z.name}</td>
                    <td className="p-4 font-bold text-indigo-600">৳{Number(z.deliveryFee).toFixed(2)}</td>
                    <td className="p-4 text-gray-600">{z.estimatedMinutes || 30} mins</td>
                    <td className="p-4 text-gray-600">৳{Number(z.minOrderAmount || 0).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        z.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {z.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
