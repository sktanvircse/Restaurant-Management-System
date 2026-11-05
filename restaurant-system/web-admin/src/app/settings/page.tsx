'use client';

import { useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Settings, Save } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [settingsState, setSettingsState] = useState<Record<string, string>>({});

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      const data = res.data.data;
      const map: Record<string, string> = {};
      data.forEach((s: any) => {
        map[s.key] = s.value;
      });
      setSettingsState(map);
      return data;
    },
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      const promises = Object.entries(settingsState).map(([key, value]) =>
        api.put(`/settings/${key}`, { value })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      alert('Settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Configuration & Settings</h1>
            <p className="text-sm text-gray-500">Configure global restaurant settings, tax rates, and currency</p>
          </div>
          <button
            onClick={() => saveSettings.mutate()}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700"
          >
            <Save className="w-4 h-4" /> Save All Settings
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading settings...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Restaurant Name</label>
              <input
                type="text"
                value={settingsState['restaurant_name'] || ''}
                onChange={(e) => setSettingsState({ ...settingsState, restaurant_name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Currency Code</label>
              <input
                type="text"
                value={settingsState['currency'] || 'BDT'}
                onChange={(e) => setSettingsState({ ...settingsState, currency: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Default VAT / Tax Rate (%)</label>
              <input
                type="number"
                value={settingsState['tax_rate'] || '5'}
                onChange={(e) => setSettingsState({ ...settingsState, tax_rate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Default Service Charge (%)</label>
              <input
                type="number"
                value={settingsState['service_charge_rate'] || '0'}
                onChange={(e) => setSettingsState({ ...settingsState, service_charge_rate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
