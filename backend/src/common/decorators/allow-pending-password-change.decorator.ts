import { SetMetadata } from '@nestjs/common';

// Routes a user who must still change the default password may call (Q-19).
export const ALLOW_PENDING_PASSWORD_CHANGE = 'allowPendingPasswordChange';

export const AllowPendingPasswordChange = () =>
  SetMetadata(ALLOW_PENDING_PASSWORD_CHANGE, true);
