import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { loginSchema, type LoginInput } from '../users/schema/user.schema.js';
import { AuthService } from './auth.service.js';
import { type Response, type Request, type CookieOptions } from 'express';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// clearCookie only removes a cookie when these options match the ones it was set with.
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

function setAuthCookies(
  response: Response,
  accessToken: string,
  refreshToken: string,
) {
  response.cookie('access_token', accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  response.cookie('refresh_token', refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body({ schema: loginSchema })
    loginData: LoginInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(loginData);

    setAuthCookies(response, accessToken, refreshToken);

    return user;
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies.refresh_token;

    // Cleared before the token check, so the browser drops them even when the
    // stored token is already gone.
    response.clearCookie('access_token', baseCookieOptions);
    response.clearCookie('refresh_token', baseCookieOptions);

    await this.authService.logout(refreshToken);
    return;
  }

  @Post('refresh_token')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies.refresh_token;
    const { newAccessToken, newRefreshToken } =
      await this.authService.refresh(refreshToken);

    setAuthCookies(response, newAccessToken, newRefreshToken);

    return;
  }
}
