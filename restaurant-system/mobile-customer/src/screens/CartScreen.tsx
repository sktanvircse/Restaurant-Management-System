import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useCart } from '../context/CartContext';
import api from '../api/api';

export default function CartScreen({ navigation }: any) {
  const { cart, updateQty, removeItem, clearCart, subtotal } = useCart();
  const [customerName, setCustomerName] = useState('Rahim Ahmed');
  const [customerPhone, setCustomerPhone] = useState('01711111111');
  const [deliveryAddress, setDeliveryAddress] = useState('House 12, Road 5, Dhanmondi');
  const [loading, setLoading] = useState(false);

  const tax = subtotal * 0.05;
  const deliveryFee = 60;
  const grandTotal = subtotal + tax + deliveryFee;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        branchId: 'branch-dhanmondi-001',
        orderType: 'DELIVERY',
        customerName,
        customerPhone,
        deliveryAddress,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
          variantId: c.variantId,
        })),
      });

      const order = res.data.data;
      clearCart();
      navigation.navigate('TrackOrder', { orderNumber: order.orderNumber });
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.response?.data?.message || 'Could not place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your Basket is Empty</Text>
        <Text style={styles.emptySubtitle}>Explore our freshly prepared menu dishes</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Menu')}>
          <Text style={styles.browseBtnText}>BROWSE DISHES</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Order Summary</Text>

        {/* Item Rows */}
        {cart.map((item, idx) => (
          <View key={idx} style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>৳{(Number(item.price) * item.quantity).toFixed(2)}</Text>
            </View>
            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(idx, -1)}>
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(idx, 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Delivery Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Delivery Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Recipient Name"
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={customerPhone}
            onChangeText={setCustomerPhone}
          />
          <TextInput
            style={[styles.input, { height: 60 }]}
            multiline
            placeholder="Street Address"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
          />
        </View>

        {/* Ledger */}
        <View style={styles.sectionCard}>
          <View style={styles.ledgerRow}>
            <Text style={styles.ledgerLabel}>Items Subtotal</Text>
            <Text style={styles.ledgerVal}>৳{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.ledgerRow}>
            <Text style={styles.ledgerLabel}>VAT (5%)</Text>
            <Text style={styles.ledgerVal}>৳{tax.toFixed(2)}</Text>
          </View>
          <View style={styles.ledgerRow}>
            <Text style={styles.ledgerLabel}>Delivery Fee</Text>
            <Text style={styles.ledgerVal}>৳{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.ledgerRow, { borderTopWidth: 1, borderColor: '#f5f5f4', paddingTop: 8, marginTop: 4 }]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalVal}>৳{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Place Order CTA */}
        <TouchableOpacity
          style={[styles.checkoutBtn, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutBtnText}>
            {loading ? 'PLACING ORDER...' : `CONFIRM & ORDER (৳${grandTotal.toFixed(2)})`}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfbf9' },
  content: { padding: 16 },
  header: { fontSize: 20, fontWeight: '900', color: '#1c1917', marginBottom: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#ffffff' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1c1917' },
  emptySubtitle: { fontSize: 12, color: '#a8a29e', marginVertical: 8 },
  browseBtn: { backgroundColor: '#ea580c', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 12 },
  browseBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  itemCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  itemName: { fontSize: 13, fontWeight: '700', color: '#1c1917' },
  itemPrice: { fontSize: 12, fontWeight: '800', color: '#ea580c', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f4', borderRadius: 8, padding: 3 },
  qtyBtn: { width: 24, height: 24, backgroundColor: '#ffffff', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 12, fontWeight: '800', color: '#1c1917' },
  qtyText: { marginHorizontal: 8, fontSize: 12, fontWeight: '800', color: '#1c1917' },
  sectionCard: { backgroundColor: '#ffffff', padding: 14, borderRadius: 16, marginVertical: 8, borderWidth: 1, borderColor: '#f5f5f4' },
  sectionHeader: { fontSize: 13, fontWeight: '800', color: '#1c1917', marginBottom: 10 },
  input: { backgroundColor: '#fafaf9', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, padding: 10, fontSize: 12, marginBottom: 8, color: '#1c1917' },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  ledgerLabel: { fontSize: 12, color: '#78716c' },
  ledgerVal: { fontSize: 12, fontWeight: '700', color: '#1c1917' },
  totalLabel: { fontSize: 14, fontWeight: '900', color: '#1c1917' },
  totalVal: { fontSize: 14, fontWeight: '900', color: '#ea580c' },
  checkoutBtn: { backgroundColor: '#ea580c', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 12, marginBottom: 30 },
  checkoutBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
