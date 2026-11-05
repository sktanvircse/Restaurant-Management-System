'use client';

import { useQuery } from '@tanstack/react-query';
import AdminShell from '@/components/layout/AdminShell';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  ArrowUpRight,
  UtensilsCrossed,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: sales, isLoading } = useQuery({
    queryKey: ['reports', 'sales'],
    queryFn: async () => {
      const res = await api.get('/reports/sales');
      return res.data.data;
    },
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['orders', 'active'],
    queryFn: async () => {
      const res = await api.get('/orders?limit=5');
      return res.data.data;
    },
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
            <p className="text-sm text-slate-500">Live operational overview and sales performance</p>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? '...' : formatCurrency(sales?.totalRevenue || 0)}
              </h3>
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+12.4% vs last period</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Orders Completed</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? '...' : sales?.totalOrders || 0}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Dine-in, takeaway & delivery</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Average Order Value */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Ticket (AOV)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? '...' : formatCurrency(sales?.averageOrderValue || 0)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Per transaction average</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Tax & VAT Collected */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">VAT / Tax Collected</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? '...' : formatCurrency(sales?.totalTax || 0)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">7.5% government standard</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Middle Section: Top Selling Items + Active Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Dishes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-orange-600" />
              <span>Top Selling Menu Items</span>
            </h3>

            {isLoading ? (
              <p className="text-sm text-slate-500">Loading sales data...</p>
            ) : sales?.topSellingItems?.length ? (
              <div className="space-y-3">
                {sales.topSellingItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">{item.quantity} sold</span>
                      <p className="text-xs text-slate-500">{formatCurrency(item.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">No item sales recorded yet</p>
            )}
          </div>

          {/* Recent Orders List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <span>Recent Orders</span>
            </h3>

            {activeOrders?.length ? (
              <div className="divide-y divide-slate-100">
                {activeOrders.map((o: any) => (
                  <div key={o.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">
                        {o.orderNumber}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          {o.tableSession?.table ? `Table ${o.tableSession.table.tableNumber}` : o.type}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-slate-900">{formatCurrency(o.totalAmount)}</p>
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full mt-1 ${
                          o.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'PREPARING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">No orders yet</p>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
