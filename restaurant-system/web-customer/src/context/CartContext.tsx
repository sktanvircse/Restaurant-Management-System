'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export interface CustomerCartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantName?: string;
  addons: Array<{ addonId: string; name: string; price: number }>;
  notes?: string;
}

interface CartContextType {
  cart: CustomerCartItem[];
  tableToken: string | null;
  setTableToken: (tok: string | null) => void;
  addItem: (item: CustomerCartItem) => void;
  updateQty: (index: number, delta: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CustomerCartItem[]>([]);
  const [tableToken, setTableToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sg_customer_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clean any legacy corrupted items with NaN prices
          const sanitized = parsed.map((item: any) => ({
            ...item,
            price: isNaN(Number(item.price)) ? 0 : Number(item.price),
            quantity: isNaN(Number(item.quantity)) || Number(item.quantity) <= 0 ? 1 : Number(item.quantity),
            addons: Array.isArray(item.addons)
              ? item.addons.map((a: any) => ({
                  ...a,
                  price: isNaN(Number(a.price)) ? 0 : Number(a.price),
                }))
              : [],
          }));
          setCart(sanitized);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sg_customer_cart', JSON.stringify(cart));
  }, [cart]);

  const addItem = (item: CustomerCartItem) => {
    const safePrice = isNaN(Number(item.price)) ? 0 : Number(item.price);
    const safeItem = {
      ...item,
      price: safePrice,
      quantity: isNaN(Number(item.quantity)) || Number(item.quantity) <= 0 ? 1 : Number(item.quantity),
      addons: Array.isArray(item.addons)
        ? item.addons.map((a) => ({
            ...a,
            price: isNaN(Number(a.price)) ? 0 : Number(a.price),
          }))
        : [],
    };
    setCart((prev) => [...prev, safeItem]);
  };

  const updateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      copy[index].quantity += delta;
      if (copy[index].quantity <= 0) {
        copy.splice(index, 1);
      }
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, it) => {
    const addonsCost = (it.addons || []).reduce((sum, a) => sum + (isNaN(Number(a.price)) ? 0 : Number(a.price)), 0);
    const itemPrice = isNaN(Number(it.price)) ? 0 : Number(it.price);
    return acc + (itemPrice + addonsCost) * (it.quantity || 1);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        tableToken,
        setTableToken,
        addItem,
        updateQty,
        removeItem,
        clearCart,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
