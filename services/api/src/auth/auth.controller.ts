import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly jwt: JwtService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const role = body.role ?? 'TENANT';
    return this.auth.register(body.email, body.password, role);
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Headers('x-forwarded-for') xff?: string, @Headers('cf-connecting-ip') cfip?: string) {
    const ip = (cfip || (xff ? String(xff).split(',')[0].trim() : undefined)) as string | undefined;
    return this.auth.login(body.email, body.password, ip);
  }

  @Get('me')
  async me(@Headers('authorization') authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Unauthorized' };
    }
    const token = authHeader.slice('Bearer '.length);
    const payload = await this.jwt.verifyAsync<{ sub: string }>(token).catch(() => null);
    if (!payload?.sub) return { error: 'Unauthorized' };
    return this.auth.me(payload.sub);
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh: string }) {
    if (!body?.refresh) return { error: 'Unauthorized' };
    return this.auth.refresh(body.refresh);
  }

  @Post('logout-all')
  async logoutAll(@Headers('authorization') authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) return { error: 'Unauthorized' };
    const token = authHeader.slice('Bearer '.length);
    const payload = await this.jwt.verifyAsync<{ sub: string }>(token).catch(() => null);
    if (!payload?.sub) return { error: 'Unauthorized' };
    return this.auth.logoutAll(payload.sub);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; code: string }) {
    if (!body?.email || !body?.code) return { error: 'Bad Request' };
    return this.auth.verifyEmail(body.email, body.code);
  }

  @Post('verify-email/resend')
  async resendVerify(@Body() body: { email: string }) {
    if (!body?.email) return { error: 'Bad Request' };
    return this.auth.resendEmailVerification(body.email);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    if (!body?.email) return { error: 'Bad Request' };
    return this.auth.requestPasswordReset(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    if (!body?.token || !body?.password) return { error: 'Bad Request' };
    return this.auth.resetPassword(body.token, body.password);
  }
}
