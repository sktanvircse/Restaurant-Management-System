'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { socket } from '@/lib/socket';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  ChefHat,
  Filter,
  RefreshCw,
  LogOut,
  Maximize,
  Minimize
} from 'lucide-react';
import Link from 'next/link';

interface KitchenTicket {
  id: string;
  orderId: string;
  station: string;
  status: 'PENDING' | 'PREPARING' | 'READY';
  createdAt: string;
  order: {
    orderNumber: string;
    orderType: string;
    table?: { tableNumber: string };
    items: Array<{
      id: string;
      quantity: number;
      notes?: string;
      menuItem: { name: string };
      variant?: { name: string };
      addons: Array<{ addon: { name: string } }>;
    }>;
  };
}

const STATIONS = [
  { id: 'ALL', label: 'All Stations' },
  { id: 'GRILL', label: 'Grill Station' },
  { id: 'FRY', label: 'Fry Station' },
  { id: 'DRINKS', label: 'Bar & Drinks' },
  { id: 'DESSERT', label: 'Desserts' },
];

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play audio chime using Web Audio API (works without external audio asset files)
  const playChime = () => {
    if (!audioEnabled) return;
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  const branchId = typeof window !== 'undefined' ? localStorage.getItem('branchId') || '' : '';

  // Fetch kitchen orders
  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['kitchen-tickets', branchId, selectedStation],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (selectedStation !== 'ALL') params.append('station', selectedStation);
      // Fetch active kitchen tickets
      const res = await api.get(`/orders/kitchen?${params.toString()}`);
      return res.data.data as KitchenTicket[];
    },
    refetchInterval: 15000, // Poll every 15s as fallback
  });

  // Real-time socket listener
  useEffect(() => {
    if (branchId) {
      socket.emit('join:branch', branchId);
      socket.emit('join:kitchen', branchId);
    }

    const handleNewOrder = () => {
      playChime();
      queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
    };

    const handleStatusUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
    };

    socket.on('order:new', handleNewOrder);
    socket.on('kitchen:ready', handleStatusUpdate);
    socket.on('order:status', handleStatusUpdate);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('kitchen:ready', handleStatusUpdate);
      socket.off('order:status', handleStatusUpdate);
    };
  }, [branchId, queryClient, audioEnabled]);

  // Bump / update ticket status mutation
  const bumpTicket = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'PREPARING' | 'READY' }) => {
      await api.patch(`/orders/kitchen/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
    },
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Group tickets into Kanban columns
  const pendingTickets = tickets.filter((t) => t.status === 'PENDING');
  const preparingTickets = tickets.filter((t) => t.status === 'PREPARING');
  const readyTickets = tickets.filter((t) => t.status === 'READY');

  const getElapsedTime = (createdStr: string) => {
    const elapsedMinutes = Math.floor((Date.now() - new Date(createdStr).getTime()) / 60000);
    return `${elapsedMinutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans select-none">
      {/* Top KDS Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-amber-500 font-black text-xl tracking-wider">
            <ChefHat className="w-7 h-7" />
            <span>KITCHEN DISPLAY SYSTEM</span>
          </div>

          {/* Station Filters */}
          <div className="flex items-center bg-gray-800 rounded-lg p-1 gap-1">
            {STATIONS.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStation(st.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition ${
                  selectedStation === st.id
                    ? 'bg-amber-500 text-gray-950 shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playChime();
              setAudioEnabled(!audioEnabled);
            }}
            title={audioEnabled ? 'Mute sound chime' : 'Enable sound chime'}
            className={`p-2 rounded-lg border transition ${
              audioEnabled ? 'bg-gray-800 border-gray-700 text-amber-400' : 'bg-red-950/40 border-red-800 text-red-400'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={() => refetch()}
            title="Refresh active tickets"
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-xs font-semibold text-gray-300 hover:text-white"
          >
            <LogOut className="w-4 h-4" /> Admin Portal
          </Link>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* COLUMN 1: NEW / PENDING */}
        <div className="flex flex-col bg-gray-900/60 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
              <h2 className="text-sm font-black uppercase tracking-wider text-red-400">
                New Tickets ({pendingTickets.length})
              </h2>
            </div>
            <span className="text-xs text-gray-500">Needs Prep</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {pendingTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                elapsedTime={getElapsedTime(ticket.createdAt)}
                onAction={() => bumpTicket.mutate({ id: ticket.id, status: 'PREPARING' })}
                actionLabel="START PREPARING"
                actionColor="bg-amber-600 hover:bg-amber-500 text-white"
              />
            ))}
            {pendingTickets.length === 0 && (
              <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
                No pending tickets
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: PREPARING / COOKING */}
        <div className="flex flex-col bg-gray-900/60 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">
                In The Kitchen ({preparingTickets.length})
              </h2>
            </div>
            <span className="text-xs text-gray-500">Cooking</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {preparingTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                elapsedTime={getElapsedTime(ticket.createdAt)}
                onAction={() => bumpTicket.mutate({ id: ticket.id, status: 'READY' })}
                actionLabel="MARK AS READY"
                actionColor="bg-green-600 hover:bg-green-500 text-white"
              />
            ))}
            {preparingTickets.length === 0 && (
              <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
                No orders currently cooking
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: READY / PLATED */}
        <div className="flex flex-col bg-gray-900/60 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <h2 className="text-sm font-black uppercase tracking-wider text-green-400">
                Ready for Service ({readyTickets.length})
              </h2>
            </div>
            <span className="text-xs text-gray-500">Ready to Serve / Dispatch</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {readyTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                elapsedTime={getElapsedTime(ticket.createdAt)}
                isReady
              />
            ))}
            {readyTickets.length === 0 && (
              <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
                No ready orders waiting
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TicketCard({
  ticket,
  elapsedTime,
  onAction,
  actionLabel,
  actionColor,
  isReady = false,
}: {
  ticket: KitchenTicket;
  elapsedTime: string;
  onAction?: () => void;
  actionLabel?: string;
  actionColor?: string;
  isReady?: boolean;
}) {
  const isUrgent = parseInt(elapsedTime) >= 15;

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col justify-between transition ${
        isUrgent
          ? 'bg-red-950/20 border-red-800/80 shadow-lg shadow-red-950/30'
          : 'bg-gray-800/90 border-gray-700 shadow-md'
      }`}
    >
      <div>
        {/* Ticket Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-700/60">
          <div>
            <span className="text-xl font-black text-amber-400">
              #{ticket.order?.orderNumber}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-700 text-gray-200">
                {ticket.order?.orderType}
              </span>
              {ticket.order?.table && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                  Table {ticket.order.table.tableNumber}
                </span>
              )}
            </div>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-1 font-mono font-bold text-sm px-2.5 py-1 rounded-lg ${
              isUrgent ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-900 text-gray-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{elapsedTime}</span>
          </div>
        </div>

        {/* Station Badge */}
        <div className="pt-2 pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Station: <span className="text-gray-200">{ticket.station}</span>
          </span>
        </div>

        {/* Item List */}
        <ul className="divide-y divide-gray-700/40 my-2">
          {ticket.order?.items?.map((item) => (
            <li key={item.id} className="py-2">
              <div className="flex items-start justify-between">
                <span className="font-bold text-base text-white">
                  <span className="text-amber-400 text-lg mr-2 font-black">
                    {item.quantity}x
                  </span>
                  {item.menuItem?.name}
                </span>
              </div>

              {item.variant && (
                <div className="text-xs text-indigo-300 font-medium pl-6">
                  • Variant: {item.variant.name}
                </div>
              )}

              {item.addons && item.addons.length > 0 && (
                <div className="text-xs text-gray-400 pl-6 space-x-1">
                  <span>+</span>
                  {item.addons.map((a, i) => (
                    <span key={i} className="text-gray-300">
                      {a.addon.name}
                      {i < item.addons.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              )}

              {item.notes && (
                <div className="text-xs text-amber-300 italic pl-6 mt-0.5 bg-amber-950/40 px-2 py-0.5 rounded">
                  Note: {item.notes}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Bump Button */}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className={`w-full py-3 rounded-lg font-black text-sm tracking-wider uppercase mt-3 transition shadow-md ${actionColor}`}
        >
          {actionLabel}
        </button>
      )}

      {isReady && (
        <div className="w-full py-2 bg-green-950/60 border border-green-700 text-green-300 rounded-lg text-xs font-bold text-center tracking-wider uppercase mt-3 flex items-center justify-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-green-400" />
          Awaiting Server / Rider
        </div>
      )}
    </div>
  );
}
