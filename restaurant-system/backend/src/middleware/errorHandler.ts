import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { apiError } from '../utils/response';
import { logger } from '../config/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  logger.error(`[${req.method} ${req.originalUrl}] ${err.message}`, {
    stack: err.stack,
  });

  // Handle AppError
  if (err instanceof AppError) {
    return apiError(res, err.message, err.statusCode, err.errors);
  }

  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        return apiError(res, `A record with this ${target} already exists`, 409);
      }
      case 'P2025':
        return apiError(res, 'Record not found', 404);
      case 'P2003':
        return apiError(res, 'Foreign key constraint failed', 400);
      default:
        return apiError(res, 'Database error occurred', 500);
    }
  }

  // Handle SyntaxError (e.g. malformed JSON body)
  if (err instanceof SyntaxError && 'body' in err) {
    return apiError(res, 'Malformed JSON payload', 400);
  }

  // Default to 500 internal server error
  const message =
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  return apiError(res, message, 500);
};

export const notFoundHandler = (req: Request, res: Response): Response => {
  return apiError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
