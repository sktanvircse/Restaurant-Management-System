'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminShell from '@/components/layout/AdminShell';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { UtensilsCrossed, Plus, Search, CheckCircle, XCircle } from 'lucide-react';

export default function MenuPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/menu/categories');
      return res.data.data;
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['menu-items', selectedCategory, search],
    queryFn: async () => {
      let url = '/menu/items?';
      if (selectedCategory) url += `categoryId=${selectedCategory}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const res = await api.get(url);
      return res.data.data;
    },
  });

  // Toggle availability (86 item button)
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: number; isAvailable: boolean }) => {
      await api.patch(`/menu/items/${id}/availability`, { isAvailable });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Menu Catalog</h1>
            <p className="text-sm text-slate-500">Manage categories, dishes, variants, and 86 stock availability</p>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Dishes
          </button>
          {categories.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search dish by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Dish Grid */}
        {isLoading ? (
          <p className="text-sm text-slate-500 py-10 text-center">Loading menu catalog...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item: any) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                  item.isAvailable ? 'border-slate-200 shadow-sm' : 'border-red-200 bg-red-50/20 opacity-75'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 uppercase">
                      {item.station}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        item.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.isAvailable ? 'IN STOCK' : 'OUT OF STOCK (86)'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 mt-2 text-base">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description || 'No description provided'}</p>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-slate-900">{formatCurrency(item.basePrice)}</span>
                    {item.variants?.length > 0 && (
                      <span className="text-[11px] text-slate-400">({item.variants.length} sizes)</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{item.prepTime} mins prep</span>
                  <button
                    onClick={() =>
                      toggleMutation.mutate({
                        id: item.id,
                        isAvailable: !item.isAvailable,
                      })
                    }
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                      item.isAvailable
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {item.isAvailable ? 'Mark 86 (Out)' : 'Restock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
