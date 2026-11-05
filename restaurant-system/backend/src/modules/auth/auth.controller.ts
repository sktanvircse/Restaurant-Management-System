import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { apiSuccess } from '../../utils/response';

export class AuthController {
  // Staff Login
  loginStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const ua = req.headers['user-agent'];

      const result = await authService.loginStaff(email, password, ip, ua);
      apiSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  // Staff Refresh Token
  refreshStaffToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshStaffToken(refreshToken);
      apiSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  // Staff Logout
  logoutStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        await authService.logoutStaff(req.user.id);
      }
      apiSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  };

  // Register new staff (Admin/Super Admin only)
  registerStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.registerStaff(req.body, req.user?.id);
      apiSuccess(res, user, 'Staff member registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  // Customer Register
  registerCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.registerCustomer(req.body);
      apiSuccess(res, result, 'Customer registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  // Customer Login
  loginCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { emailOrPhone, password } = req.body;
      const result = await authService.loginCustomer(emailOrPhone, password);
      apiSuccess(res, result, 'Customer logged in successfully');
    } catch (error) {
      next(error);
    }
  };

  // Customer Refresh Token
  refreshCustomerToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshCustomerToken(refreshToken);
      apiSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  // Customer Logout
  logoutCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.customer) {
        await authService.logoutCustomer(req.customer.id);
      }
      apiSuccess(res, null, 'Customer logged out successfully');
    } catch (error) {
      next(error);
    }
  };

  // Forgot Password
  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      apiSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  };

  // Reset Password
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      apiSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  };

  // Change Password
  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);
      apiSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  };

  // Get Current Staff User
  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getMe(req.user!.id);
      apiSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
