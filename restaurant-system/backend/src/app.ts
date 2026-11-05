import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

import { env } from './config/env';
import { logger } from './config/logger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiSuccess } from './utils/response';

// Import Routes
import { authRoutes } from './modules/auth/auth.routes';
import { uploadRoutes } from './modules/upload/upload.routes';
import { menuRoutes } from './modules/menu/menu.routes';
import { tablesRoutes } from './modules/tables/tables.routes';
import { ordersRoutes } from './modules/orders/orders.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';
import { cashRegisterRoutes } from './modules/cash-register/cash-register.routes';
import { moneyReceivedRoutes } from './modules/money-received/money-received.routes';
import { refundsRoutes } from './modules/refunds/refunds.routes';
import { deliveryRoutes } from './modules/delivery/delivery.routes';
import { reservationsRoutes } from './modules/reservations/reservations.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { suppliersRoutes } from './modules/suppliers/suppliers.routes';
import { hrRoutes } from './modules/hr/hr.routes';
import { expensesRoutes } from './modules/expenses/expenses.routes';
import { customersRoutes } from './modules/customers/customers.routes';
import { couponsRoutes } from './modules/coupons/coupons.routes';
import { reviewsRoutes } from './modules/reviews/reviews.routes';

export const createApp = (): Application => {
  const app = express();

  // 1. Trust proxy (needed behind reverse proxies / load balancers)
  app.set('trust proxy', 1);

  // 2. Security Headers (Helmet)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow frontend to load uploaded images
    })
  );

  // 3. CORS
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 4. Request Logging (Morgan stream into Winston)
  const morganStream = {
    write: (text: string) => logger.info(text.trim()),
  };
  app.use(
    morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      stream: morganStream,
      skip: (req) => req.url === '/health', // skip logging health checks
    })
  );

  // 5. Body Parsers & Compression
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 6. Global Rate Limiter
  app.use('/api', globalRateLimiter);

  // 7. Static Files (Uploads)
  const uploadDir = path.resolve(env.UPLOAD_DIR);
  app.use('/uploads', express.static(uploadDir));

  // 8. Health Check
  app.get('/health', (_req: Request, res: Response) => {
    apiSuccess(res, {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // 9. API V1 Routes
  const apiRouter = express.Router();
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/upload', uploadRoutes);
  apiRouter.use('/menu', menuRoutes);
  apiRouter.use('/tables', tablesRoutes);
  apiRouter.use('/orders', ordersRoutes);
  apiRouter.use('/payments', paymentsRoutes);
  apiRouter.use('/cash-register', cashRegisterRoutes);
  apiRouter.use('/money-received', moneyReceivedRoutes);
  apiRouter.use('/refunds', refundsRoutes);
  apiRouter.use('/delivery', deliveryRoutes);
  apiRouter.use('/reservations', reservationsRoutes);
  apiRouter.use('/inventory', inventoryRoutes);
  apiRouter.use('/supply', suppliersRoutes);
  apiRouter.use('/hr', hrRoutes);
  apiRouter.use('/expenses', expensesRoutes);
  apiRouter.use('/customers', customersRoutes);
  apiRouter.use('/coupons', couponsRoutes);
  apiRouter.use('/reviews', reviewsRoutes);

  app.use('/api/v1', apiRouter);

  // 10. 404 & Global Error Handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
