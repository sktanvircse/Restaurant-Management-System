'use client';

import { useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, Clock, Calendar, DollarSign, CheckCircle2, UserPlus } from 'lucide-react';

export default function HRPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'leaves' | 'payroll'>('employees');

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get('/hr/employees');
      return res.data.data;
    },
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const res = await api.get('/hr/attendance');
      return res.data.data;
    },
    enabled: activeTab === 'attendance',
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const res = await api.get('/hr/leaves');
      return res.data.data;
    },
    enabled: activeTab === 'leaves',
  });

  const approveLeave = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/hr/leaves/${id}/status`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }),
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Human Resources & Staff</h1>
            <p className="text-sm text-gray-500">Manage employee records, shifts, attendance, leaves, and salary payroll</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['employees', 'attendance', 'leaves', 'payroll'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                  activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'employees' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">Base Salary</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{emp.user?.fullName}</div>
                      <div className="text-xs text-gray-500">{emp.user?.email}</div>
                    </td>
                    <td className="p-4 font-medium text-gray-700">{emp.designation || 'Staff'}</td>
                    <td className="p-4 text-gray-600">{emp.department || 'Operations'}</td>
                    <td className="p-4 text-gray-600">{emp.branch?.name}</td>
                    <td className="p-4 font-bold text-gray-900">৳{Number(emp.baseSalary).toFixed(2)}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Clock In</th>
                  <th className="p-4">Clock Out</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendance.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">No attendance records</td></tr>
                ) : (
                  attendance.map((att: any) => (
                    <tr key={att.id} className="hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-900">{att.employee?.user?.fullName}</td>
                      <td className="p-4 text-gray-600">{new Date(att.date).toLocaleDateString()}</td>
                      <td className="p-4 text-gray-900 font-mono text-xs">{att.clockIn ? new Date(att.clockIn).toLocaleTimeString() : '-'}</td>
                      <td className="p-4 text-gray-900 font-mono text-xs">{att.clockOut ? new Date(att.clockOut).toLocaleTimeString() : 'Active Shift'}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Leave Type</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaves.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-400">No leave requests</td></tr>
                ) : (
                  leaves.map((l: any) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-900">{l.employee?.user?.fullName}</td>
                      <td className="p-4 text-gray-600 font-medium">{l.leaveType}</td>
                      <td className="p-4 text-xs text-gray-600">
                        {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-gray-600 max-w-xs truncate">{l.reason}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          l.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          l.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {l.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => approveLeave.mutate({ id: l.id, status: 'APPROVED' })}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => approveLeave.mutate({ id: l.id, status: 'REJECTED' })}
                              className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-semibold hover:bg-red-100"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Monthly Payroll Generation</h3>
            <p className="text-sm text-gray-500">Calculate base salaries, allowances, deductions, and finalize payment disbursements for all active staff.</p>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm hover:bg-indigo-700">
                Generate Salary Sheet for Current Month
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
