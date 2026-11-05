import { z } from 'zod';

export const createEmployeeSchema = z.object({
  userId: z.number().int().positive('User ID is required'),
  branchId: z.number().int().positive('Branch ID is required'),
  designation: z.string().min(2, 'Designation is required'),
  basicSalary: z.number().min(0, 'Basic salary must be 0 or positive'),
  bankAccount: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  nid: z.string().optional().nullable(),
  joinDate: z.string(), // YYYY-MM-DD
  endDate: z.string().optional().nullable(),
  emergencyName: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  emergencyRelation: z.string().optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const createShiftSchema = z.object({
  branchId: z.number().int().positive(),
  name: z.string().min(2, 'Shift name is required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  daysOfWeek: z.string().min(1, 'Days of week required (e.g. 1,2,3,4,5)'),
});

export const recordAttendanceSchema = z.object({
  employeeId: z.number().int().positive(),
  date: z.string(), // YYYY-MM-DD
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'HOLIDAY', 'ON_LEAVE']).default('PRESENT'),
  clockIn: z.string().datetime().optional().nullable(),
  clockOut: z.string().datetime().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const applyLeaveSchema = z.object({
  employeeId: z.number().int().positive(),
  fromDate: z.string(),
  toDate: z.string(),
  type: z.enum(['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER']),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const resolveLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  note: z.string().optional().nullable(),
});

export const generateSalarySheetSchema = z.object({
  branchId: z.number().int().positive().optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
});

export const paySalarySchema = z.object({
  notes: z.string().optional().nullable(),
});
