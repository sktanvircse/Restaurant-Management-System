'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import api from '@/lib/api';
import { Utensils, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TableQRPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const { setTableToken } = useCart();

  const [tableData, setTableData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    api
      .get(`/tables/by-token/${token}`)
      .then((res) => {
        setTableData(res.data.data);
        setTableToken(token);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Invalid or expired table QR code');
        setLoading(false);
      });
  }, [token, setTableToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-stone-600">Connecting to your table...</p>
        </div>
      </div>
    );
  }

  if (error || !tableData) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border shadow-xl max-w-sm w-full space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-black text-stone-900">QR Code Error</h2>
          <p className="text-xs text-stone-500">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-black"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-3xl border shadow-xl max-w-md w-full space-y-6">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
          <Utensils className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            {tableData.branch?.name || 'Spice Garden'}
          </span>
          <h1 className="text-2xl font-black text-stone-900">
            Welcome to Table {tableData.tableNumber}
          </h1>
          <p className="text-xs text-stone-500">
            Floor: {tableData.floor || 'Ground'} • Capacity: {tableData.capacity} Guests
          </p>
        </div>

        <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 text-xs text-stone-600 text-left space-y-2">
          <div className="flex items-center gap-2 font-bold text-stone-900">
            <CheckCircle className="w-4 h-4 text-green-600" /> Contactless Dining Active
          </div>
          <p>
            Your orders will be sent straight to the chef with Table {tableData.tableNumber} automatically linked.
          </p>
        </div>

        <button
          onClick={() => router.push('/menu')}
          className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-orange-700 shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2"
        >
          <span>View Menu & Order</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
