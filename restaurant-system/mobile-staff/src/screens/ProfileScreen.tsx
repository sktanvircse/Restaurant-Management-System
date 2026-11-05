import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, role, logout } = useAuth();

  const roleIcons: Record<string, string> = {
    WAITER: '🧑‍🍽️',
    KITCHEN: '👨‍🍳',
    RIDER: '🛵',
    MANAGER: '📋',
    CASHIER: '💳',
    SUPER_ADMIN: '⚙️',
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the staff portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Avatar / Role Badge */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>{roleIcons[role || 'WAITER'] || '👤'}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName || 'Staff Member'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{role}</Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>STAFF ID</Text>
          <Text style={styles.infoValue}>{user?.id?.slice(-8).toUpperCase() || 'N/A'}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>PHONE</Text>
          <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>SHIFT STATUS</Text>
          <Text style={[styles.infoValue, { color: '#4ade80' }]}>On Duty 🟢</Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>⬅ SIGN OUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  profileHeader: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  avatar: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: '#18181b', borderWidth: 2, borderColor: '#27272a',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarIcon: { fontSize: 36 },
  name: { color: '#f4f4f5', fontSize: 22, fontWeight: '900' },
  email: { color: '#71717a', fontSize: 12, marginTop: 4 },
  roleBadge: {
    backgroundColor: '#ea580c', paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: 8, marginTop: 10,
  },
  roleBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  infoSection: { paddingHorizontal: 16, gap: 10 },
  infoCard: {
    backgroundColor: '#18181b', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#27272a',
  },
  infoLabel: { color: '#52525b', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  infoValue: { color: '#d4d4d8', fontSize: 14, fontWeight: '700' },
  logoutBtn: {
    margin: 20, backgroundColor: '#27272a', paddingVertical: 14,
    borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#3f3f46',
  },
  logoutBtnText: { color: '#f87171', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
