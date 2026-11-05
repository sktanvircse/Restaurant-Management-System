import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, Modal, ScrollView
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function RiderScreen() {
  const { user, branchId } = useAuth();
  const queryClient = useQueryClient();
  const [codModal, setCodModal] = useState<{ deliveryId: string; orderNum: string } | null>(null);
  const [codAmount, setCodAmount] = useState('');

  // Load deliveries assigned to this rider
  const { data: deliveries = [], isLoading, refetch } = useQuery({
    queryKey: ['rider-deliveries'],
    queryFn: async () => {
      const res = await api.get('/delivery/my-deliveries');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // Update delivery status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/delivery/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    },
  });

  // Submit COD cash collection
  const submitCOD = useMutation({
    mutationFn: async ({ deliveryId, amount }: { deliveryId: string; amount: number }) => {
      await api.post(`/delivery/${deliveryId}/cod-collected`, { amountCollected: amount });
    },
    onSuccess: () => {
      setCodModal(null);
      setCodAmount('');
      queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
      Alert.alert('✅ COD Recorded', 'Cash collected has been logged successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record COD');
    },
  });

  const statusFlow: Record<string, { next: string; label: string; color: string }> = {
    PENDING: { next: 'PICKED_UP', label: '📦 MARK PICKED UP', color: '#d97706' },
    PICKED_UP: { next: 'OUT_FOR_DELIVERY', label: '🛵 OUT FOR DELIVERY', color: '#1d4ed8' },
    OUT_FOR_DELIVERY: { next: 'DELIVERED', label: '✅ CONFIRM DELIVERED', color: '#16a34a' },
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>🛵 MY DELIVERIES</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading deliveries...</Text>
        </View>
      ) : deliveries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>🛵 No deliveries assigned</Text>
          <Text style={styles.emptySubtext}>You are on standby</Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          renderItem={({ item }) => {
            const nextAction = statusFlow[item.status];
            const isCODPending = item.codAmount && item.status === 'DELIVERED' && !item.codCollected;

            return (
              <View style={styles.deliveryCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>#{item.order?.orderNumber}</Text>
                    <Text style={styles.recipientName}>{item.recipientName}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: item.status === 'DELIVERED' ? '#14532d' : '#1e3a5f' }]}>
                    <Text style={styles.statusPillText}>{item.status.replace('_', ' ')}</Text>
                  </View>
                </View>

                {/* Delivery Details */}
                <View style={styles.detailsBox}>
                  <Text style={styles.detailLabel}>📍 Destination</Text>
                  <Text style={styles.detailValue}>{item.deliveryAddress}</Text>

                  <Text style={[styles.detailLabel, { marginTop: 8 }]}>📞 Phone</Text>
                  <Text style={styles.detailValue}>{item.recipientPhone}</Text>

                  {item.order?.items?.length > 0 && (
                    <>
                      <Text style={[styles.detailLabel, { marginTop: 8 }]}>🍽 Items</Text>
                      {item.order.items.slice(0, 3).map((it: any) => (
                        <Text key={it.id} style={styles.detailValue}>
                          {it.quantity}x {it.menuItem?.name}
                        </Text>
                      ))}
                    </>
                  )}

                  {item.codAmount && (
                    <View style={styles.codBadge}>
                      <Text style={styles.codBadgeText}>
                        💵 COD: ৳{Number(item.codAmount).toFixed(2)}
                        {item.codCollected ? ' ✓ Collected' : ' — Pending Collection'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                {nextAction && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: nextAction.color }]}
                    onPress={() => {
                      if (nextAction.next === 'DELIVERED' && item.codAmount && !item.codCollected) {
                        // Show COD modal before marking delivered
                        setCodModal({ deliveryId: item.id, orderNum: item.order?.orderNumber });
                        setCodAmount(String(Number(item.codAmount)));
                      } else {
                        updateStatus.mutate({ id: item.id, status: nextAction.next });
                      }
                    }}
                  >
                    <Text style={styles.actionBtnText}>{nextAction.label}</Text>
                  </TouchableOpacity>
                )}

                {isCODPending && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#7c3aed', marginTop: 6 }]}
                    onPress={() => {
                      setCodModal({ deliveryId: item.id, orderNum: item.order?.orderNumber });
                      setCodAmount(String(Number(item.codAmount)));
                    }}
                  >
                    <Text style={styles.actionBtnText}>💵 LOG CASH COLLECTED</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* COD Collection Modal */}
      <Modal visible={!!codModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>💵 Collect Cash Payment</Text>
            <Text style={styles.modalSubtitle}>Order #{codModal?.orderNum}</Text>

            <Text style={styles.inputLabel}>Amount Received from Customer (৳)</Text>
            <TextInput
              style={styles.codInput}
              value={codAmount}
              onChangeText={setCodAmount}
              keyboardType="numeric"
              placeholder="e.g. 850"
              placeholderTextColor="#52525b"
            />

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#16a34a', marginTop: 8 }]}
              onPress={() => {
                if (!codModal) return;
                submitCOD.mutate({ deliveryId: codModal.deliveryId, amount: Number(codAmount) });
                // Also update status to delivered
                updateStatus.mutate({ id: codModal.deliveryId, status: 'DELIVERED' });
              }}
            >
              <Text style={styles.actionBtnText}>✅ CONFIRM & MARK DELIVERED</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#27272a', marginTop: 8 }]}
              onPress={() => setCodModal(null)}
            >
              <Text style={styles.actionBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  topBarTitle: { color: '#38bdf8', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  refreshBtn: { backgroundColor: '#27272a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  refreshBtnText: { color: '#a1a1aa', fontSize: 16, fontWeight: '800' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#52525b', fontSize: 16, fontWeight: '800' },
  emptySubtext: { color: '#3f3f46', fontSize: 12, marginTop: 4 },
  deliveryCard: {
    backgroundColor: '#18181b', borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: '#27272a',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderNumber: { color: '#38bdf8', fontSize: 18, fontWeight: '900' },
  recipientName: { color: '#d4d4d8', fontSize: 13, fontWeight: '700', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  detailsBox: { backgroundColor: '#27272a', borderRadius: 12, padding: 12, marginBottom: 12 },
  detailLabel: { color: '#71717a', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  detailValue: { color: '#d4d4d8', fontSize: 12, fontWeight: '600', marginTop: 2 },
  codBadge: {
    backgroundColor: '#1e1b4b', borderRadius: 8, padding: 8, marginTop: 8,
  },
  codBadgeText: { color: '#a5b4fc', fontSize: 11, fontWeight: '700' },
  actionBtn: { paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#18181b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderWidth: 1, borderColor: '#27272a',
  },
  modalTitle: { color: '#f4f4f5', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  modalSubtitle: { color: '#71717a', fontSize: 12, marginBottom: 16 },
  inputLabel: { color: '#a1a1aa', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  codInput: {
    backgroundColor: '#27272a', color: '#f4f4f5', fontSize: 24, fontWeight: '900',
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#3f3f46',
  },
});
