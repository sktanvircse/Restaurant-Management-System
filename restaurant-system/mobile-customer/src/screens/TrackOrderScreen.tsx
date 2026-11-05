import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { io } from 'socket.io-client';

export default function TrackOrderScreen({ route, navigation }: any) {
  const orderNumber = route?.params?.orderNumber || 'ORD-20261105-0001';

  const { data: order, refetch } = useQuery({
    queryKey: ['mobile-track-order', orderNumber],
    queryFn: async () => {
      const res = await api.get(`/orders/by-number/${orderNumber}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!order?.id) return;
    const socket = io('http://10.0.2.2:5000', { transports: ['websocket'] });
    socket.emit('join:order', order.id);

    socket.on('order:status', () => refetch());
    socket.on('kitchen:ready', () => refetch());

    return () => {
      socket.disconnect();
    };
  }, [order?.id, refetch]);

  const stages = [
    { key: 'PENDING', label: 'Order Placed' },
    { key: 'CONFIRMED', label: 'Accepted by Kitchen' },
    { key: 'PREPARING', label: 'Cooking & Preparation' },
    { key: 'READY', label: 'Ready for Rider' },
    { key: 'SERVED', label: 'Delivered' },
  ];

  const currentIdx = stages.findIndex((s) => s.key === order?.orderStatus);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.tag}>LIVE DISPATCH</Text>
          <Text style={styles.orderNum}>#{orderNumber}</Text>
          <Text style={styles.statusBadge}>{order?.orderStatus || 'PENDING'}</Text>
        </View>

        <View style={styles.stagesCard}>
          <Text style={styles.stagesTitle}>Delivery Progress</Text>
          {stages.map((st, i) => {
            const isCompleted = i <= currentIdx;
            return (
              <View key={st.key} style={styles.stageRow}>
                <View style={[styles.circle, isCompleted && styles.activeCircle]}>
                  <Text style={[styles.circleText, isCompleted && styles.activeCircleText]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[styles.stageLabel, isCompleted && styles.activeStageLabel]}>
                  {st.label}
                </Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeBtnText}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfbf9' },
  content: { padding: 16 },
  headerCard: {
    backgroundColor: '#1c1917',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  tag: { color: '#ea580c', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  orderNum: { color: '#ffffff', fontSize: 22, fontWeight: '900', marginVertical: 6 },
  statusBadge: {
    backgroundColor: '#ea580c',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '800',
  },
  stagesCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#f5f5f4' },
  stagesTitle: { fontSize: 14, fontWeight: '900', color: '#1c1917', marginBottom: 16 },
  stageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  circle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activeCircle: { backgroundColor: '#ea580c' },
  circleText: { fontSize: 11, fontWeight: '800', color: '#a8a29e' },
  activeCircleText: { color: '#ffffff' },
  stageLabel: { fontSize: 13, fontWeight: '700', color: '#a8a29e' },
  activeStageLabel: { color: '#1c1917' },
  homeBtn: { backgroundColor: '#f5f5f4', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  homeBtnText: { color: '#1c1917', fontSize: 12, fontWeight: '800' },
});
