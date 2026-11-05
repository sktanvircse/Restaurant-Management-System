'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Calendar, Users, Clock, Phone, Mail, CheckCircle2, Sparkles } from 'lucide-react';

export default function ReservationsPage() {
  const [branchId, setBranchId] = useState('branch-dhanmondi-001');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [reservationDate, setReservationDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('19:30');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data.data;
    },
  });

  const bookReservation = useMutation({
    mutationFn: async () => {
      await api.post('/reservations', {
        branchId,
        customerName,
        customerPhone,
        customerEmail,
        partySize: Number(partySize),
        reservationDate,
        startTime,
        specialRequests,
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to book reservation');
    },
  });

  return (
    <div className="flex-1 flex flex-col pb-16">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Table Bookings
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Reserve Your Table
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
            Enjoy private booths, outdoor terrace, and fine candlelit dining with your friends and family.
          </p>
        </div>

        {isSuccess ? (
          <div className="bg-white p-8 rounded-3xl border shadow-xl text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-black text-stone-900">Reservation Confirmed!</h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Thank you, {customerName}. Your reservation request has been received. Our floor manager will assign your table and an SMS confirmation will be sent shortly to {customerPhone}.
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="mt-4 px-6 py-2.5 bg-stone-900 text-white font-bold rounded-xl text-xs uppercase"
            >
              Book Another Table
            </button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-600 uppercase">Select Branch</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm mt-1 bg-white font-bold text-stone-900 outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} - {b.address}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-600 uppercase">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Hossain"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 uppercase">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01700000000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-600 uppercase">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. user@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-600 uppercase">Party Size (Guests)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 uppercase">Reservation Date</label>
                  <input
                    type="date"
                    value={reservationDate}
                    onChange={(e) => setReservationDate(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600 uppercase">Seating Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-600 uppercase">Special Dining Requests</label>
                <textarea
                  placeholder="e.g. Birthday celebration, high chair needed, window table preference..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              disabled={bookReservation.isPending || !customerName || !customerPhone}
              onClick={() => bookReservation.mutate()}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-orange-700 shadow-xl shadow-orange-600/30 disabled:opacity-50 transition"
            >
              {bookReservation.isPending ? 'Submitting Booking...' : 'Reserve Table'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
