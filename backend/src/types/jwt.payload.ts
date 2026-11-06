import { UUID } from 'crypto';
import { ROLE } from '../generated/prisma/enums.js';

export interface CurrentUserJwtPayload {
  sub: UUID;
  account_number: string;
  role: ROLE;
  positionId: string;
  officeId: string;
  mustChangePassword?: boolean;
}
