import { Request } from 'express';
import { User } from '../generated/prisma/client.js';

export interface RequestWithUser extends Request {
  user: User;
}
