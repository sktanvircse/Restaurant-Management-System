'use client';

import { useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Calendar, Users, Phone, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', statusFilter],
    queryFn: async () => {
      const branchId = localStorage.getItem('branchId') || '';
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/reservations?${params.toString()}`);
      return res.data.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/reservations/${id}/status`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Table Reservations</h1>
            <p className="text-sm text-gray-500">Manage customer table bookings and seatings</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SEATED">Seated</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading reservations...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Party Size</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Table</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">No reservations found</td>
                  </tr>
                ) : (
                  reservations.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{r.customerName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {r.customerPhone}</span>
                          {r.customerEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {r.customerEmail}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <Users className="w-4 h-4 text-gray-400" /> {r.partySize} Guests
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-gray-900 font-medium">
                          <Calendar className="w-4 h-4 text-indigo-500" /> {new Date(r.reservationDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {r.startTime} - {r.endTime}
                        </div>
                      </td>
                      <td className="p-4">
                        {r.table ? (
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                            Table {r.table.tableNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          r.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          r.status === 'SEATED' ? 'bg-green-100 text-green-800' :
                          r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ id: r.id, status: 'CONFIRMED' })}
                              className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium inline-flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" /> Confirm
                            </button>
                            <button
                              onClick={() => updateStatus.mutate({ id: r.id, status: 'CANCELLED' })}
                              className="px-2.5 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" /> Cancel
                            </button>
                          </>
                        )}
                        {r.status === 'CONFIRMED' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: r.id, status: 'SEATED' })}
                            className="px-2.5 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium inline-flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" /> Seat Guests
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
