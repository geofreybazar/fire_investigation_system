import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { Request } from 'express';
import { TokenExpiredException } from '../../exceptions/tokenExpired.exception.js';
import { ALLOW_PENDING_PASSWORD_CHANGE } from '../../common/decorators/allow-pending-password-change.decorator.js';
import { CurrentUserJwtPayload } from '../../types/jwt.payload.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = request.cookies?.access_token;

    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!token) {
      throw new TokenExpiredException(
        'TOKEN_EXPIRED',
        'Access token is expired',
      );
    }

    if (!jwtSecret) {
      throw new Error('JWT secret is not configured');
    }

    let user: CurrentUserJwtPayload;

    try {
      user = await this.jwtService.verifyAsync(token, {
        secret: jwtSecret,
      });
    } catch (error: unknown) {
      throw new TokenExpiredException(
        'TOKEN_EXPIRED',
        'Access token is expired',
      );
    }

    request.user = user;

    if (
      user.mustChangePassword &&
      !this.reflector.getAllAndOverride<boolean>(
        ALLOW_PENDING_PASSWORD_CHANGE,
        [context.getHandler(), context.getClass()],
      )
    ) {
      // The frontend depends on this exact error string.
      throw new ForbiddenException({
        statusCode: 403,
        error: 'PASSWORD_CHANGE_REQUIRED',
        message: 'Change your password to continue.',
      });
    }

    return true;
  }
}
