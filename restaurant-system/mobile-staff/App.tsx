import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Text, View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import WaiterScreen from './src/screens/WaiterScreen';
import KitchenMobileScreen from './src/screens/KitchenMobileScreen';
import RiderScreen from './src/screens/RiderScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const queryClient = new QueryClient();
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Role-based tab configuration
const ROLE_TAB_CONFIG: Record<string, Array<{ name: string; component: React.ComponentType<any>; icon: string; label: string }>> = {
  WAITER: [
    { name: 'Orders', component: WaiterScreen, icon: '🧑‍🍽️', label: 'Take Orders' },
    { name: 'Profile', component: ProfileScreen, icon: '👤', label: 'Profile' },
  ],
  KITCHEN: [
    { name: 'Kitchen', component: KitchenMobileScreen, icon: '👨‍🍳', label: 'Kitchen' },
    { name: 'Profile', component: ProfileScreen, icon: '👤', label: 'Profile' },
  ],
  RIDER: [
    { name: 'Deliveries', component: RiderScreen, icon: '🛵', label: 'Deliveries' },
    { name: 'Profile', component: ProfileScreen, icon: '👤', label: 'Profile' },
  ],
  MANAGER: [
    { name: 'Orders', component: WaiterScreen, icon: '📋', label: 'Orders' },
    { name: 'Kitchen', component: KitchenMobileScreen, icon: '👨‍🍳', label: 'Kitchen' },
    { name: 'Profile', component: ProfileScreen, icon: '👤', label: 'Profile' },
  ],
  CASHIER: [
    { name: 'Orders', component: WaiterScreen, icon: '💳', label: 'Orders' },
    { name: 'Profile', component: ProfileScreen, icon: '👤', label: 'Profile' },
  ],
};

function AppNavigator() {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b' }}>
        <ActivityIndicator color="#ea580c" size="large" />
      </View>
    );
  }

  if (!user || !role) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  // Fallback to WAITER tabs if unrecognized role
  const tabsConfig = ROLE_TAB_CONFIG[role] || ROLE_TAB_CONFIG['WAITER'];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ea580c',
        tabBarInactiveTintColor: '#52525b',
        tabBarStyle: {
          backgroundColor: '#18181b',
          borderTopColor: '#27272a',
          height: 62,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}
    >
      {tabsConfig.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{tab.icon}</Text>,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}
