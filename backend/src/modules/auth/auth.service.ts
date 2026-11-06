import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { LoginInput } from '../users/schema/user.schema.js';
import { AuthRepository } from './auth.repository.js';

// Q-19: 5 failed logins lock the account for 15 minutes.
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

// One message for wrong passwords, locks and deactivated accounts, so nothing
// reveals which account numbers exist.
const LOGIN_FAILED_MESSAGE = `Invalid account number or password. After ${MAX_FAILED_LOGINS} failed tries, an account is locked for ${LOCK_MINUTES} minutes.`;

function tokenClaims(user: {
  id: string;
  account_number: string;
  role: string;
  positionId: string;
  officeId: string;
  mustChangePassword: boolean;
}) {
  return {
    sub: user.id,
    account_number: user.account_number,
    role: user.role,
    positionId: user.positionId,
    officeId: user.officeId,
    mustChangePassword: user.mustChangePassword,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async login(loginData: LoginInput) {
    const user = await this.authRepository.findUserByAccountNumber(
      loginData.account_number,
    );

    const passwordCorrect =
      user === null
        ? false
        : await bcrypt.compare(loginData.password, user.password);

    // Even the correct password is refused during a lock. Tries during a lock
    // don't extend it.
    const locked = !!user?.lockedUntil && user.lockedUntil > new Date();

    if (user && !passwordCorrect && !locked) {
      await this.authRepository.recordFailedLogin(
        user.id,
        MAX_FAILED_LOGINS,
        LOCK_MINUTES,
      );
    }

    if (!user || !passwordCorrect || !user.isActive || locked) {
      this.logger.warn('Failed login attempt');
      throw new UnauthorizedException(LOGIN_FAILED_MESSAGE);
    }

    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await this.authRepository.clearFailedLogins(user.id);
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('REFRESH_SECRET');

    const accessToken = await this.jwtService.signAsync(tokenClaims(user), {
      secret: jwtSecret,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(tokenClaims(user), {
      secret: refreshSecret,
      expiresIn: '7d',
      // iat has one-second precision, so without a unique jti two tokens
      // issued in the same second are identical and collide on the
      // unique stored hash.
      jwtid: randomUUID(),
    });

    await this.authRepository.createRefreshToken(user.id, refreshToken);

    // The hash is needed above for bcrypt.compare but must never leave the API.
    const {
      password: _password,
      failedLoginCount: _failedLoginCount,
      lockedUntil: _lockedUntil,
      ...safeUser
    } = user;

    return { user: safeUser, accessToken, refreshToken };
  }

  async logout(refreshToken: string) {
    this.logger.log('User is logging out');
    const refreshSecret = this.configService.get<string>('REFRESH_SECRET');

    try {
      // validating refreshtoken related to user
      const storedToken =
        await this.authRepository.findRefreshToken(refreshToken);

      if (!storedToken) {
        throw new NotFoundException('User or refreshtoken is invalid');
      }

      // delete the previous token
      await this.authRepository.deleteRefreshToken(storedToken.id);

      this.logger.log('User logged out');

      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid User');
    }
  }

  async refresh(refreshToken: string) {
    this.logger.log('Refreshing acces token');
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('REFRESH_SECRET');

    try {
      // verifying valid refreshToken
      const decodedToken = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.authRepository.findUserById(decodedToken.sub);

      // validating refreshtoken related to user
      const storedToken =
        await this.authRepository.findRefreshToken(refreshToken);

      if (!user || !user.isActive || !storedToken || !decodedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // create new access tokens
      const newAccessToken = await this.jwtService.signAsync(
        tokenClaims(user),
        {
          secret: jwtSecret,
          expiresIn: '15m',
        },
      );

      const newRefreshToken = await this.jwtService.signAsync(
        tokenClaims(user),
        {
          secret: refreshSecret,
          expiresIn: '7d',
          jwtid: randomUUID(),
        },
      );

      // store new refresh token
      await this.authRepository.createRefreshToken(user.id, newRefreshToken);

      // delete the previous token
      await this.authRepository.deleteRefreshToken(storedToken.id);

      this.logger.log('Refreshing token successful');

      return { newAccessToken, newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('Failed to refresh token');
    }
  }
}
