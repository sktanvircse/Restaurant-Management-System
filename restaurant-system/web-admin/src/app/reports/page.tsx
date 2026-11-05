'use client';

import { useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BarChart3, TrendingUp, DollarSign, Receipt, Percent } from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'sales' | 'pl' | 'vat'>('sales');

  const { data: salesReport, isLoading: loadingSales } = useQuery({
    queryKey: ['report-sales'],
    queryFn: async () => {
      const res = await api.get('/reports/sales');
      return res.data.data;
    },
    enabled: reportType === 'sales',
  });

  const { data: plReport, isLoading: loadingPl } = useQuery({
    queryKey: ['report-pl'],
    queryFn: async () => {
      const res = await api.get('/reports/profit-loss');
      return res.data.data;
    },
    enabled: reportType === 'pl',
  });

  const { data: vatReport, isLoading: loadingVat } = useQuery({
    queryKey: ['report-vat'],
    queryFn: async () => {
      const res = await api.get('/reports/vat');
      return res.data.data;
    },
    enabled: reportType === 'vat',
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Financial Reports</h1>
            <p className="text-sm text-gray-500">Comprehensive sales breakdown, profit & loss statement, and VAT audits</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['sales', 'pl', 'vat'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
                  reportType === type ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {type === 'pl' ? 'Profit & Loss' : type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {reportType === 'sales' && salesReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase">Total Revenue</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">৳{Number(salesReport.totalSales || 0).toFixed(2)}</div>
              </div>
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase">Paid Orders</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">{salesReport.totalOrders || 0}</div>
              </div>
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase">Discounts Given</span>
                <div className="text-2xl font-bold text-red-600 mt-1">৳{Number(salesReport.totalDiscounts || 0).toFixed(2)}</div>
              </div>
              <div className="bg-white p-5 rounded-xl border shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase">VAT Collected</span>
                <div className="text-2xl font-bold text-indigo-600 mt-1">৳{Number(salesReport.totalVat || 0).toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Channel Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Dine-In Sales</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">৳{Number(salesReport.byType?.DINE_IN || 0).toFixed(2)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Takeaway Sales</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">৳{Number(salesReport.byType?.TAKEAWAY || 0).toFixed(2)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Delivery Sales</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">৳{Number(salesReport.byType?.DELIVERY || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'pl' && plReport && (
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-gray-900 text-lg">Profit & Loss Statement (P&L)</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold text-gray-700">Gross Sales Revenue</span>
                <span className="font-bold text-gray-900">৳{Number(plReport.grossSales || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b text-red-600">
                <span>Cost of Goods Sold (COGS from Recipes)</span>
                <span className="font-semibold">- ৳{Number(plReport.cogs || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b font-bold bg-gray-50 px-2 rounded">
                <span>Gross Profit</span>
                <span className="text-indigo-600">৳{Number(plReport.grossProfit || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b text-red-600">
                <span>Operating Expenses & Petty Cash</span>
                <span className="font-semibold">- ৳{Number(plReport.operatingExpenses || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b text-red-600">
                <span>Staff Salary & Payroll Disbursements</span>
                <span className="font-semibold">- ৳{Number(plReport.payrollExpenses || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t-2 border-gray-900 font-black text-lg">
                <span>Net Operating Profit</span>
                <span className={Number(plReport.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ৳{Number(plReport.netProfit || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {reportType === 'vat' && vatReport && (
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Government VAT Audit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-xs font-bold text-indigo-700 uppercase">Total Taxable Sales</div>
                <div className="text-2xl font-black text-indigo-900 mt-1">৳{Number(vatReport.taxableAmount || 0).toFixed(2)}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-xs font-bold text-green-700 uppercase">Total VAT Collected (5%)</div>
                <div className="text-2xl font-black text-green-900 mt-1">৳{Number(vatReport.vatAmount || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
