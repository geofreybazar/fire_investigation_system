import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { type Request, type Response } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };
  let response: {
    cookie: ReturnType<typeof vi.fn>;
    clearCookie: ReturnType<typeof vi.fn>;
  };

  const request = (refreshToken?: string) =>
    ({ cookies: { refresh_token: refreshToken } }) as unknown as Request;

  beforeEach(async () => {
    authService = { login: vi.fn(), logout: vi.fn(), refresh: vi.fn() };
    response = { cookie: vi.fn(), clearCookie: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('sets both auth cookies on login and returns the user', async () => {
    authService.login.mockResolvedValue({
      user: { id: 'u1' },
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    const result = await controller.login(
      { account_number: 'ACC001', password: 'x' },
      response as unknown as Response,
    );

    expect(result).toEqual({ id: 'u1' });
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'access',
      expect.objectContaining({ httpOnly: true, maxAge: 15 * 60 * 1000 }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
  });

  it('clears both auth cookies on logout', async () => {
    authService.logout.mockResolvedValue({
      message: 'Logged out successfully',
    });

    await controller.logout(
      request('refresh'),
      response as unknown as Response,
    );

    expect(authService.logout).toHaveBeenCalledWith('refresh');
    expect(response.clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('clears the cookies even when the stored refresh token is invalid', async () => {
    authService.logout.mockRejectedValue(
      new UnauthorizedException('Invalid User'),
    );

    await expect(
      controller.logout(request('stale'), response as unknown as Response),
    ).rejects.toThrow(UnauthorizedException);

    expect(response.clearCookie).toHaveBeenCalledTimes(2);
  });

  it('sets rotated cookies on refresh', async () => {
    authService.refresh.mockResolvedValue({
      newAccessToken: 'access2',
      newRefreshToken: 'refresh2',
    });

    await controller.refresh(
      request('refresh'),
      response as unknown as Response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'access2',
      expect.any(Object),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh2',
      expect.any(Object),
    );
  });
});
