import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser, Public } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { AuthService, type IssuedSession } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { PasswordResetService } from './password-reset.service';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from './refresh-cookie';

/** Xác thực: UC01 (đăng ký), UC02 (đăng nhập, refresh), UC03 (đăng xuất), UC04 (quên mật khẩu), UC06 (đổi mật khẩu). */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passwordReset: PasswordResetService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.auth.register(dto), res);
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.auth.login(dto), res);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.auth.refresh(readRefreshCookie(req)), res);
  }

  @HttpCode(204)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): void {
    clearRefreshCookie(res);
  }

  @HttpCode(200)
  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(await this.auth.changePassword(dto, user), res);
  }

  /** Luôn 202, không lộ SĐT đã đăng ký hay tài khoản có email không (Q17a). */
  @Public()
  @HttpCode(202)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.passwordReset.forgot(dto);
  }

  @Public()
  @HttpCode(204)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.passwordReset.reset(dto);
  }

  private respond({ session, refreshToken }: IssuedSession, res: Response) {
    setRefreshCookie(res, refreshToken);
    return session;
  }
}
