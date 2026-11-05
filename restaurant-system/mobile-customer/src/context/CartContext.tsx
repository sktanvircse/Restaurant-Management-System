import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MobileCartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantName?: string;
  addons?: Array<{ addonId: string; name: string; price: number }>;
}

interface CartContextType {
  cart: MobileCartItem[];
  addItem: (item: MobileCartItem) => void;
  updateQty: (index: number, delta: number) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<MobileCartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('mobile_cart').then((data) => {
      if (data) setCart(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('mobile_cart', JSON.stringify(cart));
  }, [cart]);

  const addItem = (item: MobileCartItem) => setCart((prev) => [...prev, item]);

  const updateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      copy[index].quantity += delta;
      if (copy[index].quantity <= 0) copy.splice(index, 1);
      return copy;
    });
  };

  const removeItem = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));
  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => {
    const addonsTotal = item.addons?.reduce((a, b) => a + Number(b.price), 0) || 0;
    return sum + (Number(item.price) + addonsTotal) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQty, removeItem, clearCart, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
