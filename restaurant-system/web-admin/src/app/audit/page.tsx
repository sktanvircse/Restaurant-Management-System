'use client';

import { useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Shield, Clock, FileText, User } from 'lucide-react';

export default function AuditPage() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.get('/audit');
      return res.data.data;
    },
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security & Audit Logs</h1>
          <p className="text-sm text-gray-500">Immutable trail of critical system actions, status changes, and manager overrides</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Entity ID</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-400">No audit logs recorded yet</td></tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-4 text-xs text-gray-500 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-semibold text-gray-900">
                        {log.user?.fullName || 'System'}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 font-mono text-xs">{log.entityType}</td>
                      <td className="p-4 text-gray-400 font-mono text-xs truncate max-w-[120px]">{log.entityId || '-'}</td>
                      <td className="p-4 text-gray-500 font-mono text-xs">{log.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
