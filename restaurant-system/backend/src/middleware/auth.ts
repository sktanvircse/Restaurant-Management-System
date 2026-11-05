import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { prisma } from '../config/prisma';
import { JwtUserPayload, JwtCustomerPayload } from '../types/auth.types';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken<JwtUserPayload>(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedError('User account is inactive or disabled');
    }

    const permissions = user.role.rolePermissions.map(
      (rp) => `${rp.permission.module}:${rp.permission.action}`
    );

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      roleId: user.roleId,
      branchId: user.branchId,
      permissions,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authenticateCustomer = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Customer authentication token missing');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken<JwtCustomerPayload>(token);

    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
    });

    if (!customer || !customer.isActive || customer.deletedAt) {
      throw new UnauthorizedError('Customer account is inactive');
    }

    req.customer = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      isGuest: customer.isGuest,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalCustomer = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyAccessToken<JwtCustomerPayload>(token);
        const customer = await prisma.customer.findUnique({
          where: { id: decoded.customerId },
        });
        if (customer && customer.isActive && !customer.deletedAt) {
          req.customer = {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            isGuest: customer.isGuest,
          };
        }
      } catch {
        // Ignore invalid token for optional auth
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
