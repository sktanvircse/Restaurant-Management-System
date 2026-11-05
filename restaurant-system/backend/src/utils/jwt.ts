import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtUserPayload, JwtCustomerPayload, AuthTokens } from '../types/auth.types';
import { UnauthorizedError } from './errors';

export const signAccessToken = (payload: JwtUserPayload | JwtCustomerPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });
};

export const signRefreshToken = (payload: JwtUserPayload | JwtCustomerPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const generateAuthTokens = (payload: JwtUserPayload | JwtCustomerPayload): AuthTokens => {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  };
};

export const verifyAccessToken = <T = JwtUserPayload>(token: string): T => {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as T;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    }
    throw new UnauthorizedError('Invalid token');
  }
};

export const verifyRefreshToken = <T = JwtUserPayload>(token: string): T => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as T;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Refresh token has expired');
    }
    throw new UnauthorizedError('Invalid refresh token');
  }
};
