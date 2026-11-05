import { AttendanceStatus, LeaveStatus, LeaveType, SalaryStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { formatPaginatedResult } from '../../utils/pagination';

export class HRService {
  // ==========================================
  // EMPLOYEES
  // ==========================================

  async getEmployees(branchId?: number) {
    return prisma.employee.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
            role: { select: { id: true, name: true } },
          },
        },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { joinDate: 'desc' },
    });
  }

  async getEmployeeById(id: number) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        branch: true,
        leaves: { take: 10, orderBy: { createdAt: 'desc' } },
        salaries: { take: 12, orderBy: { year: 'desc' } },
        attendance: { take: 31, orderBy: { date: 'desc' } },
      },
    });

    if (!employee) throw new NotFoundError('Employee not found');
    return employee;
  }

  async createEmployee(data: {
    userId: number;
    branchId: number;
    designation: string;
    basicSalary: number;
    bankAccount?: string | null;
    bankName?: string | null;
    nid?: string | null;
    joinDate: string;
    endDate?: string | null;
    emergencyName?: string | null;
    emergencyPhone?: string | null;
    emergencyRelation?: string | null;
  }) {
    const existing = await prisma.employee.findUnique({ where: { userId: data.userId } });
    if (existing) throw new BadRequestError('User already has an employee record');

    return prisma.employee.create({
      data: {
        userId: data.userId,
        branchId: data.branchId,
        designation: data.designation,
        basicSalary: data.basicSalary,
        bankAccount: data.bankAccount || null,
        bankName: data.bankName || null,
        nid: data.nid || null,
        joinDate: new Date(data.joinDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        emergencyName: data.emergencyName || null,
        emergencyPhone: data.emergencyPhone || null,
        emergencyRelation: data.emergencyRelation || null,
      },
      include: { user: true },
    });
  }

  async updateEmployee(id: number, data: any) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundError('Employee not found');

    const updateData = { ...data };
    if (data.joinDate) updateData.joinDate = new Date(data.joinDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return prisma.employee.update({
      where: { id },
      data: updateData,
      include: { user: true },
    });
  }

  // ==========================================
  // SHIFTS
  // ==========================================

  async getShifts(branchId?: number) {
    return prisma.shift.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async createShift(data: {
    branchId: number;
    name: string;
    startTime: string;
    endTime: string;
    daysOfWeek: string;
  }) {
    return prisma.shift.create({ data });
  }

  // ==========================================
  // ATTENDANCE
  // ==========================================

  async recordAttendance(data: {
    employeeId: number;
    date: string;
    status: AttendanceStatus;
    clockIn?: string | null;
    clockOut?: string | null;
    note?: string | null;
  }) {
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new NotFoundError('Employee not found');

    const targetDate = new Date(data.date);

    return prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: targetDate,
        },
      },
      update: {
        status: data.status,
        clockIn: data.clockIn ? new Date(data.clockIn) : undefined,
        clockOut: data.clockOut ? new Date(data.clockOut) : undefined,
        note: data.note || undefined,
      },
      create: {
        employeeId: data.employeeId,
        userId: employee.userId,
        date: targetDate,
        status: data.status,
        clockIn: data.clockIn ? new Date(data.clockIn) : null,
        clockOut: data.clockOut ? new Date(data.clockOut) : null,
        note: data.note || null,
      },
      include: { employee: { include: { user: true } } },
    });
  }

  async getAttendanceSheet(params: {
    branchId?: number;
    startDate: string;
    endDate: string;
  }) {
    return prisma.attendance.findMany({
      where: {
        ...(params.branchId ? { employee: { branchId: params.branchId } } : {}),
        date: {
          gte: new Date(params.startDate),
          lte: new Date(params.endDate),
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            designation: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { employeeId: 'asc' }],
    });
  }

  // ==========================================
  // LEAVES
  // ==========================================

  async applyLeave(data: {
    employeeId: number;
    fromDate: string;
    toDate: string;
    type: LeaveType;
    reason: string;
  }) {
    return prisma.leave.create({
      data: {
        employeeId: data.employeeId,
        fromDate: new Date(data.fromDate),
        toDate: new Date(data.toDate),
        type: data.type,
        reason: data.reason,
        status: 'PENDING',
      },
      include: { employee: { include: { user: true } } },
    });
  }

  async resolveLeave(
    leaveId: number,
    status: LeaveStatus,
    approvedByUserId: number,
    note?: string | null
  ) {
    const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
    if (!leave) throw new NotFoundError('Leave request not found');

    return prisma.leave.update({
      where: { id: leaveId },
      data: {
        status,
        approvedBy: approvedByUserId,
        approvedAt: new Date(),
        note: note || leave.note,
      },
      include: {
        employee: { include: { user: true } },
        approver: { select: { id: true, name: true } },
      },
    });
  }

  async getLeaves(params: {
    branchId?: number;
    employeeId?: number;
    status?: LeaveStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.employeeId ? { employeeId: params.employeeId } : {}),
      ...(params.branchId ? { employee: { branchId: params.branchId } } : {}),
    };

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        include: {
          employee: { include: { user: { select: { id: true, name: true, phone: true } } } },
          approver: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.leave.count({ where }),
    ]);

    return formatPaginatedResult(leaves, total, page, limit);
  }

  // ==========================================
  // PAYROLL & SALARIES
  // ==========================================

  async generateSalarySheet(params: {
    branchId: number;
    month: number;
    year: number;
  }) {
    const employees = await prisma.employee.findMany({
      where: { branchId: params.branchId },
      include: { user: true },
    });

    const results = [];

    for (const emp of employees) {
      const basic = Number(emp.basicSalary);
      const allowances = 0; // standard bonus or allowance
      const deductions = 0;
      const advanceDeducted = 0;
      const netSalary = basic + allowances - deductions - advanceDeducted;

      const salaryRecord = await prisma.salary.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month: params.month,
            year: params.year,
          },
        },
        update: {
          basicSalary: basic,
          netSalary,
        },
        create: {
          employeeId: emp.id,
          month: params.month,
          year: params.year,
          basicSalary: basic,
          allowances,
          deductions,
          advanceDeducted,
          netSalary,
          status: 'PENDING',
        },
        include: {
          employee: { include: { user: { select: { id: true, name: true } } } },
        },
      });

      results.push(salaryRecord);
    }

    return results;
  }

  async paySalary(salaryId: number, paidByUserId: number, notes?: string | null) {
    const salary = await prisma.salary.findUnique({ where: { id: salaryId } });
    if (!salary) throw new NotFoundError('Salary record not found');

    return prisma.salary.update({
      where: { id: salaryId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paidBy: paidByUserId,
        notes: notes || salary.notes,
      },
      include: {
        employee: { include: { user: true } },
        paidByUser: { select: { id: true, name: true } },
      },
    });
  }

  async getSalaries(params: {
    branchId?: number;
    month?: number;
    year?: number;
    status?: SalaryStatus;
  }) {
    return prisma.salary.findMany({
      where: {
        ...(params.branchId ? { employee: { branchId: params.branchId } } : {}),
        ...(params.month ? { month: params.month } : {}),
        ...(params.year ? { year: params.year } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
      include: {
        employee: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        paidByUser: { select: { id: true, name: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}

export const hrService = new HRService();
