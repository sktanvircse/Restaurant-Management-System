'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';
import {
  Search,
  Plus,
  ShoppingCart,
  X,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerMenuPage() {
  const { cart, addItem, subtotal, tableToken } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item modal state
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [notes, setNotes] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['customer-menu'],
    queryFn: async () => {
      const res = await api.get('/menu/categories');
      return res.data.data;
    },
  });

  const handleAddToCart = () => {
    if (!activeItem) return;
    const price = selectedVariant ? Number(selectedVariant.price) : Number(activeItem.price);
    addItem({
      menuItemId: activeItem.id,
      name: activeItem.name,
      price,
      quantity: 1,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      addons: selectedAddons.map((a) => ({ addonId: a.id, name: a.name, price: Number(a.price) })),
      notes,
    });
    setActiveItem(null);
    setSelectedVariant(null);
    setSelectedAddons([]);
    setNotes('');
  };

  const allItems = categories.flatMap((cat: any) =>
    cat.menuItems.map((item: any) => ({ ...item, categoryId: cat.id }))
  );

  const filteredItems = allItems.filter((item: any) => {
    const matchesCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery && item.isAvailable;
  });

  const totalCartCount = cart.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="flex-1 flex flex-col pb-24">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-orange-600 text-white py-10 px-4 text-center">
        <h1 className="text-3xl font-black tracking-tight">Our Artisan Menu</h1>
        <p className="text-xs sm:text-sm text-orange-100 mt-1 max-w-lg mx-auto">
          Prepared fresh upon ordering with hand-ground spices and organic ingredients.
        </p>

        {tableToken && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white text-orange-700 font-bold text-xs rounded-full mt-3 shadow">
            <span>Dine-In Table Order Active</span>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Search & Categories Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search dishes, drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-white border text-stone-700 hover:bg-stone-50'
              }`}
            >
              All Items
            </button>
            {categories.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-white border text-stone-700 hover:bg-stone-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-stone-400 text-sm">Loading delicious recipes...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item: any) => (
              <div
                key={item.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-stone-900 text-lg">{item.name}</h3>
                    {item.isSpicy && (
                      <span className="p-1 bg-red-50 text-red-600 rounded-md" title="Spicy">
                        <Flame className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.description}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                  <span className="text-lg font-black text-stone-900">
                    ৳{Number(item.price).toFixed(2)}
                  </span>
                  <button
                    onClick={() => {
                      if (item.variants?.length > 0 || item.addonGroups?.length > 0) {
                        setActiveItem(item);
                        setSelectedVariant(item.variants?.[0] || null);
                        setSelectedAddons([]);
                      } else {
                        addItem({
                          menuItemId: item.id,
                          name: item.name,
                          price: Number(item.price),
                          quantity: 1,
                          addons: [],
                        });
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-orange-50 text-orange-600 font-bold rounded-xl text-xs hover:bg-orange-600 hover:text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Pill at bottom */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-6 inset-x-0 max-w-md mx-auto px-4 z-30">
          <Link
            href="/checkout"
            className="w-full py-4 px-6 bg-stone-900 text-white rounded-2xl shadow-2xl flex items-center justify-between hover:bg-black transition border border-stone-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center font-black text-xs">
                {totalCartCount}
              </div>
              <span className="font-bold text-sm">View Cart / Checkout</span>
            </div>
            <div className="flex items-center gap-2 font-black text-orange-400">
              <span>৳{subtotal.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}

      {/* Item Customizer Modal */}
      {activeItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-stone-900">{activeItem.name}</h3>
                <p className="text-xs text-stone-500">{activeItem.description}</p>
              </div>
              <button onClick={() => setActiveItem(null)}>
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            {/* Variants */}
            {activeItem.variants?.length > 0 && (
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase">Select Portion Size</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {activeItem.variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                        selectedVariant?.id === v.id
                          ? 'border-orange-600 bg-orange-50 text-orange-700'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div>{v.name}</div>
                      <div className="text-stone-500 font-normal">৳{Number(v.price).toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Addons */}
            {activeItem.addonGroups?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase">Custom Extras & Add-ons</label>
                {activeItem.addonGroups.map((grp: any) => (
                  <div key={grp.id} className="space-y-1">
                    <span className="text-[11px] font-semibold text-stone-400">{grp.name}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {grp.addons?.map((addon: any) => {
                        const isSelected = selectedAddons.some((a) => a.id === addon.id);
                        return (
                          <button
                            key={addon.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
                              } else {
                                setSelectedAddons([...selectedAddons, addon]);
                              }
                            }}
                            className={`p-2 rounded-lg border text-xs font-medium text-left flex justify-between transition ${
                              isSelected
                                ? 'border-orange-600 bg-orange-50 text-orange-700'
                                : 'border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            <span>{addon.name}</span>
                            <span className="font-bold">+৳{Number(addon.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Instructions */}
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase">Special Instructions</label>
              <input
                type="text"
                placeholder="e.g. Mild spicy, less oil, separate dressing..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 mt-1 text-xs"
              />
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full py-3 bg-orange-600 text-white rounded-xl font-black text-sm uppercase hover:bg-orange-700 shadow-md"
            >
              Add To Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
