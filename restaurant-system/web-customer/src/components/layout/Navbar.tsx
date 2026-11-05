'use client';

import Link from 'next/link';
import { Utensils, ShoppingBag, Calendar, Phone, Clock } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-600/30">
              SG
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-stone-900 leading-none">SPICE GARDEN</div>
              <div className="text-[10px] font-bold text-orange-600 tracking-widest uppercase">Fine Dining & Takeaway</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-stone-700">
            <Link href="/" className="hover:text-orange-600 transition">Home</Link>
            <Link href="/menu" className="hover:text-orange-600 transition">Menu</Link>
            <Link href="/reservations" className="hover:text-orange-600 transition">Book Table</Link>
            <Link href="/orders/track" className="hover:text-orange-600 transition">Track Order</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/menu"
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-orange-700 transition shadow-md shadow-orange-600/20"
            >
              <ShoppingBag className="w-4 h-4" /> Order Online
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
