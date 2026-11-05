import * as bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { generateAuthTokens, verifyRefreshToken, verifyAccessToken, signAccessToken } from '../../utils/jwt';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/errors';
import { sendEmail } from '../../utils/email';
import { JwtUserPayload, JwtCustomerPayload } from '../../types/auth.types';

export class AuthService {
  /**
   * Staff login (admin, manager, cashier, waiter, chef, rider, etc.)
   */
  async loginStaff(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            currency: true,
            taxRate: true,
            serviceChargeRate: true,
          },
        },
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
      branchId: user.branchId,
    };

    const tokens = generateAuthTokens(payload);

    // Save refresh token & update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: tokens.refreshToken,
        lastLogin: new Date(),
      },
    });

    // Audit log login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'auth',
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    }).catch(() => {});

    const permissions = user.role.rolePermissions.map(
      (rp) => `${rp.permission.module}:${rp.permission.action}`
    );

    return {
      tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role.name,
        roleId: user.roleId,
        branch: user.branch,
        permissions,
      },
    };
  }

  /**
   * Staff Token Refresh
   */
  async refreshStaffToken(refreshToken: string) {
    const decoded = verifyRefreshToken<JwtUserPayload>(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
      },
    });

    if (!user || user.refreshToken !== refreshToken || !user.isActive || user.deletedAt) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const payload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
      branchId: user.branchId,
    };

    // Rotate refresh token
    const newTokens = generateAuthTokens(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newTokens.refreshToken },
    });

    return newTokens;
  }

  /**
   * Staff Logout
   */
  async logoutStaff(userId: number) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { success: true };
  }

  /**
   * Register new staff member (Admin only)
   */
  async registerStaff(
    data: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      roleId: number;
      branchId: number;
    },
    createdByUserId?: number
  ) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        roleId: data.roleId,
        branchId: data.branchId,
        createdBy: createdByUserId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        roleId: true,
        branchId: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Customer Registration
   */
  async registerCustomer(data: {
    name: string;
    email?: string;
    phone: string;
    password: string;
  }) {
    if (data.email) {
      const existingEmail = await prisma.customer.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new ConflictError('An account with this email already exists');
      }
    }

    const existingPhone = await prisma.customer.findFirst({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      throw new ConflictError('An account with this phone number already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        passwordHash,
        loyaltyPoints: 0,
      },
    });

    const payload: JwtCustomerPayload = {
      customerId: customer.id,
      email: customer.email,
      phone: customer.phone,
      isGuest: false,
    };

    const tokens = generateAuthTokens(payload);

    await prisma.customer.update({
      where: { id: customer.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      tokens,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        loyaltyPoints: customer.loyaltyPoints,
      },
    };
  }

  /**
   * Customer Login (by email or phone)
   */
  async loginCustomer(emailOrPhone: string, password: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      },
    });

    if (!customer || !customer.passwordHash || !customer.isActive || customer.deletedAt) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, customer.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload: JwtCustomerPayload = {
      customerId: customer.id,
      email: customer.email,
      phone: customer.phone,
      isGuest: customer.isGuest,
    };

    const tokens = generateAuthTokens(payload);

    await prisma.customer.update({
      where: { id: customer.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      tokens,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        loyaltyPoints: customer.loyaltyPoints,
      },
    };
  }

  /**
   * Customer Token Refresh
   */
  async refreshCustomerToken(refreshToken: string) {
    const decoded = verifyRefreshToken<JwtCustomerPayload>(refreshToken);

    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
    });

    if (!customer || customer.refreshToken !== refreshToken || !customer.isActive) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const payload: JwtCustomerPayload = {
      customerId: customer.id,
      email: customer.email,
      phone: customer.phone,
      isGuest: customer.isGuest,
    };

    const newTokens = generateAuthTokens(payload);

    await prisma.customer.update({
      where: { id: customer.id },
      data: { refreshToken: newTokens.refreshToken },
    });

    return newTokens;
  }

  /**
   * Customer Logout
   */
  async logoutCustomer(customerId: number) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { refreshToken: null },
    });
    return { success: true };
  }

  /**
   * Forgot Password request (send reset link / token)
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return true to prevent email enumeration
      return { message: 'If this email exists in our system, password reset instructions have been sent.' };
    }

    // Generate short-lived reset token (15 mins)
    const resetToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: 'reset_password',
      roleId: 0,
      branchId: user.branchId,
    });

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Spice Garden',
      text: `You requested a password reset. Use this token: ${resetToken}`,
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Use the token below to set a new password:</p>
        <pre style="background: #f4f4f4; padding: 10px;">${resetToken}</pre>
        <p>This token will expire in 15 minutes.</p>
      `,
    });

    return { message: 'If this email exists in our system, password reset instructions have been sent.' };
  }

  /**
   * Reset Password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const decoded = verifyAccessToken<JwtUserPayload>(token);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        refreshToken: null, // force re-login on all devices
      },
    });

    return { success: true, message: 'Password has been successfully reset' };
  }

  /**
   * Change Password (while logged in)
   */
  async changePassword(userId: number, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPass, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Get Current Authenticated User Profile
   */
  async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        branch: true,
        employee: true,
      },
    });

    if (!user) throw new NotFoundError('User not found');

    const permissions = user.role.rolePermissions.map(
      (rp) => `${rp.permission.module}:${rp.permission.action}`
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role.name,
      roleId: user.roleId,
      branch: user.branch,
      employee: user.employee,
      permissions,
    };
  }
}

export const authService = new AuthService();
