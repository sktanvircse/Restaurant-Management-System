import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  errors?: any;
}

export const apiSuccess = <T = any>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response => {
  const body: ApiResponse<T> = {
    success: true,
  };

  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  if (meta) body.meta = meta;

  return res.status(statusCode).json(body);
};

export const apiError = (
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  errors?: any
): Response => {
  const body: ApiResponse = {
    success: false,
    message,
  };

  if (errors) body.errors = errors;

  return res.status(statusCode).json(body);
};
