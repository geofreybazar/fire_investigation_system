import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

const secrets: Record<string, string> = {
  JWT_SECRET: 'access-secret',
  REFRESH_SECRET: 'refresh-secret',
};

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  account_number: 'ACC001',
  password: 'stored-hash',
  isActive: true,
  role: 'REGIONAL_INVESTIGATOR',
  positionId: 'position-1',
  officeId: 'office-1',
  mustChangePassword: false,
  failedLoginCount: 0,
  lockedUntil: null as Date | null,
};

const tokenPayload = {
  sub: user.id,
  account_number: user.account_number,
  role: user.role,
  positionId: user.positionId,
  officeId: user.officeId,
  mustChangePassword: false,
};

describe('AuthService', () => {
  let service: AuthService;
  let repository: {
    findUserByAccountNumber: ReturnType<typeof vi.fn>;
    findUserById: ReturnType<typeof vi.fn>;
    createRefreshToken: ReturnType<typeof vi.fn>;
    findRefreshToken: ReturnType<typeof vi.fn>;
    deleteRefreshToken: ReturnType<typeof vi.fn>;
    recordFailedLogin: ReturnType<typeof vi.fn>;
    clearFailedLogins: ReturnType<typeof vi.fn>;
  };
  let jwtService: {
    signAsync: ReturnType<typeof vi.fn>;
    verifyAsync: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.mocked(bcrypt.compare).mockReset();

    repository = {
      findUserByAccountNumber: vi.fn(),
      findUserById: vi.fn(),
      createRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
      deleteRefreshToken: vi.fn(),
      recordFailedLogin: vi.fn(),
      clearFailedLogins: vi.fn(),
    };
    jwtService = {
      // Return the secret so tests can tell access and refresh tokens apart.
      signAsync: vi.fn((_payload, options) =>
        Promise.resolve(`token-signed-with-${options.secret}`),
      ),
      verifyAsync: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repository },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { get: vi.fn((key: string) => secrets[key]) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login protection (Q-19)', () => {
    const credentials = { account_number: 'ACC001', password: 'secret' };

    it('counts a wrong password', async () => {
      repository.findUserByAccountNumber.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login(credentials)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.recordFailedLogin).toHaveBeenCalledWith(user.id, 5, 15);
    });

    it('refuses the correct password during a lock, without counting', async () => {
      repository.findUserByAccountNumber.mockResolvedValue({
        ...user,
        lockedUntil: new Date(Date.now() + 60_000),
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(service.login(credentials)).rejects.toThrow(
        'an account is locked for 15 minutes',
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(repository.recordFailedLogin).not.toHaveBeenCalled();
    });

    it('allows login once the lock has expired and clears it', async () => {
      repository.findUserByAccountNumber.mockResolvedValue({
        ...user,
        lockedUntil: new Date(Date.now() - 60_000),
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(service.login(credentials)).resolves.toBeDefined();
      expect(repository.clearFailedLogins).toHaveBeenCalledWith(user.id);
    });

    it('never returns the login counters and carries the change flag', async () => {
      repository.findUserByAccountNumber.mockResolvedValue({
        ...user,
        mustChangePassword: true,
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login(credentials);

      expect(result.user).not.toHaveProperty('failedLoginCount');
      expect(result.user).not.toHaveProperty('lockedUntil');
      expect(result.user).not.toHaveProperty('password');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ mustChangePassword: true }),
        expect.anything(),
      );
    });
  });

  describe('login', () => {
    const credentials = { account_number: 'ACC001', password: 'Password123!' };

    it('issues access and refresh tokens and stores the refresh token', async () => {
      repository.findUserByAccountNumber.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login(credentials);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'Password123!',
        'stored-hash',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(tokenPayload, {
        secret: 'access-secret',
        expiresIn: '15m',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith(tokenPayload, {
        secret: 'refresh-secret',
        expiresIn: '7d',
        jwtid: expect.any(String),
      });
      expect(repository.createRefreshToken).toHaveBeenCalledWith(
        user.id,
        'token-signed-with-refresh-secret',
      );
      const {
        password: _password,
        failedLoginCount: _failedLoginCount,
        lockedUntil: _lockedUntil,
        ...safeUser
      } = user;
      expect(result).toEqual({
        user: safeUser,
        accessToken: 'token-signed-with-access-secret',
        refreshToken: 'token-signed-with-refresh-secret',
      });
    });

    it('gives every refresh token a unique jti', async () => {
      repository.findUserByAccountNumber.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.login(credentials);
      await service.login(credentials);

      const jwtids = jwtService.signAsync.mock.calls
        .map(([, options]) => options.jwtid)
        .filter(Boolean);
      expect(jwtids).toHaveLength(2);
      expect(new Set(jwtids).size).toBe(2);
    });

    it('never returns the password hash', async () => {
      repository.findUserByAccountNumber.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login(credentials);

      expect(result.user).not.toHaveProperty('password');
      expect(JSON.stringify(result)).not.toContain('stored-hash');
    });

    it('rejects an unknown account number', async () => {
      repository.findUserByAccountNumber.mockResolvedValue(null);

      await expect(service.login(credentials)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejects a wrong password', async () => {
      repository.findUserByAccountNumber.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login(credentials)).rejects.toThrow(
        'Invalid account number or password',
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(repository.createRefreshToken).not.toHaveBeenCalled();
    });

    it('rejects a deactivated user with the same generic error, even with the correct password', async () => {
      repository.findUserByAccountNumber.mockResolvedValue({
        ...user,
        isActive: false,
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(service.login(credentials)).rejects.toThrow(
        'Invalid account number or password',
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(repository.createRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('deletes the stored refresh token', async () => {
      repository.findRefreshToken.mockResolvedValue({ id: 'token-1', user });

      await expect(service.logout('refresh-token')).resolves.toEqual({
        message: 'Logged out successfully',
      });
      expect(repository.findRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(repository.deleteRefreshToken).toHaveBeenCalledWith('token-1');
    });

    it('throws UnauthorizedException when the token is not stored', async () => {
      repository.findRefreshToken.mockResolvedValue(null);

      await expect(service.logout('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.deleteRefreshToken).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the repository fails', async () => {
      repository.findRefreshToken.mockRejectedValue(new Error('db down'));

      await expect(service.logout('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token and issues a new access token', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: user.id });
      repository.findUserById.mockResolvedValue(user);
      repository.findRefreshToken.mockResolvedValue({ id: 'old-token-id' });

      const result = await service.refresh('old-refresh-token');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('old-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(repository.findUserById).toHaveBeenCalledWith(user.id);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          secret: 'refresh-secret',
          jwtid: expect.any(String),
        }),
      );
      expect(repository.createRefreshToken).toHaveBeenCalledWith(
        user.id,
        'token-signed-with-refresh-secret',
      );
      expect(repository.deleteRefreshToken).toHaveBeenCalledWith(
        'old-token-id',
      );
      expect(result).toEqual({
        newAccessToken: 'token-signed-with-access-secret',
        newRefreshToken: 'token-signed-with-refresh-secret',
      });
    });

    it('rejects a token that fails verification', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refresh('bad-token')).rejects.toThrow(
        'Failed to refresh token',
      );
      expect(repository.createRefreshToken).not.toHaveBeenCalled();
    });

    it('rejects a token for a user that no longer exists', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: user.id });
      repository.findUserById.mockResolvedValue(null);
      repository.findRefreshToken.mockResolvedValue({ id: 'old-token-id' });

      await expect(service.refresh('old-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.createRefreshToken).not.toHaveBeenCalled();
    });

    it('rejects a valid token that is not stored (already rotated or logged out)', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: user.id });
      repository.findUserById.mockResolvedValue(user);
      repository.findRefreshToken.mockResolvedValue(null);

      await expect(service.refresh('old-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repository.createRefreshToken).not.toHaveBeenCalled();
      expect(repository.deleteRefreshToken).not.toHaveBeenCalled();
    });

    it('rejects a valid, stored token when the user has been deactivated', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: user.id });
      repository.findUserById.mockResolvedValue({ ...user, isActive: false });
      repository.findRefreshToken.mockResolvedValue({ id: 'old-token-id' });

      await expect(service.refresh('old-refresh-token')).rejects.toThrow(
        'Failed to refresh token',
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(repository.createRefreshToken).not.toHaveBeenCalled();
      expect(repository.deleteRefreshToken).not.toHaveBeenCalled();
    });
  });
});
