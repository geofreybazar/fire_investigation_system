import { JwtUser } from '../modules/auth/types/jwt-user.ts';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export {};
