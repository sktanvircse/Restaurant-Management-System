import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { useCart } from '../context/CartContext';

export default function MenuScreen() {
  const { addItem } = useCart();
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [query, setQuery] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['mobile-menu-categories'],
    queryFn: async () => {
      const res = await api.get('/menu/categories');
      return res.data.data;
    },
  });

  const allItems = categories.flatMap((cat: any) =>
    cat.menuItems.map((item: any) => ({ ...item, categoryId: cat.id }))
  );

  const filtered = allItems.filter((i: any) => {
    const matchCat = selectedCat === 'ALL' || i.categoryId === selectedCat;
    const matchQuery = i.name.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQuery && i.isAvailable;
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search food, drinks..."
          placeholderTextColor="#a8a29e"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Category selector */}
      <View style={styles.catScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'ALL', name: 'All' }, ...categories]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCat === item.id && styles.activeCatChip]}
              onPress={() => setSelectedCat(item.id)}
            >
              <Text
                style={[
                  styles.catChipText,
                  selectedCat === item.id && styles.activeCatChipText,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Items List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description || 'Delicious culinary chef special'}
              </Text>
              <Text style={styles.price}>৳{Number(item.price).toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={styles.btn}
              onPress={() =>
                addItem({
                  menuItemId: item.id,
                  name: item.name,
                  price: Number(item.price),
                  quantity: 1,
                })
              }
            >
              <Text style={styles.btnText}>+ ADD</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfbf9' },
  searchWrapper: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: '#f5f5f4' },
  searchInput: {
    backgroundColor: '#f5f5f4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 13,
    color: '#1c1917',
  },
  catScroll: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#ffffff' },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f5f5f4',
    marginRight: 8,
  },
  activeCatChip: { backgroundColor: '#ea580c' },
  catChipText: { fontSize: 11, fontWeight: '700', color: '#78716c' },
  activeCatChipText: { color: '#ffffff' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  title: { fontSize: 14, fontWeight: '800', color: '#1c1917' },
  desc: { fontSize: 11, color: '#a8a29e', marginVertical: 4 },
  price: { fontSize: 13, fontWeight: '900', color: '#ea580c', marginTop: 2 },
  btn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
});
