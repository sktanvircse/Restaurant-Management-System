import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { useCart } from '../context/CartContext';

export default function HomeScreen({ navigation }: any) {
  const { addItem } = useCart();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['mobile-categories'],
    queryFn: async () => {
      const res = await api.get('/menu/categories');
      return res.data.data;
    },
  });

  return (
    <ScrollView style={styles.container}>
      {/* Banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.brandSubtitle}>AUTHENTIC BENGALI & INDIAN</Text>
        <Text style={styles.heroTitle}>Spice Garden</Text>
        <Text style={styles.heroDescription}>
          Fresh hand-crafted Biryanis & Kebabs delivered hot to your doorstep.
        </Text>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.orderButtonText}>EXPLORE FULL MENU</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu Highlights</Text>
        {isLoading ? (
          <Text style={styles.emptyText}>Loading menu...</Text>
        ) : (
          categories.slice(0, 3).map((cat: any) => (
            <View key={cat.id} style={styles.catCard}>
              <Text style={styles.catName}>{cat.name}</Text>
              {cat.menuItems?.slice(0, 2).map((item: any) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>৳{Number(item.price).toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() =>
                      addItem({
                        menuItemId: item.id,
                        name: item.name,
                        price: Number(item.price),
                        quantity: 1,
                      })
                    }
                  >
                    <Text style={styles.addBtnText}>+ ADD</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfbf9' },
  heroBanner: {
    backgroundColor: '#ea580c',
    padding: 24,
    paddingTop: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  brandSubtitle: { color: '#ffedd5', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  heroTitle: { color: '#ffffff', fontSize: 32, fontWeight: '900', marginVertical: 4 },
  heroDescription: { color: '#ffedd5', fontSize: 13, lineHeight: 18, marginBottom: 16 },
  orderButton: {
    backgroundColor: '#1c1917',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  orderButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1c1917', marginBottom: 12 },
  emptyText: { textAlign: 'center', color: '#a8a29e', marginVertical: 20 },
  catCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  catName: { fontSize: 14, fontWeight: '800', color: '#ea580c', marginBottom: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#fafaf9',
  },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1c1917' },
  itemPrice: { fontSize: 12, fontWeight: '800', color: '#78716c', marginTop: 2 },
  addBtn: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: { color: '#ea580c', fontSize: 11, fontWeight: '800' },
});
