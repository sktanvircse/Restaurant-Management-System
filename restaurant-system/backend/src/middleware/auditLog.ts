import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export const auditLog = (module: string, action?: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Intercept response finish to log the outcome if status is 2xx
    const originalSend = res.send;

    res.send = function (body: any): Response {
      res.send = originalSend;
      const result = originalSend.call(this, body);

      // Async write to audit_logs (do not block client response)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            const detectedAction =
              action ||
              (req.method === 'POST'
                ? 'CREATE'
                : req.method === 'PUT' || req.method === 'PATCH'
                ? 'UPDATE'
                : req.method === 'DELETE'
                ? 'DELETE'
                : req.method);

            const userId = req.user?.id || null;
            const ipAddress =
              (req.headers['x-forwarded-for'] as string) ||
              req.socket.remoteAddress ||
              null;
            const userAgent = req.headers['user-agent'] || null;

            // Strip sensitive fields (passwords, tokens) from body
            const sanitizedBody = { ...req.body };
            delete sanitizedBody.password;
            delete sanitizedBody.passwordHash;
            delete sanitizedBody.refreshToken;

            await prisma.auditLog.create({
              data: {
                userId,
                action: detectedAction,
                module,
                newValues: Object.keys(sanitizedBody).length ? sanitizedBody : undefined,
                ipAddress,
                userAgent,
              },
            });
          } catch (logErr) {
            logger.warn('Failed to record audit log:', logErr);
          }
        });
      }

      return result;
    };

    next();
  };
};
