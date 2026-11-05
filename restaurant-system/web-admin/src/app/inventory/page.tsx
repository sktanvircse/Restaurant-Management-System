'use client';

import { useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Package, AlertTriangle, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [wastageData, setWastageData] = useState({ quantity: 1, reason: 'EXPIRED', notes: '' });

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const res = await api.get('/inventory/ingredients');
      return res.data.data;
    },
  });

  const recordWastage = useMutation({
    mutationFn: async () => {
      await api.post('/inventory/wastage', {
        ingredientId: selectedIngredient.id,
        quantity: Number(wastageData.quantity),
        reason: wastageData.reason,
        notes: wastageData.notes,
      });
    },
    onSuccess: () => {
      setShowWastageModal(false);
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock Control</h1>
            <p className="text-sm text-gray-500">Monitor ingredient levels, minimum stock alerts, and wastage</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading inventory...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="p-4">Ingredient</th>
                  <th className="p-4">SKU / Code</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Min Stock Alert</th>
                  <th className="p-4">Unit Cost</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ingredients.map((ing: any) => {
                  const isLow = Number(ing.currentStock) <= Number(ing.minStockAlert);
                  return (
                    <tr key={ing.id} className="hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-500" />
                        {ing.name}
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-xs">{ing.sku || '-'}</td>
                      <td className="p-4 font-bold text-gray-900">
                        {Number(ing.currentStock)} {ing.unit}
                      </td>
                      <td className="p-4 text-gray-500">
                        {Number(ing.minStockAlert)} {ing.unit}
                      </td>
                      <td className="p-4 text-gray-600">
                        ৳{Number(ing.costPerUnit).toFixed(2)}
                      </td>
                      <td className="p-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedIngredient(ing);
                            setShowWastageModal(true);
                          }}
                          className="px-2.5 py-1 text-xs bg-red-50 text-red-600 font-medium rounded hover:bg-red-100"
                        >
                          Log Wastage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showWastageModal && selectedIngredient && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Record Wastage: {selectedIngredient.name}</h3>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Quantity ({selectedIngredient.unit})</label>
                <input
                  type="number"
                  step="0.01"
                  value={wastageData.quantity}
                  onChange={(e) => setWastageData({ ...wastageData, quantity: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Reason</label>
                <select
                  value={wastageData.reason}
                  onChange={(e) => setWastageData({ ...wastageData, reason: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                >
                  <option value="EXPIRED">Expired</option>
                  <option value="DAMAGED">Damaged / Spilled</option>
                  <option value="PREPARATION_ERROR">Preparation Error</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Notes</label>
                <textarea
                  value={wastageData.notes}
                  onChange={(e) => setWastageData({ ...wastageData, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowWastageModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => recordWastage.mutate()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                >
                  Save Wastage
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
