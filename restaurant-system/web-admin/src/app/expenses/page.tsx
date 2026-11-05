'use client';

import { useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { DollarSign, Plus, Calendar, Tag, AlertCircle } from 'lucide-react';

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: 0,
    categoryId: '',
    notes: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await api.get('/expenses');
      return res.data.data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await api.get('/expenses/categories');
      return res.data.data;
    },
  });

  const createExpense = useMutation({
    mutationFn: async () => {
      const branchId = localStorage.getItem('branchId');
      await api.post('/expenses', {
        ...formData,
        amount: Number(formData.amount),
        branchId,
      });
    },
    onSuccess: () => {
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setFormData({ title: '', amount: 0, categoryId: '', notes: '', expenseDate: new Date().toISOString().split('T')[0] });
    },
  });

  const totalExpense = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses & Petty Cash</h1>
            <p className="text-sm text-gray-500">Record utilities, supplies, maintenance, and petty cash operational costs</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Recorded Expenses</span>
            <div className="text-3xl font-black text-gray-900 mt-2">৳{totalExpense.toFixed(2)}</div>
            <span className="text-xs text-gray-500 mt-1 block">{expenses.length} expense transactions</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading expenses...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="p-4">Expense Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Recorded By</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">No expenses recorded</td></tr>
                ) : (
                  expenses.map((e: any) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-900">{e.title}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {e.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{new Date(e.expenseDate).toLocaleDateString()}</td>
                      <td className="p-4 text-gray-600 text-xs">{e.creator?.fullName || 'Staff'}</td>
                      <td className="p-4 text-right font-bold text-red-600">
                        ৳{Number(e.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Record New Expense</h3>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Title / Purpose</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Electric bill / Cleaning supplies"
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Amount (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
                  rows={2}
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
                  onClick={() => createExpense.mutate()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                >
                  Save Expense
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
