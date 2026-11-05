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
        setCart(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sg_customer_cart', JSON.stringify(cart));
  }, [cart]);

  const addItem = (item: CustomerCartItem) => {
    setCart((prev) => [...prev, item]);
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
    const addonsCost = it.addons.reduce((sum, a) => sum + Number(a.price), 0);
    return acc + (Number(it.price) + addonsCost) * it.quantity;
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
