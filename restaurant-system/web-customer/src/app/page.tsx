'use client';

import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { Utensils, Clock, MapPin, Sparkles, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-stone-900 via-stone-850 to-orange-950 text-white py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Authentic Flavours & Contemporary Hospitality
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Exceptional Dining, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400">
              Delivered To Your Table & Home
            </span>
          </h1>

          <p className="text-stone-300 text-base sm:text-lg max-w-2xl mx-auto">
            Experience our famous Dum Biryani, Clay Oven Kebabs, and artisan curries. Order online for swift doorstep delivery or reserve a private table.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/menu"
              className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-orange-700 shadow-xl shadow-orange-600/30 transition flex items-center gap-2"
            >
              <span>Explore Our Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/reservations"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-black text-sm uppercase tracking-wider backdrop-blur transition"
            >
              Book A Table
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-stone-50 border">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Fast Doorstep Delivery</h3>
                <p className="text-xs text-stone-500 mt-1">Live tracking and direct dispatch from our Dhanmondi & Gulshan kitchens.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-2xl bg-stone-50 border">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Contactless Table QR</h3>
                <p className="text-xs text-stone-500 mt-1">Scan your table QR code to order food instantly without waiting for a waiter.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-2xl bg-stone-50 border">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Hygienic & Fresh</h3>
                <p className="text-xs text-stone-500 mt-1">100% Halal certified, premium ingredients, and ISO compliant kitchen food hygiene.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Branches */}
      <section className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div>
            <h2 className="text-3xl font-black text-stone-900">Our Dhaka Branches</h2>
            <p className="text-sm text-stone-500 mt-1">Visit us or order online from your nearest branch</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-stone-900">Spice Garden HQ (Dhanmondi)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">Open Now</span>
              </div>
              <p className="text-xs text-stone-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-600" /> House 42, Road 27, Dhanmondi, Dhaka 1209
              </p>
              <p className="text-xs text-stone-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-stone-400" /> Daily 11:30 AM - 11:00 PM
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-stone-900">Spice Garden Gulshan</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">Open Now</span>
              </div>
              <p className="text-xs text-stone-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-600" /> Plot 15, Avenue 2, Gulshan-2, Dhaka 1212
              </p>
              <p className="text-xs text-stone-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-stone-400" /> Daily 12:00 PM - 11:30 PM
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 text-center text-xs mt-auto">
        <p>© 2026 Spice Garden Restaurant Management System. Built with Next.js, Express & MySQL.</p>
      </footer>
    </div>
  );
}
