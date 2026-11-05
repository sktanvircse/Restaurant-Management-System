import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

type TicketStatus = 'PENDING' | 'PREPARING' | 'READY';

interface KitchenTicket {
  id: string;
  status: TicketStatus;
  station: string;
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
    }>;
  };
}

export default function KitchenMobileScreen() {
  const { branchId } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['kitchen-mobile-tickets', branchId],
    queryFn: async () => {
      const params = branchId ? `?branchId=${branchId}` : '';
      const res = await api.get(`/orders/kitchen${params}`);
      return res.data.data as KitchenTicket[];
    },
    refetchInterval: 20000,
  });

  // Live Socket listener
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    if (branchId) {
      socket.emit('join:kitchen', branchId);
    }
    socket.on('order:new', () => refetch());
    socket.on('order:status', () => refetch());
    return () => { socket.disconnect(); };
  }, [branchId, refetch]);

  const bumpTicket = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'PREPARING' | 'READY' }) => {
      await api.patch(`/orders/kitchen/${id}/status`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-mobile-tickets'] }),
  });

  const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string }> = {
    PENDING: { label: '🔴 NEW', color: '#fca5a5', bg: '#7f1d1d' },
    PREPARING: { label: '🟡 COOKING', color: '#fde68a', bg: '#78350f' },
    READY: { label: '🟢 READY', color: '#86efac', bg: '#14532d' },
  };

  const renderTicket = ({ item }: { item: KitchenTicket }) => {
    const cfg = statusConfig[item.status] || statusConfig.PENDING;
    const elapsed = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000);
    const isUrgent = elapsed >= 15;

    return (
      <View style={[styles.ticket, isUrgent && styles.urgentTicket]}>
        <View style={styles.ticketHeader}>
          <View>
            <Text style={styles.orderNum}>#{item.order?.orderNumber}</Text>
            <Text style={styles.orderMeta}>
              {item.order?.orderType}
              {item.order?.table ? ` • Table ${item.order.table.tableNumber}` : ''}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={[styles.timer, isUrgent && { color: '#f87171' }]}>⏱ {elapsed}m</Text>
          </View>
        </View>

        <View style={styles.stationBadge}>
          <Text style={styles.stationText}>Station: {item.station}</Text>
        </View>

        {/* Items */}
        <View style={styles.itemsList}>
          {item.order?.items?.map((it) => (
            <View key={it.id} style={styles.orderItemRow}>
              <Text style={styles.orderItemQty}>{it.quantity}x</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderItemName}>{it.menuItem?.name}</Text>
                {it.notes && (
                  <Text style={styles.orderItemNote}>⚠ {it.notes}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Bump Button */}
        {item.status === 'PENDING' && (
          <TouchableOpacity
            style={[styles.bumpBtn, { backgroundColor: '#d97706' }]}
            onPress={() => bumpTicket.mutate({ id: item.id, status: 'PREPARING' })}
          >
            <Text style={styles.bumpBtnText}>🔥 START PREPARING</Text>
          </TouchableOpacity>
        )}
        {item.status === 'PREPARING' && (
          <TouchableOpacity
            style={[styles.bumpBtn, { backgroundColor: '#16a34a' }]}
            onPress={() => bumpTicket.mutate({ id: item.id, status: 'READY' })}
          >
            <Text style={styles.bumpBtnText}>✅ MARK READY</Text>
          </TouchableOpacity>
        )}
        {item.status === 'READY' && (
          <View style={[styles.bumpBtn, { backgroundColor: '#1d4ed8' }]}>
            <Text style={styles.bumpBtnText}>🛎 AWAITING SERVER</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>👨‍🍳 KITCHEN TICKETS</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>↻ REFRESH</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading active tickets...</Text>
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>🍳 No active kitchen tickets</Text>
          <Text style={styles.emptySubtext}>All orders are served!</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          renderItem={renderTicket}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#18181b', borderBottomWidth: 1, borderColor: '#27272a',
  },
  topBarTitle: { color: '#fbbf24', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  refreshBtn: { backgroundColor: '#27272a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  refreshBtnText: { color: '#a1a1aa', fontSize: 10, fontWeight: '800' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#52525b', fontSize: 16, fontWeight: '800' },
  emptySubtext: { color: '#3f3f46', fontSize: 12, marginTop: 4 },
  ticket: {
    backgroundColor: '#18181b', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#27272a',
  },
  urgentTicket: {
    borderColor: '#dc2626', borderWidth: 2,
    shadowColor: '#dc2626', shadowRadius: 8, shadowOpacity: 0.3,
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderNum: { color: '#fbbf24', fontSize: 18, fontWeight: '900' },
  orderMeta: { color: '#71717a', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '900' },
  timer: { color: '#71717a', fontSize: 11, fontWeight: '800', marginTop: 4 },
  stationBadge: { backgroundColor: '#27272a', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  stationText: { color: '#a1a1aa', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  itemsList: { borderTopWidth: 1, borderColor: '#27272a', paddingTop: 10, gap: 8 },
  orderItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  orderItemQty: { color: '#fbbf24', fontSize: 16, fontWeight: '900', width: 30 },
  orderItemName: { color: '#f4f4f5', fontSize: 14, fontWeight: '700' },
  orderItemNote: { color: '#fbbf24', fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  bumpBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  bumpBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
