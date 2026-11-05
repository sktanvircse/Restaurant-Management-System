import { AuthUser, AuthCustomer } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      customer?: AuthCustomer;
    }
  }
}

export {};
