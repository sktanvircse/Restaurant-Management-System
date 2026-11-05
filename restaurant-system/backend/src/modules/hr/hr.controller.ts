import { Request, Response, NextFunction } from 'express';
import { hrService } from './hr.service';
import { apiSuccess } from '../../utils/response';
import { LeaveStatus, SalaryStatus } from '@prisma/client';

export class HRController {
  // Employees
  getEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const employees = await hrService.getEmployees(branchId);
      apiSuccess(res, employees);
    } catch (error) {
      next(error);
    }
  };

  getEmployeeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await hrService.getEmployeeById(parseInt(req.params.id, 10));
      apiSuccess(res, employee);
    } catch (error) {
      next(error);
    }
  };

  createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const employee = await hrService.createEmployee({ ...req.body, branchId });
      apiSuccess(res, employee, 'Employee profile created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await hrService.updateEmployee(parseInt(req.params.id, 10), req.body);
      apiSuccess(res, employee, 'Employee profile updated');
    } catch (error) {
      next(error);
    }
  };

  // Shifts
  getShifts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const shifts = await hrService.getShifts(branchId);
      apiSuccess(res, shifts);
    } catch (error) {
      next(error);
    }
  };

  createShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const shift = await hrService.createShift({ ...req.body, branchId });
      apiSuccess(res, shift, 'Shift created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  // Attendance
  recordAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attendance = await hrService.recordAttendance(req.body);
      apiSuccess(res, attendance, 'Attendance recorded');
    } catch (error) {
      next(error);
    }
  };

  getAttendanceSheet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const startDate = (req.query.startDate as string) || new Date(Date.now() - 30 * 86400000).toISOString();
      const endDate = (req.query.endDate as string) || new Date().toISOString();

      const sheet = await hrService.getAttendanceSheet({ branchId, startDate, endDate });
      apiSuccess(res, sheet);
    } catch (error) {
      next(error);
    }
  };

  // Leaves
  applyLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leave = await hrService.applyLeave(req.body);
      apiSuccess(res, leave, 'Leave application submitted', 201);
    } catch (error) {
      next(error);
    }
  };

  resolveLeave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, note } = req.body;
      const leave = await hrService.resolveLeave(
        parseInt(req.params.id, 10),
        status,
        req.user!.id,
        note
      );
      apiSuccess(res, leave, `Leave application ${status.toLowerCase()}`);
    } catch (error) {
      next(error);
    }
  };

  getLeaves = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
      const status = req.query.status as LeaveStatus | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await hrService.getLeaves({ branchId, employeeId, status, page, limit });
      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  // Salaries
  generateSalarySheet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.body.branchId || req.user!.branchId;
      const { month, year } = req.body;
      const salaries = await hrService.generateSalarySheet({ branchId, month, year });
      apiSuccess(res, salaries, `Salary sheet generated for ${month}/${year}`);
    } catch (error) {
      next(error);
    }
  };

  paySalary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const salary = await hrService.paySalary(
        parseInt(req.params.id, 10),
        req.user!.id,
        req.body.notes
      );
      apiSuccess(res, salary, 'Salary marked as paid');
    } catch (error) {
      next(error);
    }
  };

  getSalaries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : req.user?.branchId;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const status = req.query.status as SalaryStatus | undefined;

      const salaries = await hrService.getSalaries({ branchId, month, year, status });
      apiSuccess(res, salaries);
    } catch (error) {
      next(error);
    }
  };
}

export const hrController = new HRController();
