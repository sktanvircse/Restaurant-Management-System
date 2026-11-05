'use client';

import { useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Tag, Plus, CheckCircle, Percent } from 'lucide-react';

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 0,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await api.get('/coupons');
      return res.data.data;
    },
  });

  const createCoupon = useMutation({
    mutationFn: async () => {
      await api.post('/coupons', {
        ...formData,
        code: formData.code.toUpperCase(),
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount),
      });
    },
    onSuccess: () => {
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setFormData({ code: '', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 0, validUntil: '' });
    },
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotions & Coupons</h1>
            <p className="text-sm text-gray-500">Manage promotional discount codes and customer vouchers</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading coupons...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coupons.map((c: any) => (
              <div key={c.id} className="bg-white border rounded-xl p-5 space-y-3 shadow-sm border-l-4 border-l-indigo-600">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-lg text-indigo-700 tracking-wider">{c.code}</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `৳${c.discountValue} OFF`}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {c.isActive ? 'Active' : 'Expired'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2.5 rounded-lg">
                  <div>Min Order: <span className="font-bold">৳{Number(c.minOrderAmount || 0).toFixed(2)}</span></div>
                  <div>Valid Till: <span className="font-medium">{new Date(c.validUntil).toLocaleDateString()}</span></div>
                  <div>Used Count: <span className="font-medium">{c.usedCount || 0} times</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Create New Coupon</h3>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Coupon Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm font-mono uppercase"
                  placeholder="e.g. WELCOME10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 mt-1 text-sm bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Discount Value</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Min Order Amount (৳)</label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Valid Until</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createCoupon.mutate()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                >
                  Create Coupon
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
