import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { apiSuccess } from '../../utils/response';
import { formatPaginatedResult } from '../../utils/pagination';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('audit_logs', 'view'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
      const skip = (page - 1) * limit;

      const module = req.query.module as string | undefined;
      const action = req.query.action as string | undefined;

      const where: any = {
        ...(module ? { module } : {}),
        ...(action ? { action } : {}),
      };

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      const result = formatPaginatedResult(logs, total, page, limit);
      apiSuccess(res, result.data, undefined, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }
);

export const auditRoutes = router;
