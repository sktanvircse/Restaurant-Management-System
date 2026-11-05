import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ScrollView
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function WaiterScreen() {
  const { branchId, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  // Load available tables
  const { data: tables = [] } = useQuery({
    queryKey: ['staff-tables', branchId],
    queryFn: async () => {
      const res = await api.get('/tables');
      return res.data.data;
    },
  });

  // Load menu categories for ordering
  const { data: categories = [] } = useQuery({
    queryKey: ['staff-menu'],
    queryFn: async () => {
      const res = await api.get('/menu/categories');
      return res.data.data;
    },
  });

  const allItems = categories.flatMap((cat: any) =>
    cat.menuItems.map((item: any) => ({ ...item, categoryId: cat.id }))
  );

  const addToOrder = (item: any) => {
    const existing = orderItems.findIndex((o) => o.menuItemId === item.id);
    if (existing >= 0) {
      const updated = [...orderItems];
      updated[existing].quantity += 1;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, { menuItemId: item.id, name: item.name, price: Number(item.price), quantity: 1 }]);
    }
  };

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!selectedTable) throw new Error('Please select a table first');
      if (orderItems.length === 0) throw new Error('Add at least one item to the order');
      await api.post('/orders', {
        branchId,
        orderType: 'DINE_IN',
        tableId: selectedTable.id,
        items: orderItems.map((o) => ({
          menuItemId: o.menuItemId,
          quantity: o.quantity,
        })),
      });
    },
    onSuccess: () => {
      Alert.alert('✅ Order Sent!', `Order for Table ${selectedTable?.tableNumber} has been sent to the kitchen.`);
      setSelectedTable(null);
      setOrderItems([]);
      queryClient.invalidateQueries({ queryKey: ['staff-tables'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || err.response?.data?.message || 'Failed to place order');
    },
  });

  return (
    <View style={styles.container}>
      {/* Table Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Table</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tables}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isOccupied = item.status === 'OCCUPIED';
            const isSelected = selectedTable?.id === item.id;
            return (
              <TouchableOpacity
                onPress={() => !isOccupied && setSelectedTable(item)}
                style={[
                  styles.tableChip,
                  isOccupied && styles.occupiedTableChip,
                  isSelected && styles.selectedTableChip,
                ]}
              >
                <Text style={[styles.tableChipNum, isSelected && { color: '#ffffff' }]}>
                  T{item.tableNumber}
                </Text>
                <Text style={[styles.tableChipCap, isSelected && { color: '#fde68a' }]}>
                  {item.capacity}p
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Menu Quick Add */}
      <View style={[styles.section, { flex: 1 }]}>
        <Text style={styles.sectionTitle}>
          Add Items {selectedTable ? `→ Table ${selectedTable.tableNumber}` : '(Select table first)'}
        </Text>
        <FlatList
          data={allItems.filter((i: any) => i.isAvailable)}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 10 }}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.menuCard, !selectedTable && { opacity: 0.4 }]}
              disabled={!selectedTable}
              onPress={() => addToOrder(item)}
            >
              <Text style={styles.menuItemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.menuItemPrice}>৳{Number(item.price).toFixed(2)}</Text>
              <View style={styles.addIndicator}>
                <Text style={styles.addIndicatorText}>TAP TO ADD</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Order Summary + Send */}
      {orderItems.length > 0 && (
        <View style={styles.orderBar}>
          <View>
            <Text style={styles.orderBarTitle}>
              {orderItems.reduce((a, b) => a + b.quantity, 0)} items
              {selectedTable && ` → Table ${selectedTable.tableNumber}`}
            </Text>
            <Text style={styles.orderBarSubtitle}>
              ৳{orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)} subtotal
            </Text>
          </View>
          <TouchableOpacity
            style={styles.sendOrderBtn}
            onPress={() => placeOrder.mutate()}
            disabled={placeOrder.isPending}
          >
            <Text style={styles.sendOrderBtnText}>
              {placeOrder.isPending ? 'SENDING...' : '🍳 SEND TO KITCHEN'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  section: { padding: 16 },
  sectionTitle: { color: '#a1a1aa', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  tableChip: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#27272a', borderWidth: 1, borderColor: '#3f3f46',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  occupiedTableChip: { backgroundColor: '#7f1d1d', borderColor: '#dc2626' },
  selectedTableChip: { backgroundColor: '#ea580c', borderColor: '#f97316' },
  tableChipNum: { color: '#f4f4f5', fontSize: 13, fontWeight: '900' },
  tableChipCap: { color: '#71717a', fontSize: 9 },
  menuCard: {
    flex: 1, backgroundColor: '#18181b', borderRadius: 14,
    padding: 12, borderWidth: 1, borderColor: '#27272a',
  },
  menuItemName: { color: '#f4f4f5', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  menuItemPrice: { color: '#ea580c', fontSize: 13, fontWeight: '900' },
  addIndicator: { marginTop: 8, backgroundColor: '#27272a', borderRadius: 6, paddingVertical: 4 },
  addIndicatorText: { color: '#71717a', fontSize: 9, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  orderBar: {
    backgroundColor: '#18181b', borderTopWidth: 1, borderColor: '#27272a',
    padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  orderBarTitle: { color: '#f4f4f5', fontSize: 14, fontWeight: '900' },
  orderBarSubtitle: { color: '#71717a', fontSize: 11, marginTop: 2 },
  sendOrderBtn: {
    backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  sendOrderBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
});
