'use client';

import { useQuery } from '@tanstack/react-query';
import AdminShell from '@/components/layout/AdminShell';
import api from '@/lib/api';
import { Grid, QrCode, Users } from 'lucide-react';

export default function TablesPage() {
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const res = await api.get('/tables');
      return res.data.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500 text-white';
      case 'OCCUPIED':
        return 'bg-amber-500 text-white';
      case 'RESERVED':
        return 'bg-blue-500 text-white';
      case 'CLEANING':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-slate-400 text-white';
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Floor Plan & Tables</h1>
          <p className="text-sm text-slate-500">Live dine-in tables, session status, and QR ordering codes</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200 text-xs font-medium">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Occupied / Dining</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /> Reserved</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500" /> Cleaning</span>
        </div>

        {/* Tables Grid */}
        {isLoading ? (
          <p className="text-sm text-slate-500 py-10 text-center">Loading floor plan...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {tables.map((table: any) => (
              <div
                key={table.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">{table.section || 'General'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(table.status)}`}>
                      {table.status}
                    </span>
                  </div>

                  <div className="text-center my-4">
                    <span className="text-3xl font-black text-slate-900">{table.tableNumber}</span>
                    <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" /> {table.capacity} seats
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-[100px]">
                    Token: {table.qrToken?.slice(0, 8)}...
                  </span>
                  <a
                    href={`http://localhost:5000/api/v1/tables/${table.id}/qr`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="View QR Code for print"
                  >
                    <QrCode className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
