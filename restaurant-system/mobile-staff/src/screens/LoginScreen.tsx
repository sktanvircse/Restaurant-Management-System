import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Waiter Demo', email: 'waiter@spicegarden.com', password: 'Password123!' },
  { label: 'Kitchen Demo', email: 'kitchen@spicegarden.com', password: 'Password123!' },
  { label: 'Rider Demo', email: 'rider@spicegarden.com', password: 'Password123!' },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: string, p?: string) => {
    const loginEmail = e || email;
    const loginPass = p || password;
    if (!loginEmail || !loginPass) {
      Alert.alert('Required', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      await login(loginEmail, loginPass);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials. Check you are connected to the backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>SG</Text>
        <Text style={styles.appTitle}>SPICE GARDEN STAFF</Text>
        <Text style={styles.appSubtitle}>Management Portal • Secure Login</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>STAFF EMAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="staff@spicegarden.com"
          placeholderTextColor="#52525b"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••••"
          placeholderTextColor="#52525b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={() => handleLogin()}
        >
          {loading ? (
            <ActivityIndicator color="#18181b" />
          ) : (
            <Text style={styles.loginBtnText}>SIGN IN TO PORTAL</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Demo Quick Login Buttons */}
      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>Quick Demo Access</Text>
        {DEMO_ACCOUNTS.map((acc) => (
          <TouchableOpacity
            key={acc.email}
            style={styles.demoBtn}
            onPress={() => handleLogin(acc.email, acc.password)}
          >
            <Text style={styles.demoBtnText}>{acc.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#ea580c', textAlign: 'center',
    textAlignVertical: 'center', fontSize: 24, fontWeight: '900',
    color: '#ffffff', lineHeight: 64, marginBottom: 12,
  },
  appTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  appSubtitle: { color: '#52525b', fontSize: 11, marginTop: 4 },
  form: { backgroundColor: '#18181b', borderRadius: 20, padding: 20, marginBottom: 20 },
  label: { color: '#71717a', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  input: {
    backgroundColor: '#27272a', color: '#f4f4f5',
    borderRadius: 10, padding: 12, fontSize: 13,
    marginBottom: 14, borderWidth: 1, borderColor: '#3f3f46',
  },
  loginBtn: {
    backgroundColor: '#ea580c', paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', marginTop: 4,
  },
  loginBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  demoSection: { backgroundColor: '#18181b', borderRadius: 16, padding: 16 },
  demoTitle: { color: '#52525b', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10, textAlign: 'center' },
  demoBtn: {
    backgroundColor: '#27272a', paddingVertical: 10,
    borderRadius: 10, alignItems: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: '#3f3f46',
  },
  demoBtnText: { color: '#d4d4d8', fontSize: 12, fontWeight: '700' },
});
